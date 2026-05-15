from datetime import UTC, datetime, timedelta
from uuid import uuid4

from app.models.document import Document
from app.services.ai_review import (
    JSON_FR,
    THINK_FR,
    _normalize_reasoning,
    _normalize_verdict,
    _parse_review_json,
    _parse_streamed_review,
    _stream_parsed_review_is_degenerate,
    build_mock_review,
    normalize_confidence,
)
from app.services.classification import classify_document
from app.services.document_chat import answer_document_chat
from app.services.extraction import ExtractionResult, extract_text
from app.services.flagging import decide_review_status
from app.services.legal_obligations import extract_legal_obligations
from app.services.risk_engine import evaluate_risks


def test_classifier_detects_contract() -> None:
    text = "This agreement is a contract between each party with an effective date and clause terms."
    result = classify_document(text)
    assert result.document_type == "contract"
    assert result.confidence >= 0.6
    assert "agreement" in result.matched_keywords


def test_document_chat_does_not_fake_answer_when_provider_missing(monkeypatch) -> None:
    from app.services import document_chat

    monkeypatch.setattr(document_chat.settings, "openai_api_key", None)
    document = Document(
        id=uuid4(),
        user_id=uuid4(),
        filename="contract.pdf",
        mime="application/pdf",
        size_bytes=1200,
        sha256="a" * 64,
        storage_path="uploads/contract.pdf",
        processing_status="completed",
        review_status="ai_approved",
        classification="contract",
        summary="AI chưa thấy rủi ro trọng yếu.",
        extracted_text="Hợp đồng dịch vụ có điều khoản thanh toán và chấm dứt.",
        risk_score=10,
        flag_reasons=[],
    )

    result = answer_document_chat(
        document=document,
        question="Rủi ro chính là gì?",
        history=[],
        risk_findings=[],
    )

    assert result.provider == "unavailable"
    assert "chưa khả dụng" in result.content
    assert "không trả lời bằng mẫu chung" in result.content


def test_classifier_detects_nda_invoice_and_policy() -> None:
    nda = classify_document("Confidential information is shared by the disclosing party to the recipient.")
    invoice = classify_document("Invoice total includes tax and payment due date.")
    policy = classify_document("Employee policy and compliance procedure for the security team.")

    assert nda.document_type == "nda"
    assert invoice.document_type == "invoice"
    assert policy.document_type == "policy"


def test_classifier_detects_vietnamese_legal_documents() -> None:
    contract = classify_document("Hợp đồng dịch vụ giữa Bên A và Bên B có điều khoản, giá trị hợp đồng.")
    invoice = classify_document("Hóa đơn dịch vụ có tổng tiền, thuế và thời hạn thanh toán.")
    policy = classify_document("Chính sách tuân thủ nội bộ mô tả quy trình xử lý tài liệu.")
    judgment = classify_document(
        "Tòa án nhân dân xét xử vụ án lao động. Bản án có nguyên đơn, bị đơn, Hội đồng xét xử và phần tuyên xử."
    )

    assert contract.document_type == "contract"
    assert contract.confidence >= 0.55
    assert invoice.document_type == "invoice"
    assert policy.document_type == "policy"
    assert judgment.document_type == "court_judgment"
    assert judgment.confidence >= 0.7


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


def test_risk_engine_understands_vietnamese_contract_signals() -> None:
    future_date = (datetime.now(UTC).date() + timedelta(days=14))
    text = (
        "Hợp đồng dịch vụ giữa Bên A và Bên B. Giá trị hợp đồng 3 tỷ đồng. "
        f"Ngày hết hạn: {future_date.isoformat()}. "
        "Hai bên có quyền chấm dứt hợp đồng, luật điều chỉnh là pháp luật Việt Nam. "
        "Đại diện bên A ký và ghi rõ họ tên. Đại diện bên B ký và ghi rõ họ tên."
    )
    extraction = ExtractionResult(
        text=text,
        quality_label="good",
        quality_score=0.95,
        expiry_date=future_date,
    )
    classification = classify_document(text)
    _, risk_score, flag_reasons, _ = evaluate_risks(
        text=text,
        extraction=extraction,
        classification=classification,
    )

    assert classification.document_type == "contract"
    assert "HIGH_VALUE" in flag_reasons
    assert "EXPIRY_SOON" in flag_reasons
    assert "MISSING_SIGNATURE" not in flag_reasons
    assert "NO_TERMINATION_CLAUSE" not in flag_reasons
    assert "NO_GOVERNING_LAW" not in flag_reasons
    assert risk_score >= 55


def test_risk_engine_skips_personal_data_finding_by_default() -> None:
    """PII detection is opt-in. By default risk engine should not flag personal data."""

    text = (
        "Tòa án nhân dân xét xử vụ án lao động. Bản án có nguyên đơn Nguyễn Văn A, bị đơn Công ty B. "
        "Căn cước công dân số 075190009073, số điện thoại 0375111607, địa chỉ xã T, tỉnh Đồng Nai. "
        "Hội đồng xét xử tuyên xử chấp nhận yêu cầu khởi kiện."
    )
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

    assert classification.document_type == "court_judgment"
    assert "JUDICIAL_DOCUMENT" in flag_reasons
    assert "SENSITIVE_PERSONAL_DATA" not in flag_reasons
    assert "MISSING_SIGNATURE" not in flag_reasons
    assert risk_score >= 15
    assert all(finding.rule_code != "SENSITIVE_PERSONAL_DATA" for finding in findings)


def test_risk_engine_includes_personal_data_finding_when_setting_enabled(monkeypatch) -> None:
    """When the operator opts in via RISK_PERSONAL_DATA_ENABLED, the rule fires again."""

    from app.services import risk_engine

    monkeypatch.setattr(risk_engine.settings, "risk_personal_data_enabled", True)

    text = (
        "Tòa án nhân dân xét xử vụ án lao động. Bản án có nguyên đơn Nguyễn Văn A, bị đơn Công ty B. "
        "Căn cước công dân số 075190009073, số điện thoại 0375111607, địa chỉ xã T, tỉnh Đồng Nai. "
        "Hội đồng xét xử tuyên xử chấp nhận yêu cầu khởi kiện."
    )
    extraction = ExtractionResult(
        text=text,
        quality_label="good",
        quality_score=0.95,
        expiry_date=None,
    )
    classification = classify_document(text)
    findings, risk_score, flag_reasons, _ = risk_engine.evaluate_risks(
        text=text,
        extraction=extraction,
        classification=classification,
    )

    assert "JUDICIAL_DOCUMENT" in flag_reasons
    assert "SENSITIVE_PERSONAL_DATA" in flag_reasons
    assert risk_score >= 30
    assert any("CCCD" in (finding.snippet or "") or "CCCD/CMND" in (finding.snippet or "") for finding in findings)


def test_flagging_ai_approves_low_risk_document() -> None:
    decision = decide_review_status(
        risk_score=10,
        classification_confidence=0.84,
        extraction_quality_label="good",
        findings=[],
    )
    assert decision.review_status == "ai_approved"
    assert decision.verdict == "approve"


def test_legal_obligation_rules_extract_deadline_actions(monkeypatch) -> None:
    from app.services import legal_obligations

    monkeypatch.setattr(legal_obligations.settings, "openai_api_key", None)
    text = (
        "The Loan Parties shall cause all subsidiaries to become Loan Parties and execute "
        "Security Documents no later than 10/12/2025. Failure shall be an immediate Event of Default. "
        "Borrower must provide an appraisal report satisfactory to the Administrative Agent by 22/12/2025."
    )
    extraction = ExtractionResult(text=text, quality_label="good", quality_score=0.95, expiry_date=None)
    classification = classify_document(text)
    findings, risk_score, _, _ = evaluate_risks(text=text, extraction=extraction, classification=classification)

    obligations = extract_legal_obligations(
        text=text,
        summary=None,
        classification=classification,
        findings=findings,
        risk_score=risk_score,
    )

    assert len(obligations) >= 2
    assert obligations[0].due_date is not None
    assert any("công ty con" in obligation.title.lower() for obligation in obligations)
    assert any("định giá" in obligation.title.lower() for obligation in obligations)
    assert any(obligation.severity in {"high", "critical"} for obligation in obligations)


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
    assert decision.review_status == "needs_reviewer"
    assert decision.verdict == "needs_review"


def test_flagging_keeps_medium_risk_judicial_documents_in_ai_flow() -> None:
    text = (
        "Tòa án nhân dân xét xử vụ án lao động. Bản án có nguyên đơn Nguyễn Văn A. "
        "Căn cước công dân số 075190009073, số điện thoại 0375111607."
    )
    extraction = ExtractionResult(
        text=text,
        quality_label="good",
        quality_score=0.92,
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

    assert decision.review_status == "ai_approved"
    assert decision.verdict == "approve"


def test_flagging_keeps_low_confidence_in_ai_flow_when_risk_is_low() -> None:
    decision = decide_review_status(
        risk_score=10,
        classification_confidence=0.40,
        extraction_quality_label="good",
        findings=[],
    )

    assert decision.review_status == "ai_approved"
    assert decision.verdict == "approve"


def test_flagging_keeps_low_extraction_quality_in_ai_flow_when_risk_is_low() -> None:
    decision = decide_review_status(
        risk_score=10,
        classification_confidence=0.85,
        extraction_quality_label="low",
        findings=[],
    )

    assert decision.review_status == "ai_approved"
    assert decision.verdict == "approve"


def test_preview_streaming_thinking_hides_json_tail() -> None:
    from app.services.ai_review import preview_streaming_thinking

    buf = "<<<THINK>>>\nDòng 1 suy luận.\n<<<JSON>>>\n{\"a\":1}"
    preview = preview_streaming_thinking(buf)
    assert "Dòng 1" in preview
    assert '"a"' not in preview
    assert normalize_confidence(0.82) == 0.82
    assert normalize_confidence(82) == 0.82
    assert normalize_confidence(120) == 1.0
    assert normalize_confidence(-5) == 0.0
    assert normalize_confidence("không rõ") == 0.5


def test_parse_streamed_review_requires_json_delimiter() -> None:
    orphan_json = '{"summary":"Chỉ JSON","verdict":"approve","confidence":0.9,"reasoning":[]}'
    assert _parse_streamed_review(orphan_json) is None

    with_delim = (
        f"{THINK_FR}\nSuy luận.\n{JSON_FR}\n"
        '{"summary":"Đủ","verdict":"approve","confidence":0.9,"reasoning":["a"]}'
    )
    parsed = _parse_streamed_review(with_delim)
    assert parsed is not None
    assert parsed["summary"] == "Đủ"


def test_stream_parsed_review_degenerate_when_substantive_but_short() -> None:
    long_enough = {"summary": "x" * 800}
    assert not _stream_parsed_review_is_degenerate(long_enough, risk_score=40, findings_count=2)

    short_substantive = {"summary": "x" * 400}
    assert _stream_parsed_review_is_degenerate(short_substantive, risk_score=40, findings_count=1)

    short_but_clean = {"summary": "x" * 400}
    assert not _stream_parsed_review_is_degenerate(short_but_clean, risk_score=0, findings_count=0)


def test_ai_review_response_helpers_are_tolerant() -> None:
    parsed = _parse_review_json(
        '```json\n{"summary":"Ổn","verdict":"approve","confidence":87,"reasoning":"Không có rủi ro lớn"}\n```'
    )

    assert parsed is not None
    assert parsed["summary"] == "Ổn"
    assert _normalize_verdict(parsed["verdict"]) == "approve"
    assert _normalize_verdict("unexpected") == "needs_review"
    assert _normalize_reasoning(parsed["reasoning"]) == ["Không có rủi ro lớn"]
    assert _normalize_reasoning(["  Có chữ ký  ", ""]) == ["Có chữ ký"]


def test_mock_review_extracts_specific_judgment_facts() -> None:
    text = (
        "Bản án số: 25/2025/LĐ-ST V/v: Tranh chấp về tiền lương. "
        "Nguyên đơn: Bà Trần Thị Mỹ T Địa chỉ: Thành phố Hồ Chí Minh. "
        "Bị don: Công ty Cổ phần D Địa chỉ: Thành phố Hồ Chí Minh. "
        "Căn cước công dân số 075190009073. "
        "Tuyên xử: Chấp nhận toàn bộ yêu cầu khởi kiện của nguyên đơn, buộc bị đơn thanh toán "
        "9.601.080 đồng tiền lương còn nợ."
    )
    extraction = ExtractionResult(
        text=text,
        quality_label="good",
        quality_score=0.92,
        expiry_date=None,
    )
    classification = classify_document(text)
    findings, risk_score, _, _ = evaluate_risks(
        text=text,
        extraction=extraction,
        classification=classification,
    )

    review = build_mock_review(
        classification=classification,
        extraction=extraction,
        findings=findings,
        risk_score=risk_score,
    )

    assert "25/2025/LĐ-ST" in review.summary
    assert "Tranh chấp về tiền lương" in review.summary
    assert "Bà Trần Thị Mỹ T" in review.summary
    assert "Công ty Cổ phần D" in review.summary
    assert "9.601.080 đồng" in review.summary
    assert review.verdict == "approve"


def test_extract_text_supports_plain_text_markdown_html_and_rtf(tmp_path) -> None:
    samples = {
        "contract.txt": "Service agreement with signature and governing law.",
        "policy.md": "# Chính sách\n\nThis policy covers compliance procedure and audit logs.",
        "notice.html": "<html><body><h1>Thông báo</h1><p>Valid until 2026-12-31.</p></body></html>",
        "terms.rtf": r"{\rtf1\ansi Service agreement\par governing law and signature}",
    }

    for filename, content in samples.items():
        path = tmp_path / filename
        path.write_text(content, encoding="utf-8")

        result = extract_text(str(path))

        assert result.text
        assert result.quality_score > 0
