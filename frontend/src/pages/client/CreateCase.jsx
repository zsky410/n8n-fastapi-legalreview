import { CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageFrame from "../../components/layout/PageFrame.jsx";
import Button from "../../components/ui/Button.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";
import FileUpload from "../../components/ui/FileUpload.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import { useCases } from "../../hooks/useCases.js";
import { extractDocumentText } from "../../lib/api.js";
import { LEGAL_DOMAINS, ROLE_LABELS } from "../../lib/constants.js";
import { formatPriorityLabel } from "../../lib/formatters.js";

const TEXT_FILE_EXTENSIONS = new Set(["txt", "md", "markdown", "csv", "json", "xml", "html", "htm"]);
const OCR_FILE_EXTENSIONS = new Set(["pdf", "docx", "png", "jpg", "jpeg", "webp", ...TEXT_FILE_EXTENSIONS]);
const OCR_TEXT_LIMIT = 120000;

function getFileExtension(fileName = "") {
  const parts = String(fileName).toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) : "";
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
  const [titleMode, setTitleMode] = useState("empty");
  const [suggestedTitle, setSuggestedTitle] = useState("");
  const [titleSuggestionSource, setTitleSuggestionSource] = useState("");
  const [summary, setSummary] = useState("");
  const [domain, setDomain] = useState(LEGAL_DOMAINS[0]);
  const [priority, setPriority] = useState("medium");
  const [extractedText, setExtractedText] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [fileImportHint, setFileImportHint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const titleModeRef = useRef("empty");

  function updateTitleManually(nextTitle) {
    const normalizedTitle = nextTitle;
    const nextMode = normalizedTitle.trim() ? "manual" : "empty";
    titleModeRef.current = nextMode;
    setTitle(normalizedTitle);
    setTitleMode(nextMode);
  }

  function resetTitleSuggestionState() {
    titleModeRef.current = "empty";
    setTitle("");
    setTitleMode("empty");
    setSuggestedTitle("");
    setTitleSuggestionSource("");
  }

  function getTitleHint() {
    if (isOcrRunning) {
      return "Sau khi OCR xong, hệ thống sẽ tự điền tên vụ việc tạm thời. Bạn có thể sửa lại ngay sau đó nếu muốn.";
    }

    if (suggestedTitle && titleMode === "auto") {
      return `${
        titleSuggestionSource === "ai" ? "AI" : "Hệ thống"
      } vừa tự điền tên tạm từ nội dung tài liệu. Bạn có thể sửa lại bất cứ lúc nào.`;
    }

    if (suggestedTitle && titleMode === "manual") {
      return `Tên hiện tại là bản bạn đã sửa. Gợi ý gần nhất của hệ thống là "${suggestedTitle}".`;
    }

    return "Sau khi tải file và trích xuất xong, hệ thống sẽ tự điền tên tạm để bạn chỉnh lại nếu muốn.";
  }

  async function populateExtractedTextFromFile(primaryFile) {
    if (!primaryFile) {
      return;
    }

    if (!canRunOcr(primaryFile)) {
      setFileImportHint("Chưa thể đọc nội dung từ định dạng tệp này.");
      return;
    }

    setIsOcrRunning(true);
    setError("");
    setFileImportHint(`Đang đọc nội dung từ ${primaryFile.name}...`);

    try {
      const response = await extractDocumentText(primaryFile, "vi");
      const nextText = normalizeImportedText(response.extractedText).slice(0, OCR_TEXT_LIMIT);
      const nextSuggestedTitle = normalizeImportedText(response.suggestedTitle || "").slice(0, 120);

      setExtractedText(nextText);
      setSuggestedTitle(nextSuggestedTitle);
      setTitleSuggestionSource(response.suggestionSource || "");

      if (nextSuggestedTitle) {
        titleModeRef.current = "auto";
        setTitle(nextSuggestedTitle);
        setTitleMode("auto");
      }

      setFileImportHint(
        [
          "Nội dung từ tài liệu đã được nạp vào ô bên trên.",
          nextSuggestedTitle
            ? `${response.suggestionSource === "ai" ? "AI" : "Hệ thống"} đã tự điền lại tên vụ việc tạm thời theo nội dung tài liệu. Bạn có thể sửa lại nếu muốn.`
            : "",
          response.warning || "",
          response.pageCount
            ? `Đã nhận diện ${response.extractedPageCount || 0}/${response.pageCount} trang có nội dung OCR.`
            : "",
        ]
          .filter(Boolean)
          .join(" "),
      );
    } catch (ocrError) {
      setError(ocrError.message || "Không thể đọc nội dung tài liệu lúc này.");
      setFileImportHint("Chưa đọc được nội dung từ tài liệu này. Bạn vẫn có thể nhập nội dung thủ công.");
    } finally {
      setIsOcrRunning(false);
    }
  }

  async function handleFilesChange(nextFiles) {
    setFiles(nextFiles);
    setError("");
    setFileImportHint("");

    const primaryFile = nextFiles[0];

    if (!primaryFile) {
      setExtractedText("");
      setFileImportHint("");
      setSuggestedTitle("");
      setTitleSuggestionSource("");
      if (titleModeRef.current === "auto") {
        resetTitleSuggestionState();
      }
      return;
    }

    await populateExtractedTextFromFile(primaryFile);
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
          ? "Tài liệu đã được tải lên nhưng chưa có đủ nội dung để phân tích. Bạn có thể nhập thêm nội dung vào ô bên trên."
          : "Hãy nhập mô tả hoặc nội dung tài liệu trước khi gửi hồ sơ.",
      );
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const primaryFile = files[0];
      const nextCase = await createCase({
        title: title.trim(),
        description: summary.trim() || "Hồ sơ đang chờ hệ thống tiếp nhận và phân tích.",
        domain,
        priority,
        documentName: primaryFile?.name || "tai_lieu_moi.pdf",
        extractedText: extractedText.trim() || summary.trim(),
        files,
      });

      navigate(`/client/cases/${nextCase.id}`);
    } catch (submitError) {
      setError(submitError.message || "Không thể tạo hồ sơ lúc này.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageFrame segments={[ROLE_LABELS.client, "Tạo hồ sơ"]} bodyClassName="p-0 sm:p-0">
      <div className="p-4 sm:p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="space-y-5 p-6">
              <h3 className="legal-display text-lg font-semibold text-ink">Bước 1: Thông tin cơ bản</h3>
              <div className="grid gap-4 lg:grid-cols-2">
                <Input
                  label="Tên vụ việc"
                  value={title}
                  onChange={(event) => updateTitleManually(event.target.value)}
                  placeholder="Ví dụ: Review hợp đồng cung cấp phần mềm"
                  hint={getTitleHint()}
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
              />

              <Input
                label="Nội dung trích xuất mẫu"
                multiline
                value={extractedText}
                onChange={(event) => setExtractedText(event.target.value)}
                placeholder={isOcrRunning ? "Hệ thống đang đọc nội dung từ tài liệu..." : "Nội dung từ tài liệu sẽ xuất hiện tại đây để bạn kiểm tra lại trước khi gửi."}
              />

              <h3 className="legal-display text-lg font-semibold text-ink">Bước 2: Upload tài liệu</h3>
              <FileUpload files={files} onFilesChange={handleFilesChange} label="Tài liệu đính kèm" />
              {fileImportHint ? <p className="text-sm text-muted">{fileImportHint}</p> : null}

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setTitle("");
                    titleModeRef.current = "empty";
                    setTitleMode("empty");
                    setSuggestedTitle("");
                    setTitleSuggestionSource("");
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
          <Card className="!bg-warm-900 !text-white">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">Tóm tắt xem trước</p>
              <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/70">Tên vụ việc</p>
                  {suggestedTitle ? (
                    <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
                      {titleMode === "manual"
                        ? "Đã chỉnh tay"
                        : titleSuggestionSource === "ai"
                          ? "AI đặt tạm"
                          : "Gợi ý tạm"}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-lg font-semibold text-white">{title || "Chưa điền"}</p>
                {suggestedTitle && titleMode === "manual" ? (
                  <p className="mt-2 text-xs leading-5 text-white/60">Tên AI gợi ý gần nhất: {suggestedTitle}</p>
                ) : null}
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
        </div>
        </div>
      </div>
    </PageFrame>
  );
}
