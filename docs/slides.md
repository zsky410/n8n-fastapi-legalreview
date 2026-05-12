# Slide Outline 10-12 Trang

## 1. Problem

Doanh nghiệp nhận nhiều tài liệu pháp lý nhỏ, nhưng review thủ công tốn thời gian và khó truy vết.

## 2. MVP Goal

AI-first, human-on-exception: tài liệu an toàn được AI duyệt, tài liệu rủi ro chuyển sang người rà soát.

## 3. Architecture

Next.js + FastAPI + Postgres + n8n + Mailhog. Backend quyết định legal/risk, n8n orchestration và notification.

## 4. Document Pipeline

Upload, lưu file, extract text, classify, risk rules, AI/mock summary, flagging, webhook.

## 5. Risk & Classification

Rule-based classifier cho contract, NDA, invoice, policy, unknown. Risk rules cho missing signature, high value, expiry soon, governing law, indemnity, auto renewal.

## 6. Human Review

Admin/reviewer xem queue, lý do bị gắn cờ, risk findings, summary AI và gửi quyết định có comment.

## 7. Auditability

Audit logs cho upload, processing, AI decision, admin decision và n8n callback. Giúp demo explainable và traceable.

## 8. n8n Workflows

Workflow A route document result và gửi email. Workflow B compliance monitor cho expiry alert, audit sample và weekly summary.

## 9. UI Demo

Client document list/detail/upload. Admin queue/detail/dashboard/audit logs. Giao diện tiếng Việt có dấu.

## 10. Seed Data

8 tài liệu mẫu bao phủ AI approved, pending admin, admin approved, admin rejected, processing và failed.

## 11. Testing

Unit tests cho classifier/risk/flagging/n8n payload. Docker build, pytest, smoke test API, Playwright UI checks.

## 12. Limitations & Future Work

Không OCR scanned PDF, không Celery/Redis, không S3/MinIO, không production legal accuracy. Future: OCR, RAG Q&A, role management, richer analytics.
