from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
import time
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.document import Document
from app.models.risk_finding import RiskFinding
from app.services.ai_review import JSON_FR, preview_streaming_thinking, review_document_with_ai
from app.services.audit import create_audit_log
from app.services.classification import classify_document
from app.services.extraction import ExtractionResult, compute_quality_score, detect_expiry_date, extract_text
from app.services.flagging import decide_review_status
from app.services.risk_engine import evaluate_risks
from app.services.webhooks import send_document_reviewed_webhook


def process_document_task(document_id: UUID) -> None:
    with SessionLocal() as db:
        process_document(db, document_id=document_id)


def extract_document_task(document_id: UUID) -> None:
    with SessionLocal() as db:
        extract_document(db, document_id=document_id)


def review_document_task(document_id: UUID) -> None:
    with SessionLocal() as db:
        review_document(db, document_id=document_id)


def process_document(db: Session, *, document_id: UUID) -> None:
    extract_document(db, document_id=document_id)
    document = db.get(Document, document_id)
    if document is not None and document.review_status == "awaiting_ai_review":
        review_document(db, document_id=document_id)


def extract_document(db: Session, *, document_id: UUID) -> None:
    document = db.get(Document, document_id)
    if document is None:
        return

    document.processing_status = "extracting"
    document.review_status = "awaiting_extraction"
    create_audit_log(
        db,
        action="document.extraction.started",
        target_type="document",
        target_id=document.id,
        actor_id=document.user_id,
        payload={"filename": document.filename},
    )
    db.commit()
    db.refresh(document)

    try:
        extraction = extract_text(document.storage_path)
        expiry_date = extraction.expiry_date
        document.extracted_text = extraction.text
        document.summary = None
        document.classification = None
        document.classification_confidence = None
        document.risk_score = 0
        document.ai_confidence = None
        document.ai_thinking_log = None
        document.flag_reasons = []
        document.expiry_date = expiry_date
        document.processing_status = "extracted"
        document.review_status = "awaiting_ai_review"
        document.processed_at = None

        db.query(RiskFinding).filter(RiskFinding.document_id == document.id).delete()
        create_audit_log(
            db,
            action="document.extraction.completed",
            target_type="document",
            target_id=document.id,
            actor_id=document.user_id,
            payload={
                "text_length": len(extraction.text),
                "quality_label": extraction.quality_label,
                "quality_score": extraction.quality_score,
                "extraction_method": extraction.extraction_method,
                "page_count": extraction.page_count,
                "ocr_pages": extraction.ocr_pages,
                "expiry_date": extraction.expiry_date.isoformat() if extraction.expiry_date else None,
            },
        )
        db.commit()
    except Exception as exc:
        document.processing_status = "failed"
        document.review_status = "failed"
        document.processed_at = datetime.now(UTC)
        create_audit_log(
            db,
            action="document.extraction.failed",
            target_type="document",
            target_id=document.id,
            actor_id=document.user_id,
            payload={"error": str(exc)},
        )
        db.commit()


def review_document(db: Session, *, document_id: UUID) -> None:
    document = db.get(Document, document_id)
    if document is None:
        return

    text = document.extracted_text or ""
    document.processing_status = "ai_reviewing"
    document.review_status = "processing"
    create_audit_log(
        db,
        action="ai.review.started",
        target_type="document",
        target_id=document.id,
        actor_id=document.user_id,
        payload={"filename": document.filename, "text_length": len(text)},
    )
    db.commit()
    db.refresh(document)

    try:
        extraction = _build_extraction_from_document(document)
        classification = classify_document(extraction.text)
        create_audit_log(
            db,
            action="ai.classification.completed",
            target_type="document",
            target_id=document.id,
            actor_id=document.user_id,
            payload={
                "classification": classification.document_type,
                "confidence": classification.confidence,
                "matched_keywords": classification.matched_keywords,
            },
        )
        db.commit()

        findings, risk_score, flag_reasons, expiry_date = evaluate_risks(
            text=extraction.text,
            extraction=extraction,
            classification=classification,
        )
        create_audit_log(
            db,
            action="risk.analysis.completed",
            target_type="document",
            target_id=document.id,
            actor_id=document.user_id,
            payload={
                "risk_score": risk_score,
                "flag_reasons": flag_reasons,
                "finding_count": len(findings),
            },
        )
        db.commit()

        create_audit_log(
            db,
            action="ai.summary.started",
            target_type="document",
            target_id=document.id,
            actor_id=document.user_id,
            payload={
                "model_input_chars": len(extraction.text),
                "risk_score": risk_score,
            },
        )
        document.ai_thinking_log = ""
        db.commit()

        last_flush = {"t": 0.0}

        def on_stream_buffer(full_buffer: str) -> None:
            document.ai_thinking_log = preview_streaming_thinking(full_buffer)
            now = time.monotonic()
            if (now - last_flush["t"] >= 0.28) or (JSON_FR in full_buffer):
                db.commit()
                last_flush["t"] = now

        ai_review = review_document_with_ai(
            text=extraction.text,
            classification=classification,
            extraction=extraction,
            findings=findings,
            risk_score=risk_score,
            on_stream_buffer=on_stream_buffer,
        )
        db.commit()
        create_audit_log(
            db,
            action="ai.summary.completed",
            target_type="document",
            target_id=document.id,
            actor_id=document.user_id,
            payload={
                "provider": ai_review.provider,
                "confidence": ai_review.confidence,
                "reasoning_count": len(ai_review.reasoning),
            },
        )
        db.commit()

        decision = decide_review_status(
            risk_score=risk_score,
            classification_confidence=classification.confidence,
            extraction_quality_label=extraction.quality_label,
            findings=findings,
        )

        document.extracted_text = extraction.text
        document.classification = classification.document_type
        document.classification_confidence = Decimal(str(classification.confidence))
        document.summary = ai_review.summary
        document.risk_score = risk_score
        document.ai_confidence = Decimal(str(ai_review.confidence))
        document.flag_reasons = flag_reasons
        document.expiry_date = expiry_date
        document.processing_status = "completed"
        document.review_status = decision.review_status
        document.processed_at = datetime.now(UTC)

        db.query(RiskFinding).filter(RiskFinding.document_id == document.id).delete()
        db.flush()
        for finding in findings:
            db.add(
                RiskFinding(
                    document_id=document.id,
                    rule_code=finding.rule_code,
                    severity=finding.severity,
                    snippet=finding.snippet,
                    suggestion=finding.suggestion,
                )
            )

        create_audit_log(
            db,
            action="ai.review.completed",
            target_type="document",
            target_id=document.id,
            actor_id=document.user_id,
            payload={
                "provider": ai_review.provider,
                "verdict": ai_review.verdict,
                "confidence": ai_review.confidence,
                "reasoning": ai_review.reasoning,
                "classification": classification.document_type,
                "matched_keywords": classification.matched_keywords,
                "risk_score": risk_score,
                "flag_reasons": flag_reasons,
            },
        )
        db.commit()
        db.refresh(document)
        owner = document.user
        if owner is not None:
            try:
                send_document_reviewed_webhook(db, document=document, owner=owner)
            except Exception:
                db.rollback()
    except Exception as exc:
        document.processing_status = "failed"
        document.review_status = "failed"
        document.processed_at = datetime.now(UTC)
        err_tail = str(exc)[:1200]
        document.ai_thinking_log = (document.ai_thinking_log or "").strip() + f"\n\n[Lỗi AI review]\n{err_tail}"
        create_audit_log(
            db,
            action="ai.review.failed",
            target_type="document",
            target_id=document.id,
            actor_id=document.user_id,
            payload={"error": str(exc)},
        )
        db.commit()


def _build_extraction_from_document(document: Document) -> ExtractionResult:
    if document.extracted_text is None:
        return extract_text(document.storage_path)

    quality_score = compute_quality_score(document.extracted_text)
    quality_label = "good" if len(document.extracted_text) >= 200 and quality_score >= 0.65 else "low"
    expiry_date = document.expiry_date or detect_expiry_date(document.extracted_text)
    return ExtractionResult(
        text=document.extracted_text,
        quality_label=quality_label,
        quality_score=quality_score,
        expiry_date=expiry_date,
        extraction_method="stored_extracted_text",
    )
