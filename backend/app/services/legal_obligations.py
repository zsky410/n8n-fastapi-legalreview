from __future__ import annotations

import json
import logging
import math
import re
from dataclasses import dataclass
from datetime import UTC, date, datetime
from typing import Any

import httpx

from app.core.config import settings
from app.services.classification import ClassificationResult
from app.services.risk_engine import RiskFindingData

logger = logging.getLogger(__name__)


@dataclass
class LegalObligationData:
    title: str
    responsible_party: str | None
    obligation_type: str
    due_date: date | None
    urgency: str
    severity: str
    source_excerpt: str | None
    consequence: str | None
    recommended_action: str | None


OBLIGATION_KEYWORDS = (
    "phải",
    "có nghĩa vụ",
    "nghĩa vụ",
    "chậm nhất",
    "trước ngày",
    "hạn chót",
    "hạn thanh toán",
    "shall",
    "must",
    "required to",
    "no later than",
    "on or before",
    "prior to",
    "deadline",
    "due date",
    "deliver",
    "provide",
    "submit",
    "pay",
    "prepay",
    "become",
    "expiration",
    "expiry",
)

HIGH_RISK_KEYWORDS = (
    "event of default",
    "immediate default",
    "acceleration",
    "null and void",
    "post-default",
    "foreclose",
    "termination",
    "chấm dứt",
    "vi phạm",
    "mất hiệu lực",
)

MONTHS = {
    "january": 1,
    "february": 2,
    "march": 3,
    "april": 4,
    "may": 5,
    "june": 6,
    "july": 7,
    "august": 8,
    "september": 9,
    "october": 10,
    "november": 11,
    "december": 12,
}


def extract_legal_obligations(
    *,
    text: str,
    summary: str | None,
    classification: ClassificationResult,
    findings: list[RiskFindingData],
    risk_score: int,
) -> list[LegalObligationData]:
    if not text.strip():
        return []

    ai_result = _try_openai_obligation_extraction(
        text=text,
        summary=summary,
        classification=classification,
        findings=findings,
        risk_score=risk_score,
    )
    if ai_result is not None:
        return ai_result

    return _extract_obligations_with_rules(text=text, risk_score=risk_score)


def _try_openai_obligation_extraction(
    *,
    text: str,
    summary: str | None,
    classification: ClassificationResult,
    findings: list[RiskFindingData],
    risk_score: int,
) -> list[LegalObligationData] | None:
    if not settings.openai_api_key:
        return None

    excerpt = _build_obligation_excerpt(text, max_chars=max(4000, settings.ai_obligation_excerpt_chars))
    findings_payload = [
        {
            "rule_code": finding.rule_code,
            "severity": finding.severity,
            "snippet": finding.snippet,
            "suggestion": finding.suggestion,
        }
        for finding in findings[:8]
    ]
    system_prompt = (
        "Bạn trích xuất cam kết, mốc thời hạn và việc cần theo dõi sau khi AI rà soát tài liệu. "
        "Chỉ dùng nguồn trong đoạn trích, không bịa ngày, không bịa bên chịu trách nhiệm. "
        "Ưu tiên các cam kết có hạn chót, mốc gia hạn/chấm dứt, khoản thanh toán, cung cấp hồ sơ, "
        "phê duyệt, báo cáo, ký bổ sung hoặc điều kiện làm mất hiệu lực quyền miễn trừ/tạm hoãn thực thi. "
        "Viết toàn bộ trường mô tả bằng tiếng Việt. Giữ nguyên trích dẫn ngắn nếu lấy từ văn bản tiếng Anh.\n\n"
        "Return JSON only with shape: "
        '{"obligations":[{"title":string,"responsible_party":string|null,'
        '"obligation_type":"payment|filing|reporting|approval|notice|renewal|termination|security|other",'
        '"due_date":"YYYY-MM-DD"|null,"urgency":"overdue|due_soon|normal|no_deadline",'
        '"severity":"low|medium|high|critical","source_excerpt":string|null,'
        '"consequence":string|null,"recommended_action":string|null}]}.\n'
        "Tối đa 8 mục. Nếu không có cam kết hoặc mốc đáng theo dõi, trả obligations là mảng rỗng."
    )
    user_prompt = (
        f"Phân loại: {classification.document_type} ({classification.confidence:.2f})\n"
        f"Điểm rủi ro: {risk_score}\n"
        f"Tín hiệu rủi ro: {json.dumps(findings_payload, ensure_ascii=False)}\n"
        f"Tóm tắt AI hiện có:\n{summary or '(chưa có)'}\n\n"
        f"=== VĂN BẢN TRÍCH ===\n{excerpt}"
    )
    url = f"{settings.openai_base_url.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }
    base_payload: dict[str, Any] = {
        "model": settings.openai_review_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.1,
        "max_tokens": 1200,
        "response_format": {"type": "json_object"},
    }
    payload_variants = [
        base_payload,
        {key: value for key, value in base_payload.items() if key != "response_format"},
        {key: value for key, value in base_payload.items() if key not in {"response_format", "max_tokens"}},
    ]

    try:
        with httpx.Client(timeout=settings.openai_timeout_seconds) as client:
            raw_content = ""
            for index, payload in enumerate(payload_variants):
                response = client.post(url, headers=headers, json=payload)
                if response.status_code in {400, 422} and index < len(payload_variants) - 1:
                    continue
                response.raise_for_status()
                data = response.json()
                raw_content = str(data["choices"][0]["message"]["content"])
                break
    except Exception as exc:
        logger.info("Không trích xuất cam kết/mốc bằng LLM được; dùng fallback rules: %s", exc)
        return None

    parsed = _parse_obligation_json(raw_content)
    if parsed is None:
        return None
    return parsed


def _build_obligation_excerpt(text: str, *, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text

    lowered = text.lower()
    intervals: list[tuple[int, int, str]] = [(0, min(10_000, max_chars // 5), "Đầu tài liệu")]
    window_radius = 1_600
    for keyword in (*OBLIGATION_KEYWORDS, *HIGH_RISK_KEYWORDS):
        start = 0
        while True:
            index = lowered.find(keyword, start)
            if index == -1:
                break
            intervals.append((
                max(0, index - window_radius),
                min(len(text), index + len(keyword) + window_radius),
                f"Đoạn quanh '{keyword}'",
            ))
            start = index + len(keyword)
            if len(intervals) >= 24:
                break
        if len(intervals) >= 24:
            break

    intervals.append((max(0, len(text) - min(8000, max_chars // 5)), len(text), "Cuối tài liệu"))
    intervals.sort(key=lambda item: item[0])
    merged: list[tuple[int, int, str]] = []
    for start, end, label in intervals:
        if merged and start <= merged[-1][1] + 250:
            prev_start, prev_end, prev_label = merged[-1]
            merged[-1] = (prev_start, max(prev_end, end), f"{prev_label}; {label}")
        else:
            merged.append((start, end, label))

    chunks: list[str] = []
    total = 0
    for index, (start, end, label) in enumerate(merged, start=1):
        chunk = text[start:end].strip()
        if not chunk:
            continue
        header = f"\n\n--- ĐOẠN {index}: {label} (ký tự {start}-{end}) ---\n"
        if total + len(header) + len(chunk) > max_chars:
            continue
        chunks.append(f"{header}{chunk}")
        total += len(header) + len(chunk)
    return "".join(chunks).strip()


def _parse_obligation_json(raw_content: str) -> list[LegalObligationData] | None:
    cleaned = raw_content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.removeprefix("```json").removeprefix("```").strip()
        cleaned = cleaned.removesuffix("```").strip()
    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end <= start:
            return None
        try:
            payload = json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError:
            return None
    if not isinstance(payload, dict):
        return None
    obligations = payload.get("obligations")
    if not isinstance(obligations, list):
        return None

    normalized: list[LegalObligationData] = []
    seen: set[tuple[str, date | None]] = set()
    for item in obligations[:8]:
        if not isinstance(item, dict):
            continue
        title = _clean_text(str(item.get("title") or ""), max_len=220)
        if not title:
            continue
        due_date = _parse_date_value(item.get("due_date"))
        key = (title.lower(), due_date)
        if key in seen:
            continue
        seen.add(key)
        normalized.append(
            LegalObligationData(
                title=title,
                responsible_party=_clean_nullable(item.get("responsible_party"), max_len=220),
                obligation_type=_normalize_choice(
                    item.get("obligation_type"),
                    {"payment", "filing", "reporting", "approval", "notice", "renewal", "termination", "security", "other"},
                    "other",
                ),
                due_date=due_date,
                urgency=_normalize_urgency(item.get("urgency"), due_date),
                severity=_normalize_choice(item.get("severity"), {"low", "medium", "high", "critical"}, "medium"),
                source_excerpt=_clean_nullable(item.get("source_excerpt"), max_len=520),
                consequence=_clean_nullable(item.get("consequence"), max_len=520),
                recommended_action=_clean_nullable(item.get("recommended_action"), max_len=520),
            )
        )
    return normalized


def _extract_obligations_with_rules(*, text: str, risk_score: int) -> list[LegalObligationData]:
    matches = _find_date_mentions(text)
    obligations: list[LegalObligationData] = []
    seen: set[tuple[str, date | None]] = set()
    for start, end, due_date in matches:
        context = _window(text, start, end, radius=460)
        focused_context = _focused_obligation_context(text, start, end)
        if not _looks_like_obligation_context(context):
            continue
        title = _infer_title(focused_context or context)
        key = (title.lower(), due_date)
        if key in seen:
            continue
        seen.add(key)
        severity = _infer_severity(context, risk_score=risk_score)
        obligations.append(
            LegalObligationData(
                title=title,
                responsible_party=_infer_responsible_party(context),
                obligation_type=_infer_obligation_type(focused_context or context),
                due_date=due_date,
                urgency=_urgency_from_date(due_date),
                severity=severity,
                source_excerpt=_clean_text(context, max_len=520),
                consequence=_infer_consequence(context),
                recommended_action=_infer_recommended_action(title=title, severity=severity),
            )
        )
        if len(obligations) >= 8:
            break
    return obligations


def _find_date_mentions(text: str) -> list[tuple[int, int, date]]:
    matches: list[tuple[int, int, date]] = []

    for match in re.finditer(r"\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b", text):
        parsed = _safe_date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
        if parsed:
            matches.append((match.start(), match.end(), parsed))

    for match in re.finditer(r"\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b", text):
        first = int(match.group(1))
        second = int(match.group(2))
        year = int(match.group(3))
        day, month = _choose_day_month(first, second)
        parsed = _safe_date(year, month, day)
        if parsed:
            matches.append((match.start(), match.end(), parsed))

    month_names = "|".join(MONTHS)
    for match in re.finditer(rf"\b({month_names})\s+(\d{{1,2}}),?\s+(20\d{{2}})\b", text, re.IGNORECASE):
        parsed = _safe_date(int(match.group(3)), MONTHS[match.group(1).lower()], int(match.group(2)))
        if parsed:
            matches.append((match.start(), match.end(), parsed))

    for match in re.finditer(rf"\b(\d{{1,2}})\s+({month_names})\s+(20\d{{2}})\b", text, re.IGNORECASE):
        parsed = _safe_date(int(match.group(3)), MONTHS[match.group(2).lower()], int(match.group(1)))
        if parsed:
            matches.append((match.start(), match.end(), parsed))

    matches.sort(key=lambda item: item[0])
    deduped: list[tuple[int, int, date]] = []
    occupied: set[tuple[int, int]] = set()
    for start, end, parsed in matches:
        span = (start, end)
        if span in occupied:
            continue
        occupied.add(span)
        deduped.append((start, end, parsed))
    return deduped


def _parse_date_value(value: object) -> date | None:
    if isinstance(value, date):
        return value
    if not value:
        return None
    text = str(value).strip()
    for pattern in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%m-%d-%Y"):
        try:
            return datetime.strptime(text, pattern).date()
        except ValueError:
            continue
    return None


def _safe_date(year: int, month: int, day: int) -> date | None:
    try:
        return date(year, month, day)
    except ValueError:
        return None


def _choose_day_month(first: int, second: int) -> tuple[int, int]:
    if first > 12:
        return first, second
    if second > 12:
        return second, first
    return first, second


def _window(text: str, start: int, end: int, *, radius: int) -> str:
    left = max(0, start - radius)
    right = min(len(text), end + radius)
    return text[left:right]


def _focused_obligation_context(text: str, start: int, end: int) -> str:
    left_candidates = [text.rfind(".", 0, start), text.rfind(";", 0, start), text.rfind("\n", 0, start)]
    right_candidates = [index for index in (text.find(".", end), text.find(";", end), text.find("\n", end)) if index != -1]
    left = max(left_candidates)
    right = min(right_candidates) if right_candidates else min(len(text), end + 220)
    focused = text[left + 1 : right + 1].strip()
    if len(focused) < 30:
        return _window(text, start, end, radius=180)
    return focused


def _looks_like_obligation_context(context: str) -> bool:
    lowered = context.lower()
    return any(keyword in lowered for keyword in OBLIGATION_KEYWORDS)


def _infer_title(context: str) -> str:
    sentence = _best_sentence(context)
    lowered = sentence.lower()
    if "appraisal" in lowered or "định giá" in lowered:
        return "Cung cấp báo cáo định giá tài sản"
    if "field examination" in lowered or "field examiner" in lowered or "kiểm tra thực địa" in lowered:
        return "Hoàn tất báo cáo kiểm tra thực địa"
    if "subsidiar" in lowered and ("loan part" in lowered or "security document" in lowered):
        return "Bổ sung công ty con thành bên chịu trách nhiệm và ký tài liệu bảo đảm"
    if "prepay" in lowered or "prepayment" in lowered or "trả trước" in lowered or "thanh toán" in lowered:
        return "Hoàn tất khoản thanh toán hoặc trả trước"
    if "notice" in lowered or "thông báo" in lowered:
        return "Gửi thông báo đúng hạn"
    if "expiration" in lowered or "expiry" in lowered or "expire" in lowered or "hết hạn" in lowered:
        return "Theo dõi mốc hết hạn hoặc gia hạn"

    return _clean_text(sentence, max_len=180) or "Theo dõi cam kết hoặc mốc có hạn chót trong tài liệu"


def _best_sentence(context: str) -> str:
    normalized = re.sub(r"\s+", " ", context).strip()
    sentences = re.split(r"(?<=[.;:])\s+", normalized)
    for sentence in sentences:
        if _looks_like_obligation_context(sentence):
            return sentence
    return normalized[:180]


def _infer_responsible_party(context: str) -> str | None:
    patterns = [
        r"\b(Loan Parties?|Borrower|Company|Guarantors?|Administrative Agent|Lender)\b",
        r"\b(Bên\s+[AB]|bên vay|bên cho vay|bên nhận bảo đảm|bên bảo đảm)\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, context, re.IGNORECASE)
        if match:
            return _clean_text(match.group(1), max_len=120)
    return None


def _infer_obligation_type(context: str) -> str:
    lowered = context.lower()
    if any(token in lowered for token in ("pay", "prepay", "payment", "thanh toán", "trả trước")):
        return "payment"
    if any(token in lowered for token in ("appraisal", "field examination", "report", "báo cáo")):
        return "reporting"
    if any(token in lowered for token in ("security document", "collateral", "bảo đảm", "thế chấp")):
        return "security"
    if any(token in lowered for token in ("notice", "thông báo")):
        return "notice"
    if any(token in lowered for token in ("approval", "approve", "phê duyệt")):
        return "approval"
    if any(token in lowered for token in ("termination", "terminate", "chấm dứt")):
        return "termination"
    if any(token in lowered for token in ("renewal", "gia hạn")):
        return "renewal"
    return "other"


def _infer_severity(context: str, *, risk_score: int) -> str:
    lowered = context.lower()
    if any(keyword in lowered for keyword in HIGH_RISK_KEYWORDS):
        return "critical" if "immediate" in lowered or "null and void" in lowered else "high"
    if risk_score >= 85:
        return "high"
    if risk_score >= 60:
        return "medium"
    return "low"


def _infer_consequence(context: str) -> str:
    lowered = context.lower()
    if "event of default" in lowered or "default" in lowered or "vi phạm" in lowered:
        return "Nếu không thực hiện đúng hạn, tài liệu cho thấy có nguy cơ phát sinh hoặc khôi phục sự kiện vi phạm."
    if "null and void" in lowered or "waiver" in lowered or "forbearance" in lowered:
        return "Miễn trừ hoặc tạm hoãn thực thi có thể mất hiệu lực nếu cam kết hoặc điều kiện này không được đáp ứng."
    if "termination" in lowered or "chấm dứt" in lowered:
        return "Có thể ảnh hưởng quyền chấm dứt, gia hạn hoặc tiếp tục hiệu lực của tài liệu."
    return "Cần theo dõi để tránh bỏ sót cam kết vận hành hoặc mốc xử lý quan trọng trong tài liệu."


def _infer_recommended_action(*, title: str, severity: str) -> str:
    if severity in {"high", "critical"}:
        return f"Giao người phụ trách xác nhận ngay: {title}; lưu bằng chứng hoàn thành và để người rà soát kiểm tra trước hạn."
    return f"Ghi nhận vào lịch theo dõi, phân công người phụ trách và cập nhật trạng thái khi hoàn thành: {title}."


def _normalize_urgency(value: object, due_date: date | None) -> str:
    urgency = str(value or "").strip().lower()
    if urgency in {"overdue", "due_soon", "normal", "no_deadline"}:
        return urgency
    return _urgency_from_date(due_date)


def _urgency_from_date(due_date: date | None) -> str:
    if due_date is None:
        return "no_deadline"
    today = datetime.now(UTC).date()
    days_left = (due_date - today).days
    if days_left < 0:
        return "overdue"
    if days_left <= 14:
        return "due_soon"
    return "normal"


def _normalize_choice(value: object, allowed: set[str], fallback: str) -> str:
    normalized = str(value or "").strip().lower()
    return normalized if normalized in allowed else fallback


def _clean_nullable(value: object, *, max_len: int) -> str | None:
    if value is None:
        return None
    cleaned = _clean_text(str(value), max_len=max_len)
    return cleaned or None


def _clean_text(value: str, *, max_len: int) -> str:
    cleaned = re.sub(r"\s+", " ", value).strip(" \n\t.;")
    if len(cleaned) > max_len:
        return f"{cleaned[:max_len].rstrip()}..."
    return cleaned


def days_until(due_date: date | None) -> int | None:
    if due_date is None:
        return None
    days_left = (due_date - datetime.now(UTC).date()).days
    if not math.isfinite(days_left):
        return None
    return days_left
