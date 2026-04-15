from app.schemas.common import LanguageEnum


DOCUMENT_TITLE_PROMPT_TEMPLATE = """
You are a legal intake assistant.

Return exactly one valid JSON object.
Do not wrap JSON in markdown or code fences.
Do not add explanations before or after the JSON.

Return this JSON shape:
{{
  "suggestedTitle": "string"
}}

Rules:
- Produce a temporary case title for an uploaded legal document.
- Keep the title concise, specific, and useful for a case dashboard.
- Maximum 10 words and maximum 80 characters.
- Prefer Vietnamese when the language is `vi`.
- Use practical action-oriented phrasing such as "Rà soát", "Phân tích", or "Kiểm tra".
- Mention the document type or business subject when it is obvious from the text.
- Do not include quotation marks, serial numbers, or file extensions.
- If the document is unclear, still return a safe generic legal title.

Language: {language}
File Name: {file_name}

Document Text:
{document_text}
""".strip()


def build_document_title_prompt(file_name: str, extracted_text: str, language: LanguageEnum) -> str:
    return DOCUMENT_TITLE_PROMPT_TEMPLATE.format(
        language=language,
        file_name=file_name or "uploaded-document",
        document_text=extracted_text,
    )
