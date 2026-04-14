from app.schemas.legal_chat import LegalChatRequest


LEGAL_CHAT_PROMPT_TEMPLATE = """
You are a legal AI copilot helping users ask follow-up questions about one case.

Return exactly one valid JSON object.
Do not wrap JSON in markdown.
Do not add any extra commentary.

Return this shape:
{{
  "answer": "string",
  "citations": [
    {{
      "excerpt": "string",
      "source": "string or null",
      "rationale": "string or null"
    }}
  ],
  "caution": "string or null",
  "confidence": 0.0,
  "needsAttention": false
}}

Rules:
- Confidence must be between 0 and 1.
- Use concise, practical legal-analysis language.
- If the answer may require a lawyer review, set `needsAttention` to true.
- Prefer Vietnamese when the request language is `vi`.
- Only cite information grounded in the provided case context and conversation context.

Case ID: {case_id}
Language: {language}
Case Title: {case_title}
Document Name: {document_name}
Domain: {domain}
Case Description:
{case_description}

Extracted Document Text:
{extracted_text}

Latest Review Summary:
{review_summary}

Risk Flags:
{risk_flags}

Extracted Review Fields:
{review_fields}

Conversation Context:
{conversation_context}

User Question:
{question}
""".strip()


def build_legal_chat_prompt(payload: LegalChatRequest, case_context: dict | None = None) -> str:
    if payload.conversationContext:
        conversation_context = "\n".join(
            f"- {message.role}: {message.content}" for message in payload.conversationContext
        )
    else:
        conversation_context = "- No prior conversation."

    case_context = case_context or {}
    review = case_context.get("review") or {}
    review_flags = review.get("riskFlags") or []
    review_fields = review.get("extractedFields") or {}

    if review_flags:
        risk_flags = "\n".join(
            f"- {flag.get('label') or flag.get('excerpt') or 'Risk flag'}"
            for flag in review_flags
        )
    else:
        risk_flags = "- No recorded risk flags."

    if review_fields:
        extracted_review_fields = "\n".join(
            f"- {key}: {value}" for key, value in review_fields.items()
        )
    else:
        extracted_review_fields = "- No extracted review fields."

    return LEGAL_CHAT_PROMPT_TEMPLATE.format(
        case_id=payload.caseId,
        language=payload.language,
        case_title=case_context.get("title") or "Unknown case",
        document_name=case_context.get("documentName") or "Unknown document",
        domain=case_context.get("domain") or "Unspecified",
        case_description=case_context.get("description") or "No case description provided.",
        extracted_text=case_context.get("extractedText") or "No extracted document text provided.",
        review_summary=review.get("summary") or "No prior review summary available.",
        risk_flags=risk_flags,
        review_fields=extracted_review_fields,
        conversation_context=conversation_context,
        question=payload.question,
    )
