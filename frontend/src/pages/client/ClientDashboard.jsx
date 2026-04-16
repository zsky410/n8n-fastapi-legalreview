import { AlertTriangle, ArrowRight, FilePlus2, FolderClock, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PageFrame from "../../components/layout/PageFrame.jsx";
import Card, { CardContent, CardHeader, CardTitle } from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import RiskBadge from "../../components/ui/RiskBadge.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { useCases } from "../../hooks/useCases.js";
import { formatDateTime } from "../../lib/formatters.js";

const filters = [
  { label: "Tất cả", value: "all" },
  { label: "Cần chú ý", value: "attention" },
  { label: "Đang xử lý", value: "processing" },
  { label: "Đã công bố", value: "published" },
];

function MetricCard({ label, value }) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white/82 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink tabular-nums">{value}</p>
    </div>
  );
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { cases, error, isReady } = useCases();
  const [activeFilter, setActiveFilter] = useState("all");

  const needsAttentionCount = cases.filter((entry) => entry.needsAttention).length;
  const completedCount = cases.filter((entry) => entry.status === "finalized" || entry.status === "auto_published").length;
  const processingCount = cases.filter((entry) => entry.status !== "finalized" && entry.status !== "auto_published").length;
  const highRiskCount = cases.filter((entry) => entry.riskLevel === "high").length;
  const publishedRatio = cases.length ? Math.round((completedCount / cases.length) * 100) : 0;

  const filteredCases = useMemo(() => {
    if (activeFilter === "attention") {
      return cases.filter((entry) => entry.needsAttention);
    }

    if (activeFilter === "processing") {
      return cases.filter((entry) => entry.status !== "finalized" && entry.status !== "auto_published");
    }

    if (activeFilter === "published") {
      return cases.filter((entry) => entry.status === "finalized" || entry.status === "auto_published");
    }

    return cases;
  }, [activeFilter, cases]);

  const recentCases = [...cases].sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt)).slice(0, 3);

  const statusSummary = [
    { label: "Đang xử lý", value: processingCount, width: cases.length ? Math.max((processingCount / cases.length) * 100, 12) : 0 },
    { label: "Đã công bố", value: completedCount, width: cases.length ? Math.max((completedCount / cases.length) * 100, 12) : 0 },
    { label: "Cần chú ý", value: needsAttentionCount, width: cases.length ? Math.max((needsAttentionCount / cases.length) * 100, 12) : 0 },
  ];

  const columns = [
    {
      key: "id",
      label: "Mã hồ sơ",
      sortable: true,
      className: "w-[13%] min-w-[8.5rem]",
      render: (row) => (
        <div>
          <p className="font-semibold text-ink">{row.id}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">{row.domain || "General"}</p>
        </div>
      ),
    },
    {
      key: "documentName",
      label: "Tài liệu",
      sortable: true,
      className: "w-[34%] min-w-0",
      render: (row) => (
        <div className="min-w-0 pr-2">
          <p className="break-words font-semibold text-ink">{row.documentName}</p>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{row.title}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      sortable: true,
      className: "w-[16%]",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "riskLevel",
      label: "Rủi ro",
      sortable: true,
      className: "w-[12%]",
      render: (row) => <RiskBadge level={row.riskLevel} />,
    },
    {
      key: "createdAt",
      label: "Cập nhật",
      sortable: true,
      className: "w-[13%] whitespace-nowrap",
      render: (row) => <span className="text-sm text-muted">{formatDateTime(row.updatedAt || row.createdAt)}</span>,
    },
    {
      key: "action",
      label: "Chi tiết",
      className: "w-[12%] min-w-[8.5rem] text-right",
      render: (row) => (
        <Link
          to={`/client/cases/${row.id}`}
          className="inline-flex items-center justify-end gap-2 rounded-[14px] border border-slate-200/80 bg-white px-3 py-2 text-[13px] font-semibold text-ink transition hover:border-brand-500/20 hover:text-brand-700"
        >
          Mở hồ sơ
          <ArrowRight className="h-4 w-4" />
        </Link>
      ),
    },
  ];

  if (!isReady) {
    return (
      <PageFrame eyebrow="Client Operations" title="Danh mục hồ sơ">
        <div className="flex items-center justify-center py-16">
          <Spinner className="h-8 w-8 text-brand-700" />
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame
      eyebrow="Client Operations"
      title="Danh mục hồ sơ"
      description="Theo dõi trạng thái và mở nhanh từng hồ sơ."
      actions={
        <Link
          to="/client/cases/new"
          className="inline-flex items-center gap-2 rounded-[16px] bg-brand-500 px-5 py-3 text-sm font-semibold text-brand-foreground shadow-[0_18px_36px_rgba(24,49,115,0.22)] transition hover:bg-brand-600"
        >
          <FilePlus2 className="h-4 w-4" />
          Tạo hồ sơ mới
        </Link>
      }
    >
      {error ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm leading-6 text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <Card className="overflow-hidden">
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Tổng hồ sơ" value={cases.length} />
              <MetricCard label="Đang xử lý" value={processingCount} />
              <MetricCard label="Rủi ro cao" value={highRiskCount} />
              <MetricCard label="Cần chú ý" value={needsAttentionCount} />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(238,244,255,0.92),rgba(255,255,255,0.96))] p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-700">Tổng quan</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[20px] border border-white/60 bg-white/75 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Hoạt động</p>
                    <p className="mt-2 text-lg font-semibold text-ink">{processingCount || 0}</p>
                  </div>
                  <div className="rounded-[20px] border border-white/60 bg-white/75 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Đã công bố</p>
                    <p className="mt-2 text-lg font-semibold text-ink">{completedCount || 0}</p>
                  </div>
                  <div className="rounded-[20px] border border-white/60 bg-white/75 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Tỷ lệ</p>
                    <p className="mt-2 text-lg font-semibold text-ink">{publishedRatio}%</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] bg-warm-900 p-6 text-white shadow-[0_28px_60px_rgba(15,23,42,0.18)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/44">Pipeline Snapshot</p>
                    <p className="mt-2 text-lg font-semibold text-white">Nhịp xử lý hiện tại</p>
                  </div>
                  <FolderClock className="h-5 w-5 text-[#d9b265]" />
                </div>
                <div className="mt-6 space-y-4">
                  {statusSummary.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-white/70">{item.label}</span>
                        <span className="font-semibold text-white">{item.value}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-white/10">
                        <div className="h-2 rounded-full bg-[#d9b265]" style={{ width: `${item.width}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-[20px] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/44">Tín hiệu</p>
                  <p className="mt-2 text-sm text-white/72">
                    {needsAttentionCount ? `${needsAttentionCount} hồ sơ cần chú ý` : "Ổn định"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">Ưu tiên hôm nay</p>
                  <CardTitle>Case cần nhìn lại</CardTitle>
                </div>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentCases.length ? (
                recentCases.map((caseItem) => (
                  <Link
                    key={caseItem.id}
                    to={`/client/cases/${caseItem.id}`}
                    className="block rounded-[22px] border border-slate-200/80 bg-[#f8fafc] px-4 py-4 transition hover:border-brand-500/20 hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-ink">{caseItem.title}</p>
                      {caseItem.needsAttention ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-900">
                          Cần chú ý
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge status={caseItem.status} />
                      <RiskBadge level={caseItem.riskLevel} />
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyState compact title="Chưa có hồ sơ" description="Tạo hồ sơ đầu tiên để bắt đầu luồng intake." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">Workspace Filters</p>
                  <CardTitle>Lọc nhanh theo mục tiêu</CardTitle>
                </div>
                <ShieldCheck className="h-5 w-5 text-brand-700" />
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={
                    activeFilter === filter.value
                      ? "rounded-full bg-brand-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_12px_24px_rgba(24,49,115,0.18)]"
                      : "rounded-full border border-slate-200/80 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted transition hover:border-brand-500/20 hover:text-brand-700"
                  }
                >
                  {filter.label}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {cases.length ? (
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">Matter Registry</p>
                <CardTitle>Danh sách hồ sơ theo dõi</CardTitle>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                {filteredCases.length} / {cases.length} hồ sơ
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              flat
              rows={filteredCases}
              searchKeys={["id", "title", "documentName", "status", "riskLevel"]}
              emptyTitle="Không có hồ sơ khớp bộ lọc"
              emptyDescription="Thử đổi bộ lọc hoặc tạo hồ sơ mới để tiếp tục theo dõi xử lý."
            />
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="Chưa có hồ sơ nào"
          description="Bắt đầu intake đầu tiên để hệ thống có dữ liệu phân tích, lưu trữ matter và mở room trao đổi theo hồ sơ."
          action={{
            label: "Tạo hồ sơ mới",
            props: {
              onClick: () => navigate("/client/cases/new"),
            },
          }}
        />
      )}
    </PageFrame>
  );
}
