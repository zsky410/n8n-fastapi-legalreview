"use client";

import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { DocumentListItem, fetchDocuments } from "@/lib/api";
import { formatDateTime, humanStatus } from "@/lib/format";
import { EmptyState, FlagList, PageError, RiskBadge, StatusBadge } from "@/components/ui";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tải danh sách tài liệu");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const activeCount = documents.filter((document) =>
    ["pending", "processing", "pending_admin"].includes(document.review_status),
  ).length;

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Khu vực khách hàng</p>
          <h1>Tài liệu</h1>
        </div>
        <div className="header-actions">
          <button className="secondary-button" type="button" onClick={loadDocuments} disabled={isLoading}>
            <RefreshCw size={16} aria-hidden="true" />
            <span>Làm mới</span>
          </button>
          <Link className="primary-button compact" href="/documents/upload">
            <Plus size={16} aria-hidden="true" />
            <span>Tải lên</span>
          </Link>
          <span className="status-pill neutral">{activeCount} đang xử lý</span>
        </div>
      </header>

      {error ? <PageError message={error} onRetry={loadDocuments} /> : null}

      <section className="data-panel">
        <div className="table-header documents-table">
          <span>Tên file</span>
          <span>Trạng thái</span>
          <span>Cờ rủi ro</span>
          <span>Rủi ro</span>
          <span>Cập nhật</span>
        </div>
        {isLoading ? (
          <div className="empty-state">Đang tải tài liệu</div>
        ) : documents.length ? (
          <div className="table-body">
            {documents.map((document) => (
              <Link className="table-row documents-table" href={`/documents/${document.id}`} key={document.id}>
                <div>
                  <strong>{document.filename}</strong>
                  <span>{document.classification ? humanStatus(document.classification) : "Chưa phân loại"}</span>
                </div>
                <StatusBadge status={document.review_status} />
                <FlagList flags={document.flag_reasons.slice(0, 3)} />
                <RiskBadge score={document.risk_score} />
                <span>{formatDateTime(document.processed_at ?? document.uploaded_at)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có tài liệu"
            action={
              <Link className="primary-button compact" href="/documents/upload">
                <Plus size={16} aria-hidden="true" />
                <span>Tải file đầu tiên</span>
              </Link>
            }
          >
            Tải lên file PDF hoặc DOCX để bắt đầu quy trình rà soát.
          </EmptyState>
        )}
      </section>
    </section>
  );
}
