from app.schemas.legal_review import LegalReviewRequest


LEGAL_REVIEW_PROMPT_TEMPLATE = """
You are an AI legal analysis assistant.

Analyze the following legal document and return a structured JSON result.

Case ID: {case_id}
Language: {language}
Document Type Hint: {document_type_hint}
Priority: {priority}

Document Text:
{document_text}
""".strip()


def build_legal_review_prompt(payload: LegalReviewRequest) -> str:
    return LEGAL_REVIEW_PROMPT_TEMPLATE.format(
        case_id=payload.caseId,
        language=payload.language,
        document_type_hint=payload.metadata.documentTypeHint or "unknown",
        priority=payload.metadata.priority,
        document_text=payload.extractedText,
    )

