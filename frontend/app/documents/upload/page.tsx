"use client";

import { FileUp, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";

import { uploadDocument } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import { PageError } from "@/components/ui";

const supportedFileLabel = "PDF, DOCX, TXT, MD, RTF hoặc HTML";
const supportedFileAccept =
  ".pdf,.docx,.txt,.md,.rtf,.html,.htm,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/html,application/rtf,text/rtf";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError(`Vui lòng chọn file ${supportedFileLabel} trước`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const uploaded = await uploadDocument(file);
      router.push(`/documents/${uploaded.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tải tài liệu thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page-stack narrow">
      <header className="page-header">
        <div>
          <p className="eyebrow">Khu vực khách hàng</p>
          <h1>Tải tài liệu</h1>
        </div>
      </header>

      {error ? <PageError message={error} /> : null}

      <form className="upload-panel" onSubmit={handleSubmit}>
        <label className="drop-zone">
          <FileUp size={34} aria-hidden="true" />
          <span>{file ? file.name : "Chọn tài liệu pháp lý"}</span>
          <small>{file ? `Đã chọn ${formatBytes(file.size)}` : `${supportedFileLabel}, tối đa 10 MB`}</small>
          <input
            type="file"
            accept={supportedFileAccept}
            onChange={handleFileChange}
          />
        </label>

        <div className="upload-summary">
          <div>
            <strong>Quy trình rà soát</strong>
            <p>Hệ thống tự trích xuất văn bản, phân loại và chạy AI review ngay sau khi tải lên.</p>
          </div>
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            <UploadCloud size={18} aria-hidden="true" />
            <span>{isSubmitting ? "Đang tải lên" : "Tải tài liệu"}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
