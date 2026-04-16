import { Paperclip, UploadCloud } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "../../lib/cn.js";

function formatBytes(size) {
  if (!size) {
    return "0 B";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({
  accept = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.md",
  files = [],
  label = "Tài liệu",
  multiple = true,
  onFilesChange,
}) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);

  function pushFiles(fileList) {
    const nextFiles = Array.from(fileList || []);
    onFilesChange(nextFiles);
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-ink">{label}</div>
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          pushFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition",
          isDragging
            ? "border-brand-500 bg-brand-50"
            : "border-line bg-[#fffefa] hover:border-brand-500 hover:bg-brand-50/60",
        )}
      >
        <UploadCloud className="h-10 w-10 text-brand-700" />
        <p className="mt-4 text-base font-semibold text-ink">Kéo thả file vào đây hoặc bấm để chọn</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted">
          Hỗ trợ PDF, DOCX, ảnh scan, TXT hoặc MD. Nội dung sẽ được nạp tự động sau khi bạn chọn file.
        </p>
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(event) => pushFiles(event.target.files)}
        />
      </label>
      {files.length ? (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={`${file.name}-${file.size}`}
              className="flex items-center justify-between rounded-xl border border-line bg-[#fffefa] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-brand-50 p-2 text-brand-700">
                  <Paperclip className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{file.name}</p>
                  <p className="text-xs text-muted">{formatBytes(file.size)}</p>
                </div>
              </div>
              <span className="rounded-full bg-warm-50 px-2.5 py-1 text-xs font-semibold text-muted">
                Đã chọn
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
