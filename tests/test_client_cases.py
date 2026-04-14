import os
import uuid

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.api.routes.auth import get_auth_service
from app.api.routes.client_cases import get_client_case_service
from app.core.config import Settings
from app.main import app
from app.services.auth_service import AuthService
from app.services.client_case_service import ClientCaseService


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
def services() -> tuple[AuthService, ClientCaseService]:
    settings = Settings(
        database_url=TEST_DATABASE_URL,
        auth_jwt_secret="test-cases-secret",
        auth_access_token_minutes=60,
    )
    auth_service = AuthService(settings)
    case_service = ClientCaseService(settings)
    auth_service.ensure_schema()
    case_service.ensure_schema()
    app.dependency_overrides[get_auth_service] = lambda: auth_service
    app.dependency_overrides[get_client_case_service] = lambda: case_service
    yield auth_service, case_service
    app.dependency_overrides.clear()


def test_client_case_create_list_detail_and_review_persistence(services: tuple[AuthService, ClientCaseService]) -> None:
    auth_service, _case_service = services
    email = f"cases-{uuid.uuid4().hex[:8]}@example.com"
    cleanup_users(auth_service.settings.database_url, email)

    register_response = client.post(
        "/v1/auth/register",
        json={
          "email": email,
          "password": "MatKhau#123",
          "name": "Case Tester",
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
            "title": "Review hợp đồng SaaS",
            "documentName": "saas-agreement.pdf",
            "description": "Khách hàng cần rà soát điều khoản chấm dứt và thanh toán.",
            "domain": "Hợp đồng thương mại",
            "priority": "high",
            "extractedText": (
                "Hợp đồng SaaS có điều khoản thanh toán, chấm dứt đơn phương, "
                "giới hạn trách nhiệm và giải quyết tranh chấp theo luật Việt Nam."
            ),
            "attachments": [
                {
                    "name": "saas-agreement.pdf",
                    "size": 102400,
                    "type": "application/pdf",
                }
            ],
        },
    )

    assert create_response.status_code == 200
    created_case = create_response.json()
    case_id = created_case["id"]
    assert case_id.startswith("CASE-")
    assert created_case["review"] is None
    assert created_case["documentName"] == "saas-agreement.pdf"

    list_response = client.get("/v1/client/cases", headers=headers)
    assert list_response.status_code == 200
    listed_cases = list_response.json()
    assert any(item["id"] == case_id for item in listed_cases)

    review_response = client.put(
        f"/v1/client/cases/{case_id}/review",
        headers=headers,
        json={
            "caseId": case_id,
            "docType": "service_agreement",
            "confidence": 0.86,
            "riskScore": 72,
            "riskLevel": "high",
            "riskFlags": [
                {
                    "code": "termination_risk",
                    "label": "Điều khoản chấm dứt một chiều",
                    "severity": "high",
                    "excerpt": "Bên cung cấp có thể chấm dứt bất kỳ lúc nào",
                    "rationale": "Điều khoản này tạo mất cân bằng nghĩa vụ giữa các bên.",
                }
            ],
            "extractedFields": {
                "governingLaw": "Luật Việt Nam",
            },
            "recommendedAction": "manual_review_recommended",
            "summary": "Cần rà soát kỹ điều khoản chấm dứt và giới hạn trách nhiệm.",
            "needsAttention": True,
            "qualityWarning": False,
            "disclaimer": "Kết quả AI chỉ có giá trị tham khảo.",
            "meta": {
                "requestId": "review-test-001",
                "provider": "gemini",
                "model": "gemini-2.5-flash",
                "processingMs": 845,
            },
        },
    )

    assert review_response.status_code == 200
    reviewed_case = review_response.json()
    assert reviewed_case["status"] == "auto_published"
    assert reviewed_case["riskLevel"] == "high"
    assert reviewed_case["review"]["riskScore"] == 72

    detail_response = client.get(f"/v1/client/cases/{case_id}", headers=headers)
    assert detail_response.status_code == 200
    detail_payload = detail_response.json()
    assert detail_payload["review"]["summary"]
    assert detail_payload["attachments"][0]["name"] == "saas-agreement.pdf"

    cleanup_users(auth_service.settings.database_url, email)
