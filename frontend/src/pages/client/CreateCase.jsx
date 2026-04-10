import { CheckCircle2, FileSearch, FileStack } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";
import FileUpload from "../../components/ui/FileUpload.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import { useCases } from "../../hooks/useCases.js";
import { extractDocumentText } from "../../lib/api.js";
import { LEGAL_DOMAINS } from "../../lib/constants.js";
import { formatPriorityLabel } from "../../lib/formatters.js";

const TEXT_FILE_EXTENSIONS = new Set(["txt", "md", "markdown", "csv", "json", "xml", "html", "htm"]);
const OCR_FILE_EXTENSIONS = new Set(["pdf", "docx", "png", "jpg", "jpeg", "webp", ...TEXT_FILE_EXTENSIONS]);

function getFileExtension(fileName = "") {
  const parts = String(fileName).toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) : "";
}

function isTextReadableFile(file) {
  if (!file) {
    return false;
  }

  return String(file.type || "").startsWith("text/") || TEXT_FILE_EXTENSIONS.has(getFileExtension(file.name));
}

function canRunOcr(file) {
  if (!file) {
    return false;
  }

  const extension = getFileExtension(file.name);
  return OCR_FILE_EXTENSIONS.has(extension);
}

function normalizeImportedText(value = "") {
  return String(value).split("\0").join(" ").trim();
}

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
  const [fileImportHint, setFileImportHint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOcrRunning, setIsOcrRunning] = useState(false);

  async function handleFilesChange(nextFiles) {
    setFiles(nextFiles);
    setError("");
    setFileImportHint("");

    const primaryFile = nextFiles[0];

    if (!primaryFile) {
      return;
    }

    if (!isTextReadableFile(primaryFile)) {
      setFileImportHint(
        canRunOcr(primaryFile)
          ? "Đã nhận tệp đính kèm. Bạn có thể bấm “Trích xuất OCR” để nạp nội dung từ PDF, DOCX hoặc ảnh scan vào hồ sơ."
          : "Định dạng này chưa hỗ trợ OCR trên giao diện hiện tại. Hãy đổi sang PDF, DOCX, TXT, MD hoặc ảnh scan phổ biến.",
      );
      return;
    }

    try {
      const fileText = normalizeImportedText(await primaryFile.text());

      if (!fileText) {
        setFileImportHint(`Tệp ${primaryFile.name} không có nội dung văn bản để nạp tự động.`);
        return;
      }

      setExtractedText((currentText) => currentText.trim() || fileText.slice(0, 12000));
      setFileImportHint(`Đã nạp nội dung từ ${primaryFile.name} vào trường trích xuất để bạn chạy review thật.`);
    } catch {
      setFileImportHint(`Không thể đọc nội dung từ ${primaryFile.name}. Bạn vẫn có thể dán OCR hoặc đoạn trích thủ công.`);
    }
  }

  async function handleRunOcr() {
    const primaryFile = files[0];

    if (!primaryFile) {
      setError("Hãy chọn một tệp trước khi chạy OCR.");
      return;
    }

    if (!canRunOcr(primaryFile)) {
      setError("Định dạng tệp hiện chưa hỗ trợ OCR trong bản demo này.");
      return;
    }

    setIsOcrRunning(true);
    setError("");
    setFileImportHint(`Đang trích xuất nội dung từ ${primaryFile.name}...`);

    try {
      const response = await extractDocumentText(primaryFile, "vi");
      const nextText = normalizeImportedText(response.extractedText).slice(0, 30000);

      setExtractedText(nextText);
      setFileImportHint(
        response.warning
          ? `Đã OCR ${response.fileName} bằng ${response.provider === "gemini" ? "Gemini" : "trình đọc nội bộ"}. ${response.warning}`
          : `Đã OCR ${response.fileName} và nạp ${response.textLength} ký tự vào hồ sơ.`,
      );
    } catch (ocrError) {
      setError(ocrError.message || "Không thể OCR tài liệu lúc này.");
      setFileImportHint("OCR chưa hoàn tất. Bạn vẫn có thể dán nội dung thủ công để tiếp tục.");
    } finally {
      setIsOcrRunning(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Cần nhập tên vụ việc trước khi tạo hồ sơ.");
      return;
    }

    if (!extractedText.trim() && !summary.trim()) {
      setError(
        files.length
          ? "Đã có tệp đính kèm nhưng chưa có nội dung văn bản để phân tích. Hãy dán OCR hoặc dùng file TXT/MD cho demo thật."
          : "Hãy nhập tóm tắt hoặc dán nội dung OCR trước khi gửi hồ sơ để AI có đủ dữ liệu phân tích.",
      );
      return;
    }

    setIsSubmitting(true);
    setError("");

    const primaryFile = files[0];
    const nextCase = createCase({
      title: title.trim(),
      description: summary.trim() || "Hồ sơ đang chờ hệ thống tiếp nhận và phân tích.",
      domain,
      priority,
      documentName: primaryFile?.name || "tai_lieu_moi.pdf",
      extractedText: extractedText.trim() || summary.trim(),
      files,
    });

    navigate(`/client/cases/${nextCase.id}`);
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_36%),linear-gradient(135deg,#ffffff_0%,#eef8ff_52%,#f8fafc_100%)]">
        <CardContent className="space-y-4 p-6">
          <div>
            <h2 className="text-3xl font-semibold text-ink">Tạo hồ sơ mới</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Nhập thông tin cơ bản, thêm tài liệu và chuyển thẳng sang trang chi tiết để tiếp tục theo dõi kết quả.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="space-y-5 p-6">
              <h3 className="text-lg font-semibold text-ink">Bước 1: Thông tin cơ bản</h3>
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
                hint="Phần này sẽ được dùng để hiển thị phần tóm tắt tại trang tổng quan và chi tiết hồ sơ."
              />

              <Input
                label="Nội dung trích xuất mẫu"
                multiline
                value={extractedText}
                onChange={(event) => setExtractedText(event.target.value)}
                placeholder="Dán một đoạn nội dung OCR hoặc nội dung chính của tài liệu để hệ thống phân tích chính xác hơn."
                hint="Nội dung càng đầy đủ thì phần tóm tắt, cảnh báo và trường thông tin trích xuất sẽ càng sát tài liệu hơn."
              />

              <h3 className="text-lg font-semibold text-ink">Bước 2: Upload tài liệu</h3>
              <FileUpload files={files} onFilesChange={handleFilesChange} label="Tài liệu đính kèm" />
              {fileImportHint ? <p className="text-sm text-muted">{fileImportHint}</p> : null}
              {files.length ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleRunOcr}
                    isLoading={isOcrRunning}
                    disabled={!canRunOcr(files[0])}
                  >
                    <FileSearch className="h-4 w-4" />
                    Trích xuất OCR từ file đầu tiên
                  </Button>
                  <p className="text-sm text-muted">
                    PDF, DOCX và ảnh scan sẽ dùng OCR; TXT hoặc MD sẽ được đọc trực tiếp. OCR hiện áp dụng cho file đầu tiên bạn chọn.
                  </p>
                </div>
              ) : null}

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}

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
                    setFileImportHint("");
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
          <Card className="!bg-ink !text-white">
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
                <p className="mt-2 text-lg font-semibold text-white">{formatPriorityLabel(priority)}</p>
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
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-gold">
                  <FileStack className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-ink">Sau khi gửi hồ sơ</p>
                  <p className="text-sm text-muted">Bạn sẽ được chuyển sang trang chi tiết để xem phân tích, trao đổi và theo dõi tiến trình xử lý.</p>
                </div>
              </div>
              <ul className="space-y-3 text-sm leading-6 text-muted">
                <li>Hồ sơ được lưu trên trình duyệt hiện tại và vẫn còn sau khi bạn tải lại trang.</li>
                <li>Tên tài liệu được lấy từ tệp đầu tiên; nếu chưa tải lên, hệ thống sẽ dùng tên mặc định.</li>
                <li>File TXT hoặc MD có thể được nạp nội dung tự động để bạn chạy review thật ngay sau khi tạo hồ sơ.</li>
                <li>Với PDF, DOCX hoặc ảnh scan, bạn có thể bấm OCR để nạp văn bản trước khi gửi hồ sơ.</li>
                <li>OCR cho PDF hoặc ảnh đang dùng quota Gemini, nên đôi lúc có thể chậm hơn hoặc rơi về lỗi quota.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
