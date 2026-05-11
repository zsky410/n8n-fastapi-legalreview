from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.automation import AutomationDocument, WeeklySummary
from app.services.automation import build_document_automation_payload, build_weekly_summary_payload

router = APIRouter()


@router.get("/expiring", response_model=list[AutomationDocument])
def list_expiring_documents(
    days: int = Query(default=7, ge=1, le=365),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[AutomationDocument]:
    today = datetime.now(UTC).date()
    end_date = today + timedelta(days=days)
    rows = db.execute(
        select(Document, User.email)
        .join(User, Document.user_id == User.id)
        .where(
            Document.expiry_date.is_not(None),
            Document.expiry_date >= today,
            Document.expiry_date <= end_date,
        )
        .order_by(Document.expiry_date.asc(), Document.uploaded_at.desc())
        .limit(limit)
    ).all()
    return [
        AutomationDocument.model_validate(
            build_document_automation_payload(document, user_email=email, today=today)
        )
        for document, email in rows
    ]


@router.get("/audit-sample", response_model=list[AutomationDocument])
def list_ai_approved_audit_sample(
    limit: int = Query(default=5, ge=1, le=25),
    db: Session = Depends(get_db),
) -> list[AutomationDocument]:
    rows = db.execute(
        select(Document, User.email)
        .join(User, Document.user_id == User.id)
        .where(Document.review_status == "ai_approved")
        .order_by(Document.processed_at.desc().nullslast(), Document.uploaded_at.desc())
        .limit(limit)
    ).all()
    return [
        AutomationDocument.model_validate(build_document_automation_payload(document, user_email=email))
        for document, email in rows
    ]


@router.get("/weekly-summary", response_model=WeeklySummary)
def get_weekly_summary(db: Session = Depends(get_db)) -> WeeklySummary:
    period_end = datetime.now(UTC)
    period_start = period_end - timedelta(days=7)
    total_documents = db.scalar(
        select(func.count()).select_from(Document).where(Document.uploaded_at >= period_start)
    )
    status_rows = db.execute(
        select(Document.review_status, func.count())
        .where(Document.uploaded_at >= period_start)
        .group_by(Document.review_status)
    ).all()
    status_counts = {status: count for status, count in status_rows}
    return WeeklySummary.model_validate(
        build_weekly_summary_payload(
            total_documents=total_documents or 0,
            status_counts=status_counts,
            period_start=period_start,
            period_end=period_end,
        )
    )
