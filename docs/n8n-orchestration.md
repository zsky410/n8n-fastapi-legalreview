# Milestone 4 N8N Orchestration

This document closes the orchestration handoff for Milestone 4 and maps the existing n8n workflow to the current FastAPI AI microservice.

## Current workflow review

The file `Legacl Document Review.json` was built in the earlier architecture where n8n performed:
- prompt construction
- direct Gemini call
- JSON parsing and normalization

That is no longer the target architecture.

In the current architecture:
- n8n handles intake, extraction, routing, notify, and timeline orchestration
- FastAPI handles legal AI logic, Gemini prompts, parsing, retries, fallback, and normalized JSON output

## Keep / remove / replace in the current workflow

### Keep these nodes

- `Webhook`
- `Switch File Type`
- `Extract PDF Text`
- `DOCX → PDF`
- `Extract Converted PDF`
- `Normalize & Validate Text`
- `Has Error?`
- `Heuristic DocType`
- `Set Error: Unsupported File`
- `Set Error: Low Text`
- `Return Response`

### Remove or bypass these nodes

- `Build Prompt`
- `AI Legal Review`
- `Google Gemini Chat Model`
- `Google Gemini Chat Model2`
- `Format & Normalize Output`

These nodes duplicate work that now belongs to FastAPI.

### Replace them with these orchestration nodes

1. `Build Review Payload`
2. `Call Legal Review API`
3. `Route Review Result`
4. `Prepare Timeline Update`
5. `Prepare Notify Payload`
6. `Return Response`

## Canonical review workflow

Recommended flow:

1. `Webhook`
2. `Switch File Type`
3. `Extract PDF Text` or `DOCX -> PDF -> Extract Converted PDF`
4. `Normalize & Validate Text`
5. `Has Error?`
6. `Heuristic DocType`
7. `Build Review Payload`
8. `Call Legal Review API`
9. `Route Review Result`
10. `Prepare Timeline Update`
11. `Prepare Notify Payload`
12. `Return Response`

## Review payload mapping

Send this payload to `POST /v1/legal/review`:

```json
{
  "caseId": "case_001",
  "language": "vi",
  "extractedText": "Full OCR or extracted legal text...",
  "metadata": {
    "documentName": "lease-agreement.pdf",
    "documentTypeHint": "lease agreement",
    "priority": "high",
    "submittedBy": "client_123",
    "sourceSystem": "n8n",
    "tags": ["milestone4", "upload"]
  }
}
```

Suggested mapping from your current nodes:

- `caseId`
  - from webhook body if backend already generated it
  - otherwise generate in n8n before calling FastAPI
- `language`
  - from webhook body
  - fallback: `vi`
- `extractedText`
  - from `Normalize & Validate Text`
- `metadata.documentName`
  - from `fileName`
- `metadata.documentTypeHint`
  - map from `Heuristic DocType`
- `metadata.priority`
  - from webhook body or default `medium`
- `metadata.submittedBy`
  - from webhook body or current user id
- `metadata.sourceSystem`
  - fixed string `n8n`
- `metadata.tags`
  - optional array such as `["milestone4", "review"]`

## DocType mapping from old heuristic node

Your old heuristic node returns categories like `NDA`, `Employment`, `Lease`, `Service`, `Sales`, `Other`.

Map them before calling FastAPI:

- `NDA` -> `nda`
- `Employment` -> `employment contract`
- `Lease` -> `lease agreement`
- `Service` -> `service agreement`
- `Sales` -> `sales agreement`
- `Other` -> `legal document`

## Suggested HTTP Request node config

### Review endpoint

- Method: `POST`
- URL:
  - same Docker network as this FastAPI stack: `http://api:8000/v1/legal/review`
  - n8n in a different Docker stack on the same Linux machine: `http://172.17.0.1:8080/v1/legal/review`
  - Docker Desktop style host mapping: `http://host.docker.internal:8080/v1/legal/review`
  - public reverse proxy: `http://localhost:8080/v1/legal/review` only if n8n is not inside a container
- Content-Type: `application/json`
- Timeout: `30000`

## n8n environment notes

- The sample review workflow in this repo is [`n8n/legaldesk-review-fastapi.json`](/home/zsky/mydata/Projects/ai-microservice/n8n/legaldesk-review-fastapi.json).
- The sample chat workflow in this repo is [`n8n/legaldesk-chat-fastapi.json`](/home/zsky/mydata/Projects/ai-microservice/n8n/legaldesk-chat-fastapi.json).
- In the local n8n instance used for verification, expression access to `$env` was denied, so the imported workflow currently uses a literal URL:
  - `http://172.17.0.1:8080`
- On this machine, `host.docker.internal` did not resolve inside the `n8n` container.
- Current local FastAPI stack does not require an API key header between n8n and FastAPI.
- If you later add an API gateway or shared-secret middleware, update the HTTP Request node to send that header explicitly.

## Routing rules in n8n

Use the FastAPI response directly for routing.

Recommended first-pass rules:

- `needsAttention == true` -> route to manual legal review queue
- `riskScore >= 70` -> high-risk queue
- `qualityWarning == true` -> OCR/re-analysis queue
- `confidence < 0.55` -> quality check queue
- otherwise -> auto-publish or normal processing queue

## Timeline update payload

Prepare a timeline event after the review API call:

```json
{
  "caseId": "case_001",
  "eventType": "AI_REVIEW_COMPLETED",
  "status": "AIAnalyzing",
  "riskScore": 72,
  "riskLevel": "high",
  "needsAttention": true,
  "requestId": "uuid-from-fastapi-meta",
  "source": "n8n"
}
```

If your backend already has a timeline API, call it from a dedicated HTTP Request node after routing.

## Notify payload

Prepare notify payload only after routing:

```json
{
  "caseId": "case_001",
  "channel": "internal",
  "template": "legal_review_high_risk",
  "priority": "high",
  "context": {
    "riskScore": 72,
    "riskLevel": "high",
    "summary": "..."
  }
}
```

## OCR branch adjustment

Your current workflow sends low-text files directly to `Set Error: Low Text`.

For Milestone 4, the better branch is:

1. `Normalize & Validate Text`
2. if low text
3. call OCR provider or OCR workflow
4. normalize OCR output
5. continue to FastAPI review
6. only return `LOW_TEXT_CONTENT` if OCR also fails

## Chat workflow companion

Your current JSON only covers review.

Create a second workflow for chat:

1. `Webhook` or backend trigger
2. `Build Chat Payload`
3. `Call POST /v1/legal/chat`
4. `Persist Answer`
5. `Update Timeline`
6. `Return Response`

Chat request shape:

```json
{
  "caseId": "case_001",
  "question": "Hop dong nay co dieu khoan nao can xem lai gap?",
  "language": "vi",
  "conversationContext": [
    {
      "role": "user",
      "content": "Hay tom tat hop dong nay."
    }
  ]
}
```

## Concrete adjustments needed in `Legacl Document Review.json`

1. Replace direct Gemini nodes with a single HTTP Request call to FastAPI review.
2. Remove the prompt-building node because prompt logic now lives in FastAPI.
3. Remove the JSON parsing node because response normalization now lives in FastAPI.
4. Convert old heuristic doc type labels to FastAPI-compatible hints before sending payload.
5. Add routing after API response based on `needsAttention`, `riskScore`, `confidence`, and `qualityWarning`.
6. Add a timeline-update step after review completion.
7. Add a notify step after routing.
8. Replace the low-text hard error branch with OCR fallback if you have an OCR provider.
9. Fix the unsupported-file message if you keep the current workflow file:
   - it says `PDF, DOCX, TXT`
   - but the current `Switch File Type` only handles `pdf` and `docx`

## Definition of done for Milestone 4

Milestone 4 is considered complete when:

- n8n no longer owns legal prompt/model/parser logic
- n8n calls `POST /v1/legal/review`
- n8n can call `POST /v1/legal/chat` in a companion workflow
- routing is driven by FastAPI response fields
- timeline and notify payloads are prepared after review
- OCR fallback path is defined for low-text documents

## Current conclusion

- FastAPI side for Milestone 4 is ready
- The existing workflow JSON needs migration, not reuse as-is
- The required node-by-node migration is now documented in this file
- Sample importable review/chat workflows are now stored in `n8n/`
