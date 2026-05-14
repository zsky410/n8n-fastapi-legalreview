from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class RiskFindingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    rule_code: str
    severity: str
    snippet: str | None
    suggestion: str | None
    created_at: datetime


class DocumentAuditLogRead(BaseModel):
    id: UUID
    actor_email: str | None = None
    action: str
    target_type: str
    target_id: UUID | None
    payload: dict[str, Any]
    created_at: datetime


class DocumentListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    filename: str
    mime: str
    size_bytes: int
    processing_status: str
    review_status: str
    classification: str | None
    classification_confidence: Decimal | None
    risk_score: int
    flag_reasons: list[str]
    uploaded_at: datetime
    processed_at: datetime | None


class DocumentDetail(DocumentListItem):
    summary: str | None
    extracted_text: str | None
    ai_confidence: Decimal | None
    ai_thinking_log: str | None = None
    expiry_date: date | None
    risk_findings: list[RiskFindingRead]
    audit_logs: list[DocumentAuditLogRead] = []


class DocumentUploadResponse(BaseModel):
    id: UUID
    filename: str
    processing_status: str
    review_status: str
    message: str
