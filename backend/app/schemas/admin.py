from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.document import RiskFindingRead


class AdminDocumentListItem(BaseModel):
    id: UUID
    filename: str
    owner_email: str
    review_status: str
    processing_status: str
    classification: str | None
    risk_score: int
    flag_reasons: list[str]
    uploaded_at: datetime
    processed_at: datetime | None


class AdminReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    reviewer_email: str | None = None
    decision: str
    comment: str | None
    override_ai: bool
    created_at: datetime


class AdminAuditLogRead(BaseModel):
    id: UUID
    actor_email: str | None = None
    action: str
    target_type: str
    target_id: UUID | None
    payload: dict[str, Any]
    created_at: datetime


class AdminDocumentDetail(AdminDocumentListItem):
    mime: str
    size_bytes: int
    sha256: str
    summary: str | None
    extracted_text: str | None
    classification_confidence: Decimal | None
    ai_confidence: Decimal | None
    risk_findings: list[RiskFindingRead]
    reviews: list[AdminReviewRead]
    audit_logs: list[AdminAuditLogRead]


class AdminDecisionRequest(BaseModel):
    decision: Literal["approve", "reject"]
    comment: str = Field(min_length=3, max_length=2000)


class AdminDecisionResponse(BaseModel):
    document_id: UUID
    review_status: str
    decision: str
    message: str


class AdminStats(BaseModel):
    total_documents: int
    ai_approved: int
    pending_admin: int
    admin_approved: int
    admin_rejected: int
    failed: int
    agreement_rate: float
    top_flag_reason: str | None
