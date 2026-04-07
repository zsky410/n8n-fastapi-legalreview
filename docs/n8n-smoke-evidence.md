# n8n Smoke Evidence

This note records the local verification completed for Milestone 4 on April 8, 2026.

## Local instance used

- n8n UI: `http://localhost:5678`
- FastAPI public entrypoint: `http://localhost:8080`
- n8n container to FastAPI base URL used in the verified workflow: `http://172.17.0.1:8080`

## Imported workflows

- Review workflow file: [`n8n/legaldesk-review-fastapi.json`](/home/zsky/mydata/Projects/ai-microservice/n8n/legaldesk-review-fastapi.json)
- Chat workflow file: [`n8n/legaldesk-chat-fastapi.json`](/home/zsky/mydata/Projects/ai-microservice/n8n/legaldesk-chat-fastapi.json)
- Active review workflow in local n8n after cleanup: `K7lbQ1k5o2aOWCmX`
- Active chat workflow in local n8n after cleanup: `vl3NsuhsZA6kTF6n`

## Smoke case 1: Review happy path

Request target:

- `POST http://localhost:5678/webhook/legaldesk-review-fastapi`

Observed result:

- `success: true`
- `routeDecision.queue: manual_legal_review_queue`
- `review.caseId: case-smoke-001`
- `review.docType: lease agreement`
- `review.riskScore: 85`
- `review.needsAttention: true`

## Smoke case 2: Review low-text with OCR fallback input

Input shape:

- short `extractedText`
- populated `ocrText`

Observed result:

- `success: true`
- workflow continued to FastAPI review instead of returning `LOW_TEXT_CONTENT`
- `review.caseId: case-smoke-ocr-001`
- `review.riskScore: 80`
- `review.needsAttention: true`

Interpretation:

- The orchestration accepted low extracted text when OCR text was supplied and completed the AI review path end-to-end.

## Smoke case 3: Chat companion workflow

Request target:

- `POST http://localhost:5678/webhook/legaldesk-chat-fastapi`

Observed result:

- `success: true`
- `routeDecision.queue: manual_legal_follow_up_queue`
- `chat.caseId: case-smoke-001`
- `chat.needsAttention: true`

## Important environment findings

- `host.docker.internal` did not resolve inside this Linux `n8n` container.
- `$env.LEGALDESK_FASTAPI_BASE_URL` access was denied inside n8n expressions on this instance.
- Because of that, the sample workflows were verified using a literal URL in the HTTP Request node:
  - `http://172.17.0.1:8080`
- If your n8n deployment allows environment variable access, you can parameterize the URL later.

## Old workflow adjustments still required

For the older workflow file [`Legacl Document Review.json`](/home/zsky/mydata/Projects/ai-microservice/Legacl%20Document%20Review.json):

- keep intake and extraction nodes
- remove direct Gemini, prompt-building, and output-normalization nodes
- replace them with a FastAPI HTTP Request step
- map `docTypeHint` into FastAPI-compatible values
- change low-text hard error into OCR fallback before review
- either add a real `txt` branch or correct the unsupported-file message
