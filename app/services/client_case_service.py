import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from app.core.config import Settings, get_settings
from app.schemas.auth import AuthUser
from app.schemas.client_case import ClientCaseCreateRequest, ClientCaseResponse
from app.schemas.legal_review import LegalReviewResponse
from app.services.client_case_repository import ClientCaseRepository, StoredCaseRecord


class ClientCaseService:
    def __init__(
        self,
        settings: Settings | None = None,
        repository: ClientCaseRepository | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.repository = repository or ClientCaseRepository(self.settings)

    def ensure_schema(self) -> None:
        self.repository.ensure_schema()

    def list_cases(self, current_user: AuthUser) -> list[ClientCaseResponse]:
        self.ensure_schema()
        return [self._serialize_case(record) for record in self.repository.list_cases(current_user.id)]

    def get_case(self, current_user: AuthUser, case_id: str) -> ClientCaseResponse:
        self.ensure_schema()
        record = self.repository.get_case(current_user.id, case_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy hồ sơ này trong tài khoản hiện tại.",
            )
        return self._serialize_case(record)

    def create_case(self, current_user: AuthUser, payload: ClientCaseCreateRequest) -> ClientCaseResponse:
        self.ensure_schema()
        record = self.repository.create_case(
            owner_user_id=current_user.id,
            case_id=self._generate_case_id(),
            title=" ".join(payload.title.split()),
            document_name=" ".join(payload.documentName.split()),
            description=" ".join(payload.description.split()),
            domain=" ".join(payload.domain.split()),
            priority=payload.priority,
            extracted_text=payload.extractedText.strip(),
            attachments=[attachment.model_dump() for attachment in payload.attachments],
            sla_due_at=self._resolve_sla(payload.slaDueAt),
        )
        return self._serialize_case(record)

    def save_review(
        self,
        current_user: AuthUser,
        case_id: str,
        review: LegalReviewResponse,
    ) -> ClientCaseResponse:
        self.ensure_schema()
        updated_case = self.repository.upsert_review(
            owner_user_id=current_user.id,
            case_id=case_id,
            review_json=review.model_dump(),
            risk_level=review.riskLevel,
            needs_attention=bool(review.needsAttention),
        )
        if not updated_case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy hồ sơ để lưu kết quả phân tích.",
            )
        return self._serialize_case(updated_case)

    @staticmethod
    def _generate_case_id() -> str:
        return f"CASE-{uuid.uuid4().hex[:8].upper()}"

    @staticmethod
    def _resolve_sla(sla_due_at: str | None) -> datetime:
        if sla_due_at:
            return datetime.fromisoformat(sla_due_at.replace("Z", "+00:00"))
        return datetime.now(timezone.utc) + timedelta(hours=4)

    @staticmethod
    def _serialize_case(record: StoredCaseRecord) -> ClientCaseResponse:
        review = LegalReviewResponse.model_validate(record.review_json) if record.review_json else None
        return ClientCaseResponse(
            id=record.id,
            title=record.title,
            documentName=record.document_name,
            description=record.description,
            domain=record.domain,
            priority=record.priority,
            status=record.status,
            riskLevel=record.risk_level,
            needsAttention=record.needs_attention,
            createdAt=record.created_at.isoformat(),
            updatedAt=record.updated_at.isoformat(),
            extractedText=record.extracted_text,
            attachments=record.attachments,
            slaDueAt=record.sla_due_at.isoformat() if record.sla_due_at else None,
            review=review,
            chatMessages=record.chat_messages,
        )
