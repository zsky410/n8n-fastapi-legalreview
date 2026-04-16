import html
import io
import logging
import re
import tempfile
import zipfile
from dataclasses import dataclass, field
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import Settings, get_settings
from app.schemas.common import LanguageEnum
from app.schemas.document_ocr import DocumentOcrPageDetail, DocumentOcrResponse
from app.services.document_title_service import DocumentTitleSuggestionService

try:
    import ocrmypdf
except ImportError:
    ocrmypdf = None

try:
    from pdfminer.high_level import extract_text as extract_pdf_text
except ImportError:
    extract_pdf_text = None

try:
    from pdfminer.pdfpage import PDFPage
except ImportError:
    PDFPage = None

try:
    import pytesseract
    from PIL import Image, ImageOps
except ImportError:
    pytesseract = None
    Image = None
    ImageOps = None

TEXT_EXTENSIONS = {"txt", "md", "markdown", "csv", "json", "xml", "html", "htm"}
OCR_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "webp"}
DIRECT_FILE_EXTENSIONS = TEXT_EXTENSIONS | {"docx"}
SUPPORTED_EXTENSIONS = DIRECT_FILE_EXTENSIONS | OCR_EXTENSIONS
MAX_UPLOAD_BYTES = 40 * 1024 * 1024
MAX_RETURN_CHARS = 120000
MIN_EXTRACTED_CHARS = 20
MIN_PAGE_TEXT_CHARS = 12


@dataclass
class PageExtraction:
    page_number: int
    text: str
    source: str

    @property
    def normalized_text(self) -> str:
        return DocumentOcrService._normalize_text(self.text)

    @property
    def char_count(self) -> int:
        return len(self.normalized_text)

    @property
    def has_text(self) -> bool:
        return self.char_count >= MIN_PAGE_TEXT_CHARS


@dataclass
class OcrExtraction:
    text: str
    provider: str
    source: str
    pages: list[PageExtraction] = field(default_factory=list)
    page_count: int | None = None

    @property
    def extracted_page_count(self) -> int | None:
        if not self.pages:
            return None

        return sum(1 for page in self.pages if page.has_text)

    @property
    def empty_page_count(self) -> int | None:
        if not self.pages:
            return None

        return sum(1 for page in self.pages if not page.has_text)


class DocumentOcrService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.logger = logging.getLogger(__name__)
        self.title_service = DocumentTitleSuggestionService(self.settings)

    async def extract(self, file: UploadFile, language: LanguageEnum = LanguageEnum.VI) -> DocumentOcrResponse:
        file_name = (file.filename or "uploaded-document").strip() or "uploaded-document"
        content_type = (file.content_type or "").strip().lower() or None
        extension = Path(file_name).suffix.lower().lstrip(".")
        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tệp tải lên đang rỗng, chưa có nội dung để OCR.")

        if len(file_bytes) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                "Tệp vượt quá 40 MB. Hãy dùng tệp nhỏ hơn để OCR ổn định.",
            )

        if extension not in SUPPORTED_EXTENSIONS:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Định dạng tệp chưa được hỗ trợ OCR. Hãy dùng PDF, DOCX, TXT, MD, PNG, JPG hoặc WEBP.",
            )

        if extension in TEXT_EXTENSIONS:
            extraction = OcrExtraction(
                text=self._decode_text(file_bytes),
                provider="local",
                source="direct_text",
            )
        elif extension == "docx":
            extraction = OcrExtraction(
                text=self._extract_docx_text(file_bytes),
                provider="local",
                source="docx_xml",
            )
        elif extension == "pdf":
            extraction = self._extract_pdf_text(file_bytes, language)
        else:
            extraction = OcrExtraction(
                text=self._extract_image_text(file_bytes, language),
                provider="tesseract",
                source="tesseract_image",
            )

        normalized_text = self._normalize_text(extraction.text)
        if len(normalized_text) < MIN_EXTRACTED_CHARS:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "OCR chưa trích xuất đủ nội dung để phân tích. Hãy thử tệp rõ nét hơn hoặc bổ sung văn bản thủ công.",
            )

        truncated = len(normalized_text) > MAX_RETURN_CHARS
        if truncated:
            normalized_text = normalized_text[:MAX_RETURN_CHARS].rstrip()

        warning = None
        if truncated:
            warning = "Nội dung OCR đã được rút gọn còn 120.000 ký tự để giữ giao diện phản hồi ổn định."
        elif extraction.empty_page_count:
            warning = (
                f"OCR đã nhận diện {extraction.extracted_page_count or 0}/{extraction.page_count or len(extraction.pages)} trang có nội dung. "
                "Hãy đối chiếu các trang còn trống với bản gốc."
            )
        elif extraction.provider in {"ocrmypdf", "tesseract", "hybrid"}:
            warning = "Kết quả OCR nên được đối chiếu nhanh với bản gốc trước khi dùng cho quyết định pháp lý."

        suggested_title, suggestion_source = self.title_service.suggest_title(
            file_name=file_name,
            extracted_text=normalized_text,
            language=language,
        )

        page_details = [
            DocumentOcrPageDetail(
                pageNumber=page.page_number,
                source=page.source,
                charCount=page.char_count,
                hasText=page.has_text,
            )
            for page in extraction.pages
        ]

        return DocumentOcrResponse(
            fileName=file_name,
            mimeType=content_type,
            extractedText=normalized_text,
            provider=extraction.provider,
            source=extraction.source,
            textLength=len(normalized_text),
            pageCount=extraction.page_count,
            extractedPageCount=extraction.extracted_page_count,
            emptyPageCount=extraction.empty_page_count,
            pageDetails=page_details,
            suggestedTitle=suggested_title,
            suggestionSource=suggestion_source,
            truncated=truncated,
            warning=warning,
        )

    @staticmethod
    def _decode_text(file_bytes: bytes) -> str:
        for encoding in ("utf-8-sig", "utf-8", "utf-16", "latin-1"):
            try:
                return file_bytes.decode(encoding)
            except UnicodeDecodeError:
                continue

        return file_bytes.decode("utf-8", errors="ignore")

    def _extract_docx_text(self, file_bytes: bytes) -> str:
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as archive:
                xml_parts = []
                for name in ("word/document.xml", "word/header1.xml", "word/footer1.xml"):
                    if name in archive.namelist():
                        xml_parts.append(archive.read(name).decode("utf-8", errors="ignore"))
        except zipfile.BadZipFile as exc:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Tệp DOCX không hợp lệ hoặc đã bị hỏng.",
            ) from exc

        combined_xml = "\n".join(xml_parts)
        if not combined_xml.strip():
            return ""

        combined_xml = combined_xml.replace("</w:p>", "\n").replace("</w:tr>", "\n").replace("<w:tab/>", "\t")
        text = re.sub(r"<[^>]+>", " ", combined_xml)
        return html.unescape(text)

    @staticmethod
    def _normalize_text(value: str) -> str:
        value = html.unescape(str(value or ""))
        value = value.replace("\x00", " ")
        value = re.sub(r"\r\n?", "\n", value)
        value = re.sub(r"[ \t]+", " ", value)
        value = re.sub(r"\n{3,}", "\n\n", value)
        return value.strip()

    def _extract_pdf_text(self, file_bytes: bytes, language: LanguageEnum) -> OcrExtraction:
        native_pages = self._extract_pdf_native_pages(file_bytes)
        native_text = self._format_pages_for_extracted_text(native_pages)
        page_count = len(native_pages) or None

        if native_pages and self._pages_have_text_coverage(native_pages):
            return OcrExtraction(
                text=native_text,
                provider="local",
                source="pdf_text",
                pages=native_pages,
                page_count=page_count,
            )

        if not native_pages:
            native_text = self._extract_pdf_native_text(file_bytes)
            if len(native_text) >= MIN_EXTRACTED_CHARS:
                return OcrExtraction(text=native_text, provider="local", source="pdf_text")

        if ocrmypdf is None:
            if len(native_text) >= MIN_EXTRACTED_CHARS:
                return OcrExtraction(
                    text=native_text,
                    provider="local",
                    source="pdf_text_partial",
                    pages=native_pages,
                    page_count=page_count,
                )

            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "OCRmyPDF chưa sẵn sàng trong runtime hiện tại. Hãy build lại container OCR.",
            )

        try:
            with tempfile.TemporaryDirectory(prefix="legaldesk-ocr-") as temp_dir:
                temp_path = Path(temp_dir)
                input_path = temp_path / "input.pdf"
                output_path = temp_path / "output.pdf"
                sidecar_path = temp_path / "ocr.txt"

                input_path.write_bytes(file_bytes)
                ocrmypdf.ocr(
                    input_path,
                    output_path,
                    sidecar=sidecar_path,
                    language=self._tesseract_languages(language),
                    skip_text=True,
                    deskew=True,
                    rotate_pages=True,
                    optimize=0,
                    jobs=1,
                    use_threads=False,
                    progress_bar=False,
                )

                raw_ocr_text = sidecar_path.read_text(encoding="utf-8", errors="ignore")
                ocr_pages = self._split_pdf_sidecar_pages(raw_ocr_text, page_count)
                merged_pages = self._merge_pdf_pages(native_pages, ocr_pages)
                ocr_text = self._strip_ocr_runtime_notes(raw_ocr_text)

                if merged_pages:
                    merged_text = self._format_pages_for_extracted_text(merged_pages)
                    if len(merged_text) >= MIN_EXTRACTED_CHARS:
                        provider = "hybrid" if any(page.source == "pdf_text" for page in merged_pages) else "ocrmypdf"
                        source = "pdf_text_ocr_merged" if provider == "hybrid" else "ocrmypdf_pdf"
                        return OcrExtraction(
                            text=merged_text,
                            provider=provider,
                            source=source,
                            pages=merged_pages,
                            page_count=len(merged_pages),
                        )

                if len(ocr_text) >= MIN_EXTRACTED_CHARS:
                    return OcrExtraction(text=ocr_text, provider="ocrmypdf", source="ocrmypdf_pdf")

                if len(native_text) >= MIN_EXTRACTED_CHARS:
                    return OcrExtraction(
                        text=native_text,
                        provider="local",
                        source="pdf_text_partial",
                        pages=native_pages,
                        page_count=page_count,
                    )

                return OcrExtraction(text=ocr_text, provider="ocrmypdf", source="ocrmypdf_pdf")
        except HTTPException:
            raise
        except Exception as exc:
            self.logger.warning("OCRmyPDF failed for PDF: %s", exc)
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY,
                "OCR PDF chưa hoàn tất bằng OCRmyPDF. Hãy thử lại sau hoặc dùng bản scan rõ hơn.",
            ) from exc

    def _extract_image_text(self, file_bytes: bytes, language: LanguageEnum) -> str:
        if pytesseract is None or Image is None or ImageOps is None:
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "Tesseract OCR chưa sẵn sàng trong runtime hiện tại. Hãy build lại container OCR.",
            )

        try:
            with Image.open(io.BytesIO(file_bytes)) as image:
                prepared_image = ImageOps.exif_transpose(image)
                return pytesseract.image_to_string(
                    prepared_image,
                    lang="+".join(self._tesseract_languages(language)),
                    config="--psm 6",
                )
        except HTTPException:
            raise
        except Exception as exc:
            self.logger.warning("Tesseract OCR failed for image: %s", exc)
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY,
                "OCR ảnh chưa hoàn tất bằng Tesseract. Hãy thử ảnh rõ nét hơn hoặc bổ sung văn bản thủ công.",
            ) from exc

    def _extract_pdf_native_pages(self, file_bytes: bytes) -> list[PageExtraction]:
        page_count = self._count_pdf_pages(file_bytes)
        if not page_count or extract_pdf_text is None:
            return []

        pages: list[PageExtraction] = []
        for page_index in range(page_count):
            try:
                text = extract_pdf_text(io.BytesIO(file_bytes), page_numbers=[page_index])
            except Exception as exc:
                self.logger.warning("Native PDF page extraction failed on page %s: %s", page_index + 1, exc)
                text = ""

            pages.append(
                PageExtraction(
                    page_number=page_index + 1,
                    text=self._strip_ocr_runtime_notes(text),
                    source="pdf_text",
                )
            )

        return pages

    def _count_pdf_pages(self, file_bytes: bytes) -> int | None:
        if PDFPage is None:
            return None

        try:
            return sum(1 for _page in PDFPage.get_pages(io.BytesIO(file_bytes)))
        except Exception as exc:
            self.logger.warning("PDF page count failed: %s", exc)
            return None

    def _extract_pdf_native_text(self, file_bytes: bytes) -> str:
        if extract_pdf_text is None:
            return ""

        try:
            text = extract_pdf_text(io.BytesIO(file_bytes))
        except Exception as exc:
            self.logger.warning("Native PDF text extraction failed: %s", exc)
            return ""

        return self._strip_ocr_runtime_notes(text)

    @staticmethod
    def _pages_have_text_coverage(pages: list[PageExtraction]) -> bool:
        return bool(pages) and all(page.has_text for page in pages)

    def _split_pdf_sidecar_pages(self, value: str, page_count: int | None = None) -> list[PageExtraction]:
        raw_text = str(value or "").replace("\r\n", "\n").replace("\r", "\n")
        raw_pages = raw_text.split("\f") if "\f" in raw_text else [raw_text]

        if page_count:
            if len(raw_pages) < page_count:
                raw_pages.extend([""] * (page_count - len(raw_pages)))
            elif len(raw_pages) > page_count:
                raw_pages = raw_pages[: page_count - 1] + ["\n".join(raw_pages[page_count - 1 :])]

        return [
            PageExtraction(
                page_number=index + 1,
                text=self._strip_ocr_runtime_notes(page_text),
                source="ocrmypdf_pdf",
            )
            for index, page_text in enumerate(raw_pages)
        ]

    @staticmethod
    def _merge_pdf_pages(native_pages: list[PageExtraction], ocr_pages: list[PageExtraction]) -> list[PageExtraction]:
        page_count = max(len(native_pages), len(ocr_pages))
        if page_count == 0:
            return []

        merged_pages: list[PageExtraction] = []
        for page_index in range(page_count):
            native_page = native_pages[page_index] if page_index < len(native_pages) else None
            ocr_page = ocr_pages[page_index] if page_index < len(ocr_pages) else None
            native_text = native_page.normalized_text if native_page else ""
            ocr_text = ocr_page.normalized_text if ocr_page else ""

            if ocr_text and (not native_text or len(ocr_text) > len(native_text) * 1.2):
                merged_pages.append(PageExtraction(page_index + 1, ocr_text, "ocrmypdf_pdf"))
            elif native_text:
                merged_pages.append(PageExtraction(page_index + 1, native_text, "pdf_text"))
            else:
                merged_pages.append(PageExtraction(page_index + 1, "", "empty"))

        return merged_pages

    @staticmethod
    def _format_pages_for_extracted_text(pages: list[PageExtraction]) -> str:
        if not pages:
            return ""

        if len(pages) == 1:
            return pages[0].normalized_text

        chunks = []
        for page in pages:
            page_text = page.normalized_text or "[Trang này chưa trích xuất được nội dung rõ ràng.]"
            chunks.append(f"--- Trang {page.page_number} ---\n{page_text}")

        return "\n\n".join(chunks)

    @staticmethod
    def _strip_ocr_runtime_notes(value: str) -> str:
        cleaned = str(value or "")
        cleaned = re.sub(r"^\[OCR skipped on page\(s\) [^\]]+\]\s*$", "", cleaned, flags=re.MULTILINE)
        cleaned = re.sub(r"^\[OCR skipped[^\]]*\]\s*$", "", cleaned, flags=re.MULTILINE)
        return cleaned.strip()

    @staticmethod
    def _tesseract_languages(language: LanguageEnum) -> list[str]:
        if language == LanguageEnum.VI:
            return ["vie", "eng"]

        return ["eng"]
