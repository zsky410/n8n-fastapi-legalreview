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
  accept = ".pdf,.doc,.docx,.png,.jpg,.jpeg",
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
      <div className="text-sm font-semibold text-slate-700">{label}</div>
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
          "flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed px-6 py-10 text-center transition",
          isDragging
            ? "border-brand-400 bg-brand-50"
            : "border-slate-300 bg-white hover:border-brand-300 hover:bg-brand-50/40",
        )}
      >
        <UploadCloud className="h-10 w-10 text-brand-500" />
        <p className="mt-4 text-base font-semibold text-slate-900">Kéo thả file vào đây hoặc bấm để chọn</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          Hỗ trợ PDF, DOCX hoặc ảnh scan để tạo hồ sơ demo và chạy luồng review mock-first.
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
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-brand-50 p-2 text-brand-700">
                  <Paperclip className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                Xem trước
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
