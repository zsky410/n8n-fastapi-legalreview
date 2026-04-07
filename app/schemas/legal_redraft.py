from pydantic import Field

from app.schemas.common import ApiBaseModel


class LegalRedraftRequest(ApiBaseModel):
    clauseText: str = Field(..., min_length=10)
    objective: str = Field(..., min_length=3)


class LegalRedraftResponse(ApiBaseModel):
    revisedClause: str
    rationale: str
