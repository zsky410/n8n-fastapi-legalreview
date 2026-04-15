import logging
import re
import unicodedata
from pathlib import Path

from app.core.config import Settings, get_settings
from app.prompts.document_title import build_document_title_prompt
from app.schemas.common import LanguageEnum
from app.schemas.document_ocr import DocumentTitleSuggestionLLMOutput
from app.services.gemini_client import GeminiClient
from app.services.parser_service import ParserService
from app.services.retry_service import RetryService

MAX_PROMPT_TEXT_CHARS = 5000
MAX_TITLE_CHARS = 120


class DocumentTitleSuggestionService:
    def __init__(
        self,
        settings: Settings | None = None,
        parser_service: ParserService | None = None,
        retry_service: RetryService | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.gemini_client = GeminiClient(self.settings)
        self.parser_service = parser_service or ParserService()
        self.retry_service = retry_service or RetryService(
            retries=self.settings.llm_max_retries,
            delay_seconds=self.settings.llm_retry_delay_seconds,
        )
        self.logger = logging.getLogger(__name__)

    def suggest_title(
        self,
        file_name: str,
        extracted_text: str,
        language: LanguageEnum = LanguageEnum.VI,
    ) -> tuple[str | None, str | None]:
        normalized_text = " ".join(str(extracted_text or "").split())
        normalized_file_name = (file_name or "uploaded-document").strip() or "uploaded-document"

        if self.gemini_client.is_enabled() and normalized_text:
            try:
                live_title = self._run_live_title_suggestion(normalized_file_name, normalized_text, language)
                if live_title:
                    return live_title, "ai"
            except Exception as exc:
                self.logger.warning(
                    "Gemini title suggestion failed for file=%s, falling back to heuristic mode: %s",
                    normalized_file_name,
                    exc,
                )

        fallback_title = self._build_bootstrap_title(normalized_file_name, normalized_text, language)
        if fallback_title:
            return fallback_title, "heuristic"

        return None, None

    def _run_live_title_suggestion(
        self,
        file_name: str,
        extracted_text: str,
        language: LanguageEnum,
    ) -> str:
        prompt = build_document_title_prompt(
            file_name=file_name,
            extracted_text=extracted_text[:MAX_PROMPT_TEXT_CHARS],
            language=language,
        )

        def generate_parse_normalize() -> str:
            raw_response = self.gemini_client.generate_text(prompt)
            parsed = self.parser_service.parse_model(raw_response, DocumentTitleSuggestionLLMOutput)
            return self._normalize_title(parsed.suggestedTitle)

        return self.retry_service.run(
            generate_parse_normalize,
            context="document_title_suggestion_gemini",
        )

    def _build_bootstrap_title(
        self,
        file_name: str,
        extracted_text: str,
        language: LanguageEnum,
    ) -> str:
        title_from_body = self._extract_title_like_line(extracted_text)
        if title_from_body:
            return self._normalize_title(title_from_body)

        combined_text = self._fold_text(f"{Path(file_name).stem} {extracted_text}")
        is_vietnamese = language == LanguageEnum.VI

        categorized_title = self._detect_category_title(combined_text, is_vietnamese)
        if categorized_title:
            return categorized_title

        file_based_title = self._build_title_from_file_name(file_name, is_vietnamese)
        if file_based_title:
            return file_based_title

        return "Rà soát tài liệu pháp lý" if is_vietnamese else "Review legal document"

    def _detect_category_title(self, combined_text: str, is_vietnamese: bool) -> str | None:
        category_rules = [
            (
                ("bao mat", "nda", "non disclosure", "confidential"),
                "Rà soát thỏa thuận bảo mật",
                "Review confidentiality agreement",
            ),
            (
                ("phan mem", "software", "saas", "license"),
                "Rà soát hợp đồng cung cấp phần mềm",
                "Review software services agreement",
            ),
            (
                ("lao dong", "employment", "employee", "employer", "probation", "salary"),
                "Rà soát hợp đồng lao động",
                "Review employment agreement",
            ),
            (
                ("thue", "lease", "tenant", "landlord", "premises", "rent"),
                "Rà soát hợp đồng thuê",
                "Review lease agreement",
            ),
            (
                ("cung cap", "supply", "vendor", "supplier", "purchase"),
                "Rà soát hợp đồng cung cấp",
                "Review supply agreement",
            ),
            (
                ("dich vu", "service agreement", "statement of work", "services"),
                "Rà soát hợp đồng dịch vụ",
                "Review service agreement",
            ),
            (
                ("hop tac", "cooperation", "joint venture", "mou", "memorandum"),
                "Rà soát thỏa thuận hợp tác",
                "Review cooperation agreement",
            ),
            (
                ("uy quyen", "power of attorney", "authorization"),
                "Rà soát văn bản ủy quyền",
                "Review authorization document",
            ),
            (
                ("don khoi kien", "petition", "plaintiff", "defendant", "court filing"),
                "Phân tích đơn khởi kiện",
                "Analyze litigation filing",
            ),
        ]

        for keywords, vi_title, en_title in category_rules:
            if any(keyword in combined_text for keyword in keywords):
                return vi_title if is_vietnamese else en_title

        if "hop dong" in combined_text:
            return "Rà soát hợp đồng" if is_vietnamese else "Review contract"

        if "thoa thuan" in combined_text:
            return "Rà soát thỏa thuận" if is_vietnamese else "Review agreement"

        if "bien ban" in combined_text:
            return "Rà soát biên bản" if is_vietnamese else "Review memorandum"

        if "ho so tranh chap" in combined_text or "giai quyet tranh chap" in combined_text:
            return "Phân tích hồ sơ tranh chấp" if is_vietnamese else "Analyze dispute dossier"

        return None

    def _build_title_from_file_name(self, file_name: str, is_vietnamese: bool) -> str | None:
        stem = Path(file_name).stem
        stem = re.sub(r"[_\-]+", " ", stem)
        stem = re.sub(r"\b(v\d+|final|draft|signed|scan|copy|ban|temp)\b", " ", stem, flags=re.IGNORECASE)
        stem = " ".join(stem.split())

        if len(stem) < 4:
            return None

        if stem.islower():
            stem = stem.title()

        prefix = "Rà soát tài liệu" if is_vietnamese else "Review document"
        return self._normalize_title(f"{prefix} {stem}")

    def _extract_title_like_line(self, extracted_text: str) -> str | None:
        for raw_line in extracted_text.splitlines():
            candidate = " ".join(raw_line.split())
            if not candidate or len(candidate) < 8 or len(candidate) > 80:
                continue

            if candidate.endswith(".") and len(candidate.split()) > 8:
                continue

            folded_candidate = self._fold_text(candidate)
            if len(candidate.split()) > 10:
                continue

            if any(
                keyword in folded_candidate
                for keyword in (
                    "hop dong",
                    "thoa thuan",
                    "bien ban",
                    "don khoi kien",
                    "ban ghi nho",
                    "uy quyen",
                )
            ):
                return candidate

        return None

    @staticmethod
    def _fold_text(value: str) -> str:
        normalized = unicodedata.normalize("NFD", str(value or "").lower())
        stripped = "".join(character for character in normalized if unicodedata.category(character) != "Mn")
        cleaned = re.sub(r"[^a-z0-9]+", " ", stripped)
        return " ".join(cleaned.split())

    @staticmethod
    def _normalize_title(value: str) -> str:
        normalized = " ".join(str(value or "").replace("\n", " ").split())
        normalized = normalized.strip(" -_.,:;\"'`“”")
        normalized = re.sub(r"\s{2,}", " ", normalized)

        if len(normalized) > MAX_TITLE_CHARS:
            normalized = normalized[:MAX_TITLE_CHARS].rsplit(" ", 1)[0].strip() or normalized[:MAX_TITLE_CHARS].strip()

        if normalized:
            normalized = normalized[0].upper() + normalized[1:]

        return normalized
