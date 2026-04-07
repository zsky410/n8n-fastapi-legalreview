from pydantic import Field

from app.schemas.common import ApiBaseModel


class ErrorDetail(ApiBaseModel):
    code: str
    message: str
    field: str | None = None


class ErrorResponse(ApiBaseModel):
    error: str
    message: str
    details: list[ErrorDetail] = Field(default_factory=list)
    requestId: str
