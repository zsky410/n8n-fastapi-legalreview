from __future__ import annotations

from collections import Counter
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.v1.dependencies import get_current_user
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.document import Document
from app.models.review import Review
from app.models.user import User
from app.schemas.admin import (
    AdminAuditLogRead,
    AdminDecisionRequest,
    AdminDecisionResponse,
    AdminDocumentDetail,
    AdminDocumentListItem,
    AdminReviewRead,
    AdminStats,
)
from app.services.audit import create_audit_log
from app.services.webhooks import send_document_reviewed_webhook

router = APIRouter()


@router.get("/queue", response_model=list[AdminDocumentListItem])
def list_review_queue(
    scope: Literal["pending", "ai_approved", "all"] = Query(default="pending"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AdminDocumentListItem]:
    _assert_reviewer(current_user)
    query = (
        select(Document, User.email)
        .join(User, Document.user_id == User.id)
        .order_by(Document.risk_score.desc(), Document.uploaded_at.asc())
    )
    if scope == "pending":
        query = query.where(Document.review_status == "pending_admin")
    elif scope == "ai_approved":
        query = query.where(Document.review_status == "ai_approved")

    rows = db.execute(query).all()
    return [_build_admin_document_list_item(document, owner_email) for document, owner_email in rows]


@router.get("/documents/{document_id}", response_model=AdminDocumentDetail)
def get_admin_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AdminDocumentDetail:
    _assert_reviewer(current_user)
    document = db.scalar(
        select(Document)
        .where(Document.id == document_id)
        .options(
            selectinload(Document.user),
            selectinload(Document.risk_findings),
            selectinload(Document.reviews).selectinload(Review.reviewer),
        )
    )
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    audit_logs = db.scalars(
        select(AuditLog)
        .where(AuditLog.target_id == document.id)
        .options(selectinload(AuditLog.actor))
        .order_by(AuditLog.created_at.desc())
        .limit(10)
    ).all()
    return _build_admin_document_detail(document, audit_logs=list(audit_logs))


@router.post("/documents/{document_id}/decision", response_model=AdminDecisionResponse)
def submit_admin_decision(
    document_id: UUID,
    payload: AdminDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AdminDecisionResponse:
    _assert_reviewer(current_user)
    document = db.scalar(
        select(Document)
        .where(Document.id == document_id)
        .options(selectinload(Document.user))
    )
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if document.review_status != "pending_admin":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Document is not pending admin review",
        )

    review_status = "admin_approved" if payload.decision == "approve" else "admin_rejected"
    document.review_status = review_status
    review = Review(
        document_id=document.id,
        reviewer_id=current_user.id,
        decision=review_status,
        comment=payload.comment,
        override_ai=True,
    )
    db.add(review)
    create_audit_log(
        db,
        action="admin.decision.submitted",
        target_type="document",
        target_id=document.id,
        actor_id=current_user.id,
        payload={
            "decision": review_status,
            "comment": payload.comment,
            "previous_status": "pending_admin",
        },
    )
    db.commit()
    db.refresh(document)

    if document.user is not None:
        send_document_reviewed_webhook(db, document=document, owner=document.user)

    return AdminDecisionResponse(
        document_id=document.id,
        review_status=document.review_status,
        decision=review_status,
        message="Decision saved",
    )


@router.get("/stats", response_model=AdminStats)
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AdminStats:
    _assert_reviewer(current_user)
    total_documents = db.scalar(select(func.count()).select_from(Document)) or 0
    status_rows = db.execute(select(Document.review_status, func.count()).group_by(Document.review_status)).all()
    status_counts = {row_status: count for row_status, count in status_rows}
    reviewed_total = sum(status_counts.values())
    approved_total = status_counts.get("ai_approved", 0) + status_counts.get("admin_approved", 0)
    agreement_rate = round((approved_total / reviewed_total) * 100, 1) if reviewed_total else 0.0

    flag_reasons = db.scalars(select(Document.flag_reasons)).all()
    top_flag_reason = _top_flag_reason(flag_reasons)

    return AdminStats(
        total_documents=total_documents,
        ai_approved=status_counts.get("ai_approved", 0),
        pending_admin=status_counts.get("pending_admin", 0),
        admin_approved=status_counts.get("admin_approved", 0),
        admin_rejected=status_counts.get("admin_rejected", 0),
        failed=status_counts.get("failed", 0),
        agreement_rate=agreement_rate,
        top_flag_reason=top_flag_reason,
    )


@router.get("/audit-logs", response_model=list[AdminAuditLogRead])
def list_audit_logs(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AdminAuditLogRead]:
    _assert_reviewer(current_user)
    audit_logs = db.scalars(
        select(AuditLog)
        .options(selectinload(AuditLog.actor))
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    ).all()
    return [_build_audit_log_read(audit_log) for audit_log in audit_logs]


def _assert_reviewer(user: User) -> None:
    if user.role not in {"admin", "reviewer"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Reviewer access required")


def _build_admin_document_list_item(document: Document, owner_email: str) -> AdminDocumentListItem:
    return AdminDocumentListItem(
        id=document.id,
        filename=document.filename,
        owner_email=owner_email,
        review_status=document.review_status,
        processing_status=document.processing_status,
        classification=document.classification,
        risk_score=document.risk_score,
        flag_reasons=document.flag_reasons,
        uploaded_at=document.uploaded_at,
        processed_at=document.processed_at,
    )


def _build_admin_document_detail(
    document: Document,
    *,
    audit_logs: list[AuditLog],
) -> AdminDocumentDetail:
    return AdminDocumentDetail(
        id=document.id,
        filename=document.filename,
        owner_email=document.user.email,
        review_status=document.review_status,
        processing_status=document.processing_status,
        classification=document.classification,
        risk_score=document.risk_score,
        flag_reasons=document.flag_reasons,
        uploaded_at=document.uploaded_at,
        processed_at=document.processed_at,
        mime=document.mime,
        size_bytes=document.size_bytes,
        sha256=document.sha256,
        summary=document.summary,
        extracted_text=document.extracted_text,
        classification_confidence=document.classification_confidence,
        ai_confidence=document.ai_confidence,
        ai_thinking_log=document.ai_thinking_log,
        risk_findings=list(document.risk_findings),
        reviews=[
            AdminReviewRead(
                id=review.id,
                reviewer_email=review.reviewer.email if review.reviewer else None,
                decision=review.decision,
                comment=review.comment,
                override_ai=review.override_ai,
                created_at=review.created_at,
            )
            for review in document.reviews
        ],
        audit_logs=[_build_audit_log_read(audit_log) for audit_log in audit_logs],
    )


def _build_audit_log_read(audit_log: AuditLog) -> AdminAuditLogRead:
    return AdminAuditLogRead(
        id=audit_log.id,
        actor_email=audit_log.actor.email if audit_log.actor else None,
        action=audit_log.action,
        target_type=audit_log.target_type,
        target_id=audit_log.target_id,
        payload=audit_log.payload,
        created_at=audit_log.created_at,
    )


def _top_flag_reason(flag_reasons: list[list[str]]) -> str | None:
    counter: Counter[str] = Counter()
    for reasons in flag_reasons:
        counter.update(reasons or [])
    if not counter:
        return None
    return counter.most_common(1)[0][0]
