from __future__ import annotations

import uuid
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from typing import Any

from fastapi.testclient import TestClient

from app.api.v1.endpoints.webhooks import record_n8n_event
from app.db.session import get_db
from app.main import app
from app.models.audit_log import AuditLog
from app.models.document import Document
from app.models.legal_obligation import LegalObligation
from app.models.n8n_event import N8nEvent
from app.schemas.webhook import N8nEventCallback
from app.services.automation import build_document_automation_payload, build_weekly_summary_payload
from app.services.webhooks import build_legal_obligations_payload


class FakeSession:
    def __init__(self) -> None:
        self.added: list[Any] = []
        self.committed = False

    def add(self, obj: Any) -> None:
        if getattr(obj, "id", None) is None:
            obj.id = uuid.uuid4()
        self.added.append(obj)

    def flush(self) -> None:
        return None

    def commit(self) -> None:
        self.committed = True

    def refresh(self, obj: Any) -> None:
        if getattr(obj, "created_at", None) is None:
            obj.created_at = datetime.now(UTC)


def test_n8n_callback_endpoint_records_event_and_audit_log() -> None:
    fake_db = FakeSession()

    def override_get_db() -> FakeSession:
        return fake_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        response = TestClient(app).post(
            "/api/v1/webhooks/n8n-events",
            json={
                "trace_id": "doc-123",
                "event_type": "notification.sent",
                "status": "success",
                "payload": {
                    "workflow": "document-result-router",
                    "channels": ["email"],
                    "document_id": "123",
                },
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    body = response.json()
    assert body["trace_id"] == "doc-123"
    assert body["direction"] == "inbound"
    assert body["payload"]["workflow"] == "document-result-router"
    assert fake_db.committed is True
    assert any(isinstance(obj, N8nEvent) for obj in fake_db.added)
    audit_log = next(obj for obj in fake_db.added if isinstance(obj, AuditLog))
    assert audit_log.action == "n8n.callback.received"
    assert audit_log.payload["workflow"] == "document-result-router"


def test_record_n8n_event_accepts_empty_payload() -> None:
    fake_db = FakeSession()
    response = record_n8n_event(
        N8nEventCallback(
            trace_id=None,
            event_type="compliance.expiry_alert.no_data",
            status="success",
            payload={},
        ),
        db=fake_db,  # type: ignore[arg-type]
    )

    assert response.event_type == "compliance.expiry_alert.no_data"
    assert response.status == "success"
    assert response.payload == {}


def test_build_document_automation_payload_includes_links_and_days_left() -> None:
    today = date(2026, 5, 11)
    document_id = uuid.uuid4()
    uploaded_at = datetime(2026, 5, 10, tzinfo=UTC)
    processed_at = datetime(2026, 5, 11, tzinfo=UTC)
    document = Document(
        id=document_id,
        user_id=uuid.uuid4(),
        filename="contract.docx",
        mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size_bytes=1024,
        sha256="a" * 64,
        storage_path="uploads/contract.docx",
        processing_status="completed",
        review_status="ai_approved",
        classification="contract",
        classification_confidence=Decimal("0.8400"),
        risk_score=12,
        flag_reasons=[],
        expiry_date=today + timedelta(days=3),
        uploaded_at=uploaded_at,
        processed_at=processed_at,
    )

    payload = build_document_automation_payload(
        document,
        user_email="client@example.com",
        today=today,
    )

    assert payload["document_id"] == document_id
    assert payload["user_email"] == "client@example.com"
    assert payload["days_left"] == 3
    assert payload["client_url"].endswith(f"/documents/{document_id}")
    assert payload["reviewer_url"].endswith(f"/admin/documents/{document_id}")
    assert payload["admin_url"].endswith(f"/admin/documents/{document_id}")


def test_build_weekly_summary_payload_counts_statuses() -> None:
    period_end = datetime(2026, 5, 11, tzinfo=UTC)
    period_start = period_end - timedelta(days=7)

    payload = build_weekly_summary_payload(
        total_documents=4,
        status_counts={
            "ai_approved": 2,
            "needs_reviewer": 1,
            "failed": 1,
        },
        period_start=period_start,
        period_end=period_end,
        generated_at=period_end,
    )

    assert payload["total_documents"] == 4
    assert payload["ai_approved"] == 2
    assert payload["needs_reviewer"] == 1
    assert payload["failed"] == 1
    assert payload["reviewer_rejected"] == 0
    assert payload["agreement_rate"] == 50.0


def test_build_legal_obligations_payload_includes_recipients_and_days_left(monkeypatch) -> None:
    from app.services import webhooks

    monkeypatch.setattr(webhooks.settings, "email_ops_recipient", "ops@example.com")
    monkeypatch.setattr(webhooks.settings, "email_manager_recipient", "manager@example.com")
    monkeypatch.setattr(webhooks.settings, "frontend_base_url", "http://localhost:3000")

    document_id = uuid.uuid4()
    document = Document(
        id=document_id,
        user_id=uuid.uuid4(),
        filename="credit-agreement.pdf",
        mime="application/pdf",
        size_bytes=2048,
        sha256="b" * 64,
        storage_path="uploads/credit-agreement.pdf",
        processing_status="completed",
        review_status="needs_reviewer",
        classification="contract",
        classification_confidence=Decimal("0.9100"),
        risk_score=82,
        flag_reasons=["HIGH_VALUE"],
        uploaded_at=datetime(2026, 5, 10, tzinfo=UTC),
        processed_at=datetime(2026, 5, 11, tzinfo=UTC),
    )
    obligation = LegalObligation(
        id=uuid.uuid4(),
        document_id=document_id,
        title="Cung cấp báo cáo định giá tài sản",
        responsible_party="Borrower",
        obligation_type="reporting",
        due_date=datetime.now(UTC).date() + timedelta(days=5),
        urgency="due_soon",
        severity="high",
        status="open",
        source_excerpt="Borrower must provide an appraisal report by the deadline.",
        consequence="Có thể phát sinh sự kiện vi phạm.",
        recommended_action="Giao người phụ trách xác nhận trước hạn.",
    )
    owner = type("Owner", (), {"email": "client@example.com"})()

    payload = build_legal_obligations_payload(
        document=document,
        owner=owner,  # type: ignore[arg-type]
        obligations=[obligation],
        trace_id="obl-123",
    )

    assert payload["trace_id"] == "obl-123"
    assert payload["ops_email"] == "ops@example.com"
    assert payload["manager_email"] == "manager@example.com"
    assert payload["obligation_count"] == 1
    assert payload["high_priority_count"] == 1
    assert payload["obligations"][0]["days_left"] == 5
    assert payload["obligations"][0]["title"] == "Cung cấp báo cáo định giá tài sản"
