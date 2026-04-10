import html
import io
import logging
import re
import zipfile
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import Settings, get_settings
from app.schemas.common import LanguageEnum
from app.schemas.document_ocr import DocumentOcrResponse
from app.services.gemini_client import GeminiClient

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
        self.gemini_client = GeminiClient(self.settings)
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
        else:
            if not self.gemini_client.is_enabled():
                raise HTTPException(
                    status.HTTP_503_SERVICE_UNAVAILABLE,
                    "OCR cho PDF hoặc ảnh cần Gemini đang hoạt động. Hãy kiểm tra API key hoặc quota rồi thử lại.",
                )

            mime_type = content_type or self._guess_mime_type(extension)
            try:
                extracted_text = self.gemini_client.extract_text_from_file(
                    prompt=self._build_ocr_prompt(language),
                    file_bytes=file_bytes,
                    mime_type=mime_type,
                )
            except Exception as exc:
                self.logger.warning("Gemini OCR failed for file=%s: %s", file_name, exc)
                raise HTTPException(
                    status.HTTP_502_BAD_GATEWAY,
                    "OCR bằng Gemini chưa hoàn tất. Hãy thử lại sau hoặc dán nội dung OCR thủ công để tiếp tục demo.",
                ) from exc

            provider = "gemini"
            source = "gemini_file_ocr"

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
        elif provider == "gemini":
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

    @staticmethod
    def _build_ocr_prompt(language: LanguageEnum) -> str:
        target_language = "tiếng Việt" if language == LanguageEnum.VI else "English"
        return (
            "Bạn là mô-đun OCR cho tài liệu pháp lý. "
            f"Hãy trích xuất toàn bộ văn bản nhìn thấy từ tệp được gửi lên và ưu tiên giữ đúng dấu câu, xuống dòng, số liệu, tiêu đề và tiếng {target_language}. "
            "Chỉ trả về phần văn bản OCR thuần, không giải thích, không tóm tắt, không nhận xét."
        )

    @staticmethod
    def _guess_mime_type(extension: str) -> str:
        return {
            "pdf": "application/pdf",
            "png": "image/png",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "webp": "image/webp",
        }.get(extension, "application/octet-stream")
