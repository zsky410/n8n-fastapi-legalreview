"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AdminDocumentListItem, fetchAdminQueue } from "@/lib/api";
import { ageFromNow, formatDateTime } from "@/lib/format";
import { EmptyState, FlagList, PageError, RiskBadge, StatusBadge } from "@/components/ui";

const queueScopes = [
  ["pending", "Cần xử lý"],
  ["ai_approved", "AI đã duyệt"],
  ["all", "Tất cả"],
] as const;

export default function AdminQueuePage() {
  const [documents, setDocuments] = useState<AdminDocumentListItem[]>([]);
  const [scope, setScope] = useState<(typeof queueScopes)[number][0]>("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await fetchAdminQueue(scope);
      setDocuments(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tải hàng chờ rà soát");
    } finally {
      setIsLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Reviewer workspace</p>
          <h1>Exception queue</h1>
        </div>
        <div className="header-actions">
          <button className="secondary-button" type="button" onClick={loadQueue} disabled={isLoading}>
            <RefreshCw size={16} aria-hidden="true" />
            <span>Làm mới</span>
          </button>
          <span className="status-pill warning">{documents.length} tài liệu</span>
        </div>
      </header>

      <div className="tab-strip" aria-label="Lọc hàng chờ reviewer">
        {queueScopes.map(([value, label]) => (
          <button
            className={scope === value ? "tab-button active" : "tab-button"}
            key={value}
            type="button"
            onClick={() => setScope(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? <PageError message={error} onRetry={loadQueue} /> : null}

      <section className="data-panel">
        <div className="table-header admin-table">
          <span>Tài liệu</span>
          <span>Người gửi</span>
          <span>Cờ rủi ro</span>
          <span>Rủi ro</span>
          <span>Trạng thái</span>
          <span>Thời gian chờ</span>
        </div>
        {isLoading ? (
          <div className="empty-state">Đang tải hàng chờ rà soát</div>
        ) : documents.length ? (
          <div className="table-body">
            {documents.map((document) => (
              <Link className="table-row admin-table" href={`/admin/documents/${document.id}`} key={document.id} prefetch={false}>
                <div>
                  <strong>{document.filename}</strong>
                  <span>{formatDateTime(document.uploaded_at)}</span>
                </div>
                <span>{document.owner_email}</span>
                <FlagList flags={document.flag_reasons.slice(0, 3)} />
                <RiskBadge score={document.risk_score} />
                <StatusBadge status={document.review_status} />
                <span>{ageFromNow(document.uploaded_at)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Không có tài liệu">Tài liệu phù hợp bộ lọc sẽ xuất hiện ở đây.</EmptyState>
        )}
      </section>
    </section>
  );
}
