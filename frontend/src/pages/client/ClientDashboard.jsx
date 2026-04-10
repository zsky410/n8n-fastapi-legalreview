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
      render: (row) => <span className="font-semibold text-slate-900">{row.id}</span>,
    },
    {
      key: "documentName",
      label: "Tên tài liệu",
      sortable: true,
      render: (row) => (
        <div className="min-w-[240px]">
          <p className="font-semibold text-slate-900">{row.documentName}</p>
          <p className="mt-1 text-xs text-slate-500">{row.title}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "riskLevel",
      label: "Rủi ro",
      sortable: true,
      render: (row) => <RiskBadge level={row.riskLevel} />,
    },
    {
      key: "createdAt",
      label: "Ngày tạo",
      sortable: true,
      render: (row) => <span className="text-slate-700">{formatDateTime(row.createdAt)}</span>,
    },
    {
      key: "action",
      label: "Chi tiết",
      className: "w-[132px]",
      render: (row) => (
        <Link
          to={`/client/cases/${row.id}`}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
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
        <Spinner className="h-8 w-8 text-brand-700" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Hồ sơ của tôi</h2>
              <p className="mt-2 text-sm text-slate-500">Theo dõi trạng thái xử lý, mức rủi ro và mở nhanh từng hồ sơ từ một bảng tổng hợp duy nhất.</p>
            </div>
            <Link
              to="/client/cases/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              <FilePlus2 className="h-4 w-4" />
              Tạo hồ sơ mới
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Tổng hồ sơ" value={cases.length} />
        <KpiCard label="Đang xử lý" value={processingCount} />
        <KpiCard label="Đã công bố" value={completedCount} />
        <KpiCard label="Cần chú ý" value={needsAttentionCount} tone="accent" />
      </div>

      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Danh sách hồ sơ</h3>
              <p className="text-sm text-slate-500">Lọc nhanh theo mức độ ưu tiên xử lý và mở ngay hồ sơ cần theo dõi.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeFilter === filter.value
                      ? "bg-brand-500 text-white shadow-sm shadow-brand-200"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700"
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
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
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
