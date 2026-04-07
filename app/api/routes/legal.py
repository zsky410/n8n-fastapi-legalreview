from fastapi import APIRouter, Depends

from app.schemas.legal_review import LegalReviewRequest, LegalReviewResponse
from app.services.legal_review_service import LegalReviewService

router = APIRouter(prefix="/legal", tags=["legal"])


def get_legal_review_service() -> LegalReviewService:
    return LegalReviewService()


@router.post("/review", response_model=LegalReviewResponse, summary="Analyze a legal case document")
def review_legal_case(
    payload: LegalReviewRequest,
    service: LegalReviewService = Depends(get_legal_review_service),
) -> LegalReviewResponse:
    return service.analyze(payload)

