from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path

import pdfplumber
from docx import Document as DocxDocument


@dataclass
class ExtractionResult:
    text: str
    quality_label: str
    quality_score: float
    expiry_date: date | None


DATE_PATTERNS = [
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%m/%d/%Y",
    "%d-%m-%Y",
    "%B %d, %Y",
    "%b %d, %Y",
]


def extract_text(storage_path: str) -> ExtractionResult:
    path = Path(storage_path)
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        text = _extract_pdf(path)
    elif suffix == ".docx":
        text = _extract_docx(path)
    else:
        raise ValueError(f"Unsupported file type: {suffix}")

    normalized_text = normalize_text(text)
    quality_score = compute_quality_score(normalized_text)
    quality_label = "good" if len(normalized_text) >= 200 and quality_score >= 0.65 else "low"
    expiry_date = detect_expiry_date(normalized_text)
    return ExtractionResult(
        text=normalized_text,
        quality_label=quality_label,
        quality_score=quality_score,
        expiry_date=expiry_date,
    )


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def compute_quality_score(text: str) -> float:
    if not text:
        return 0.0
    letters = sum(1 for char in text if char.isalpha())
    printable = sum(1 for char in text if char.isprintable() and not char.isspace())
    if printable == 0:
        return 0.0
    score = letters / printable
    return round(min(max(score, 0.0), 1.0), 4)


def detect_expiry_date(text: str) -> date | None:
    matches = re.finditer(
        r"(expiry date|expiration date|expires on|valid until|term ends on)[:\s]+([A-Za-z0-9,/\- ]{6,30})",
        text,
        flags=re.IGNORECASE,
    )
    for match in matches:
        candidate = match.group(2).strip(" .")
        parsed = parse_date(candidate)
        if parsed is not None:
            return parsed
    return None


def parse_date(raw: str) -> date | None:
    cleaned = raw.strip()
    for pattern in DATE_PATTERNS:
        try:
            return datetime.strptime(cleaned, pattern).date()
        except ValueError:
            continue
    return None


def _extract_pdf(path: Path) -> str:
    pages: list[str] = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            pages.append(page.extract_text() or "")
    return "\n".join(pages)


def _extract_docx(path: Path) -> str:
    document = DocxDocument(path)
    paragraphs = [paragraph.text for paragraph in document.paragraphs]
    return "\n".join(paragraphs)

