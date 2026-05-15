from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class AutomationDocument(BaseModel):
    document_id: UUID
    filename: str
    user_email: str
    review_status: str
    classification: str | None
    classification_confidence: Decimal | None
    risk_score: int
    flag_reasons: list[str]
    expiry_date: date | None
    days_left: int | None
    uploaded_at: datetime
    processed_at: datetime | None
    client_url: str
    reviewer_url: str
    admin_url: str


class WeeklySummary(BaseModel):
    generated_at: datetime
    period_start: datetime
    period_end: datetime
    total_documents: int
    ai_approved: int
    needs_reviewer: int
    reviewer_approved: int
    reviewer_rejected: int
    failed: int
    processing: int
    agreement_rate: float
