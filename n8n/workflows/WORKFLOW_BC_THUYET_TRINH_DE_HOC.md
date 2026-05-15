# Workflow B & C - Bản Thuyết Trình Dễ Học Thuộc (Low-tech, ít code)

Mục tiêu tài liệu này: để member trong team có thể đứng lên nói lại luồng workflow mạch lạc, không cần đi sâu code.

- Workflow B: `compliance-monitor-audit`
- Workflow C: `legal-obligation-monitor`

---

## 1) Workflow B - `compliance-monitor-audit`

### 1.1 Nói ngắn gọn 1 câu
Workflow B là workflow định kỳ để làm 3 việc: nhắc tài liệu sắp hết hạn, kiểm tra mẫu AI tự duyệt hằng tuần, và gửi báo cáo tổng kết tuần.

### 1.2 Workflow B có mấy nhánh?
Có 3 nhánh chính:
1. Nhánh A: Expiry alert (tài liệu sắp hết hạn)
2. Nhánh B: Weekly audit sample (mẫu AI duyệt cần kiểm tra)
3. Nhánh C: Weekly summary (tổng kết tuần)

### 1.3 Trigger nào chạy nhánh nào?
- `Manual Trigger`: chạy cả 3 nhánh cùng lúc (dùng để demo/test)
- `Daily Expiry Check`: chỉ chạy nhánh Expiry alert mỗi ngày
- `Weekly Audit Check`: chạy nhánh Weekly audit sample và Weekly summary mỗi tuần

Nói miệng dễ nhớ:
- “Manual thì bắn cả cụm.”
- “Daily chỉ lo hết hạn.”
- “Weekly lo audit và tổng kết.”

---

### 1.4 Đi từng node - Nhánh A (Expiry alert)

#### Node 1: `Get Expiring Documents`
- Việc làm: hỏi backend danh sách tài liệu sắp hết hạn trong 7 ngày.
- Kết quả mong muốn: có một danh sách docs.

#### Node 2: `Collect Expiring Docs`
- Việc làm: gom dữ liệu về một format thống nhất.
- Kết quả: tạo ra 2 ý chính:
1. `has_data`: có dữ liệu hay không.
2. `docs`: danh sách tài liệu.

#### Node 3: `Has Expiring Documents?` (IF)
- Nếu `has_data = true` -> đi nhánh Có dữ liệu.
- Nếu `has_data = false` -> đi nhánh Không có dữ liệu.

Trường hợp rơi nhánh:
- Có ít nhất 1 tài liệu sắp hết hạn -> đi `Prepare Expiry Items`.
- Không có tài liệu nào -> đi `Callback Expiry No Data`.

#### Node 4A (nhánh false): `Callback Expiry No Data`
- Việc làm: báo về backend là hôm nay không có gì để gửi.
- Ý nghĩa: hệ thống vẫn ghi nhận chạy thành công, chỉ là không có dữ liệu.

#### Node 4B (nhánh true): `Prepare Expiry Items`
- Việc làm: chuyển mỗi tài liệu thành 1 “gói email” (to, subject, body).
- Ý nghĩa: chuẩn bị xong đầu vào cho bước gửi mail hàng loạt.

#### Node 5: `Split Expiry Emails`
- Việc làm: tách thành từng item một để gửi lần lượt.
- Lý do: tránh spam SMTP/rate limit.

Nhớ cách hiểu:
- 1 vòng = 1 email.
- Gửi xong chờ 1 giây rồi quay lại gửi email kế.

#### Node 6: `Send Expiry Alert`
- Việc làm: gửi email cảnh báo hết hạn cho user tương ứng.

#### Node 7: `Wait Rate Limit`
- Việc làm: chờ 1 giây trước khi gửi email kế tiếp.
- Ý nghĩa: giảm nguy cơ bị chặn do gửi quá nhanh.

#### Node 8: quay lại `Split Expiry Emails`
- Việc làm: lấy item tiếp theo.
- Cứ lặp đến khi hết danh sách.

#### Node 9: `Callback Expiry Summary` (khi loop done)
- Việc làm: báo backend đã hoàn tất, gửi kèm số lượng email đã gửi.
- Ý nghĩa: có log tổng kết của nhánh expiry.

---

### 1.5 Đi từng node - Nhánh B (Weekly audit sample)

#### Node 1: `Get AI Approved Sample`
- Việc làm: lấy mẫu tài liệu AI tự duyệt (ví dụ limit 5) để người phụ trách kiểm tra lại chất lượng.

#### Node 2: `Collect Audit Sample`
- Việc làm: gom dữ liệu về format thống nhất, tạo `has_data` và `docs`.

#### Node 3: `Has Audit Sample?` (IF)
- Nếu có mẫu -> đi tạo digest.
- Nếu không có mẫu -> callback no_data.

Trường hợp rơi nhánh:
- Có tài liệu mẫu -> `Build Audit Digest`.
- Không có -> `Callback Audit No Data`.

#### Node 4A (nhánh false): `Callback Audit No Data`
- Việc làm: báo backend tuần này không có mẫu để audit.

#### Node 4B (nhánh true): `Build Audit Digest`
- Việc làm: đóng gói danh sách mẫu thành một email tổng hợp cho reviewer/ops.
- Nội dung nói miệng: “1 email gom nhiều tài liệu, đỡ spam.”

#### Node 5: `Send Reviewer Audit Digest`
- Việc làm: gửi email digest cho người rà soát.

#### Node 6: `Callback Audit Created`
- Việc làm: báo backend đã tạo/gửi luồng audit thành công.

Lưu ý dễ nhầm:
- Từ `Build Audit Digest`, workflow đi song song sang gửi mail và callback.

---

### 1.6 Đi từng node - Nhánh C (Weekly summary)

#### Node 1: `Get Weekly Summary`
- Việc làm: lấy số liệu tổng kết tuần từ backend.

#### Node 2: `Build Weekly Summary Email`
- Việc làm: biến số liệu thành nội dung email tổng kết (tổng tài liệu, số AI duyệt, số cần reviewer...).

#### Node 3: `Send Weekly Summary`
- Việc làm: gửi email tổng kết cho admin/manager.

#### Node 4: `Callback Weekly Summary`
- Việc làm: báo backend là đã gửi xong tổng kết tuần.

---

### 1.7 Mẫu câu thuyết trình miệng Workflow B
“Workflow B là workflow định kỳ có 3 nhánh. Nhánh 1 lo cảnh báo hết hạn hằng ngày: lấy danh sách, nếu rỗng thì callback no_data, nếu có thì tách từng email gửi tuần tự có delay 1 giây rồi callback summary. Nhánh 2 lo audit mẫu AI hằng tuần: có dữ liệu thì build một digest gửi reviewer, không có thì callback no_data. Nhánh 3 lo tổng kết tuần: lấy số liệu, build mail, gửi cho manager rồi callback hoàn tất.”

---

## 2) Workflow C - `legal-obligation-monitor`

### 2.1 Nói ngắn gọn 1 câu
Workflow C nhận danh sách nghĩa vụ pháp lý từ backend, kiểm tra hợp lệ, rồi gửi email digest theo mức độ ưu tiên cho đúng người.

### 2.2 Luồng tổng quát
1. Nhận webhook.
2. Chuẩn hóa payload.
3. Kiểm tra hợp lệ.
4. Nếu không hợp lệ -> callback invalid.
5. Nếu hợp lệ nhưng không có obligations -> callback no_data.
6. Nếu có obligations -> build digest email -> gửi theo loop -> callback từng vòng.

---

### 2.3 Đi từng node

#### Node 1: `Receive Legal Obligations`
- Việc làm: nhận webhook `/legal-obligations`.
- Đầu vào: dữ liệu tài liệu + danh sách obligations.

#### Node 2: `Normalize Obligation Payload`
- Việc làm: chuẩn hóa dữ liệu về một chuẩn nội bộ, ví dụ:
- obligations có phải mảng không,
- đếm số mục ưu tiên cao,
- chuẩn hóa risk score,
- set các field fallback email.
- Kết quả: tạo các cờ quan trọng:
1. `valid`
2. `has_obligations`

#### Node 3: `Validate Obligation Payload` (IF)
- Điều kiện: payload có đủ thông tin tối thiểu (trace, document, user).

Trường hợp rơi nhánh:
- `valid = false` -> `Callback Invalid Obligation Payload`.
- `valid = true` -> đi tiếp `Has Obligations?`.

#### Node 4A: `Callback Invalid Obligation Payload`
- Việc làm: báo backend payload lỗi, dừng luồng.

#### Node 4B: `Has Obligations?` (IF)
- Điều kiện: danh sách obligations có phần tử hay không.

Trường hợp rơi nhánh:
- `has_obligations = false` -> `Callback No Obligations`.
- `has_obligations = true` -> `Build Obligation Digest Email`.

#### Node 5A: `Callback No Obligations`
- Việc làm: báo backend là hợp lệ nhưng không có nghĩa vụ nào cần gửi.

#### Node 5B: `Build Obligation Digest Email`
- Việc làm chính (nói miệng):
1. Sắp xếp obligations để ưu tiên mục gần hạn/nghiêm trọng.
2. Tính mức nghiêm trọng cao nhất và mức khẩn cấp cao nhất.
3. Chọn người nhận:
- Nếu có mục high/critical hoặc overdue/due_soon -> ưu tiên gửi reviewer/ops (có thể CC manager).
- Nếu chỉ mức bình thường -> gửi user.
4. Tạo email digest (HTML + text) dễ đọc.

#### Node 6: `Split Obligation Emails`
- Việc làm: tách từng item để gửi lần lượt.

#### Node 7: `Send Obligation Alert`
- Việc làm: gửi email alert/digest.

#### Node 8: `Wait Email Rate Limit`
- Việc làm: chờ 1 giây giữa các lần gửi.

#### Node 9: `Callback Obligation Alert Sent`
- Việc làm: báo backend đã gửi item đó, kèm metadata (số obligations, mức severity/urgency cao nhất, to/cc).

#### Node 10: quay lại `Split Obligation Emails`
- Việc làm: xử lý item tiếp theo cho đến hết.

---

### 2.4 Mẫu câu thuyết trình miệng Workflow C
“Workflow C nhận danh sách nghĩa vụ từ webhook. Đầu tiên normalize payload rồi kiểm tra valid. Nếu payload thiếu trường bắt buộc thì callback invalid và dừng. Nếu hợp lệ nhưng không có nghĩa vụ thì callback no_data. Nếu có nghĩa vụ thì build một email digest, trong đó tự chọn người nhận theo độ khẩn: mục high/critical hoặc quá hạn thì ưu tiên reviewer/ops, còn bình thường thì gửi user. Sau đó workflow gửi lần lượt từng email, có delay 1 giây để tránh rate limit, và callback trạng thái gửi sau mỗi vòng.”

---

## 3) Bảng “rơi nhánh nào khi nào” để học thuộc nhanh

### Workflow B

| Node rẽ nhánh | Điều kiện | Vào nhánh nào |
|---|---|---|
| `Has Expiring Documents?` | `has_data = true` | `Prepare Expiry Items` |
| `Has Expiring Documents?` | `has_data = false` | `Callback Expiry No Data` |
| `Has Audit Sample?` | `has_data = true` | `Build Audit Digest` |
| `Has Audit Sample?` | `has_data = false` | `Callback Audit No Data` |

### Workflow C

| Node rẽ nhánh | Điều kiện | Vào nhánh nào |
|---|---|---|
| `Validate Obligation Payload` | `valid = true` | `Has Obligations?` |
| `Validate Obligation Payload` | `valid = false` | `Callback Invalid Obligation Payload` |
| `Has Obligations?` | `has_obligations = true` | `Build Obligation Digest Email` |
| `Has Obligations?` | `has_obligations = false` | `Callback No Obligations` |

---

## 4) Các điểm member hay nhầm

1. Nhánh Weekly Summary trong workflow B cũng đi từ `Weekly Audit Check` (không có weekly summary trigger riêng).
2. `SplitInBatches` ở workflow B/C là để gửi tuần tự, không phải gửi song song.
3. Callback ở workflow C (`legal_obligations.alert_sent`) là callback theo từng vòng gửi, không phải chỉ 1 lần cuối.
4. “No data” không phải lỗi hệ thống; đây là trạng thái chạy thành công nhưng không có dữ liệu nghiệp vụ.

---

## 5) Bản nói miệng 60 giây cho team lead gọi bất chợt

“Workflow B là workflow định kỳ 3 nhánh: nhắc hết hạn hằng ngày, audit mẫu AI hằng tuần, và tổng kết tuần. Mỗi nhánh đều có callback về backend để log trạng thái. Nhánh gửi email nhiều item dùng SplitInBatches cộng delay 1 giây để tránh rate limit. Workflow C thì nhận nghĩa vụ pháp lý từ webhook, normalize và validate trước. Nếu payload lỗi thì callback invalid, nếu không có nghĩa vụ thì callback no_data. Khi có nghĩa vụ thì build digest, chọn người nhận theo mức độ khẩn cấp, gửi tuần tự từng email rồi callback sau mỗi vòng gửi.”

---

Tài liệu này ưu tiên cách trình bày miệng để học thuộc, nên cố ý hạn chế code và tập trung vào logic luồng nghiệp vụ.
