from pydantic import Field

from app.schemas.common import ApiBaseModel


class DependencyStatus(ApiBaseModel):
    status: str
    detail: str | None = None


class HealthResponse(ApiBaseModel):
    status: str
    service: str
    environment: str
    timestamp: str
    dependencies: dict[str, DependencyStatus] = Field(default_factory=dict)
