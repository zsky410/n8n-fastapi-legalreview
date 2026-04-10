from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.schemas.common import LanguageEnum
from app.schemas.document_ocr import DocumentOcrResponse
from app.schemas.legal_chat import LegalChatRequest, LegalChatResponse
from app.schemas.legal_review import LegalReviewRequest, LegalReviewResponse
from app.services.document_ocr_service import DocumentOcrService
from app.services.legal_chat_service import LegalChatService
from app.services.legal_review_service import LegalReviewService

router = APIRouter(prefix="/legal", tags=["legal"])


def get_legal_review_service() -> LegalReviewService:
    return LegalReviewService()


def get_legal_chat_service() -> LegalChatService:
    return LegalChatService()


def get_document_ocr_service() -> DocumentOcrService:
    return DocumentOcrService()


@router.post("/review", response_model=LegalReviewResponse, summary="Analyze a legal case document")
def review_legal_case(
    payload: LegalReviewRequest,
    service: LegalReviewService = Depends(get_legal_review_service),
) -> LegalReviewResponse:
    return service.analyze(payload)


@router.post("/chat", response_model=LegalChatResponse, summary="Ask follow-up questions about a legal case")
def chat_about_legal_case(
    payload: LegalChatRequest,
    service: LegalChatService = Depends(get_legal_chat_service),
) -> LegalChatResponse:
    return service.answer(payload)


@router.post("/ocr", response_model=DocumentOcrResponse, summary="Extract text from an uploaded legal document")
async def extract_document_text(
    file: UploadFile = File(...),
    language: LanguageEnum = Form(LanguageEnum.VI),
    service: DocumentOcrService = Depends(get_document_ocr_service),
) -> DocumentOcrResponse:
    return await service.extract(file, language)
