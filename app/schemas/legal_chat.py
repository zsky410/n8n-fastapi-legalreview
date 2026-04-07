from enum import Enum

from pydantic import Field

from app.schemas.common import ApiBaseModel, LanguageEnum


class ChatRoleEnum(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ConversationMessage(ApiBaseModel):
    role: ChatRoleEnum
    content: str = Field(..., min_length=1)


class LegalChatRequest(ApiBaseModel):
    caseId: str = Field(..., min_length=1)
    question: str = Field(..., min_length=3)
    conversationContext: list[ConversationMessage] = Field(default_factory=list)
    language: LanguageEnum = LanguageEnum.VI


class ChatCitation(ApiBaseModel):
    excerpt: str = Field(..., min_length=1)
    source: str | None = None
    rationale: str | None = None


class LegalChatLLMOutput(ApiBaseModel):
    answer: str = Field(..., min_length=1)
    citations: list[ChatCitation] = Field(default_factory=list)
    caution: str | None = None
    confidence: float = Field(..., ge=0, le=1)
    needsAttention: bool


class LegalChatResponse(ApiBaseModel):
    caseId: str
    answer: str
    citations: list[ChatCitation] = Field(default_factory=list)
    caution: str | None = None
    confidence: float = Field(..., ge=0, le=1)
    needsAttention: bool
    disclaimer: str | None = None
