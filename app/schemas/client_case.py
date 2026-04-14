from pydantic import Field

from app.schemas.common import ApiBaseModel, PriorityEnum, RiskLevelEnum
from app.schemas.legal_chat import PersistedChatMessage
from app.schemas.legal_review import LegalReviewResponse


class ClientCaseAttachment(ApiBaseModel):
    name: str = Field(min_length=1, max_length=255)
    size: int = Field(ge=0)
    type: str = Field(default="", max_length=120)


class ClientCaseCreateRequest(ApiBaseModel):
    title: str = Field(min_length=1, max_length=255)
    documentName: str = Field(min_length=1, max_length=255)
    description: str = Field(default="", max_length=4000)
    domain: str = Field(default="", max_length=120)
    priority: PriorityEnum = PriorityEnum.MEDIUM
    extractedText: str = Field(min_length=1, max_length=50000)
    attachments: list[ClientCaseAttachment] = Field(default_factory=list)
    slaDueAt: str | None = None


class ClientCaseResponse(ApiBaseModel):
    id: str
    title: str
    documentName: str
    description: str
    domain: str
    priority: PriorityEnum
    status: str
    riskLevel: RiskLevelEnum
    needsAttention: bool
    createdAt: str
    updatedAt: str
    extractedText: str
    attachments: list[ClientCaseAttachment] = Field(default_factory=list)
    slaDueAt: str | None = None
    review: LegalReviewResponse | None = None
    chatMessages: list[PersistedChatMessage] = Field(default_factory=list)
