import html
import io
import logging
import re
import tempfile
import zipfile
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import Settings, get_settings
from app.schemas.common import LanguageEnum
from app.schemas.document_ocr import DocumentOcrResponse

try:
    import ocrmypdf
except ImportError:
    ocrmypdf = None

try:
    from pdfminer.high_level import extract_text as extract_pdf_text
except ImportError:
    extract_pdf_text = None

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
MAX_UPLOAD_BYTES = 15 * 1024 * 1024
MAX_RETURN_CHARS = 30000
MIN_EXTRACTED_CHARS = 20


class DocumentOcrService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.logger = logging.getLogger(__name__)

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
                "Tệp vượt quá 15 MB. Hãy dùng tệp nhỏ hơn để demo OCR ổn định.",
            )

        if extension not in SUPPORTED_EXTENSIONS:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Định dạng tệp chưa được hỗ trợ OCR. Hãy dùng PDF, DOCX, TXT, MD, PNG, JPG hoặc WEBP.",
            )

        if extension in TEXT_EXTENSIONS:
            extracted_text = self._decode_text(file_bytes)
            provider = "local"
            source = "direct_text"
        elif extension == "docx":
            extracted_text = self._extract_docx_text(file_bytes)
            provider = "local"
            source = "docx_xml"
        elif extension == "pdf":
            extracted_text, provider, source = self._extract_pdf_text(file_bytes, language)
        else:
            extracted_text = self._extract_image_text(file_bytes, language)
            provider = "tesseract"
            source = "tesseract_image"

        normalized_text = self._normalize_text(extracted_text)
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
            warning = "Nội dung OCR đã được rút gọn còn 30.000 ký tự để giữ giao diện phản hồi ổn định."
        elif provider in {"ocrmypdf", "tesseract"}:
            warning = "Kết quả OCR nên được đối chiếu nhanh với bản gốc trước khi dùng cho quyết định pháp lý."

        return DocumentOcrResponse(
            fileName=file_name,
            mimeType=content_type,
            extractedText=normalized_text,
            provider=provider,
            source=source,
            textLength=len(normalized_text),
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

    def _extract_pdf_text(self, file_bytes: bytes, language: LanguageEnum) -> tuple[str, str, str]:
        native_text = self._extract_pdf_native_text(file_bytes)
        if len(native_text) >= MIN_EXTRACTED_CHARS:
            return native_text, "local", "pdf_text"

        if ocrmypdf is None:
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

                ocr_text = self._strip_ocr_runtime_notes(sidecar_path.read_text(encoding="utf-8", errors="ignore"))
                if len(ocr_text) >= MIN_EXTRACTED_CHARS:
                    return ocr_text, "ocrmypdf", "ocrmypdf_pdf"

                if len(native_text) >= MIN_EXTRACTED_CHARS:
                    return native_text, "local", "pdf_text"

                return ocr_text, "ocrmypdf", "ocrmypdf_pdf"
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
