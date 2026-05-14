from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ClassificationResult:
    document_type: str
    confidence: float
    matched_keywords: list[str]


CLASSIFICATION_KEYWORDS: dict[str, list[str]] = {
    "court_judgment": [
        "bản án",
        "quyết định",
        "tòa án",
        "toà án",
        "hội đồng xét xử",
        "thẩm phán",
        "nguyên đơn",
        "bị đơn",
        "người có quyền lợi",
        "nghĩa vụ liên quan",
        "thụ lý",
        "tuyên xử",
        "án phí",
        "kháng cáo",
        "viện kiểm sát",
        "vụ án",
        "nhân danh nước",
        "court",
        "judgment",
        "case number",
        "plaintiff",
        "defendant",
    ],
    "contract": [
        "agreement",
        "contract",
        "party",
        "clause",
        "effective date",
        "hợp đồng",
        "bên a",
        "bên b",
        "điều khoản",
        "giá trị hợp đồng",
        "phụ lục hợp đồng",
        "thanh lý hợp đồng",
    ],
    "nda": [
        "confidential",
        "confidentiality",
        "confidential information",
        "non-disclosure",
        "recipient",
        "disclosing party",
        "nda",
        "bảo mật",
        "thông tin mật",
        "bên tiết lộ",
        "bên nhận",
        "thỏa thuận bảo mật",
    ],
    "invoice": [
        "invoice",
        "total",
        "tax",
        "due date",
        "payment",
        "hóa đơn",
        "tổng tiền",
        "thuế",
        "thanh toán",
        "đơn giá",
        "ngày đến hạn",
    ],
    "policy": [
        "policy",
        "procedure",
        "compliance",
        "employee",
        "chính sách",
        "quy trình",
        "tuân thủ",
        "nhân viên",
        "quy chế",
        "nội quy",
    ],
}


def classify_document(text: str) -> ClassificationResult:
    lowered = text.lower()
    scores: dict[str, tuple[int, list[str]]] = {}
    for document_type, keywords in CLASSIFICATION_KEYWORDS.items():
        matched = [keyword for keyword in keywords if keyword in lowered]
        scores[document_type] = (len(matched), matched)

    best_type = "unknown"
    best_score = 0
    best_matches: list[str] = []
    for document_type, (score, matched) in scores.items():
        if score > best_score:
            best_type = document_type
            best_score = score
            best_matches = matched

    if best_score == 0:
        return ClassificationResult(document_type="unknown", confidence=0.25, matched_keywords=[])

    confidence = max(0.35, min(0.98, 0.25 + (best_score * 0.15)))
    return ClassificationResult(
        document_type=best_type,
        confidence=round(confidence, 4),
        matched_keywords=best_matches,
    )
