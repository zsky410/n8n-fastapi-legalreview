import os
import uuid
from unittest.mock import patch

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.api.routes.auth import get_auth_service
from app.api.routes.client_cases import get_client_case_service
from app.api.routes.legal import get_legal_chat_service
from app.core.config import Settings
from app.main import app
from app.services.auth_service import AuthService
from app.services.client_case_service import ClientCaseService
from app.services.legal_chat_service import LegalChatService


def resolve_test_database_url() -> str | None:
    candidates = [
        os.getenv("AUTH_TEST_DATABASE_URL"),
        "postgresql://legaldesk:legaldesk@postgres:5432/legaldesk_ai",
        "postgresql://legaldesk:legaldesk@localhost:5433/legaldesk_ai",
    ]

    for candidate in candidates:
        if not candidate:
            continue
        try:
            with psycopg.connect(candidate, connect_timeout=1):
                return candidate
        except psycopg.Error:
            continue

    return None


TEST_DATABASE_URL = resolve_test_database_url()
pytestmark = pytest.mark.skipif(TEST_DATABASE_URL is None, reason="Không có Postgres test database khả dụng.")
client = TestClient(app)


def cleanup_users(database_url: str, *emails: str) -> None:
    if not emails:
        return

    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM users WHERE email = ANY(%s)", (list(emails),))
        conn.commit()


@pytest.fixture()
def services() -> tuple[AuthService, ClientCaseService, LegalChatService]:
    settings = Settings(
        database_url=TEST_DATABASE_URL,
        auth_jwt_secret="test-chat-secret",
        auth_access_token_minutes=60,
    )
    auth_service = AuthService(settings)
    case_service = ClientCaseService(settings)
    chat_service = LegalChatService(settings)
    auth_service.ensure_schema()
    case_service.ensure_schema()
    app.dependency_overrides[get_auth_service] = lambda: auth_service
    app.dependency_overrides[get_client_case_service] = lambda: case_service
    app.dependency_overrides[get_legal_chat_service] = lambda: chat_service
    yield auth_service, case_service, chat_service
    app.dependency_overrides.clear()


def test_legal_chat_loads_case_context_and_persists_messages(
    services: tuple[AuthService, ClientCaseService, LegalChatService],
) -> None:
    auth_service, _case_service, _chat_service = services
    email = f"chat-{uuid.uuid4().hex[:8]}@example.com"
    cleanup_users(auth_service.settings.database_url, email)

    register_response = client.post(
        "/v1/auth/register",
        json={
            "email": email,
            "password": "MatKhau#123",
            "name": "Chat Tester",
            "company": "LegalDesk QA",
        },
    )
    assert register_response.status_code == 200
    access_token = register_response.json()["accessToken"]
    headers = {"Authorization": f"Bearer {access_token}"}

    create_response = client.post(
        "/v1/client/cases",
        headers=headers,
        json={
            "title": "Review hợp đồng triển khai",
            "documentName": "implementation-agreement.pdf",
            "description": "Cần làm rõ điều khoản thanh toán và chấm dứt.",
            "domain": "Hợp đồng thương mại",
            "priority": "high",
            "extractedText": (
                "Hợp đồng triển khai có điều khoản thanh toán theo mốc, phạt vi phạm, "
                "chấm dứt đơn phương và giải quyết tranh chấp theo luật Việt Nam."
            ),
            "attachments": [],
        },
    )
    assert create_response.status_code == 200
    case_id = create_response.json()["id"]

    review_response = client.put(
        f"/v1/client/cases/{case_id}/review",
        headers=headers,
        json={
            "caseId": case_id,
            "docType": "service_agreement",
            "confidence": 0.91,
            "riskScore": 74,
            "riskLevel": "high",
            "riskFlags": [
                {
                    "code": "payment_risk",
                    "label": "Điều khoản thanh toán cần theo dõi",
                    "severity": "high",
                    "excerpt": "Thanh toán phụ thuộc vào nghiệm thu một chiều",
                    "rationale": "Dễ tạo rủi ro chậm thanh toán và tranh chấp nghiệm thu.",
                }
            ],
            "extractedFields": {"governingLaw": "Luật Việt Nam"},
            "recommendedAction": "manual_review_recommended",
            "summary": "Điều khoản thanh toán và chấm dứt cần rà soát kỹ.",
            "needsAttention": True,
            "qualityWarning": False,
            "disclaimer": "Kết quả AI chỉ có giá trị tham khảo.",
            "meta": {
                "requestId": "chat-review-test-001",
                "provider": "gemini",
                "model": "gemini-2.5-flash",
                "processingMs": 730,
            },
        },
    )
    assert review_response.status_code == 200

    def fake_generate(prompt: str) -> str:
        assert "Review hợp đồng triển khai" in prompt
        assert "Điều khoản thanh toán và chấm dứt cần rà soát kỹ." in prompt
        assert "Hợp đồng triển khai có điều khoản thanh toán theo mốc" in prompt
        return """
        {
          "answer": "Điều khoản thanh toán và chấm dứt là hai điểm cần ưu tiên rà soát trong hồ sơ này.",
          "citations": [
            {
              "excerpt": "Thanh toán phụ thuộc vào nghiệm thu một chiều",
              "source": "review_summary",
              "rationale": "Đây là điểm rủi ro đã được ghi nhận trong review gần nhất."
            }
          ],
          "caution": "Cần đối chiếu với bản gốc trước khi quyết định.",
          "confidence": 0.84,
          "needsAttention": true
        }
        """

    with (
        patch("app.services.gemini_client.GeminiClient.is_enabled", return_value=True),
        patch("app.services.gemini_client.GeminiClient.generate_text", side_effect=fake_generate),
    ):
        chat_response = client.post(
            "/v1/legal/chat",
            json={
                "caseId": case_id,
                "question": "Điều khoản nào cần chú ý nhất?",
                "language": "vi",
                "conversationContext": [],
            },
        )

    assert chat_response.status_code == 200
    chat_payload = chat_response.json()
    assert "cần ưu tiên rà soát" in chat_payload["answer"]
    assert chat_payload["needsAttention"] is True

    detail_response = client.get(f"/v1/client/cases/{case_id}", headers=headers)
    assert detail_response.status_code == 200
    detail_payload = detail_response.json()
    assert len(detail_payload["chatMessages"]) == 2
    assert detail_payload["chatMessages"][0]["role"] == "user"
    assert detail_payload["chatMessages"][0]["content"] == "Điều khoản nào cần chú ý nhất?"
    assert detail_payload["chatMessages"][1]["role"] == "assistant"
    assert detail_payload["chatMessages"][1]["citations"][0]["source"] == "review_summary"

    cleanup_users(auth_service.settings.database_url, email)
