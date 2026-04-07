LEGAL_REDRAFT_PROMPT_TEMPLATE = """
You are a legal drafting assistant.

Rewrite the clause to satisfy the requested objective while preserving legal clarity.
Return exactly one valid JSON object:
{
  "revisedClause": "string",
  "rationale": "string"
}
""".strip()
