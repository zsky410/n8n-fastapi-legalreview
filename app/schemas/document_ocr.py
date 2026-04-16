from pydantic import Field

from app.schemas.common import ApiBaseModel


class DocumentTitleSuggestionLLMOutput(ApiBaseModel):
    suggestedTitle: str = Field(..., min_length=3, max_length=120)


class DocumentOcrPageDetail(ApiBaseModel):
    pageNumber: int = Field(..., ge=1)
    source: str = Field(..., min_length=1)
    charCount: int = Field(..., ge=0)
    hasText: bool = False


class DocumentOcrResponse(ApiBaseModel):
    fileName: str = Field(..., min_length=1)
    mimeType: str | None = None
    extractedText: str = Field(..., min_length=1)
    provider: str = Field(..., min_length=1)
    source: str = Field(..., min_length=1)
    textLength: int = Field(..., ge=1)
    pageCount: int | None = Field(default=None, ge=1)
    extractedPageCount: int | None = Field(default=None, ge=0)
    emptyPageCount: int | None = Field(default=None, ge=0)
    pageDetails: list[DocumentOcrPageDetail] = Field(default_factory=list)
    suggestedTitle: str | None = Field(default=None, min_length=3, max_length=120)
    suggestionSource: str | None = Field(default=None, min_length=1)
    truncated: bool = False
    warning: str | None = None
