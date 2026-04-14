from fastapi import APIRouter, Depends

from app.api.routes.auth import get_current_client_user
from app.schemas.auth import AuthUser
from app.schemas.client_case import ClientCaseCreateRequest, ClientCaseResponse
from app.schemas.legal_review import LegalReviewResponse
from app.services.client_case_service import ClientCaseService

router = APIRouter(prefix="/client/cases", tags=["client-cases"])


def get_client_case_service() -> ClientCaseService:
    return ClientCaseService()


@router.get("", response_model=list[ClientCaseResponse], summary="List current client cases")
def list_client_cases(
    current_user: AuthUser = Depends(get_current_client_user),
    service: ClientCaseService = Depends(get_client_case_service),
) -> list[ClientCaseResponse]:
    return service.list_cases(current_user)


@router.post("", response_model=ClientCaseResponse, summary="Create a client case")
def create_client_case(
    payload: ClientCaseCreateRequest,
    current_user: AuthUser = Depends(get_current_client_user),
    service: ClientCaseService = Depends(get_client_case_service),
) -> ClientCaseResponse:
    return service.create_case(current_user, payload)


@router.get("/{case_id}", response_model=ClientCaseResponse, summary="Get one client case")
def get_client_case(
    case_id: str,
    current_user: AuthUser = Depends(get_current_client_user),
    service: ClientCaseService = Depends(get_client_case_service),
) -> ClientCaseResponse:
    return service.get_case(current_user, case_id)


@router.put("/{case_id}/review", response_model=ClientCaseResponse, summary="Persist latest review for a client case")
def save_client_case_review(
    case_id: str,
    payload: LegalReviewResponse,
    current_user: AuthUser = Depends(get_current_client_user),
    service: ClientCaseService = Depends(get_client_case_service),
) -> ClientCaseResponse:
    return service.save_review(current_user, case_id, payload)
