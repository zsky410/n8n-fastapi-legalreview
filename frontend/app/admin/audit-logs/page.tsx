"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AuditLog, fetchAuditLogs } from "@/lib/api";
import { formatDateTime, humanStatus } from "@/lib/format";
import { EmptyState, PageError } from "@/components/ui";

export default function AdminAuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuditLogs = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchAuditLogs();
      setAuditLogs(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tải nhật ký kiểm soát");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAuditLogs();
  }, [loadAuditLogs]);

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Truy vết</p>
          <h1>Nhật ký kiểm soát</h1>
        </div>
        <button className="secondary-button" type="button" onClick={loadAuditLogs} disabled={isLoading}>
          <RefreshCw size={16} aria-hidden="true" />
          <span>Làm mới</span>
        </button>
      </header>

      {error ? <PageError message={error} onRetry={loadAuditLogs} /> : null}

      <section className="data-panel">
        <div className="table-header audit-table">
          <span>Hành động</span>
          <span>Người thực hiện</span>
          <span>Đối tượng</span>
          <span>Thời gian</span>
        </div>
        {isLoading ? (
          <div className="empty-state">Đang tải nhật ký kiểm soát</div>
        ) : auditLogs.length ? (
          <div className="table-body">
            {auditLogs.map((log) => (
              <div className="table-row audit-table" key={log.id}>
                <div>
                  <strong>{humanStatus(log.action)}</strong>
                  <span>{JSON.stringify(log.payload).slice(0, 120)}</span>
                </div>
                <span>{log.actor_email ?? "Hệ thống"}</span>
                <span>{humanStatus(log.target_type)}</span>
                <span>{formatDateTime(log.created_at)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Chưa có sự kiện kiểm soát">Tải lên, AI rà soát, callback và quyết định người rà soát sẽ xuất hiện ở đây.</EmptyState>
        )}
      </section>
    </section>
  );
}
