from pydantic import Field

from app.schemas.common import ApiBaseModel


class DocumentOcrResponse(ApiBaseModel):
    fileName: str = Field(..., min_length=1)
    mimeType: str | None = None
    extractedText: str = Field(..., min_length=1)
    provider: str = Field(..., min_length=1)
    source: str = Field(..., min_length=1)
    textLength: int = Field(..., ge=1)
    truncated: bool = False
    warning: str | None = None
