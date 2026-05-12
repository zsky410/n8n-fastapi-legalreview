# Demo Script 5 Phút

## Chuẩn Bị

```bash
cp .env.example .env
docker compose up --build
```

Mở các tab:

- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs
- n8n: http://localhost:5678
- Mailhog: http://localhost:8025

Tài khoản:

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Khách hàng | `client@example.com` | `password123` |
| Người rà soát | `reviewer@example.com` | `password123` |
| Admin | `admin@example.com` | `password123` |

## Flow 1: Auto-Approval

1. Đăng nhập bằng `client@example.com`.
2. Mở màn Tài liệu.
3. Chọn filter "AI đã duyệt".
4. Mở `demo-safe-contract.docx`.
5. Nói rõ: backend extract, classify, risk score thấp, AI/mock tự duyệt.

Kỳ vọng:

- Status hiển thị "AI đã duyệt".
- Risk score thấp.
- Không có cờ rủi ro.

## Flow 2: Tài Liệu Rủi Ro

1. Chọn filter "Chờ admin".
2. Mở `demo-high-value-contract.docx`.
3. Chỉ vào "Lý do bị gắn cờ" và "Phát hiện rủi ro".

Kỳ vọng:

- Status "Chờ admin duyệt".
- Có cờ "Thiếu chữ ký", "Giá trị cao", "Thiếu luật điều chỉnh".
- Phần tóm tắt AI giải thích ngắn gọn bằng tiếng Việt.

## Flow 3: Admin Decision

1. Đăng xuất, đăng nhập bằng `admin@example.com`.
2. Mở Hàng chờ.
3. Mở tài liệu rủi ro.
4. Nhập ghi chú.
5. Chọn "Duyệt" hoặc "Từ chối" và gửi quyết định.
6. Mở "Dòng thời gian audit".

Kỳ vọng:

- Status đổi sang `Admin đã duyệt` hoặc `Admin đã từ chối`.
- Audit log có action admin decision.
- Client nhìn lại tài liệu sẽ thấy status mới.

## Flow 4: n8n Compliance Monitor

1. Mở n8n.
2. Import hoặc mở workflow `compliance-monitor-audit`.
3. Execute workflow thủ công.
4. Mở Mailhog.
5. Kiểm tra email expiry/audit/weekly summary.
6. Kiểm tra callback:

```bash
docker compose exec postgres psql -U legalreview -d legalreview \
  -c "select event_type, status, created_at from n8n_events order by created_at desc limit 10;"
```

## Flow 5: Dashboard Và Audit Logs

1. Mở Dashboard.
2. Chỉ các card: tổng tài liệu, AI đã duyệt, chờ admin, từ chối, tỷ lệ duyệt.
3. Mở Nhật ký audit.
4. Nhấn refresh.

Kỳ vọng:

- Dashboard có dữ liệu từ seed docs và tài liệu upload.
- Audit logs có upload, AI review, admin decision, callback.

## Câu Kết Video

"MVP này tập trung vào luồng AI-first, human-on-exception. AI xử lý tài liệu an toàn, các trường hợp rủi ro được chuyển sang người rà soát, toàn bộ quyết định đều có audit trail và n8n chịu trách nhiệm orchestration/thông báo thay vì quyết định pháp lý."
