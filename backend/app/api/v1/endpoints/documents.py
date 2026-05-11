from __future__ import annotations

from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import Select, select
from sqlalchemy.orm import Session, selectinload

from app.api.v1.dependencies import get_current_user
from app.db.session import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentDetail, DocumentListItem, DocumentUploadResponse
from app.services.audit import create_audit_log
from app.services.document_pipeline import process_document_task
from app.services.storage import store_upload

router = APIRouter()


@router.post("", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentUploadResponse:
    storage_path, size_bytes, sha256 = store_upload(file, user_id=current_user.id)
    document = Document(
        user_id=current_user.id,
        filename=file.filename or Path(storage_path).name,
        mime=_normalize_mime(file.content_type, storage_path),
        size_bytes=size_bytes,
        sha256=sha256,
        storage_path=storage_path,
        processing_status="pending",
        review_status="processing",
        flag_reasons=[],
    )
    db.add(document)
    db.flush()
    create_audit_log(
        db,
        action="document.uploaded",
        target_type="document",
        target_id=document.id,
        actor_id=current_user.id,
        payload={
            "filename": document.filename,
            "mime": document.mime,
            "size_bytes": document.size_bytes,
            "sha256": document.sha256,
        },
    )
    db.commit()

    background_tasks.add_task(process_document_task, document.id)
    return DocumentUploadResponse(
        id=document.id,
        filename=document.filename,
        processing_status=document.processing_status,
        review_status=document.review_status,
        message="Document uploaded and queued for processing",
    )


@router.get("", response_model=list[DocumentListItem])
def list_documents(
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DocumentListItem]:
    query: Select[tuple[Document]] = select(Document).order_by(Document.uploaded_at.desc())
    if current_user.role not in {"admin", "reviewer"}:
        query = query.where(Document.user_id == current_user.id)
    if status_filter:
        query = query.where(Document.review_status == status_filter)
    documents = db.scalars(query).all()
    return [DocumentListItem.model_validate(document) for document in documents]


@router.get("/{document_id}", response_model=DocumentDetail)
def get_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentDetail:
    document = _get_document_or_404(db, document_id=document_id)
    _assert_document_access(document, current_user)

    detailed_document = db.scalar(
        select(Document)
        .where(Document.id == document_id)
        .options(selectinload(Document.risk_findings))
    )
    if detailed_document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return DocumentDetail.model_validate(detailed_document)


@router.get("/{document_id}/download")
def download_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FileResponse:
    document = _get_document_or_404(db, document_id=document_id)
    _assert_document_access(document, current_user)
    return FileResponse(
        path=document.storage_path,
        filename=document.filename,
        media_type=document.mime,
    )


def _get_document_or_404(db: Session, *, document_id: UUID) -> Document:
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return document


def _assert_document_access(document: Document, user: User) -> None:
    if user.role in {"admin", "reviewer"}:
        return
    if document.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def _guess_mime(storage_path: str) -> str:
    suffix = Path(storage_path).suffix.lower()
    return {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }.get(suffix, "application/octet-stream")


def _normalize_mime(content_type: str | None, storage_path: str) -> str:
    if not content_type or content_type == "application/octet-stream":
        return _guess_mime(storage_path)
    return content_type
