# FULL PLAN MỚI — Legal Document Review MVP 5 Ngày

## 1. Bối Cảnh & Mục Tiêu
Dự án là hệ thống tự động review tài liệu pháp lý theo triết lý **AI-first, human-on-exception**: AI xử lý phần lớn tài liệu an toàn, còn admin/reviewer chỉ xem các tài liệu bị flag.

Mục tiêu 5 ngày không phải làm một legal SaaS hoàn chỉnh, mà là làm một sản phẩm demo chắc chắn chạy được:
- User đăng nhập, upload tài liệu.
- Backend extract text, phân loại, tìm rủi ro, sinh summary/verdict.
- Nếu an toàn: tự `AI Approved`.
- Nếu rủi ro: chuyển `Pending Admin Review`.
- n8n nhận event, gửi thông báo, chạy monitor/audit định kỳ.
- Admin xem queue, đọc lý do flag, approve/reject/override.
- Dashboard và audit log chứng minh hệ thống explainable và traceable.

Ưu tiên cao nhất:
- End-to-end chạy ổn trên máy sạch bằng Docker.
- Demo được 4 flow chính trong video 5 phút.
- Có README, seed data, test rule engine.
- Không để project chết vì credential, OCR scan, streaming, Celery, MinIO hoặc report PDF.

## 2. Scope Quyết Định
P0 bắt buộc:
- Auth JWT basic với seeded users.
- Upload PDF text-based và DOCX.
- Document list, document detail, status badge.
- Rule-based classification.
- Rule-based risk engine.
- AI reviewer optional: có OpenAI key thì gọi LLM, không có thì dùng mock reasoning deterministic.
- Flagging engine deterministic.
- Admin queue, admin detail, approve/reject/override.
- Audit logs cho upload, process, AI decision, admin decision, n8n callback.
- n8n Workflow A: route kết quả review và gửi notification.
- n8n Workflow B: compliance monitor gồm expiry alert và weekly AI audit sample.
- Mailhog để demo email nội bộ không cần SMTP thật.

P1 làm nếu P0 xong trước:
- Dashboard đẹp hơn với chart.
- Slack hoặc Telegram notification thêm ngoài email.
- RAG Q&A trả JSON một lần, không streaming.
- pgvector chunks để chứng minh retrieval.

P2 cắt khỏi deadline 5 ngày:
- Celery/Redis.
- MinIO/S3.
- Scanned PDF/image OCR bằng Tesseract.
- Q&A streaming.
- Monthly PDF report bằng Gotenberg.
- Google Sheets.
- Full user management.
- Refresh token rotation phức tạp.

## 3. Kiến Trúc Kỹ Thuật
Kiến trúc MVP:
```text
Next.js Client/Admin
        |
        | REST + JWT
        v
FastAPI Backend
        |
        | SQLAlchemy
        v
Postgres
        |
        | file path
        v
Local Upload Volume

FastAPI --webhook--> n8n --email--> Mailhog
FastAPI <--callback-- n8n
```

Vai trò backend:
- Xử lý auth, upload, extract text, classify, risk, AI review, flagging.
- Lưu trạng thái tài liệu, findings, audit logs.
- Expose API cho frontend và automation.
- Trigger webhook sang n8n sau khi document processed.

Vai trò n8n:
- Không xử lý AI.
- Không quyết định legal risk.
- Chỉ nhận event, validate, route, notify, schedule, callback log.
- Chứng minh orchestration patterns: webhook, HTTP API integration, IF/Switch, schedule, batch/rate-limit, callback, error branch.

Docker services:
- `postgres`: database chính.
- `backend`: FastAPI.
- `frontend`: Next.js.
- `n8n`: workflow automation.
- `mailhog`: email demo.

Không dùng Redis/Celery/MinIO trong MVP để giảm lỗi vận hành.

## 4. Chức Năng Theo Vai Trò
User/client:
- Login bằng tài khoản seed.
- Upload file PDF/DOCX.
- Xem danh sách tài liệu của mình.
- Filter theo trạng thái: all, processing, ai approved, pending admin, admin approved, rejected.
- Xem detail tài liệu.
- Detail hiển thị summary, classification, confidence, risk score, risk findings, final status.
- Xem thông báo kết quả qua Mailhog.

Reviewer/Admin:
- Login bằng role `reviewer` hoặc `admin`.
- Xem queue mặc định chỉ gồm `pending_admin`.
- Toggle xem cả tài liệu `ai_approved`.
- Xem detail tài liệu gồm metadata, summary, classification, risks, flag reasons.
- Panel “Why was this flagged?” hiển thị rule codes và AI/mock reasoning.
- Action `Approve`, `Reject`, `Override AI`.
- Mỗi action bắt buộc có comment nếu reject hoặc override.
- Dashboard cơ bản: total docs, approved, pending admin, rejected, agreement rate.
- Audit logs table: action, actor, target, timestamp, payload ngắn.

System/AI pipeline:
- Upload tạo document `processing_status=pending`.
- BackgroundTasks chạy process document.
- Extract text bằng `pdfplumber` hoặc `python-docx`.
- Classification rule xác định loại: `contract`, `nda`, `invoice`, `policy`, `unknown`.
- Risk rules tìm vấn đề như missing signature, high value, expiry soon, broad indemnity, termination missing, governing law missing.
- AI reviewer tổng hợp summary, verdict, confidence, findings.
- Flagging engine quyết định `ai_approved` hoặc `pending_admin`.
- Sau khi process xong, backend gửi webhook `document.reviewed` sang n8n.

## 5. Database Schema MVP
`users`:
```sql
id uuid primary key,
email text unique not null,
password_hash text not null,
role text not null,
created_at timestamptz not null
```

`documents`:
```sql
id uuid primary key,
user_id uuid references users(id),
filename text not null,
mime text not null,
size_bytes integer not null,
sha256 text not null,
storage_path text not null,
processing_status text not null,
review_status text not null,
classification text,
classification_confidence numeric,
summary text,
extracted_text text,
risk_score integer default 0,
ai_confidence numeric,
flag_reasons jsonb default '[]',
expiry_date date,
uploaded_at timestamptz not null,
processed_at timestamptz
```

`risk_findings`:
```sql
id uuid primary key,
document_id uuid references documents(id),
rule_code text not null,
severity text not null,
snippet text,
suggestion text,
created_at timestamptz not null
```

`reviews`:
```sql
id uuid primary key,
document_id uuid references documents(id),
reviewer_id uuid references users(id),
decision text not null,
comment text,
override_ai boolean default false,
created_at timestamptz not null
```

`audit_logs`:
```sql
id uuid primary key,
actor_id uuid references users(id),
action text not null,
target_type text not null,
target_id uuid,
payload jsonb default '{}',
created_at timestamptz not null
```

`n8n_events`:
```sql
id uuid primary key,
trace_id text,
event_type text not null,
direction text not null,
payload jsonb default '{}',
status text not null,
created_at timestamptz not null
```

Status chuẩn:
```text
processing_status: pending | processing | completed | failed
review_status: processing | ai_approved | pending_admin | admin_approved | admin_rejected | failed
```

## 6. Backend API MVP
Auth:
```text
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

Documents:
```text
POST /api/v1/documents
GET  /api/v1/documents
GET  /api/v1/documents/{document_id}
GET  /api/v1/documents/{document_id}/download
```

Admin:
```text
GET  /api/v1/admin/queue
GET  /api/v1/admin/documents/{document_id}
POST /api/v1/admin/documents/{document_id}/decision
GET  /api/v1/admin/stats
GET  /api/v1/admin/audit-logs
```

Automation for n8n:
```text
POST /api/v1/webhooks/n8n-events
GET  /api/v1/automation/expiring?days=7
GET  /api/v1/automation/audit-sample?limit=5
GET  /api/v1/automation/weekly-summary
```

Webhook backend gửi sang n8n:
```json
{
  "event_type": "document.reviewed",
  "trace_id": "doc-{document_id}-{timestamp}",
  "document_id": "uuid",
  "user_email": "client@example.com",
  "filename": "sample-contract.pdf",
  "review_status": "pending_admin",
  "classification": "contract",
  "risk_score": 82,
  "flag_reasons": ["HIGH_RISK_SCORE", "MISSING_SIGNATURE"],
  "admin_url": "http://localhost:3000/admin/documents/{id}",
  "client_url": "http://localhost:3000/documents/{id}"
}
```

n8n callback về backend:
```json
{
  "trace_id": "doc-{document_id}-{timestamp}",
  "event_type": "notification.sent",
  "status": "success",
  "payload": {
    "workflow": "document-result-router",
    "channels": ["email"],
    "document_id": "uuid"
  }
}
```

## 7. AI Pipeline Chi Tiết
Step 1: Upload
- Validate extension `.pdf` hoặc `.docx`.
- Validate size tối đa 10MB.
- Tính `sha256`.
- Lưu file vào local volume.
- Tạo row document.
- Ghi audit `document.uploaded`.
- Start `BackgroundTasks(process_document)`.

Step 2: Extraction
- PDF dùng `pdfplumber`.
- DOCX dùng `python-docx`.
- Nếu text length dưới ngưỡng 200 ký tự thì mark `failed` hoặc `pending_admin` với reason `LOW_TEXT_EXTRACTION`.
- Lưu `extracted_text`.

Step 3: Classification
- Rule keyword scoring.
- Contract keywords: agreement, contract, party, clause, effective date.
- NDA keywords: confidential, non-disclosure, recipient, disclosing party.
- Invoice keywords: invoice, total, tax, due date, payment.
- Policy keywords: policy, procedure, compliance, employee.
- Output gồm `classification`, `confidence`, `matched_rules`.

Step 4: Risk Engine
- `MISSING_SIGNATURE`: không thấy signature/signed/by/date.
- `HIGH_VALUE`: phát hiện amount lớn hơn threshold.
- `EXPIRY_SOON`: expiry trong 30 ngày.
- `NO_TERMINATION_CLAUSE`: thiếu termination.
- `NO_GOVERNING_LAW`: thiếu governing law/jurisdiction.
- `BROAD_INDEMNITY`: có indemnify/hold harmless broad wording.
- `AUTO_RENEWAL`: có auto-renewal.
- `LOW_EXTRACTION_QUALITY`: text quá ngắn hoặc nhiều ký tự lạ.
- `UNKNOWN_DOC_TYPE`: classification unknown.
- `CONFIDENCE_LOW`: classification confidence thấp.

Step 5: AI Reviewer
- Nếu có `OPENAI_API_KEY`, gọi model rẻ để sinh JSON summary/findings/verdict.
- Nếu không có key, tạo summary deterministic từ classification và risk findings.
- Output luôn cùng shape: `summary`, `verdict`, `confidence`, `reasoning`.

Step 6: Flagging
- `pending_admin` nếu risk score >= 60.
- `pending_admin` nếu có severity `critical` hoặc `high`.
- `pending_admin` nếu classification confidence < 0.55.
- `pending_admin` nếu extraction failed/low quality.
- `ai_approved` nếu không vi phạm điều kiện trên.
- Ghi audit `ai.review.completed`.
- Gửi webhook sang n8n.

## 8. n8n Workflow A — document-result-router
Mục tiêu: nhận event từ FastAPI sau khi review xong, route theo trạng thái, gửi email, callback log.

Pattern dùng:
```text
Webhook Processing + HTTP API Integration + IF/Switch + Notification + Callback
```

Node dự kiến:
1. `Webhook: Receive Document Reviewed`
```text
Method: POST
Path: /document-reviewed
Response mode: onReceived
Expected data: $json.body
```

2. `Set: Normalize Payload`
```text
trace_id = {{$json.body.trace_id}}
document_id = {{$json.body.document_id}}
user_email = {{$json.body.user_email}}
review_status = {{$json.body.review_status}}
risk_score = {{$json.body.risk_score}}
flag_reasons = {{$json.body.flag_reasons}}
admin_url = {{$json.body.admin_url}}
client_url = {{$json.body.client_url}}
```

3. `IF: Validate Required Fields`
```text
Pass if trace_id, document_id, user_email, review_status exist.
False branch goes to invalid callback.
```

4. `HTTP Request: Callback Invalid Payload`
```text
POST http://backend:8000/api/v1/webhooks/n8n-events
Only false branch from validation.
status = failed
event_type = notification.invalid_payload
```

5. `Switch: Route By Review Status`
```text
Case pending_admin
Case ai_approved
Case admin_approved
Case admin_rejected
Default unknown
```

6. `Set: Build Pending Admin Email`
```text
to = reviewer/demo admin email
subject = [LegalReview] Document flagged: {{$json.filename}}
body = risk score, flag reasons, admin link
```

7. `Email Send: Notify Reviewer`
```text
SMTP host: mailhog
Port: 1025
To: reviewer@example.com
Subject/body from previous node
```

8. `IF: Critical Risk`
```text
Pass if risk_score >= 85.
True branch sends optional urgent notification.
```

9. `Email Send: Critical Admin Alert`
```text
To: admin@example.com
Subject: CRITICAL legal document flagged
Used instead of Telegram in P0 to avoid credential risk.
```

10. `Set: Build AI Approved Email`
```text
to = user_email
subject = [LegalReview] Your document was AI approved
body = classification, risk score, client link
```

11. `Email Send: Notify User Approved`
```text
SMTP host: mailhog
Port: 1025
```

12. `Set: Build Admin Decision Email`
```text
Used for admin_approved/admin_rejected after admin action if backend later emits event.
```

13. `Email Send: Notify User Final Decision`
```text
To: user_email
Subject reflects approved/rejected.
```

14. `Set: Build Unknown Status Payload`
```text
status = failed
event_type = notification.unknown_status
```

15. `HTTP Request: Callback Success`
```text
POST http://backend:8000/api/v1/webhooks/n8n-events
status = success
event_type = notification.sent
payload includes channels and workflow name.
```

16. `HTTP Request: Callback Failed`
```text
POST http://backend:8000/api/v1/webhooks/n8n-events
status = failed
event_type = notification.failed
Used from invalid/default branches.
```

17. `Sticky Note: Demo Instructions`
```text
Documents how to test via curl/Postman and where Mailhog is.
```

Error handling trong Workflow A:
- Email nodes bật `Continue On Fail` nếu cần demo callback lỗi.
- Sau Email node có `IF: Email Node Failed` kiểm tra error field.
- Failure branch gọi `Callback Failed`.
- Demo chủ đích: đổi SMTP host sai để show callback failed hoặc n8n execution error.

Acceptance Workflow A:
- Upload document an toàn tạo email user trong Mailhog.
- Upload document rủi ro tạo email reviewer trong Mailhog.
- Risk score >= 85 tạo thêm email admin critical.
- Backend `n8n_events` có success/fail theo `trace_id`.

## 9. n8n Workflow B — compliance-monitor-audit
Mục tiêu: chạy định kỳ để chứng minh compliance operations: expiry alert và AI audit sample.

Pattern dùng:
```text
Scheduled Tasks + HTTP API Integration + Batch Processing + Aggregation + Callback
```

Branch 1: Daily expiry alert.

Node dự kiến:
1. `Schedule Trigger: Daily Expiry Check`
```text
Mode: daysAndHours
Every day 08:00
Demo mode: có thể đổi temporary thành every 1 minute.
```

2. `HTTP Request: Get Expiring Documents`
```text
GET http://backend:8000/api/v1/automation/expiring?days=7
Auth: internal API key header if implemented
```

3. `IF: Has Expiring Documents`
```text
True if response array length > 0.
False branch goes to callback no_data.
```

4. `Code: Prepare Expiry Items`
```text
Convert response docs into one item per user/document.
Fields: user_email, filename, expiry_date, client_url, days_left.
```

5. `Split In Batches: One Email At A Time`
```text
Batch size: 1
Used to show batch/rate-limit pattern.
```

6. `Set: Build Expiry Email`
```text
Subject: [LegalReview] Document expiring soon
Body: filename, expiry date, link.
```

7. `Email Send: Send Expiry Alert`
```text
SMTP Mailhog.
```

8. `Wait: Rate Limit`
```text
Wait 1 second before next batch.
```

9. `Code: Accumulate Expiry Result`
```text
Use workflow static data or count current execution items.
Track sent_count and failed_count.
```

10. `HTTP Request: Callback Expiry Summary`
```text
POST /api/v1/webhooks/n8n-events
event_type = compliance.expiry_alert.completed
status = success
payload.sent_count = count
```

11. `HTTP Request: Callback Expiry No Data`
```text
event_type = compliance.expiry_alert.no_data
status = success
```

Branch 2: Weekly AI audit sample.

Node dự kiến:
12. `Schedule Trigger: Weekly AI Audit`
```text
Mode: daysAndHours
Monday 09:00
Demo mode: manual trigger or temporary every 1 minute.
```

13. `HTTP Request: Get AI Approved Sample`
```text
GET http://backend:8000/api/v1/automation/audit-sample?limit=5
Returns random/recent ai_approved documents.
```

14. `IF: Has Audit Sample`
```text
True if at least one item.
False branch callback no_data.
```

15. `Code: Build Audit Digest`
```text
Create markdown/html digest listing document filename, classification, risk score, client/admin link.
```

16. `Email Send: Send Reviewer Audit Digest`
```text
To: reviewer@example.com
Subject: Weekly AI Auto-Approval Audit Sample
```

17. `HTTP Request: Callback Audit Created`
```text
POST /api/v1/webhooks/n8n-events
event_type = compliance.weekly_audit.created
status = success
payload.sample_count = count
```

18. `HTTP Request: Callback Audit No Data`
```text
event_type = compliance.weekly_audit.no_data
status = success
```

Branch 3: Weekly summary.

Node dự kiến:
19. `HTTP Request: Get Weekly Summary`
```text
GET http://backend:8000/api/v1/automation/weekly-summary
Can be chained after weekly audit trigger.
```

20. `Set: Build Weekly Summary Email`
```text
Subject: Weekly LegalReview Summary
Body: total docs, ai approved, pending admin, rejected, agreement rate.
```

21. `Email Send: Send Weekly Summary`
```text
To: admin@example.com
```

22. `HTTP Request: Callback Weekly Summary`
```text
event_type = compliance.weekly_summary.sent
status = success
```

Error handling trong Workflow B:
- HTTP Request nodes set timeout 10s.
- If backend returns error, branch to callback failed where possible.
- Email failure is logged by callback failed.
- README ghi rõ cách chạy manual từng branch để demo.

Acceptance Workflow B:
- Khi có document expiry trong 7 ngày, Mailhog nhận email.
- Khi có tài liệu `ai_approved`, reviewer nhận weekly audit digest.
- Khi không có data, workflow vẫn callback `no_data`, không crash.
- Backend lưu được `n8n_events` cho từng branch.

## 10. Frontend Pages
Auth:
```text
/login
```

Client:
```text
/documents
/documents/upload
/documents/[id]
```

Admin:
```text
/admin/queue
/admin/documents/[id]
/admin/dashboard
/admin/audit-logs
```

Client document detail tabs:
```text
Overview: status, filename, upload time, processed time
Summary: AI/mock summary
Classification: type, confidence, reason
Risks: risk score, findings table
```

Admin detail sections:
```text
Document metadata
AI decision
Why flagged
Risk findings
Decision form
Audit trail short list
```

Dashboard cards:
```text
Total documents
AI approved
Pending admin
Admin rejected
Agreement rate
Top flag reason
```

## 11. Timeline 5 Ngày
Ngày 1 — Foundation:
- Docker Compose: postgres, backend, frontend, n8n, mailhog.
- Backend skeleton, config, DB session, health check.
- Alembic migration đầu.
- Seed users.
- Login API và frontend login.
- Layout client/admin.
- Acceptance: `docker compose up` chạy, login được, `/auth/me` trả user.

Ngày 2 — AI pipeline:
- Upload API và local file storage.
- Extract PDF/DOCX.
- Classification rules.
- Risk rules.
- AI/mock reviewer.
- Flagging engine.
- Audit logs.
- Webhook outbound sang n8n.
- Acceptance: 2 sample docs ra đúng `ai_approved` và `pending_admin`.

Ngày 3 — n8n:
- Build Workflow A node-by-node.
- Build Workflow B node-by-node.
- Setup Mailhog SMTP credential.
- Backend callback endpoint lưu `n8n_events`.
- README hướng dẫn import workflow.
- Acceptance: Mailhog nhận email và backend có callback logs.

Ngày 4 — UI demo:
- Client upload/list/detail.
- Admin queue/detail/decision.
- Dashboard và audit logs.
- Polish status badge và empty states.
- Acceptance: demo end-to-end bằng UI không cần Postman.

Ngày 5 — Hardening:
- Seed 6-8 sample docs.
- Tests cho classifier/risk/flagging.
- README, screenshots, demo script.
- Slide 10-12 trang.
- Video 5 phút.
- Buffer fix bug, không thêm feature mới.

## 12. Phân Công 2 Thành Viên
Member 1 — Intake/Core/Client:
- Docker Compose base.
- Backend auth, upload, document APIs.
- Extraction, classifier, risk engine, flagging.
- Client UI upload/list/detail.
- Unit tests classifier/risk/flagging.

Member 2 — Admin/n8n/Compliance:
- n8n setup, Workflow A, Workflow B.
- Admin APIs, reviews, stats, audit logs.
- Admin UI queue/detail/dashboard/audit.
- Mailhog/notification config.
- README n8n pattern table và workflow import guide.

Integration cùng làm:
- Webhook payload contract.
- Seed data.
- Demo script.
- Final bugfix.

## 13. Demo Script
Flow 1: Normal auto-approval.
- Login user.
- Upload safe contract.
- Wait process.
- Status thành `AI Approved`.
- Mở Mailhog thấy email user.

Flow 2: Risky document flagged.
- Upload document thiếu chữ ký hoặc high value.
- Status thành `Pending Admin Review`.
- Mở Mailhog thấy email reviewer.
- Admin queue xuất hiện document.

Flow 3: Admin decision.
- Login admin.
- Mở flagged document.
- Xem “Why flagged”.
- Override/Approve với comment.
- Client thấy status update.
- Audit log có action.

Flow 4: Compliance monitor.
- Chạy manual Workflow B.
- Expiry email xuất hiện trong Mailhog.
- Weekly audit digest xuất hiện.
- Backend có `n8n_events`.

Flow 5: Dashboard.
- Mở admin dashboard.
- Chỉ số total, approved, pending, rejected, agreement rate có dữ liệu.

## 14. Test Plan
Unit tests:
- Classifier nhận đúng contract/NDA/invoice/policy/unknown.
- Risk engine detect missing signature.
- Risk engine detect high value.
- Risk engine detect expiry soon.
- Risk engine detect governing law missing.
- Flagging approve khi risk thấp/confidence cao.
- Flagging pending admin khi risk cao.
- Flagging pending admin khi confidence thấp.
- Flagging pending admin khi extraction low quality.

Integration smoke:
- Login seeded user.
- Upload document tạo DB row.
- Process document tạo findings.
- Admin decision đổi status.
- n8n callback tạo `n8n_events`.

Manual tests:
- Docker compose chạy từ clean state.
- Workflow JSON import được vào n8n.
- Mailhog nhận email.
- Frontend không crash khi chưa có document.
- Dashboard không crash khi stats rỗng.

## 15. README & Nộp Bài
README bắt buộc có:
- Project overview.
- Architecture diagram text hoặc image.
- Quickstart: `.env`, `docker compose up`, seed, login accounts.
- Demo accounts.
- Backend vs n8n responsibility table.
- n8n workflow pattern table.
- API summary.
- How to import n8n workflows.
- Known limitations.
- Screenshots.
- Demo script.

Pattern table n8n:
```text
Webhook Processing: Workflow A nhận document.reviewed
HTTP API Integration: n8n gọi backend callback và automation APIs
IF/Switch: route ai_approved/pending_admin/admin decision
Scheduled Tasks: daily expiry và weekly audit
Batch Processing: Split In Batches gửi expiry emails
Error Handling: callback failed/no_data và continue-on-fail branch
Human Handoff: pending_admin email cho reviewer
```

Slide 10-12 trang:
```text
Problem
AI-first review idea
Architecture
Backend pipeline
n8n orchestration
Database/audit
Demo flow
Screenshots
Testing
Limitations
Future work
Team contribution
```

## 16. Assumptions & Defaults
- Deadline là 5 ngày, 2 thành viên.
- Repo hiện tại gần như greenfield, nên scaffold mới từ đầu.
- Dùng Mailhog thay SMTP thật để demo ổn định.
- Dùng local volume thay MinIO.
- Dùng BackgroundTasks thay Celery.
- Không có OpenAI key vẫn demo được bằng mock AI reviewer.
- Legal review chỉ là demo học thuật, không claim production legal accuracy.
- Nếu thiếu thời gian, cắt dashboard chart trước, không cắt pipeline/admin/n8n callback.
