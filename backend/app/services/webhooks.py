from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.models.legal_obligation import LegalObligation
from app.models.n8n_event import N8nEvent
from app.models.user import User
from app.services.legal_obligations import days_until


def send_document_reviewed_webhook(
    db: Session,
    *,
    document: Document,
    owner: User,
) -> None:
    trace_id = f"doc-{document.id}-{int(datetime.now(UTC).timestamp())}"
    payload = build_document_reviewed_payload(document=document, owner=owner, trace_id=trace_id)

    status = "success"
    try:
        with httpx.Client(timeout=settings.n8n_webhook_timeout_seconds) as client:
            response = client.post(settings.n8n_webhook_url, json=payload)
            response.raise_for_status()
    except Exception as exc:
        status = "failed"
        payload["error"] = str(exc)

    try:
        db.add(
            N8nEvent(
                trace_id=trace_id,
                event_type="document.reviewed",
                direction="outbound",
                payload=payload,
                status=status,
            )
        )
        db.commit()
    except Exception:
        db.rollback()


def build_document_reviewed_payload(
    *,
    document: Document,
    owner: User,
    trace_id: str,
) -> dict[str, Any]:
    return {
        "event_type": "document.reviewed",
        "trace_id": trace_id,
        "document_id": str(document.id),
        "user_email": owner.email,
        "filename": document.filename,
        "review_status": document.review_status,
        "classification": document.classification,
        "risk_score": document.risk_score,
        "flag_reasons": document.flag_reasons,
        "from_email": settings.email_sender,
        "ops_email": settings.email_ops_recipient,
        "manager_email": settings.email_manager_recipient,
        "reviewer_url": f"{settings.frontend_base_url}/admin/documents/{document.id}",
        "admin_url": f"{settings.frontend_base_url}/admin/documents/{document.id}",
        "client_url": f"{settings.frontend_base_url}/documents/{document.id}",
    }


def send_legal_obligations_webhook(
    db: Session,
    *,
    document: Document,
    owner: User,
) -> None:
    if not settings.n8n_obligations_webhook_url:
        return

    trace_id = f"obl-{document.id}-{int(datetime.now(UTC).timestamp())}"
    obligations = list(document.legal_obligations)
    payload = build_legal_obligations_payload(
        document=document,
        owner=owner,
        obligations=obligations,
        trace_id=trace_id,
    )

    status = "success"
    try:
        with httpx.Client(timeout=settings.n8n_webhook_timeout_seconds) as client:
            response = client.post(settings.n8n_obligations_webhook_url, json=payload)
            response.raise_for_status()
    except Exception as exc:
        status = "failed"
        payload["error"] = str(exc)

    try:
        db.add(
            N8nEvent(
                trace_id=trace_id,
                event_type="legal_obligations.detected",
                direction="outbound",
                payload=payload,
                status=status,
            )
        )
        db.commit()
    except Exception:
        db.rollback()


def build_legal_obligations_payload(
    *,
    document: Document,
    owner: User,
    obligations: list[LegalObligation],
    trace_id: str,
) -> dict[str, Any]:
    frontend_base = str(settings.frontend_base_url).rstrip("/")
    return {
        "event_type": "legal_obligations.detected",
        "trace_id": trace_id,
        "document_id": str(document.id),
        "user_email": owner.email,
        "from_email": settings.email_sender,
        "ops_email": settings.email_ops_recipient,
        "manager_email": settings.email_manager_recipient,
        "filename": document.filename,
        "review_status": document.review_status,
        "classification": document.classification,
        "risk_score": document.risk_score,
        "flag_reasons": document.flag_reasons,
        "client_url": f"{frontend_base}/documents/{document.id}",
        "reviewer_url": f"{frontend_base}/admin/documents/{document.id}",
        "obligation_count": len(obligations),
        "critical_count": sum(1 for item in obligations if item.severity == "critical"),
        "high_priority_count": sum(1 for item in obligations if item.severity in {"high", "critical"}),
        "obligations": [_serialize_obligation(item) for item in obligations],
    }


def _serialize_obligation(obligation: LegalObligation) -> dict[str, Any]:
    due_date = obligation.due_date
    return {
        "id": str(obligation.id),
        "title": obligation.title,
        "responsible_party": obligation.responsible_party,
        "obligation_type": obligation.obligation_type,
        "due_date": due_date.isoformat() if due_date else None,
        "days_left": days_until(due_date),
        "urgency": obligation.urgency,
        "severity": obligation.severity,
        "status": obligation.status,
        "source_excerpt": obligation.source_excerpt,
        "consequence": obligation.consequence,
        "recommended_action": obligation.recommended_action,
    }
