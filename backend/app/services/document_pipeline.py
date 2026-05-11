from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.document import Document
from app.models.risk_finding import RiskFinding
from app.services.ai_review import review_document_with_ai
from app.services.audit import create_audit_log
from app.services.classification import classify_document
from app.services.extraction import extract_text
from app.services.flagging import decide_review_status
from app.services.risk_engine import evaluate_risks
from app.services.webhooks import send_document_reviewed_webhook


def process_document_task(document_id: UUID) -> None:
    with SessionLocal() as db:
        process_document(db, document_id=document_id)


def process_document(db: Session, *, document_id: UUID) -> None:
    document = db.get(Document, document_id)
    if document is None:
        return

    document.processing_status = "processing"
    document.review_status = "processing"
    create_audit_log(
        db,
        action="document.processing.started",
        target_type="document",
        target_id=document.id,
        actor_id=document.user_id,
        payload={"filename": document.filename},
    )
    db.commit()
    db.refresh(document)

    try:
        extraction = extract_text(document.storage_path)
        classification = classify_document(extraction.text)
        findings, risk_score, flag_reasons, expiry_date = evaluate_risks(
            text=extraction.text,
            extraction=extraction,
            classification=classification,
        )
        ai_review = review_document_with_ai(
            text=extraction.text,
            classification=classification,
            extraction=extraction,
            findings=findings,
            risk_score=risk_score,
        )
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
        create_audit_log(
            db,
            action="document.processing.failed",
            target_type="document",
            target_id=document.id,
            actor_id=document.user_id,
            payload={"error": str(exc)},
        )
        db.commit()
