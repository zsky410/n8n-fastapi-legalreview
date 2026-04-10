import { ArrowRight, Clock3, FilePlus2, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Badge from "../../components/ui/Badge.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import KpiCard from "../../components/ui/KpiCard.jsx";
import RiskBadge from "../../components/ui/RiskBadge.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { useCases } from "../../hooks/useCases.js";
import { formatDateTime, formatSlaLabel } from "../../lib/formatters.js";

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
      key: "title",
      label: "Hồ sơ",
      sortable: true,
      render: (row) => (
        <div className="min-w-[240px]">
          <p className="font-semibold text-slate-900">{row.title}</p>
          <p className="mt-1 text-xs text-slate-500">{row.id}</p>
          <p className="mt-2 text-sm text-slate-500">{row.documentName}</p>
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
      key: "updatedAt",
      label: "Cập nhật",
      sortable: true,
      render: (row) => (
        <div className="min-w-[148px]">
          <p className="font-medium text-slate-700">{formatDateTime(row.updatedAt)}</p>
          <p className="mt-1 text-xs text-slate-500">{formatSlaLabel(row.slaDueAt)}</p>
        </div>
      ),
    },
    {
      key: "needsAttention",
      label: "Theo dõi",
      render: (row) => (
        <Badge className={row.needsAttention ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}>
          {row.needsAttention ? "Cần follow-up" : "Ổn định"}
        </Badge>
      ),
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
          Mở case
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
      <Card className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_38%),linear-gradient(135deg,#ffffff_0%,#eef8ff_54%,#ecfeff_100%)]">
        <CardContent className="grid gap-5 p-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <Badge className="border-brand-100 bg-white/80 text-brand-700">Milestone 5 client workspace</Badge>
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">Theo dõi hồ sơ, xem risk score và đi thẳng vào từng case.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                Dashboard này gom những thứ client cần nhất trong Milestone 5: số liệu tổng quan, trạng thái hồ sơ, tín hiệu rủi ro và lối tắt sang CreateCase hoặc CaseDetail.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/client/cases/new"
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <FilePlus2 className="h-4 w-4" />
                Tạo hồ sơ mới
              </Link>
              {cases[0] ? (
                <Link
                  to={`/client/cases/${cases[0].id}`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Sparkles className="h-4 w-4" />
                  Mở case gần nhất
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm shadow-brand-100/70 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Auto-review readiness</p>
                  <p className="text-sm text-slate-500">Mock-first flow đã đủ để demo end-to-end.</p>
                </div>
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-900/10 bg-slate-950 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Case spotlight</p>
              <p className="mt-4 text-lg font-semibold">{cases[0]?.title || "Chưa có hồ sơ nào trong workspace"}</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {cases[0]?.review?.summary || "Tạo case mới để xem review mock-first, chat theo hồ sơ và timeline SLA trong cùng một route."}
              </p>
              {cases[0]?.slaDueAt ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatSlaLabel(cases[0].slaDueAt)}
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Tổng hồ sơ" value={cases.length} trend="+mock/local state" />
        <KpiCard label="Đang xử lý" value={processingCount} />
        <KpiCard label="Đã công bố" value={completedCount} />
        <KpiCard label="Cần chú ý" value={needsAttentionCount} tone="accent" />
      </div>

      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Danh sách hồ sơ</h3>
              <p className="text-sm text-slate-500">Bảng này là entry point chính cho toàn bộ flow Milestone 5 phía client.</p>
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
              emptyDescription="Thử đổi quick filter hoặc tạo hồ sơ mới để tiếp tục demo flow."
            />
          ) : (
            <div className="space-y-4">
              <EmptyState
                title="Chưa có hồ sơ nào"
                description="Bắt đầu từ CreateCase để tạo case đầu tiên, sau đó quay lại đây để theo dõi trạng thái và mức rủi ro."
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
