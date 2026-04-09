import { ArrowRight, FolderClock, Layers3, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

import Badge from "../../components/ui/Badge.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";
import KpiCard from "../../components/ui/KpiCard.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { useCases } from "../../hooks/useCases.js";

export default function ClientDashboard() {
  const { cases, isReady } = useCases();

  if (!isReady) {
    return (
      <div className="surface-panel flex items-center justify-center px-6 py-16">
        <Spinner className="h-8 w-8 text-brand-700" />
      </div>
    );
  }

  const needsAttentionCount = cases.filter((entry) => entry.needsAttention).length;
  const completedCount = cases.filter((entry) => entry.status === "finalized" || entry.status === "auto_published").length;
  const processingCount = cases.filter((entry) => entry.status !== "finalized" && entry.status !== "auto_published").length;

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-gradient-to-br from-white via-white to-brand-50">
        <CardContent className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <Badge className="border-brand-100 bg-brand-50 text-brand-700">Shell client đã sẵn sàng</Badge>
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">Dashboard scaffold đã sẵn sàng cho Phase 2.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Hiện tại dashboard tập trung xác nhận shell, role guard và summary card. Bảng hồ sơ đầy đủ sẽ được mở rộng trong phase tiếp theo.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/client/cases/new"
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Tạo hồ sơ mới
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={`/client/cases/${cases[0]?.id || "CASE-2604-001"}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Xem hồ sơ mẫu
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">Ghi chú nền tảng</p>
            <p className="mt-4 text-lg font-semibold">Cases đang đến từ mock/local state để mình ổn định IA trước khi bật feature thật.</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>Trang này đã có context cases và local persistence.</li>
              <li>Route chi tiết được khởi động từ đây.</li>
              <li>Phase 2 sẽ mở rộng thành data table và bộ lọc đầy đủ.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Tổng hồ sơ" value={cases.length} trend="+3 mock" />
        <KpiCard label="Đang xử lý" value={processingCount} />
        <KpiCard label="Hoàn tất" value={completedCount} />
        <KpiCard label="Cần chú ý" value={needsAttentionCount} tone="accent" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardContent className="space-y-3 p-6">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <FolderClock className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-semibold text-slate-900">Hồ sơ gần nhất</h3>
            <p className="text-sm leading-6 text-slate-500">
              {cases[0]?.title || "Chưa có hồ sơ nào"} đang được dùng làm case detail preview trong Phase 1.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-6">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-semibold text-slate-900">Scaffold hệ thống rủi ro</h3>
            <p className="text-sm leading-6 text-slate-500">
              Mức rủi ro và status badge đã được đồng bộ cho cả client và admin.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-6">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <Layers3 className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-semibold text-slate-900">Tiếp theo ở Phase 2</h3>
            <p className="text-sm leading-6 text-slate-500">
              Thêm bảng hồ sơ, quick filter và CTA sang CreateCase có local create flow.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
