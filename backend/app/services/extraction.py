from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date, datetime
from html.parser import HTMLParser
from pathlib import Path

import fitz
import pdfplumber
import pytesseract
from docx import Document as DocxDocument
from PIL import Image, ImageOps
from pytesseract import TesseractError

from app.core.config import settings


@dataclass
class ExtractionResult:
    text: str
    quality_label: str
    quality_score: float
    expiry_date: date | None
    extraction_method: str = "text"
    page_count: int = 0
    ocr_pages: int = 0


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
    page_count = 0
    ocr_pages = 0
    extraction_method = "text"
    if suffix == ".pdf":
        text, extraction_method, page_count, ocr_pages = _extract_pdf(path)
    elif suffix == ".docx":
        text = _extract_docx(path)
        extraction_method = "docx"
    elif suffix in {".txt", ".md"}:
        text = _extract_plain_text(path)
        extraction_method = "plain_text"
    elif suffix == ".rtf":
        text = _extract_rtf(path)
        extraction_method = "rtf"
    elif suffix in {".html", ".htm"}:
        text = _extract_html(path)
        extraction_method = "html"
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
        extraction_method=extraction_method,
        page_count=page_count,
        ocr_pages=ocr_pages,
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
        r"(expiry date|expiration date|expires on|valid until|term ends on|ngày hết hạn|hiệu lực đến|có hiệu lực đến|thời hạn đến)[:\s]+([A-Za-z0-9,/\- ]{6,30})",
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
    vietnamese_match = re.search(r"ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})", cleaned, flags=re.IGNORECASE)
    if vietnamese_match:
        day, month, year = (int(value) for value in vietnamese_match.groups())
        try:
            return date(year, month, day)
        except ValueError:
            return None

    for pattern in DATE_PATTERNS:
        try:
            return datetime.strptime(cleaned, pattern).date()
        except ValueError:
            continue
    return None


def _extract_pdf(path: Path) -> tuple[str, str, int, int]:
    pages: list[str] = []
    page_count = 0
    try:
        with pdfplumber.open(path) as pdf:
            page_count = len(pdf.pages)
            for page in pdf.pages:
                pages.append(page.extract_text() or "")
    except Exception:
        page_count = _count_pdf_pages(path)

    text_layer_text = "\n".join(pages)
    normalized_text = normalize_text(text_layer_text)
    text_layer_quality = compute_quality_score(normalized_text)
    should_run_ocr = settings.ocr_enabled and (len(normalized_text) < 120 or text_layer_quality < 0.35)
    if not should_run_ocr:
        return text_layer_text, "pdf_text_layer", page_count, 0

    ocr_text, ocr_pages = _ocr_pdf(path, max_pages=settings.ocr_max_pages)
    if len(normalize_text(ocr_text)) > len(normalized_text):
        return ocr_text, "pdf_ocr", page_count, ocr_pages
    if normalized_text:
        return text_layer_text, "pdf_text_layer", page_count, 0
    return text_layer_text, "pdf_text_layer_empty", page_count, 0


def _extract_docx(path: Path) -> str:
    document = DocxDocument(path)
    paragraphs = [paragraph.text for paragraph in document.paragraphs]
    return "\n".join(paragraphs)


def _ocr_pdf(path: Path, *, max_pages: int) -> tuple[str, int]:
    pages: list[str] = []
    page_total = 0
    with fitz.open(path) as pdf:
        page_total = min(len(pdf), max_pages)
        for page_index in range(page_total):
            page = pdf.load_page(page_index)
            pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples).convert("L")
            image = ImageOps.autocontrast(image)
            pages.append(_ocr_image(image))
    return "\n".join(pages), page_total


def _count_pdf_pages(path: Path) -> int:
    try:
        with fitz.open(path) as pdf:
            return len(pdf)
    except Exception:
        return 0


def _ocr_image(image: Image.Image) -> str:
    try:
        return pytesseract.image_to_string(image, lang=settings.ocr_languages)
    except TesseractError:
        if settings.ocr_languages != "eng":
            return pytesseract.image_to_string(image, lang="eng")
        raise


def _extract_plain_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8-sig")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="replace")


def _extract_html(path: Path) -> str:
    parser = _PlainTextHTMLParser()
    parser.feed(_extract_plain_text(path))
    parser.close()
    return "\n".join(parser.text_parts)


def _extract_rtf(path: Path) -> str:
    text = _extract_plain_text(path)
    text = re.sub(r"\\'([0-9a-fA-F]{2})", _decode_rtf_hex, text)
    text = re.sub(r"\\(par|line)\b\s?", "\n", text)
    text = re.sub(r"\\tab\b\s?", "\t", text)
    text = re.sub(r"\\[a-zA-Z]+-?\d*\s?", " ", text)
    text = re.sub(r"\\[^a-zA-Z0-9]", " ", text)
    return text.replace("{", " ").replace("}", " ")


def _decode_rtf_hex(match: re.Match[str]) -> str:
    try:
        return bytes.fromhex(match.group(1)).decode("cp1252")
    except (UnicodeDecodeError, ValueError):
        return ""


class _PlainTextHTMLParser(HTMLParser):
    BLOCK_TAGS = {
        "article",
        "br",
        "dd",
        "div",
        "dt",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "li",
        "p",
        "section",
        "td",
        "th",
        "tr",
    }

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.text_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() in self.BLOCK_TAGS:
            self.text_parts.append("\n")

    def handle_data(self, data: str) -> None:
        stripped = data.strip()
        if stripped:
            self.text_parts.append(stripped)
