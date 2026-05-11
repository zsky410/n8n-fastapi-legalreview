from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Any

from app.core.config import settings
from app.models.document import Document


def build_document_automation_payload(
    document: Document,
    *,
    user_email: str,
    today: date | None = None,
) -> dict[str, Any]:
    current_date = today or datetime.now(UTC).date()
    expiry_date = document.expiry_date
    days_left = (expiry_date - current_date).days if expiry_date is not None else None
    frontend_base_url = str(settings.frontend_base_url).rstrip("/")

    return {
        "document_id": document.id,
        "filename": document.filename,
        "user_email": user_email,
        "review_status": document.review_status,
        "classification": document.classification,
        "classification_confidence": document.classification_confidence,
        "risk_score": document.risk_score,
        "flag_reasons": document.flag_reasons,
        "expiry_date": expiry_date,
        "days_left": days_left,
        "uploaded_at": document.uploaded_at,
        "processed_at": document.processed_at,
        "client_url": f"{frontend_base_url}/documents/{document.id}",
        "admin_url": f"{frontend_base_url}/admin/documents/{document.id}",
    }


def build_weekly_summary_payload(
    *,
    total_documents: int,
    status_counts: dict[str, int],
    period_start: datetime,
    period_end: datetime,
    generated_at: datetime | None = None,
) -> dict[str, Any]:
    ai_approved = status_counts.get("ai_approved", 0)
    reviewed_count = sum(status_counts.values())
    agreement_rate = round((ai_approved / reviewed_count) * 100, 2) if reviewed_count else 0.0

    return {
        "generated_at": generated_at or datetime.now(UTC),
        "period_start": period_start,
        "period_end": period_end,
        "total_documents": total_documents,
        "ai_approved": ai_approved,
        "pending_admin": status_counts.get("pending_admin", 0),
        "admin_approved": status_counts.get("admin_approved", 0),
        "admin_rejected": status_counts.get("admin_rejected", 0),
        "failed": status_counts.get("failed", 0),
        "processing": status_counts.get("processing", 0),
        "agreement_rate": agreement_rate,
    }
