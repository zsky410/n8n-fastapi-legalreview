from app.schemas.legal_review import LegalReviewRequest


LEGAL_REVIEW_PROMPT_TEMPLATE = """
You are a legal document risk analysis assistant.

Your task is to analyze the document and return exactly one valid JSON object.
Do not wrap the JSON in markdown or code fences.
Do not add explanations before or after the JSON.

Return this JSON shape:
{{
  "docType": "string",
  "confidence": 0.0,
  "riskScore": 0,
  "riskLevel": "low|medium|high",
  "riskFlags": [
    {{
      "code": "string",
      "label": "string",
      "severity": "low|medium|high",
      "excerpt": "string or null",
      "rationale": "string or null"
    }}
  ],
  "extractedFields": {{
    "effectiveDate": "string or omitted",
    "governingLaw": "string or omitted",
    "parties": ["string"]
  }},
  "recommendedAction": "auto_publish|publish_with_warning|manual_review_recommended",
  "summary": "string",
  "needsAttention": true,
  "qualityWarning": false
}}

Rules:
- Use concise legal-risk reasoning.
- Keep `riskScore` between 0 and 100.
- Keep `confidence` between 0 and 1.
- Use lowercase enum values exactly as requested.
- If information is missing, keep fields empty or omit optional extracted fields.
- Prefer Vietnamese in `summary` when input language is `vi`.

Case ID: {case_id}
Language: {language}
Document Type Hint: {document_type_hint}
Priority: {priority}
Source System: {source_system}
Tags: {tags}

Document Text:
{document_text}
""".strip()


def build_legal_review_prompt(payload: LegalReviewRequest) -> str:
    return LEGAL_REVIEW_PROMPT_TEMPLATE.format(
        case_id=payload.caseId,
        language=payload.language,
        document_type_hint=payload.metadata.documentTypeHint or "unknown",
        priority=payload.metadata.priority,
        source_system=payload.metadata.sourceSystem or "unknown",
        tags=", ".join(payload.metadata.tags) if payload.metadata.tags else "none",
        document_text=payload.extractedText,
    )
