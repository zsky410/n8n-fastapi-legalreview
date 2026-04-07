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

Conversation Context:
{conversation_context}

User Question:
{question}
""".strip()


def build_legal_chat_prompt(payload: LegalChatRequest) -> str:
    if payload.conversationContext:
        conversation_context = "\n".join(
            f"- {message.role}: {message.content}" for message in payload.conversationContext
        )
    else:
        conversation_context = "- No prior conversation."

    return LEGAL_CHAT_PROMPT_TEMPLATE.format(
        case_id=payload.caseId,
        language=payload.language,
        conversation_context=conversation_context,
        question=payload.question,
    )
