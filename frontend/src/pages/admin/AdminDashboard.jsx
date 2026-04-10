import { useMemo } from "react";

import Card, { CardContent } from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import KpiCard from "../../components/ui/KpiCard.jsx";
import RiskBadge from "../../components/ui/RiskBadge.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { useCases } from "../../hooks/useCases.js";
import { formatDateTime, formatSlaLabel } from "../../lib/formatters.js";

export default function AdminDashboard() {
  const { cases, isReady } = useCases();

  const totals = useMemo(() => {
    const total = cases.length;
    const processing = cases.filter((entry) => !["auto_published", "finalized"].includes(entry.status)).length;
    const needsAttention = cases.filter((entry) => entry.needsAttention).length;
    const qualityWarning = cases.filter((entry) => Boolean(entry.review?.qualityWarning)).length;
    return { total, processing, needsAttention, qualityWarning };
  }, [cases]);

  const riskDistribution = useMemo(
    () => ({
      low: cases.filter((entry) => entry.riskLevel === "low").length,
      medium: cases.filter((entry) => entry.riskLevel === "medium").length,
      high: cases.filter((entry) => entry.riskLevel === "high").length,
    }),
    [cases],
  );

  const statusDistribution = useMemo(() => {
    const buckets = [
      { key: "uploaded", label: "Đã tải lên", count: 0 },
      { key: "extracting", label: "OCR", count: 0 },
      { key: "ai_analyzing", label: "Phân tích AI", count: 0 },
      { key: "auto_published", label: "Đã công bố", count: 0 },
      { key: "finalized", label: "Hoàn tất", count: 0 },
    ];
    for (const entry of cases) {
      const bucket = buckets.find((item) => item.key === entry.status);
      if (bucket) bucket.count += 1;
    }
    return buckets;
  }, [cases]);

  const latestCases = useMemo(
    () =>
      [...cases]
        .sort((leftCase, rightCase) => new Date(rightCase.createdAt).getTime() - new Date(leftCase.createdAt).getTime())
        .slice(0, 10),
    [cases],
  );

  const tableColumns = [
    { key: "id", label: "Mã hồ sơ", sortable: true },
    { key: "title", label: "Khách hàng / Hồ sơ" },
    { key: "status", label: "Trạng thái", render: (row) => <StatusBadge status={row.status} /> },
    { key: "riskLevel", label: "Rủi ro", render: (row) => <RiskBadge level={row.riskLevel} /> },
    { key: "slaDueAt", label: "SLA", render: (row) => formatSlaLabel(row.slaDueAt) },
    { key: "createdAt", label: "Ngày tạo", sortable: true, render: (row) => formatDateTime(row.createdAt) },
  ];

  function toPercent(value) {
    if (!totals.total) return 0;
    return Math.round((value / totals.total) * 100);
  }

  if (!isReady) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="loading-shimmer h-44 rounded-[24px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-gradient-to-br from-white via-white to-brand-50">
        <CardContent className="space-y-4 p-6">
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">Bảng điều hành vận hành</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Theo dõi nhanh các chỉ số chính, phân bố rủi ro và danh sách hồ sơ mới nhất trong hệ thống.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Tỷ lệ đọc dữ liệu" value="96%" trend="+2,1%" />
        <KpiCard label="Tỷ lệ cảnh báo" value="4%" />
        <KpiCard label="Tự động phân luồng" value="82%" />
        <KpiCard label="Xử lý trung bình" value="1,2 giây" tone="accent" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Tổng hồ sơ" value={totals.total} />
        <KpiCard label="Đang xử lý" value={totals.processing} />
        <KpiCard label="Cần chú ý" value={totals.needsAttention} tone="accent" />
        <KpiCard label="Cảnh báo chất lượng" value={totals.qualityWarning} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm font-semibold text-slate-900">Phân bố rủi ro</p>
            {totals.total ? (
              <div className="space-y-4">
                {[
                  { label: "Thấp", value: riskDistribution.low, color: "bg-emerald-500" },
                  { label: "Trung bình", value: riskDistribution.medium, color: "bg-amber-500" },
                  { label: "Cao", value: riskDistribution.high, color: "bg-rose-500" },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100">
                      <div className={`h-3 rounded-full ${item.color}`} style={{ width: `${toPercent(item.value)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState compact title="Chưa có dữ liệu rủi ro" description="Tạo hoặc nạp hồ sơ để hiển thị biểu đồ phân bố rủi ro." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm font-semibold text-slate-900">Hồ sơ theo trạng thái</p>
            {totals.total ? (
              <div className="space-y-4">
                {statusDistribution.map((item) => (
                  <div key={item.key} className="grid grid-cols-[150px_minmax(0,1fr)_40px] items-center gap-3 text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <div className="h-3 rounded-full bg-slate-100">
                      <div className="h-3 rounded-full bg-sky-500" style={{ width: `${toPercent(item.count)}%` }} />
                    </div>
                    <span className="text-right text-slate-600">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState compact title="Chưa có dữ liệu trạng thái" description="Chart sẽ hiển thị khi có hồ sơ trong hệ thống." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Hồ sơ mới cập nhật</h3>
            <p className="text-sm text-slate-500">Bảng theo dõi nhanh mã hồ sơ, mức rủi ro, SLA và trạng thái xử lý.</p>
          </div>
          <DataTable
            columns={tableColumns}
            rows={latestCases}
            searchKeys={["id", "title", "status", "riskLevel"]}
            emptyTitle="Chưa có hồ sơ gần đây"
            emptyDescription="Bảng sẽ hiển thị 10 hồ sơ mới nhất khi hệ thống có dữ liệu."
          />
        </CardContent>
      </Card>
    </div>
  );
}
