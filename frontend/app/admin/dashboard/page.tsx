"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Route,
  Webhook,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AdminStats,
  AdminWorkflowActivityPoint,
  AdminWorkflowLog,
  AdminWorkflowObservability,
  fetchAdminStats,
  fetchAdminWorkflowLogs,
} from "@/lib/api";
import { formatDateTime, humanStatus } from "@/lib/format";
import { EmptyState, PageError } from "@/components/ui";

type KpiCard = {
  label: string;
  value: string;
  hint: string;
  tone: "success" | "warning" | "danger" | "neutral";
  icon: LucideIcon;
};

const emptyWorkflow: AdminWorkflowObservability = {
  total_events: 0,
  success_events: 0,
  failed_events: 0,
  in_progress_events: 0,
  success_rate: 0,
  latest_event_at: null,
  latest_status: null,
  status_counts: [],
  workflow_counts: [],
  activity: [],
  recent_events: [],
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [workflow, setWorkflow] = useState<AdminWorkflowObservability>(emptyWorkflow);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const [statsData, workflowData] = await Promise.all([
        fetchAdminStats(),
        fetchAdminWorkflowLogs({ days: 7, limit: 24 }),
      ]);
      setStats(statsData);
      setWorkflow(workflowData);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tải dashboard vận hành");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const kpis = useMemo<KpiCard[]>(
    () => [
      {
        label: "Tài liệu trong hệ thống",
        value: String(stats?.total_documents ?? 0),
        hint: `${stats?.needs_reviewer ?? 0} hồ sơ cần người rà soát`,
        tone: "neutral",
        icon: Route,
      },
      {
        label: "Workflow events",
        value: String(workflow.total_events),
        hint: workflow.latest_event_at ? `Mới nhất ${formatDateTime(workflow.latest_event_at)}` : "Chưa có callback n8n",
        tone: "neutral",
        icon: Workflow,
      },
      {
        label: "Tỷ lệ workflow ổn định",
        value: `${workflow.success_rate}%`,
        hint: `${workflow.success_events} thành công / ${workflow.failed_events} lỗi`,
        tone: workflow.failed_events ? "warning" : "success",
        icon: CheckCircle2,
      },
      {
        label: "Callback cần chú ý",
        value: String(workflow.failed_events + workflow.in_progress_events),
        hint: `${workflow.in_progress_events} đang chờ hoặc trạng thái khác`,
        tone: workflow.failed_events ? "danger" : "warning",
        icon: AlertTriangle,
      },
    ],
    [stats, workflow],
  );

  return (
    <section className="page-stack admin-command-center">
      <header className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Workflow command center</p>
          <h1>Dashboard vận hành n8n</h1>
          <p>
            Theo dõi callback, trạng thái xử lý tài liệu, lỗi workflow và nhịp hoạt động tự động hóa trong một màn hình duy nhất.
          </p>
        </div>
        <div className="dashboard-hero-actions">
          <div className="hero-health-card">
            <span>Trạng thái mới nhất</span>
            <strong>{workflow.latest_status ? humanStatus(workflow.latest_status) : "Chưa có event"}</strong>
            <small>{workflow.latest_event_at ? formatDateTime(workflow.latest_event_at) : "Đang chờ log đầu tiên từ n8n"}</small>
          </div>
          <button className="secondary-button" type="button" onClick={loadDashboard} disabled={isLoading}>
            <RefreshCw className={isLoading ? "spin-icon" : undefined} size={16} aria-hidden="true" />
            <span>Làm mới</span>
          </button>
        </div>
      </header>

      {error ? <PageError message={error} onRetry={loadDashboard} /> : null}

      <section className="workflow-kpi-grid" aria-label="Chỉ số chính">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <article className={`workflow-kpi-card ${item.tone}`} key={item.label}>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.hint}</small>
              </div>
              <Icon size={22} aria-hidden="true" />
            </article>
          );
        })}
      </section>

      <section className="workflow-dashboard-grid">
        <article className="data-panel workflow-chart-panel">
          <PanelHeading
            icon={BarChart3}
            kicker="7 ngày gần nhất"
            title="Nhịp callback workflow"
            description="Cột xanh là callback thành công, đỏ là lỗi, vàng là trạng thái đang chờ hoặc chưa phân loại."
          />
          <ActivityChart points={workflow.activity} />
        </article>

        <article className="data-panel workflow-health-panel">
          <PanelHeading
            icon={Activity}
            kicker="Sức khỏe vận hành"
            title="Tỷ lệ trạng thái"
            description="Tổng hợp nhanh mọi event n8n đã ghi nhận."
          />
          <StatusDonut workflow={workflow} />
        </article>
      </section>

      <section className="workflow-dashboard-grid compact">
        <article className="data-panel workflow-breakdown-panel">
          <PanelHeading
            icon={Webhook}
            kicker="Workflow đang chạy"
            title="Top workflow theo callback"
            description="Dựa trên payload.workflow hoặc tiền tố event_type."
          />
          <WorkflowBars workflow={workflow} />
        </article>

        <article className="data-panel workflow-breakdown-panel">
          <PanelHeading
            icon={Clock3}
            kicker="Tài liệu"
            title="Tình trạng review"
            description="Ghép nhịp automation với backlog người rà soát."
          />
          <DocumentOps stats={stats} />
        </article>
      </section>

      <section className="data-panel workflow-log-panel">
        <div className="workflow-log-heading">
          <PanelHeading
            icon={Workflow}
            kicker="Live log"
            title="Nhật ký workflow gần nhất"
            description="Mỗi dòng là một callback n8n đã được backend ghi nhận và lưu audit."
          />
          <span className="status-pill neutral">{workflow.recent_events.length} event</span>
        </div>

        {isLoading && !workflow.recent_events.length ? (
          <div className="empty-state">Đang tải workflow log</div>
        ) : workflow.recent_events.length ? (
          <div className="workflow-log-list">
            {workflow.recent_events.map((event) => (
              <WorkflowLogRow event={event} key={event.id} />
            ))}
          </div>
        ) : (
          <EmptyState title="Chưa có workflow log">
            Khi n8n gọi webhook `/api/v1/webhooks/n8n-events`, callback sẽ xuất hiện ở đây cùng workflow, trạng thái và trace id.
          </EmptyState>
        )}
      </section>
    </section>
  );
}

function PanelHeading({
  icon: Icon,
  kicker,
  title,
  description,
}: {
  icon: LucideIcon;
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <div className="workflow-panel-heading">
      <span className="workflow-panel-icon" aria-hidden="true">
        <Icon size={17} />
      </span>
      <div>
        <span>{kicker}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function ActivityChart({ points }: { points: AdminWorkflowActivityPoint[] }) {
  const chartPoints = points.length ? points : [{ label: "Hôm nay", success: 0, failed: 0, other: 0 }];
  const maxValue = Math.max(...chartPoints.map((point) => point.success + point.failed + point.other), 1);

  return (
    <div className="workflow-activity-chart">
      {chartPoints.map((point) => {
        const total = point.success + point.failed + point.other;
        return (
          <div className="workflow-activity-day" key={point.label}>
            <div className="workflow-bar-track" aria-label={`${point.label}: ${total} event`}>
              <span className="bar-segment success" style={{ height: `${(point.success / maxValue) * 100}%` }} />
              <span className="bar-segment failed" style={{ height: `${(point.failed / maxValue) * 100}%` }} />
              <span className="bar-segment other" style={{ height: `${(point.other / maxValue) * 100}%` }} />
            </div>
            <span>{point.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatusDonut({ workflow }: { workflow: AdminWorkflowObservability }) {
  const total = Math.max(workflow.total_events, 1);
  const successDegrees = (workflow.success_events / total) * 360;
  const failedDegrees = (workflow.failed_events / total) * 360;
  const otherDegrees = (workflow.in_progress_events / total) * 360;

  return (
    <div className="workflow-health-body">
      <div
        className="workflow-donut"
        style={{
          background: `conic-gradient(var(--teal) 0deg ${successDegrees}deg, var(--rust) ${successDegrees}deg ${
            successDegrees + failedDegrees
          }deg, var(--gold) ${successDegrees + failedDegrees}deg ${successDegrees + failedDegrees + otherDegrees}deg, #e9e3d5 ${
            successDegrees + failedDegrees + otherDegrees
          }deg 360deg)`,
        }}
      >
        <span>{workflow.success_rate}%</span>
      </div>
      <div className="workflow-health-legend">
        <LegendItem label="Thành công" value={workflow.success_events} tone="success" />
        <LegendItem label="Lỗi" value={workflow.failed_events} tone="failed" />
        <LegendItem label="Khác" value={workflow.in_progress_events} tone="other" />
      </div>
    </div>
  );
}

function WorkflowBars({ workflow }: { workflow: AdminWorkflowObservability }) {
  const maxCount = Math.max(...workflow.workflow_counts.map((item) => item.count), 1);

  if (!workflow.workflow_counts.length) {
    return <div className="workflow-mini-empty">Chưa có callback trong cửa sổ 7 ngày.</div>;
  }

  return (
    <div className="workflow-bar-list">
      {workflow.workflow_counts.map((item) => (
        <div className="workflow-horizontal-bar" key={item.label}>
          <div>
            <strong>{formatWorkflowName(item.label)}</strong>
            <span>{item.count} event</span>
          </div>
          <div className="workflow-horizontal-track">
            <span style={{ width: `${(item.count / maxCount) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DocumentOps({ stats }: { stats: AdminStats | null }) {
  const items = [
    ["AI đã duyệt", stats?.ai_approved ?? 0, "success"],
    ["Cần người rà soát", stats?.needs_reviewer ?? 0, "warning"],
    ["Người rà soát duyệt", stats?.reviewer_approved ?? 0, "success"],
    ["Từ chối", stats?.reviewer_rejected ?? 0, "danger"],
    ["Thất bại", stats?.failed ?? 0, "danger"],
  ] as const;

  return (
    <div className="document-ops-list">
      {items.map(([label, value, tone]) => (
        <div className="document-ops-row" key={label}>
          <span className={`status-dot ${tone}`} />
          <strong>{label}</strong>
          <em>{value}</em>
        </div>
      ))}
      <div className="document-ops-highlight">
        <span>Lý do gắn cờ nhiều nhất</span>
        <strong>{stats?.top_flag_reason ? humanStatus(stats.top_flag_reason) : "Chưa có cờ rủi ro"}</strong>
      </div>
    </div>
  );
}

function WorkflowLogRow({ event }: { event: AdminWorkflowLog }) {
  const documentId = stringFromPayload(event.payload, "document_id");
  const rowContent = (
    <>
      <div className="workflow-log-main">
        <span className={`workflow-event-dot ${statusTone(event.status)}`} />
        <div>
          <strong>{humanStatus(event.event_type)}</strong>
          <span>{formatWorkflowName(event.workflow ?? event.event_type)}</span>
        </div>
      </div>
      <span className={`status-pill ${statusTone(event.status)}`}>{humanStatus(event.status)}</span>
      <span className="workflow-trace">{event.trace_id ?? "Không có trace"}</span>
      <span>{formatDateTime(event.created_at)}</span>
      <small>{payloadDigest(event.payload)}</small>
    </>
  );

  if (documentId) {
    return (
      <Link className="workflow-log-row" href={`/admin/documents/${documentId}`} prefetch={false}>
        {rowContent}
      </Link>
    );
  }

  return <div className="workflow-log-row">{rowContent}</div>;
}

function LegendItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "failed" | "other";
}) {
  return (
    <div className="workflow-legend-item">
      <span className={`status-dot ${tone}`} />
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}

function statusTone(status: string): "success" | "danger" | "warning" | "neutral" {
  const normalized = status.toLowerCase();
  if (normalized.includes("fail") || normalized.includes("error")) {
    return "danger";
  }
  if (normalized === "success" || normalized === "completed" || normalized === "sent" || normalized === "ok") {
    return "success";
  }
  if (normalized.includes("completed") || normalized.includes("sent")) {
    return "success";
  }
  if (normalized.includes("pending") || normalized.includes("processing") || normalized.includes("running")) {
    return "warning";
  }
  return "neutral";
}

function formatWorkflowName(value: string): string {
  const translated = humanStatus(value);
  if (translated !== value.replaceAll("_", " ").replaceAll(".", " ")) {
    return translated;
  }
  return value
    .split(/[-_.]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function payloadDigest(payload: Record<string, unknown>): string {
  const keys = [
    "workflow",
    "document_id",
    "channels",
    "status",
    "message",
    "error",
    "obligation_count",
    "high_priority_count",
  ];
  const compactPayload = keys.reduce<Record<string, unknown>>((accumulator, key) => {
    if (payload[key] !== undefined) {
      accumulator[key] = payload[key];
    }
    return accumulator;
  }, {});
  const hasCompactPayload = Object.keys(compactPayload).length > 0;
  return JSON.stringify(hasCompactPayload ? compactPayload : payload).slice(0, 180);
}

function stringFromPayload(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value : null;
}
