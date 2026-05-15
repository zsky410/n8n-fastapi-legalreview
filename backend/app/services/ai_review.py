from __future__ import annotations

import json
import logging
import math
import re
import time
from collections.abc import Callable
from dataclasses import dataclass

import httpx

from app.core.config import settings
from app.services.classification import ClassificationResult
from app.services.extraction import ExtractionResult
from app.services.flagging import decide_review_status
from app.services.risk_engine import RiskFindingData
from app.services.review_status import NEEDS_REVIEW

logger = logging.getLogger(__name__)


@dataclass
class AIReviewResult:
    summary: str
    verdict: str
    confidence: float
    reasoning: list[str]
    provider: str


def review_document_with_ai(
    *,
    text: str,
    classification: ClassificationResult,
    extraction: ExtractionResult,
    findings: list[RiskFindingData],
    risk_score: int,
    on_stream_buffer: Callable[[str], None] | None = None,
) -> AIReviewResult:
    if settings.openai_api_key:
        result = _try_openai_review(
            text=text,
            classification=classification,
            extraction=extraction,
            findings=findings,
            risk_score=risk_score,
            on_stream_buffer=on_stream_buffer,
        )
        if result is not None:
            return result
        logger.warning(
            "OpenAI review không dùng được (lỗi mạng/API, JSON không đọc được, hoặc hết quota); "
            "đang dùng bản tóm tắt ghép từ rules engine (mock) — ngắn và khác phân tích LLM lúc upload.",
        )
    else:
        logger.info("OPENAI_API_KEY chưa cấu hình; dùng bản tóm tắt mock từ rules engine.")
    return build_mock_review(
        classification=classification,
        extraction=extraction,
        findings=findings,
        risk_score=risk_score,
        on_stream_buffer=on_stream_buffer,
    )


def build_mock_review(
    *,
    classification: ClassificationResult,
    extraction: ExtractionResult,
    findings: list[RiskFindingData],
    risk_score: int,
    on_stream_buffer: Callable[[str], None] | None = None,
) -> AIReviewResult:
    if on_stream_buffer is not None:
        _emit_mock_thinking_stream(
            classification=classification,
            extraction=extraction,
            findings=findings,
            risk_score=risk_score,
            on_stream_buffer=on_stream_buffer,
        )
    decision = decide_review_status(
        risk_score=risk_score,
        classification_confidence=classification.confidence,
        extraction_quality_label=extraction.quality_label,
        findings=findings,
    )
    reasons = [
        f"{_human_label(finding.rule_code)}: {finding.snippet or 'Không có đoạn trích cụ thể.'} Khuyến nghị: {finding.suggestion}"
        for finding in findings[:5]
    ]
    if not reasons:
        reasons = ["Không phát hiện rủi ro trọng yếu từ rules engine."]

    document_insight = _build_document_insight(
        text=extraction.text,
        document_type=classification.document_type,
    )
    risk_insight = _build_risk_insight(
        decision=decision,
        findings=findings,
        risk_score=risk_score,
    )

    if findings and decision.review_status == NEEDS_REVIEW:
        evidence_lines = "\n".join(
            f"- {_human_label(finding.rule_code)} ({_human_label(finding.severity).lower()}): "
            f"{finding.snippet or 'Không có đoạn trích cụ thể.'} Khuyến nghị: {finding.suggestion}"
            for finding in findings[:5]
        )
        summary = (
            f"{document_insight}\n\n"
            f"{risk_insight}\n\n"
            f"Chi tiết finding:\n{evidence_lines}\n\n"
            "Khuyến nghị xử lý: Mở tab Rủi ro để kiểm tra từng finding, đối chiếu bằng chứng trong mục Tổng quan, "
            "sau đó người rà soát nghiệp vụ quyết định duyệt, yêu cầu sửa, hoặc yêu cầu bổ sung tài liệu."
        )
        verdict = decision.verdict
    else:
        summary = (
            f"{document_insight}\n\n"
            f"{risk_insight}\n\n"
            f"Chất lượng dữ liệu: Văn bản trích xuất được đánh giá là {_human_label(extraction.quality_label).lower()} "
            f"với điểm {extraction.quality_score:.2f}. Độ tin cậy phân loại là {classification.confidence:.0%}."
        )
        verdict = decision.verdict

    confidence = round(
        max(0.35, min(0.97, (classification.confidence * 0.7) + (0.3 if not findings else 0.15))),
        4,
    )
    return AIReviewResult(
        summary=summary,
        verdict=verdict,
        confidence=confidence,
        reasoning=reasons,
        provider="mock",
    )


def _emit_mock_thinking_stream(
    *,
    classification: ClassificationResult,
    extraction: ExtractionResult,
    findings: list[RiskFindingData],
    risk_score: int,
    on_stream_buffer: Callable[[str], None],
) -> None:
    """Simulate streamed thinking for the mock provider (no LLM)."""

    rules_preview = ", ".join(f.rule_code for f in findings[:4]) if findings else "(không có)"
    parts = [
        "<<<THINK>>>\n",
        "[mock] Đang đọc văn bản trích xuất và metadata phân loại.\n",
        f"[mock] Heuristic classification: {classification.document_type} (confidence {classification.confidence:.2f}).\n",
        f"[mock] Độ dài text: {len(extraction.text)} ký tự; chất lượng trích xuất: {extraction.quality_label}.\n",
        f"[mock] Risk engine: score {risk_score}; rule hits: {rules_preview}.\n",
        "[mock] Không có LLM — kết luận dưới đây được ghép từ rules + regex (không phải phân tích pháp lý sâu).\n",
    ]
    buffer = ""
    for fragment in parts:
        buffer += fragment
        on_stream_buffer(buffer)


def _build_document_insight(*, text: str, document_type: str) -> str:
    if document_type == "court_judgment":
        return _build_court_judgment_insight(text)
    if document_type in {"contract", "nda"}:
        return _build_contract_insight(text, document_type=document_type)
    if document_type == "invoice":
        return _build_invoice_insight(text)
    return _build_generic_insight(text, document_type=document_type)


def _build_court_judgment_insight(text: str) -> str:
    normalized = _normalize_text(text)
    dispute = _first_match(
        normalized,
        [
            r"V/v:\s*(.+?)(?=\.|\s+NHÂN|\s+NHAN|\s+T[ÒO]A|\s+TOA|$)",
            r"về việc\s+[“\"]?(.+?)[”\"]?(?=\s+theo|\s+giữa|\s*,|\.)",
        ],
    )
    case_no = _first_match(normalized, [r"Bản án số:\s*([^\s]+)", r"Ban an so:\s*([^\s]+)"])
    plaintiff = _first_match(
        normalized,
        [r"Nguyên đơn:\s*(.+?)(?=\s+Địa chỉ|\s+Dia chi|\s+2\.|\s+Bị\s+đơn|\s+Bi\s+don|$)"],
    )
    defendant = _first_match(
        normalized,
        [r"(?:^|[.;]\s*|\s+\d+\.\s*)Bị\s+đơn:\s*(.+?)(?=\s+Địa chỉ|\s+Dia chi|\s+Người đại diện|\s+Nguoi dai dien|\s+N[ỘO]I\s+DUNG|$)",
         r"(?:^|[.;]\s*|\s+\d+\.\s*)Bị\s+don:\s*(.+?)(?=\s+Địa chỉ|\s+Dia chi|\s+Người đại diện|\s+Nguoi dai dien|\s+N[ỘO]I\s+DUNG|$)",
         r"(?:^|[.;]\s*|\s+\d+\.\s*)Bi\s+don:\s*(.+?)(?=\s+Địa chỉ|\s+Dia chi|\s+Người đại diện|\s+Nguoi dai dien|\s+N[ỘO]I\s+DUNG|$)"],
    )
    amounts = _unique_matches(
        normalized,
        r"\b\d{1,3}(?:[.\s]\d{3})+(?:,\d+)?\s*đồng\b",
        limit=3,
    )
    outcome = _first_match(
        normalized,
        [
            r"Tuyên xử:\s*(Chấp nhận.+?)(?=\s+\d+\.|\s+Về án phí|$)",
            r"Tuyen xu:\s*(Chap nhan.+?)(?=\s+\d+\.|\s+Ve an phi|$)",
            r"(Chấp nhận toàn bộ yêu cầu.+?)(?=\s+\[\d+\]|\s+Về án phí|$)",
        ],
        max_len=360,
    )

    facts: list[str] = []
    if case_no:
        facts.append(f"Bản án số {case_no}")
    if dispute:
        facts.append(f"nội dung chính là {dispute}")
    if plaintiff or defendant:
        facts.append(f"các bên gồm nguyên đơn {plaintiff or 'chưa rõ'} và bị đơn {defendant or 'chưa rõ'}")
    if amounts:
        facts.append(f"văn bản nhắc tới các khoản tiền {', '.join(amounts)}")

    summary = "; ".join(facts) if facts else "AI nhận diện đây là bản án/văn bản tố tụng và đã đọc phần thông tin vụ việc trong văn bản trích xuất"
    if outcome:
        summary = f"{summary}. Phần quyết định thể hiện: {outcome}"
    return f"Nhận định tài liệu: {summary}."


def _build_contract_insight(text: str, *, document_type: str) -> str:
    normalized = _normalize_text(text)
    amounts = _unique_matches(normalized, r"\b(?:USD|\$)\s?\d[\d,.\s]*|\b\d{1,3}(?:[.\s]\d{3})+\s*(?:VNĐ|VND|đồng)\b", limit=3)
    parties = _first_match(
        normalized,
        [r"(?:giữa|between)\s+(.+?)(?=\s+(?:và|and)\s+.+?(?:\.|,|;))"],
        max_len=160,
    )
    termination_signal = "có nhắc tới điều khoản chấm dứt" if re.search(r"termination|terminate|chấm dứt|thanh lý", normalized, re.IGNORECASE) else "chưa thấy rõ điều khoản chấm dứt"
    law_signal = "có tín hiệu luật điều chỉnh/giải quyết tranh chấp" if re.search(r"governing law|jurisdiction|luật điều chỉnh|giải quyết tranh chấp|trọng tài|tòa án", normalized, re.IGNORECASE) else "chưa thấy rõ luật điều chỉnh hoặc cơ chế tranh chấp"
    parts = [f"AI nhận diện tài liệu là {_human_label(document_type).lower()}"]
    if parties:
        parts.append(f"bên liên quan: {parties}")
    if amounts:
        parts.append(f"giá trị/tiền được nhắc tới: {', '.join(amounts)}")
    parts.append(f"{termination_signal}; {law_signal}")
    return f"Nhận định tài liệu: {'; '.join(parts)}."


def _build_invoice_insight(text: str) -> str:
    normalized = _normalize_text(text)
    amounts = _unique_matches(normalized, r"\b(?:USD|\$)\s?\d[\d,.\s]*|\b\d{1,3}(?:[.\s]\d{3})+\s*(?:VNĐ|VND|đồng)\b", limit=3)
    due_date = _first_match(normalized, [r"(?:due date|ngày đến hạn|hạn thanh toán)[:\s]+([0-9/\-.]{6,20})"])
    facts = ["AI nhận diện tài liệu là hóa đơn/chứng từ thanh toán"]
    if amounts:
        facts.append(f"số tiền nổi bật: {', '.join(amounts)}")
    if due_date:
        facts.append(f"hạn thanh toán: {due_date}")
    return f"Nhận định tài liệu: {'; '.join(facts)}."


def _build_generic_insight(text: str, *, document_type: str) -> str:
    normalized = _normalize_text(text)
    excerpt = normalized[:220]
    if len(normalized) > 220:
        excerpt = f"{excerpt}..."
    return f"Nhận định tài liệu: AI phân loại là {_human_label(document_type).lower()} và đọc được phần đầu văn bản: {excerpt}"


def _build_risk_insight(
    *,
    decision: object,
    findings: list[RiskFindingData],
    risk_score: int,
) -> str:
    top_issues = ", ".join(_human_label(finding.rule_code) for finding in findings[:3]) if findings else "không có finding rủi ro trọng yếu"
    if getattr(decision, "review_status", "") == NEEDS_REVIEW:
        return (
            f"Đánh giá rủi ro: Risk score {risk_score}, các điểm chính gồm {top_issues}. "
            "Tổng điểm vượt ngưỡng tự động nên tài liệu được chuyển reviewer xử lý exception."
        )
    return (
        f"Đánh giá rủi ro: Risk score {risk_score}, các điểm AI ghi nhận gồm {top_issues}. "
        "Tổng điểm chưa vượt ngưỡng cao nên hệ thống tự duyệt và lưu các finding để tham khảo."
    )


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _first_match(text: str, patterns: list[str], *, max_len: int = 220) -> str | None:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return _clean_fact(match.group(1), max_len=max_len)
    return None


def _unique_matches(text: str, pattern: str, *, limit: int) -> list[str]:
    values: list[str] = []
    for match in re.finditer(pattern, text, flags=re.IGNORECASE):
        value = _clean_fact(match.group(0), max_len=80)
        if value and value not in values:
            values.append(value)
        if len(values) >= limit:
            break
    return values


def _clean_fact(value: str, *, max_len: int) -> str:
    cleaned = value.strip(" .;:-\n\t")
    cleaned = re.sub(r"\s+", " ", cleaned)
    if len(cleaned) > max_len:
        cleaned = f"{cleaned[:max_len].rstrip()}..."
    return cleaned


THINK_FR = "<<<THINK>>>"
JSON_FR = "<<<JSON>>>"


def preview_streaming_thinking(buffer: str) -> str:
    """Human-readable slice of an in-progress streamed response for the UI."""

    if THINK_FR not in buffer:
        return "Đang kết nối LLM và chờ luồng suy luận…"
    start = buffer.index(THINK_FR) + len(THINK_FR)
    if JSON_FR in buffer[start:]:
        end = buffer.index(JSON_FR, start)
        body = buffer[start:end]
    else:
        body = buffer[start:]
    text = body.strip()
    return text[:150_000] if text else "Đang suy luận…"


def _delta_from_stream_chunk(chunk: dict[str, object]) -> str:
    choices = chunk.get("choices")
    if not isinstance(choices, list) or not choices:
        return ""
    first = choices[0]
    if not isinstance(first, dict):
        return ""
    delta = first.get("delta")
    if not isinstance(delta, dict):
        return ""
    content = delta.get("content")
    return str(content) if content else ""


def _post_chat_completion_stream_collect(
    *,
    client: httpx.Client,
    url: str,
    headers: dict[str, str],
    system_prompt: str,
    user_prompt: str,
    on_buffer: Callable[[str], None] | None,
) -> str | None:
    base_payload: dict[str, object] = {
        "model": settings.openai_review_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.25,
        "max_tokens": 2600,
        "stream": True,
    }
    variants: list[dict[str, object]] = [
        base_payload,
        {key: value for key, value in base_payload.items() if key != "max_tokens"},
        {key: value for key, value in base_payload.items() if key not in {"max_tokens", "temperature"}},
    ]
    timeout = httpx.Timeout(settings.openai_timeout_seconds)
    for request_payload in variants:
        collected = ""
        try:
            with client.stream("POST", url, headers=headers, json=request_payload, timeout=timeout) as response:
                if response.status_code in {400, 422}:
                    continue
                response.raise_for_status()
                for raw_line in response.iter_lines():
                    if not raw_line:
                        continue
                    line = raw_line.decode("utf-8", errors="replace") if isinstance(raw_line, bytes) else raw_line
                    if line.startswith(":"):
                        continue
                    if not line.startswith("data: "):
                        continue
                    data = line.removeprefix("data: ").strip()
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                    except json.JSONDecodeError:
                        continue
                    if not isinstance(chunk, dict):
                        continue
                    delta = _delta_from_stream_chunk(chunk)
                    if not delta:
                        continue
                    collected += delta
                    if on_buffer is not None:
                        on_buffer(collected)
        except (httpx.HTTPError, ValueError, TypeError) as exc:
            logger.debug("Streaming chat completion attempt failed: %s", exc)
            continue
        if collected.strip():
            return collected
    return None


def _build_review_system_prompt(*, stream_delimiter: bool) -> str:
    shared = (
        "You are a senior Vietnamese legal reviewer for automated contract review. "
        "Your output is used in a risk dashboard, so be decisive, short, and evidence-driven. "
        "Do NOT write a legal memo, chronology, party biography, or clause-by-clause summary. "
        "Only mention background facts when they explain a concrete risk or action.\n\n"
        "PRIMARY GOAL:\n"
        "- Identify the top legal/business risks, drafting gaps, missing documents, and approval blockers.\n"
        "- For each risk, explain: what is wrong, exact evidence from the excerpt, why it matters, and what to do next.\n"
        "- If a risk is not proven from the excerpt, say the precise diligence question instead of speculating.\n\n"
        "STRICT LENGTH / FOCUS:\n"
        "- Entire `summary` should normally be 700-1200 Vietnamese words, shorter for simple documents.\n"
        "- At least 55% of `summary` must be under '## Rủi ro cần xử lý trước'.\n"
        "- Avoid generic warnings, broad textbook law, and irrelevant Vietnam-law discussion unless a Vietnamese party, governing law, listed company, asset, or compliance trigger appears in the excerpt.\n"
        "- Ignore generic PII findings unless PII creates a contractual/compliance risk in this document.\n\n"
        "REQUIRED `summary` MARKDOWN HEADINGS (exact order, use exactly these lines):\n"
        "## Kết luận nhanh\n"
        "## Rủi ro cần xử lý trước\n"
        "## Thiếu dữ kiện / tài liệu cần bổ sung\n"
        "## Hành động khuyến nghị\n"
        "## Bối cảnh tối thiểu\n\n"
        "SECTION RULES:\n"
        "- '## Kết luận nhanh': 3 bullets only: decision, why it is / is not escalated, highest-risk blocker.\n"
        "- '## Rủi ro cần xử lý trước': 5-8 bullets for complex contracts, 3-5 for simple ones. "
        "Each bullet must follow this pattern: **3-8 word risk label** — Mức: Cao/Trung bình/Thấp. "
        "Bằng chứng: “short exact quote”. Tác động: one practical consequence. Cần làm: one concrete action.\n"
        "- '## Thiếu dữ kiện / tài liệu cần bổ sung': 3-6 bullets; name the missing document, clause, calculation, approval, or evidence.\n"
        "- '## Hành động khuyến nghị': numbered list, 4-6 prioritized actions, written as tasks counsel/ops can execute.\n"
        "- '## Bối cảnh tối thiểu': maximum 4 bullets, only facts needed to understand the risks; no long party list.\n\n"
        "RULE ENGINE:\n"
        "- Treat the user-provided findings as signals, not conclusions. Convert them into context-specific risks.\n"
        "- If findings include HIGH_VALUE, explain what amount/obligation makes it material.\n"
        "- If findings include NO_TERMINATION_CLAUSE, do not blindly say the document lacks termination; check whether the document type actually needs it.\n"
        "- Escalate to needs_review when there are existing defaults, acceleration/remedies risk, broad release, unclear waiver scope, major collateral/guarantee expansion, subjective approval standards, or missing base agreements.\n\n"
        "WRITING:\n"
        "- Vietnamese with diacritics. Use typographic double quotes “...” only for short verbatim spans from the document.\n"
        "- Keep AI, OCR, PDF, DOCX, risk score, default, waiver, forbearance, lender, borrower, collateral in English when natural.\n"
        "- No markdown tables, no HTML, no raw angle brackets, no single # headings.\n"
        "- `reasoning`: 5-8 short bullets; each is a distinct risk/action, not a duplicate paragraph.\n"
        "- `confidence`: confidence in this review (0..1).\n"
        "- `verdict`: approve only if risks are low or fully mitigated; otherwise needs_review."
    )
    if stream_delimiter:
        header = (
            "OUTPUT FORMAT (strict):\n"
            "- The assistant message must START with the exact line <<<THINK>>> (no leading spaces).\n"
            "- Then write 6-12 Vietnamese lines showing only your prioritization plan: top risks, evidence to quote, missing docs, verdict logic. "
            "Do not paste the final summary here.\n"
            "- Then a single line exactly <<<JSON>>> alone, followed immediately by ONE JSON object with keys "
            "summary, verdict, confidence, reasoning (no markdown fences, no extra text after JSON).\n"
        )
        return header + "\n\n" + shared
    return (
        'Return JSON only with this exact shape: '
        '{"summary": string, "verdict": "approve" | "needs_review", "confidence": number, "reasoning": string[]}.\n\n'
        + shared
    )

def _parse_streamed_review(full_text: str) -> dict[str, object] | None:
    """Chỉ đọc JSON sau dòng <<<JSON>>>; không parse cả buffer (tránh nhầm { } trong phần THINK)."""

    if JSON_FR not in full_text:
        return None
    _, tail = full_text.split(JSON_FR, 1)
    return _parse_review_json(tail.strip())


def _ai_result_from_parsed(parsed: dict[str, object]) -> AIReviewResult:
    return AIReviewResult(
        summary=str(parsed.get("summary") or ""),
        verdict=_normalize_verdict(parsed.get("verdict")),
        confidence=normalize_confidence(parsed.get("confidence", 0.5)),
        reasoning=_normalize_reasoning(parsed.get("reasoning", [])),
        provider="chat_completions",
    )


def _stream_parsed_review_is_degenerate(
    parsed: dict[str, object],
    *,
    risk_score: int,
    findings_count: int,
) -> bool:
    """Kết quả stream hợp lệ nhưng quá mỏng so với bối cảnh rủi ro → nên gọi lại non-stream."""

    summary = str(parsed.get("summary") or "").strip()
    if len(summary) < 260:
        return True
    substantive = risk_score > 0 or findings_count > 0
    if substantive and len(summary) < 720:
        return True
    return False


REVIEW_CONTEXT_KEYWORDS = (
    "event of default",
    "default",
    "acceleration",
    "forbearance",
    "waiver",
    "release",
    "severance",
    "change in control",
    "good reason",
    "cause",
    "non-solicitation",
    "non-compete",
    "confidentiality",
    "indemnification",
    "hold harmless",
    "termination",
    "assignment",
    "governing law",
    "choice of law",
    "jurisdiction",
    "arbitration",
    "jury trial",
    "amendment",
    "bonus",
    "base salary",
    "equity",
    "collateral",
    "guarant",
    "security",
)


def _build_review_excerpt(text: str, *, max_chars: int) -> tuple[str, str]:
    """Build a review context from beginning + risk windows + ending, not just page 1."""

    if len(text) <= max_chars:
        return text, ""

    head_chars = min(12_000, max_chars // 4)
    tail_chars = min(12_000, max_chars // 4)
    window_radius = 1_800
    intervals: list[tuple[int, int, str]] = [(0, head_chars, "Đầu tài liệu")]
    lowered = text.lower()

    for keyword in REVIEW_CONTEXT_KEYWORDS:
        start = 0
        while True:
            index = lowered.find(keyword, start)
            if index == -1:
                break
            intervals.append((
                max(0, index - window_radius),
                min(len(text), index + len(keyword) + window_radius),
                f"Đoạn quanh keyword: {keyword}",
            ))
            start = index + len(keyword)
            if len(intervals) >= 26:
                break
        if len(intervals) >= 26:
            break

    intervals.append((max(0, len(text) - tail_chars), len(text), "Cuối tài liệu"))
    intervals.sort(key=lambda item: item[0])

    merged: list[tuple[int, int, str]] = []
    used_chars = 0
    for start, end, label in intervals:
        if end <= start:
            continue
        if merged and start <= merged[-1][1] + 250:
            prev_start, prev_end, prev_label = merged[-1]
            merged[-1] = (prev_start, max(prev_end, end), f"{prev_label}; {label}")
            continue
        interval_len = end - start
        if used_chars + interval_len > max_chars and label != "Cuối tài liệu":
            continue
        merged.append((start, end, label))
        used_chars += interval_len

    chunks: list[str] = []
    total = 0
    for idx, (start, end, label) in enumerate(merged, start=1):
        chunk = text[start:end].strip()
        if not chunk:
            continue
        header = f"\n\n--- EXCERPT {idx}: {label} (chars {start}-{end}) ---\n"
        if total + len(header) + len(chunk) > max_chars + 2_000:
            continue
        chunks.append(f"{header}{chunk}")
        total += len(header) + len(chunk)

    note = (
        f"\n\n[Lưu ý: tài liệu dài {len(text)} ký tự; context gửi cho AI là các đoạn chọn lọc "
        f"gồm đầu tài liệu, vùng quanh keyword rủi ro và cuối tài liệu, tổng khoảng {total} ký tự. "
        "Nếu cần kết luận chắc chắn về điều khoản nằm ngoài các đoạn này, hãy yêu cầu đọc full văn bản.]"
    )
    return "".join(chunks).strip(), note


def _try_openai_review(
    *,
    text: str,
    classification: ClassificationResult,
    extraction: ExtractionResult,
    findings: list[RiskFindingData],
    risk_score: int,
    on_stream_buffer: Callable[[str], None] | None = None,
) -> AIReviewResult | None:
    findings_payload = [
        {
            "rule_code": finding.rule_code,
            "severity": finding.severity,
            "snippet": finding.snippet,
            "suggestion": finding.suggestion,
        }
        for finding in findings
        if finding.rule_code != "SENSITIVE_PERSONAL_DATA"
    ]
    excerpt_chars = max(4000, settings.ai_review_excerpt_chars)
    excerpt, excerpt_note = _build_review_excerpt(text, max_chars=excerpt_chars)
    user_prompt = (
        f"Classification: {classification.document_type} ({classification.confidence:.2f})\n"
        f"Extraction method: {extraction.extraction_method}\n"
        f"Extraction quality: {extraction.quality_label} ({extraction.quality_score:.2f})\n"
        f"Extracted text length: {len(extraction.text)} characters\n"
        f"Risk score (rules engine): {risk_score}\n"
        f"Findings from rules engine (already excludes PII rule): "
        f"{json.dumps(findings_payload, ensure_ascii=False)}\n\n"
        "Use the excerpt below as the single source of truth for facts. "
        "Stay focused on legal/business substance; ignore PII concerns.\n\n"
        f"=== DOCUMENT EXCERPT ===\n{excerpt}{excerpt_note}"
    )
    base_url = settings.openai_base_url.rstrip("/")
    url = f"{base_url}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }
    stream_system = _build_review_system_prompt(stream_delimiter=True)
    json_system = _build_review_system_prompt(stream_delimiter=False)

    try:
        with httpx.Client(timeout=settings.openai_timeout_seconds) as client:
            if on_stream_buffer is not None:
                streamed = _post_chat_completion_stream_collect(
                    client=client,
                    url=url,
                    headers=headers,
                    system_prompt=stream_system,
                    user_prompt=user_prompt,
                    on_buffer=on_stream_buffer,
                )
                if streamed and streamed.strip():
                    parsed_stream = _parse_streamed_review(streamed)
                    if parsed_stream is not None and not _stream_parsed_review_is_degenerate(
                        parsed_stream,
                        risk_score=risk_score,
                        findings_count=len(findings),
                    ):
                        return _ai_result_from_parsed(parsed_stream)
                    if parsed_stream is not None:
                        logger.warning(
                            "Luồng stream LLM có JSON nhưng tóm tắt quá mỏng hoặc không đủ chiều sâu so với risk; "
                            "thử lại bằng gọi JSON không stream.",
                        )
                    else:
                        logger.warning(
                            "Luồng stream LLM thiếu <<<JSON>>> hoặc JSON không đọc được; "
                            "thử lại bằng gọi JSON không stream.",
                        )

            payload = _post_chat_completion(
                client=client,
                url=url,
                system_prompt=json_system,
                user_prompt=user_prompt,
            )
    except Exception as exc:
        logger.warning(
            "OpenAI review failed; falling back to deterministic rules provider: %s",
            exc,
        )
        return None

    try:
        raw_json = payload["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        logger.warning(
            "OpenAI review response did not contain choices[0].message.content; falling back: %s",
            exc,
        )
        return None

    parsed = _parse_review_json(raw_json)
    if parsed is None:
        logger.warning("OpenAI review returned non-JSON content; falling back to deterministic rules provider")
        return None

    return _ai_result_from_parsed(parsed)


def _post_chat_completion(
    *,
    client: httpx.Client,
    url: str,
    system_prompt: str,
    user_prompt: str,
) -> dict[str, object]:
    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }
    base_payload = {
        "model": settings.openai_review_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 2600,
        "response_format": {"type": "json_object"},
    }
    payload_variants = [
        base_payload,
        {key: value for key, value in base_payload.items() if key != "response_format"},
        {
            key: value
            for key, value in base_payload.items()
            if key not in {"response_format", "temperature"}
        },
        {
            key: value
            for key, value in base_payload.items()
            if key not in {"response_format", "temperature", "max_tokens"}
        },
    ]

    last_response: httpx.Response | None = None
    for index, request_payload in enumerate(payload_variants):
        response = client.post(url, headers=headers, json=request_payload)
        last_response = response
        if response.status_code in {400, 422} and index < len(payload_variants) - 1:
            continue
        response.raise_for_status()
        parsed = response.json()
        if not isinstance(parsed, dict):
            raise ValueError("Chat completion response must be an object")
        return parsed

    if last_response is not None:
        last_response.raise_for_status()
    raise ValueError("Chat completion request failed")


def _parse_review_json(raw_json: object) -> dict[str, object] | None:
    if not isinstance(raw_json, str):
        return None
    cleaned = raw_json.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.removeprefix("```json").removeprefix("```").strip()
        cleaned = cleaned.removesuffix("```").strip()
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return None
        try:
            parsed = json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError:
            return None
    return parsed if isinstance(parsed, dict) else None


def _normalize_verdict(value: object) -> str:
    verdict = str(value or "").strip().lower()
    if verdict in {"approve", "needs_review"}:
        return verdict
    return "needs_review"


def _normalize_reasoning(value: object) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if value:
        return [str(value).strip()]
    return []


def normalize_confidence(value: object) -> float:
    try:
        confidence = float(value)
    except (TypeError, ValueError):
        return 0.5
    if not math.isfinite(confidence):
        return 0.5
    if confidence > 1 and confidence <= 100:
        confidence = confidence / 100
    return round(max(0.0, min(1.0, confidence)), 4)


def _human_label(value: str) -> str:
    labels = {
        "contract": "Hợp đồng",
        "nda": "NDA",
        "invoice": "Hóa đơn",
        "policy": "Chính sách",
        "court_judgment": "Bản án / văn bản tố tụng",
        "unknown": "Chưa rõ",
        "good": "Tốt",
        "low": "Thấp",
        "medium": "Trung bình",
        "high": "Cao",
        "critical": "Rất cao",
        "JUDICIAL_DOCUMENT": "Tài liệu tố tụng/tư pháp",
        "SENSITIVE_PERSONAL_DATA": "Dữ liệu cá nhân nhạy cảm",
        "MISSING_SIGNATURE": "Thiếu chữ ký",
        "HIGH_VALUE": "Giá trị cao",
        "EXPIRY_SOON": "Sắp hết hạn",
        "NO_TERMINATION_CLAUSE": "Thiếu điều khoản chấm dứt",
        "NO_GOVERNING_LAW": "Thiếu luật điều chỉnh",
        "BROAD_INDEMNITY": "Bồi thường quá rộng",
        "AUTO_RENEWAL": "Tự động gia hạn",
        "LOW_EXTRACTION_QUALITY": "Chất lượng trích xuất thấp",
        "UNKNOWN_DOC_TYPE": "Loại tài liệu chưa rõ",
        "CONFIDENCE_LOW": "Độ tin cậy thấp",
    }
    return labels.get(value, value)
