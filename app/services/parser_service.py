import re
from typing import TypeVar

from pydantic import BaseModel

ModelT = TypeVar("ModelT", bound=BaseModel)


class ParserService:
    @staticmethod
    def extract_json_object(raw_text: str) -> str:
        text = raw_text.strip()

        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)

        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise ValueError("No JSON object found in model response.")

        return match.group(0)

    def parse_model(self, raw_text: str, model_cls: type[ModelT]) -> ModelT:
        json_text = self.extract_json_object(raw_text)

        return model_cls.model_validate_json(json_text)
