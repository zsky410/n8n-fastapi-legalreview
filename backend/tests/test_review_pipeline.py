from datetime import UTC, datetime, timedelta

from app.services.ai_review import normalize_confidence
from app.services.classification import classify_document
from app.services.extraction import ExtractionResult
from app.services.flagging import decide_review_status
from app.services.risk_engine import evaluate_risks


def test_classifier_detects_contract() -> None:
    text = "This agreement is a contract between each party with an effective date and clause terms."
    result = classify_document(text)
    assert result.document_type == "contract"
    assert result.confidence >= 0.6
    assert "agreement" in result.matched_keywords


def test_classifier_detects_nda_invoice_and_policy() -> None:
    nda = classify_document("Confidential information is shared by the disclosing party to the recipient.")
    invoice = classify_document("Invoice total includes tax and payment due date.")
    policy = classify_document("Employee policy and compliance procedure for the security team.")

    assert nda.document_type == "nda"
    assert invoice.document_type == "invoice"
    assert policy.document_type == "policy"


def test_classifier_returns_unknown_for_unmatched_text() -> None:
    result = classify_document("Lunch menu and meeting notes for the office social.")
    assert result.document_type == "unknown"
    assert result.confidence == 0.25


def test_risk_engine_detects_missing_signature_and_governing_law() -> None:
    text = "This agreement is a contract between the party and vendor with termination obligations."
    extraction = ExtractionResult(
        text=text,
        quality_label="good",
        quality_score=0.95,
        expiry_date=None,
    )
    classification = classify_document(text)
    findings, risk_score, flag_reasons, _ = evaluate_risks(
        text=text,
        extraction=extraction,
        classification=classification,
    )
    assert "MISSING_SIGNATURE" in flag_reasons
    assert "NO_GOVERNING_LAW" in flag_reasons
    assert risk_score >= 40
    assert any(finding.rule_code == "MISSING_SIGNATURE" for finding in findings)


def test_risk_engine_detects_high_value_and_expiry() -> None:
    future_date = (datetime.now(UTC).date() + timedelta(days=7))
    text = (
        "Master service agreement effective date with contract language, governing law, termination, "
        f"signature blocks, and expiration date {future_date.isoformat()}. Total liability is USD 150,000."
    )
    extraction = ExtractionResult(
        text=text,
        quality_label="good",
        quality_score=0.92,
        expiry_date=future_date,
    )
    classification = classify_document(text)
    _, risk_score, flag_reasons, expiry_date = evaluate_risks(
        text=text,
        extraction=extraction,
        classification=classification,
    )
    assert "HIGH_VALUE" in flag_reasons
    assert "EXPIRY_SOON" in flag_reasons
    assert expiry_date == future_date
    assert risk_score >= 55


def test_flagging_ai_approves_low_risk_document() -> None:
    decision = decide_review_status(
        risk_score=10,
        classification_confidence=0.84,
        extraction_quality_label="good",
        findings=[],
    )
    assert decision.review_status == "ai_approved"
    assert decision.verdict == "approve"


def test_flagging_routes_high_risk_document_to_admin() -> None:
    text = "This agreement is a contract between the party and vendor for USD 250,000."
    extraction = ExtractionResult(
        text=text,
        quality_label="low",
        quality_score=0.40,
        expiry_date=None,
    )
    classification = classify_document(text)
    findings, risk_score, _, _ = evaluate_risks(
        text=text,
        extraction=extraction,
        classification=classification,
    )
    decision = decide_review_status(
        risk_score=risk_score,
        classification_confidence=classification.confidence,
        extraction_quality_label=extraction.quality_label,
        findings=findings,
    )
    assert decision.review_status == "pending_admin"
    assert decision.verdict == "needs_review"


def test_flagging_routes_low_confidence_to_admin() -> None:
    decision = decide_review_status(
        risk_score=10,
        classification_confidence=0.40,
        extraction_quality_label="good",
        findings=[],
    )

    assert decision.review_status == "pending_admin"
    assert decision.verdict == "needs_review"


def test_flagging_routes_low_extraction_quality_to_admin() -> None:
    decision = decide_review_status(
        risk_score=10,
        classification_confidence=0.85,
        extraction_quality_label="low",
        findings=[],
    )

    assert decision.review_status == "pending_admin"
    assert decision.verdict == "needs_review"


def test_ai_confidence_is_normalized_and_bounded() -> None:
    assert normalize_confidence(0.82) == 0.82
    assert normalize_confidence(82) == 0.82
    assert normalize_confidence(120) == 1.0
    assert normalize_confidence(-5) == 0.0
