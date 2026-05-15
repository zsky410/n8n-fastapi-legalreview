from __future__ import annotations

from collections import Counter
from datetime import UTC, datetime, time, timedelta
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.v1.dependencies import get_current_user
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.document import Document
from app.models.n8n_event import N8nEvent
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
    AdminWorkflowActivityPoint,
    AdminWorkflowLogRead,
    AdminWorkflowMetric,
    AdminWorkflowObservability,
)
from app.services.audit import create_audit_log
from app.services.review_status import (
    AI_APPROVED,
    APPROVED_STATUSES,
    HUMAN_APPROVED_STATUSES,
    HUMAN_REJECTED_STATUSES,
    HUMAN_REVIEW_PENDING_STATUSES,
    REVIEWER_APPROVED,
    REVIEWER_REJECTED,
    count_statuses,
    is_human_review_pending,
)
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
        query = query.where(Document.review_status.in_(HUMAN_REVIEW_PENDING_STATUSES))
    elif scope == "ai_approved":
        query = query.where(Document.review_status == AI_APPROVED)

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
            selectinload(Document.legal_obligations),
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
    if not is_human_review_pending(document.review_status):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Document is not waiting for reviewer handling",
        )

    previous_status = document.review_status
    review_status = REVIEWER_APPROVED if payload.decision == "approve" else REVIEWER_REJECTED
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
        action="reviewer.decision.submitted",
        target_type="document",
        target_id=document.id,
        actor_id=current_user.id,
        payload={
            "decision": review_status,
            "comment": payload.comment,
            "previous_status": previous_status,
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
    approved_total = count_statuses(status_counts, APPROVED_STATUSES)
    agreement_rate = round((approved_total / reviewed_total) * 100, 1) if reviewed_total else 0.0

    flag_reasons = db.scalars(select(Document.flag_reasons)).all()
    top_flag_reason = _top_flag_reason(flag_reasons)

    return AdminStats(
        total_documents=total_documents,
        ai_approved=status_counts.get(AI_APPROVED, 0),
        needs_reviewer=count_statuses(status_counts, HUMAN_REVIEW_PENDING_STATUSES),
        reviewer_approved=count_statuses(status_counts, HUMAN_APPROVED_STATUSES),
        reviewer_rejected=count_statuses(status_counts, HUMAN_REJECTED_STATUSES),
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


@router.get("/workflow-logs", response_model=AdminWorkflowObservability)
def get_workflow_logs(
    limit: int = Query(default=30, ge=1, le=200),
    days: int = Query(default=7, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AdminWorkflowObservability:
    _assert_reviewer(current_user)
    total_events = db.scalar(select(func.count()).select_from(N8nEvent)) or 0
    status_rows = db.execute(select(N8nEvent.status, func.count()).group_by(N8nEvent.status)).all()
    status_counts = {row_status: count for row_status, count in status_rows}
    success_events = sum(count for row_status, count in status_counts.items() if _status_bucket(row_status) == "success")
    failed_events = sum(count for row_status, count in status_counts.items() if _status_bucket(row_status) == "failed")
    in_progress_events = max(total_events - success_events - failed_events, 0)
    success_rate = round((success_events / total_events) * 100, 1) if total_events else 0.0

    recent_events = db.scalars(
        select(N8nEvent)
        .order_by(N8nEvent.created_at.desc())
        .limit(limit)
    ).all()
    latest_event = recent_events[0] if recent_events else None

    now = datetime.now(UTC)
    window_start = datetime.combine(now.date() - timedelta(days=days - 1), time.min, tzinfo=UTC)
    window_events = db.scalars(
        select(N8nEvent)
        .where(N8nEvent.created_at >= window_start)
        .order_by(N8nEvent.created_at.asc())
    ).all()

    workflow_counter: Counter[str] = Counter(_workflow_name(event) or "unknown" for event in window_events)
    return AdminWorkflowObservability(
        total_events=total_events,
        success_events=success_events,
        failed_events=failed_events,
        in_progress_events=in_progress_events,
        success_rate=success_rate,
        latest_event_at=latest_event.created_at if latest_event else None,
        latest_status=latest_event.status if latest_event else None,
        status_counts=[
            AdminWorkflowMetric(label=row_status, count=count)
            for row_status, count in sorted(status_counts.items(), key=lambda item: item[1], reverse=True)
        ],
        workflow_counts=[
            AdminWorkflowMetric(label=workflow, count=count)
            for workflow, count in workflow_counter.most_common(6)
        ],
        activity=_build_workflow_activity(window_events, days=days, now=now),
        recent_events=[_build_workflow_log_read(event) for event in recent_events],
    )


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
        legal_obligations=list(document.legal_obligations),
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


def _build_workflow_log_read(event: N8nEvent) -> AdminWorkflowLogRead:
    return AdminWorkflowLogRead(
        id=event.id,
        trace_id=event.trace_id,
        event_type=event.event_type,
        direction=event.direction,
        status=event.status,
        workflow=_workflow_name(event),
        payload=event.payload,
        created_at=event.created_at,
    )


def _build_workflow_activity(
    events: list[N8nEvent],
    *,
    days: int,
    now: datetime,
) -> list[AdminWorkflowActivityPoint]:
    labels = [(now.date() - timedelta(days=offset)) for offset in range(days - 1, -1, -1)]
    buckets = {day: {"success": 0, "failed": 0, "other": 0} for day in labels}
    for event in events:
        event_day = event.created_at.date()
        if event_day not in buckets:
            continue
        bucket = _status_bucket(event.status)
        buckets[event_day][bucket] += 1

    return [
        AdminWorkflowActivityPoint(
            label=day.strftime("%d/%m"),
            success=counts["success"],
            failed=counts["failed"],
            other=counts["other"],
        )
        for day, counts in buckets.items()
    ]


def _status_bucket(status_value: str) -> Literal["success", "failed", "other"]:
    normalized_status = status_value.lower()
    if "fail" in normalized_status or "error" in normalized_status:
        return "failed"
    if normalized_status in {"success", "completed", "sent", "ok"}:
        return "success"
    if "completed" in normalized_status or "sent" in normalized_status:
        return "success"
    return "other"


def _workflow_name(event: N8nEvent) -> str | None:
    workflow = event.payload.get("workflow") or event.payload.get("workflow_name") or event.payload.get("workflowId")
    if isinstance(workflow, str) and workflow.strip():
        return workflow.strip()
    if event.event_type:
        return event.event_type.split(".")[0]
    return None
