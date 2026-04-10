import logging

from app.core.config import Settings


class GeminiClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.logger = logging.getLogger(__name__)

    def is_enabled(self) -> bool:
        return self.settings.enable_llm_calls and bool(self.settings.gemini_api_key)

    def generate_text(self, prompt: str) -> str:
        if not self.is_enabled():
            raise RuntimeError("Gemini live calls are disabled. Set ENABLE_LLM_CALLS=true and GEMINI_API_KEY.")

        try:
            from google import genai
        except ImportError as exc:
            raise RuntimeError("google-genai is not installed in the runtime environment.") from exc

        client = genai.Client(api_key=self.settings.gemini_api_key)
        response = client.models.generate_content(
            model=self.settings.gemini_model,
            contents=prompt,
        )

        text = getattr(response, "text", None)

        if not text:
            raise RuntimeError("Gemini returned an empty response.")

        self.logger.info("Gemini response received successfully.")

        return text

    def extract_text_from_file(self, prompt: str, file_bytes: bytes, mime_type: str) -> str:
        if not self.is_enabled():
            raise RuntimeError("Gemini live calls are disabled. Set ENABLE_LLM_CALLS=true and GEMINI_API_KEY.")

        try:
            from google import genai
            from google.genai import types
        except ImportError as exc:
            raise RuntimeError("google-genai is not installed in the runtime environment.") from exc

        client = genai.Client(api_key=self.settings.gemini_api_key)
        response = client.models.generate_content(
            model=self.settings.gemini_model,
            contents=[
                types.Part.from_text(text=prompt),
                types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
            ],
        )

        text = getattr(response, "text", None)
        if not text:
            raise RuntimeError("Gemini OCR returned an empty response.")

        self.logger.info("Gemini OCR response received successfully.")
        return text
