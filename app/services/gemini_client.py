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

