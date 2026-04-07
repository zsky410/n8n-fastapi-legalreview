from typing import Any

from pydantic import Field

from app.schemas.common import (
    ApiBaseModel,
    LanguageEnum,
    PriorityEnum,
    RiskLevelEnum,
    RiskSeverityEnum,
)


class LegalReviewMetadata(ApiBaseModel):
    documentName: str | None = Field(default=None, min_length=1)
    documentTypeHint: str | None = Field(default=None, min_length=1)
    priority: PriorityEnum = PriorityEnum.MEDIUM
    submittedBy: str | None = Field(default=None, min_length=1)
    sourceSystem: str | None = Field(default=None, min_length=1)
    tags: list[str] = Field(default_factory=list)


class LegalReviewRequest(ApiBaseModel):
    caseId: str = Field(..., min_length=1)
    extractedText: str = Field(..., min_length=50)
    language: LanguageEnum = LanguageEnum.VI
    metadata: LegalReviewMetadata


class RiskFlag(ApiBaseModel):
    code: str
    label: str
    severity: RiskSeverityEnum
    excerpt: str | None = None
    rationale: str | None = None


class ReviewMeta(ApiBaseModel):
    requestId: str
    provider: str
    model: str
    processingMs: int


class LegalReviewResponse(ApiBaseModel):
    caseId: str
    docType: str
    confidence: float = Field(..., ge=0, le=1)
    riskScore: int = Field(..., ge=0, le=100)
    riskLevel: RiskLevelEnum
    riskFlags: list[RiskFlag]
    extractedFields: dict[str, Any]
    recommendedAction: str
    summary: str
    needsAttention: bool
    qualityWarning: bool
    disclaimer: str
    meta: ReviewMeta

