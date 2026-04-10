import { ArrowRight, FilePlus2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Card, { CardContent } from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import KpiCard from "../../components/ui/KpiCard.jsx";
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

export default function ClientDashboard() {
  const { cases, isReady } = useCases();
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
          className="inline-flex items-center justify-end gap-2 rounded-sm border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:border-gold/40 hover:bg-brand-50 hover:text-gold"
        >
          Mở hồ sơ
          <ArrowRight className="h-4 w-4" />
        </Link>
      ),
    },
  ];

  if (!isReady) {
    return (
      <div className="surface-panel flex items-center justify-center px-6 py-16">
        <Spinner className="h-8 w-8 text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-ink">Hồ sơ của tôi</h2>
              <p className="mt-2 text-sm text-muted">Theo dõi trạng thái xử lý, mức rủi ro và mở nhanh từng hồ sơ từ một bảng tổng hợp duy nhất.</p>
            </div>
            <Link
              to="/client/cases/new"
              className="inline-flex items-center gap-2 rounded-sm bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
            >
              <FilePlus2 className="h-4 w-4" />
              Tạo hồ sơ mới
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Tổng hồ sơ" value={cases.length} variant="total" />
        <KpiCard label="Đang xử lý" value={processingCount} variant="processing" />
        <KpiCard label="Đã công bố" value={completedCount} variant="published" />
        <KpiCard label="Cần chú ý" value={needsAttentionCount} variant="attention" />
      </div>

      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-ink">Danh sách hồ sơ</h3>
              <p className="text-sm text-muted">Lọc nhanh theo mức độ ưu tiên xử lý và mở ngay hồ sơ cần theo dõi.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeFilter === filter.value
                      ? "!bg-ink text-white shadow-sm"
                      : "border border-line bg-white text-muted hover:border-gold/40 hover:text-gold"
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
                  className="inline-flex items-center gap-2 rounded-sm bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
                >
                  <FilePlus2 className="h-4 w-4" />
                  Tạo hồ sơ mới
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
