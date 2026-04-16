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
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{label}</div>
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
          "flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed px-6 py-10 text-center transition duration-200",
          isDragging
            ? "border-brand-500 bg-brand-50/80 shadow-[0_0_0_4px_rgba(30,58,138,0.08)]"
            : "border-slate-300 bg-[#f8fafc] hover:border-brand-500/40 hover:bg-white",
        )}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-brand-500/15 bg-brand-50 text-brand-700">
          <UploadCloud className="h-6 w-6" />
        </span>
        <p className="mt-4 text-lg font-semibold text-ink">Kéo thả tài liệu hoặc bấm để chọn</p>
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
              className="flex items-center justify-between gap-3 rounded-[20px] border border-slate-200/80 bg-white/90 px-4 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-brand-500/10 bg-brand-50 p-2 text-brand-700">
                  <Paperclip className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{file.name}</p>
                  <p className="text-xs text-muted">{formatBytes(file.size)}</p>
                </div>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Đã chọn
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
