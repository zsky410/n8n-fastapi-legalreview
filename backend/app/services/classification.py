from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ClassificationResult:
    document_type: str
    confidence: float
    matched_keywords: list[str]


CLASSIFICATION_KEYWORDS: dict[str, list[str]] = {
    "contract": ["agreement", "contract", "party", "clause", "effective date"],
    "nda": [
        "confidential",
        "confidentiality",
        "confidential information",
        "non-disclosure",
        "recipient",
        "disclosing party",
    ],
    "invoice": ["invoice", "total", "tax", "due date", "payment"],
    "policy": ["policy", "procedure", "compliance", "employee"],
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

    keyword_count = len(CLASSIFICATION_KEYWORDS[best_type])
    confidence = max(0.35, min(0.98, best_score / keyword_count))
    return ClassificationResult(
        document_type=best_type,
        confidence=round(confidence, 4),
        matched_keywords=best_matches,
    )
