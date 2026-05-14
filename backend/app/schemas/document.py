from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


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


class DocumentChatMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    document_id: UUID
    user_id: UUID
    role: str
    content: str
    provider: str | None = None
    model: str | None = None
    created_at: datetime


class DocumentChatRequest(BaseModel):
    message: str = Field(min_length=2, max_length=4000)


class DocumentChatResponse(BaseModel):
    assistant_message: DocumentChatMessageRead
    messages: list[DocumentChatMessageRead]
