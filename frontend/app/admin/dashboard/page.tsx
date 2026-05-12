"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AdminStats, fetchAdminStats } from "@/lib/api";
import { humanStatus } from "@/lib/format";
import { PageError } from "@/components/ui";

const statLabels: Array<[keyof AdminStats, string, string]> = [
  ["total_documents", "Tổng tài liệu", "Tất cả lượt gửi"],
  ["ai_approved", "AI đã duyệt", "Tự động thông qua"],
  ["pending_admin", "Chờ admin", "Cần người rà soát xử lý"],
  ["admin_rejected", "Đã từ chối", "Quyết định thủ công"],
  ["agreement_rate", "Tỷ lệ duyệt", "Tỷ lệ được thông qua"],
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tải bảng tổng quan");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Vận hành</p>
          <h1>Bảng tổng quan</h1>
        </div>
        <button className="secondary-button" type="button" onClick={loadStats} disabled={isLoading}>
          <RefreshCw size={16} aria-hidden="true" />
          <span>Làm mới</span>
        </button>
      </header>

      {error ? <PageError message={error} onRetry={loadStats} /> : null}

      <section className="stat-grid">
        {statLabels.map(([key, label, hint]) => {
          const value = stats?.[key];
          const displayValue = key === "agreement_rate" ? `${value ?? 0}%` : String(value ?? 0);
          return (
            <div className="stat-panel" key={key}>
              <span>{label}</span>
              <strong>{displayValue}</strong>
              <small>{hint}</small>
            </div>
          );
        })}
      </section>

      <section className="data-panel insight-panel">
        <div>
          <span>Lý do gắn cờ nhiều nhất</span>
          <strong>{stats?.top_flag_reason ? humanStatus(stats.top_flag_reason) : "Chưa có cờ rủi ro"}</strong>
        </div>
        <div>
          <span>Admin đã duyệt</span>
          <strong>{stats?.admin_approved ?? 0}</strong>
        </div>
        <div>
          <span>Thất bại</span>
          <strong>{stats?.failed ?? 0}</strong>
        </div>
      </section>
    </section>
  );
}
