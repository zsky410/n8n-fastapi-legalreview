import { CheckCircle2, FileStack } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";
import FileUpload from "../../components/ui/FileUpload.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import { useCases } from "../../hooks/useCases.js";
import { LEGAL_DOMAINS } from "../../lib/constants.js";

export default function CreateCase() {
  const navigate = useNavigate();
  const { createCase } = useCases();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [domain, setDomain] = useState(LEGAL_DOMAINS[0]);
  const [priority, setPriority] = useState("medium");
  const [extractedText, setExtractedText] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Cần nhập tên vụ việc trước khi tạo hồ sơ.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const primaryFile = files[0];
    const nextCase = createCase({
      title: title.trim(),
      description: summary.trim() || "Hồ sơ được tạo từ form client và chờ AI review mock-first.",
      domain,
      priority,
      documentName: primaryFile?.name || "tai_lieu_demo.pdf",
      extractedText: extractedText.trim() || summary.trim(),
      files,
    });

    navigate(`/client/cases/${nextCase.id}`);
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_36%),linear-gradient(135deg,#ffffff_0%,#eef8ff_52%,#f8fafc_100%)]">
        <CardContent className="space-y-4 p-6">
          <Badge className="border-brand-100 bg-white/80 text-brand-700">CreateCase mock-first</Badge>
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">Tạo hồ sơ mới</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Gồm 2 bước trên cùng một trang: nhập thông tin cơ bản và upload tài liệu, sau đó chuyển sang `CaseDetail`.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="space-y-5 p-6">
              <h3 className="text-lg font-semibold text-slate-900">Bước 1: Thông tin cơ bản</h3>
              <div className="grid gap-4 lg:grid-cols-2">
                <Input
                  label="Tên vụ việc"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ví dụ: Review hợp đồng cung cấp phần mềm"
                  error={error && !title.trim() ? error : ""}
                />
                <Select
                  label="Lĩnh vực"
                  value={domain}
                  onChange={(event) => setDomain(event.target.value)}
                  options={LEGAL_DOMAINS.map((item) => ({ label: item, value: item }))}
                />
              </div>
              <Select
                label="Mức độ ưu tiên"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                options={[
                  { label: "Thấp", value: "low" },
                  { label: "Trung bình", value: "medium" },
                  { label: "Cao", value: "high" },
                ]}
              />

              <Input
                label="Mô tả ngắn"
                multiline
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Nêu rõ điều khoản cần rà soát, deadline hoặc mức ưu tiên của hồ sơ..."
                hint="Phần này sẽ được dùng để hiển thị card summary tại dashboard và case detail."
              />

              <Input
                label="Nội dung trích xuất mẫu"
                multiline
                value={extractedText}
                onChange={(event) => setExtractedText(event.target.value)}
                placeholder="Dán một đoạn nội dung OCR để mock review tạo được risk score, flags và extracted fields sát hơn."
                hint="Có thể để trống nếu bạn chỉ muốn test flow UI; hệ thống sẽ fallback sang mô tả ngắn."
              />

              <h3 className="text-lg font-semibold text-slate-900">Bước 2: Upload tài liệu</h3>
              <FileUpload files={files} onFilesChange={setFiles} label="Tài liệu đính kèm" />

              {error && title.trim() ? <p className="text-sm text-rose-600">{error}</p> : null}

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setTitle("");
                    setSummary("");
                    setPriority("medium");
                    setExtractedText("");
                    setFiles([]);
                    setError("");
                  }}
                >
                  Làm mới form
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  <CheckCircle2 className="h-4 w-4" />
                  Gửi hồ sơ
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        <div className="space-y-5">
          <Card className="bg-slate-950 text-white">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">Tóm tắt xem trước</p>
              <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-sm text-white/70">Tên vụ việc</p>
                <p className="mt-2 text-lg font-semibold text-white">{title || "Chưa điền"}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-sm text-white/70">Lĩnh vực</p>
                <p className="mt-2 text-lg font-semibold text-white">{domain}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-sm text-white/70">Ưu tiên</p>
                <p className="mt-2 text-lg font-semibold text-white">{priority.toUpperCase()}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-sm text-white/70">Tệp đính kèm</p>
                <p className="mt-2 text-lg font-semibold text-white">{files.length ? `${files.length} file đã chọn` : "Chưa có file"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <FileStack className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Flow sau khi submit</p>
                  <p className="text-sm text-slate-500">Từ CreateCase sang CaseDetail, rồi chạy AI mock, chat theo case và theo dõi timeline.</p>
                </div>
              </div>
              <ul className="space-y-3 text-sm leading-6 text-slate-500">
                <li>Case được lưu ở local state và giữ lại khi reload trình duyệt.</li>
                <li>Document name lấy từ file đầu tiên hoặc dùng fallback demo nếu chưa upload.</li>
                <li>Overview sẽ cho phép chạy review mock-first ngay trên case vừa tạo.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
