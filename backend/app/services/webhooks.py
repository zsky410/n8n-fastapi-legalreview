from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.models.n8n_event import N8nEvent
from app.models.user import User


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
        "admin_url": f"{settings.frontend_base_url}/admin/documents/{document.id}",
        "client_url": f"{settings.frontend_base_url}/documents/{document.id}",
    }
