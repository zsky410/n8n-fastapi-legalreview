import { ArrowRight, FilePlus2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import PageFrame from "../../components/layout/PageFrame.jsx";
import Card from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import RiskBadge from "../../components/ui/RiskBadge.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { useCases } from "../../hooks/useCases.js";
import { ROLE_LABELS } from "../../lib/constants.js";
import { formatDateTime } from "../../lib/formatters.js";

const filters = [
  { label: "Tất cả", value: "all" },
  { label: "Cần chú ý", value: "attention" },
  { label: "Đang xử lý", value: "processing" },
  { label: "Đã công bố", value: "published" },
];

export default function ClientDashboard() {
  const { cases, error, isReady } = useCases();
  const [activeFilter, setActiveFilter] = useState("all");

  const needsAttentionCount = cases.filter((entry) => entry.needsAttention).length;
  const completedCount = cases.filter((entry) => entry.status === "finalized" || entry.status === "auto_published").length;
  const processingCount = cases.filter((entry) => entry.status !== "finalized" && entry.status !== "auto_published").length;

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

  const columns = [
    {
      key: "id",
      label: "Mã hồ sơ",
      sortable: true,
      className: "w-[12%] min-w-[8.5rem]",
      render: (row) => <span className="font-semibold text-ink">{row.id}</span>,
    },
    {
      key: "documentName",
      label: "Tên tài liệu",
      sortable: true,
      className: "w-[32%] min-w-0",
      render: (row) => (
        <div className="min-w-0 pr-2">
          <p className="break-words font-semibold text-ink">{row.documentName}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted">{row.title}</p>
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
      label: "Ngày tạo",
      sortable: true,
      className: "w-[14%] whitespace-nowrap",
      render: (row) => <span className="text-muted">{formatDateTime(row.createdAt)}</span>,
    },
    {
      key: "action",
      label: "Chi tiết",
      className: "w-[14%] min-w-[8.5rem] text-right",
      render: (row) => (
        <Link
          to={`/client/cases/${row.id}`}
          className="inline-flex items-center justify-end gap-2 rounded border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
        >
          Mở hồ sơ
          <ArrowRight className="h-4 w-4" />
        </Link>
      ),
    },
  ];

  if (!isReady) {
    return (
      <PageFrame segments={[ROLE_LABELS.client, "Tổng quan"]}>
        <div className="flex items-center justify-center py-16">
          <Spinner className="h-8 w-8 text-brand-700" />
        </div>
      </PageFrame>
    );
  }

  const stats = [
    { label: "Tổng hồ sơ", value: cases.length, tone: "neutral" },
    { label: "Đang xử lý", value: processingCount, tone: "brand" },
    { label: "Đã công bố", value: completedCount, tone: "positive" },
    { label: "Cần chú ý", value: needsAttentionCount, tone: "warning" },
  ];

  const statToneClasses = {
    neutral: "bg-surface text-ink",
    brand: "bg-brand-50 text-brand-700",
    positive: "bg-wise-mint/70 text-wise-positive",
    warning: "bg-yellow-50 text-amber-950",
  };

  return (
    <PageFrame segments={[ROLE_LABELS.client, "Tổng quan"]}>
      <div className="space-y-6">
        {error ? (
          <div className="rounded-card border border-wise-danger/30 bg-red-50 px-4 py-3 text-sm text-wise-danger">
            {error}
          </div>
        ) : null}

        <section className="flex flex-wrap items-center justify-between gap-4 px-1">
          <div>
            <h2 className="legal-display text-2xl font-semibold text-ink">Hồ sơ của tôi</h2>
            <p className="mt-2 text-sm text-muted">Theo dõi trạng thái xử lý, mức rủi ro và mở nhanh từng hồ sơ từ một bảng tổng hợp duy nhất.</p>
          </div>
          <Link
            to="/client/cases/new"
            className="motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:scale-105 motion-safe:active:scale-95 inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-base font-semibold text-brand-foreground shadow-ring"
          >
            <FilePlus2 className="h-4 w-4" />
            Tạo hồ sơ mới
          </Link>
        </section>

        <Card className="p-6">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-card border border-line bg-[#fffefa] shadow-ring">
              <div className="grid gap-px bg-line md:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className={`min-h-[120px] px-5 py-5 ${statToneClasses[stat.tone]}`}>
                    <p className="text-sm font-semibold">{stat.label}</p>
                    <p className="mt-4 text-4xl font-semibold tracking-tight tabular-nums">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="legal-display text-xl font-semibold text-ink">Danh sách hồ sơ</h3>
                <p className="text-sm text-muted">Lọc nhanh theo mức độ ưu tiên xử lý và mở ngay hồ sơ cần theo dõi.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setActiveFilter(filter.value)}
                    className={`motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:scale-105 rounded-full px-4 py-2 text-base font-semibold transition ${
                      activeFilter === filter.value
                        ? "!bg-brand-500 text-brand-foreground shadow-ring"
                        : "border border-line bg-[#fffefa] text-muted hover:border-brand-500/40 hover:bg-brand-200/50 hover:text-ink"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {cases.length ? (
              <DataTable
                columns={columns}
                flat
                rows={filteredCases}
                searchKeys={["id", "title", "documentName", "status", "riskLevel"]}
                emptyTitle="Không có hồ sơ khớp bộ lọc"
                emptyDescription="Thử đổi bộ lọc hoặc tạo hồ sơ mới để tiếp tục theo dõi xử lý."
              />
            ) : (
              <div className="space-y-4">
                <EmptyState
                  title="Chưa có hồ sơ nào"
                  description="Bắt đầu tạo hồ sơ đầu tiên, sau đó quay lại đây để theo dõi trạng thái và mức rủi ro."
                />
                <div className="flex justify-center">
                  <Link
                    to="/client/cases/new"
                    className="motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:scale-105 motion-safe:active:scale-95 inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-base font-semibold text-brand-foreground shadow-ring"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Tạo hồ sơ mới
                  </Link>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageFrame>
  );
}
