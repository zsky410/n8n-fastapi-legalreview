from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, date, datetime

from app.core.config import settings
from app.services.classification import ClassificationResult
from app.services.extraction import ExtractionResult


@dataclass
class RiskFindingData:
    rule_code: str
    severity: str
    snippet: str | None
    suggestion: str
    score: int


@dataclass
class MoneySignal:
    display: str
    normalized_usd: float


SEVERITY_SCORES = {
    "low": 10,
    "medium": 15,
    "high": 25,
    "critical": 40,
}


def evaluate_risks(
    *,
    text: str,
    extraction: ExtractionResult,
    classification: ClassificationResult,
) -> tuple[list[RiskFindingData], int, list[str], date | None]:
    findings: list[RiskFindingData] = []
    lowered = text.lower()
    expiry_date = extraction.expiry_date

    def add(rule_code: str, severity: str, snippet: str | None, suggestion: str) -> None:
        findings.append(
            RiskFindingData(
                rule_code=rule_code,
                severity=severity,
                snippet=snippet,
                suggestion=suggestion,
                score=SEVERITY_SCORES[severity],
            )
        )

    if classification.document_type == "court_judgment":
        add(
            "JUDICIAL_DOCUMENT",
            "medium",
            "Tài liệu có dấu hiệu là bản án/văn bản tố tụng: xuất hiện từ khóa về Tòa án, Hội đồng xét xử, nguyên đơn/bị đơn hoặc tuyên xử.",
            "Dùng đúng phạm vi tham khảo pháp lý/tố tụng; không xử lý như hợp đồng hoặc chứng từ giao dịch thông thường.",
        )

    if settings.risk_personal_data_enabled:
        sensitive_snippet = detect_sensitive_personal_data(text)
        if sensitive_snippet is not None:
            add(
                "SENSITIVE_PERSONAL_DATA",
                "medium",
                sensitive_snippet,
                "Giới hạn quyền truy cập, cân nhắc che thông tin CCCD/số điện thoại/địa chỉ khi chia sẻ ngoài nhóm xử lý.",
            )

    signature_tokens = (
        "signature",
        "signed by",
        "authorized signatory",
        "executed by",
        "chữ ký",
        "ký tên",
        "người ký",
        "người đại diện",
        "đại diện bên a",
        "đại diện bên b",
        "ký và ghi rõ họ tên",
        "đóng dấu",
    )
    if classification.document_type in {"contract", "nda"} and not any(token in lowered for token in signature_tokens):
        add(
            "MISSING_SIGNATURE",
            "high",
            "Không phát hiện từ khóa về chữ ký hoặc phần ký kết trong hợp đồng/NDA.",
            "Kiểm tra tài liệu có đầy đủ phần chữ ký, đại diện ký và thông tin ký kết.",
        )

    money = detect_high_value_money(text)
    if money is not None and money.normalized_usd >= 100_000:
        add(
            "HIGH_VALUE",
            "critical",
            f"Detected amount {money.display}.",
            "Chuyển tài liệu giá trị cao sang duyệt thủ công.",
        )

    if expiry_date is not None:
        days_left = (expiry_date - datetime.now(UTC).date()).days
        if 0 <= days_left <= 30:
            add(
                "EXPIRY_SOON",
                "medium",
                f"Document appears to expire on {expiry_date.isoformat()}",
                "Kiểm tra điều khoản gia hạn hoặc gia hạn trước khi tài liệu hết hiệu lực.",
            )

    termination_tokens = (
        "termination",
        "terminate",
        "terminated",
        "chấm dứt",
        "đơn phương chấm dứt",
        "thanh lý",
        "hủy bỏ hợp đồng",
        "hủy hợp đồng",
    )
    if classification.document_type in {"contract", "nda"} and not any(token in lowered for token in termination_tokens):
        add(
            "NO_TERMINATION_CLAUSE",
            "high",
            "Không tìm thấy từ khóa về điều khoản chấm dứt trong hợp đồng/NDA.",
            "Bổ sung quyền chấm dứt và thời hạn thông báo rõ ràng.",
        )

    governing_law_tokens = (
        "governing law",
        "jurisdiction",
        "venue",
        "luật điều chỉnh",
        "pháp luật việt nam",
        "pháp luật hiện hành",
        "giải quyết tranh chấp",
        "thẩm quyền",
        "tòa án",
        "trọng tài",
    )
    if classification.document_type in {"contract", "nda"} and not any(token in lowered for token in governing_law_tokens):
        add(
            "NO_GOVERNING_LAW",
            "medium",
            "Không phát hiện điều khoản luật điều chỉnh hoặc thẩm quyền giải quyết tranh chấp.",
            "Nêu rõ luật điều chỉnh và địa điểm giải quyết tranh chấp.",
        )

    if any(token in lowered for token in ("indemnify", "hold harmless", "bồi thường", "miễn trừ trách nhiệm")):
        add(
            "BROAD_INDEMNITY",
            "high",
            "Phát hiện nội dung về bồi thường/miễn trừ trách nhiệm.",
            "Kiểm tra trách nhiệm bồi thường có được giới hạn phù hợp hay không.",
        )

    if any(token in lowered for token in ("auto renew", "automatic renewal", "automatically renew", "tự động gia hạn", "gia hạn tự động")):
        add(
            "AUTO_RENEWAL",
            "medium",
            "Phát hiện nội dung tự động gia hạn.",
            "Xác nhận thời hạn thông báo gia hạn và điều kiện từ chối gia hạn.",
        )

    if extraction.quality_label == "low":
        add(
            "LOW_EXTRACTION_QUALITY",
            "high",
            "Văn bản trích xuất quá ngắn hoặc chất lượng thấp.",
            "Kiểm tra chất lượng file gốc hoặc tải lên phiên bản có text/OCR rõ hơn.",
        )

    if classification.document_type == "unknown":
        add(
            "UNKNOWN_DOC_TYPE",
            "medium",
            "Không thể phân loại tài liệu một cách chắc chắn.",
            "Chuyển sang rà soát thủ công hoặc cải thiện quy tắc phân loại tài liệu.",
        )

    if classification.confidence < 0.55:
        add(
            "CONFIDENCE_LOW",
            "medium",
            f"Classification confidence is {classification.confidence:.2f}.",
            "Rà soát thủ công trước khi tin vào kết luận tự động.",
        )

    risk_score = min(100, sum(finding.score for finding in findings))
    flag_reasons = [finding.rule_code for finding in findings]
    return findings, risk_score, flag_reasons, expiry_date


def detect_high_value_amount(text: str) -> float | None:
    money = detect_high_value_money(text)
    return money.normalized_usd if money is not None else None


def detect_sensitive_personal_data(text: str) -> str | None:
    signals: list[str] = []
    if re.search(r"\b\d{9,12}\b", text) and re.search(r"(cccd|cmnd|căn cước|chứng minh nhân dân)", text, flags=re.IGNORECASE):
        signals.append("CCCD/CMND")
    if re.search(r"\b0\d{9}\b", text):
        signals.append("số điện thoại")
    if re.search(r"\b(địa chỉ|ấp|xã|phường|quận|huyện|tỉnh|thành phố)\b", text, flags=re.IGNORECASE):
        signals.append("địa chỉ")
    if not signals:
        return None
    unique_signals = ", ".join(dict.fromkeys(signals))
    return f"Phát hiện dữ liệu cá nhân trong văn bản trích xuất: {unique_signals}."


def detect_high_value_money(text: str) -> MoneySignal | None:
    candidates: list[MoneySignal] = []
    usd_pattern = r"(?:USD|\$)\s?([0-9]{1,3}(?:[,.\s][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+(?:[.,][0-9]{2})?)"
    for match in re.finditer(usd_pattern, text, flags=re.IGNORECASE):
        amount = _parse_number(match.group(1))
        if amount is not None:
            candidates.append(MoneySignal(display=f"USD {amount:,.2f}", normalized_usd=amount))

    vnd_patterns = [
        r"([0-9]{1,3}(?:[,.\s][0-9]{3})+|[0-9]+)\s?(?:VNĐ|VND|đồng)",
        r"(?:VNĐ|VND)\s?([0-9]{1,3}(?:[,.\s][0-9]{3})+|[0-9]+)",
    ]
    for pattern in vnd_patterns:
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            amount = _parse_number(match.group(1))
            if amount is not None:
                candidates.append(MoneySignal(display=f"{amount:,.0f} VND", normalized_usd=amount / 25_000))

    for match in re.finditer(r"([0-9]+(?:[,.][0-9]+)?)\s?tỷ(?:\s?đồng)?", text, flags=re.IGNORECASE):
        amount = _parse_decimal(match.group(1))
        if amount is not None:
            vnd_amount = amount * 1_000_000_000
            candidates.append(MoneySignal(display=f"{vnd_amount:,.0f} VND", normalized_usd=vnd_amount / 25_000))

    if not candidates:
        return None
    return max(candidates, key=lambda candidate: candidate.normalized_usd)


def _parse_number(raw: str) -> float | None:
    cleaned = raw.strip().replace(" ", "")
    if "," in cleaned and "." in cleaned:
        cleaned = cleaned.replace(",", "")
    elif "," in cleaned:
        groups = cleaned.split(",")
        cleaned = "".join(groups) if all(len(group) == 3 for group in groups[1:]) else cleaned.replace(",", ".")
    elif "." in cleaned:
        groups = cleaned.split(".")
        cleaned = "".join(groups) if all(len(group) == 3 for group in groups[1:]) else cleaned
    try:
        return float(cleaned)
    except ValueError:
        return None


def _parse_decimal(raw: str) -> float | None:
    try:
        return float(raw.replace(",", "."))
    except ValueError:
        return None
