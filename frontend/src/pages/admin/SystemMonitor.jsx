import { useEffect, useMemo, useState } from "react";

import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import KpiCard from "../../components/ui/KpiCard.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { getHealth } from "../../lib/api.js";
import { formatDateTime } from "../../lib/formatters.js";

const mockOpsMetrics = [
  { label: "n8n orchestrator", value: "connected" },
  { label: "Uptime", value: "6d 11h" },
  { label: "Requests today", value: "1,284" },
  { label: "Avg response", value: "312ms" },
  { label: "Error rate", value: "1.8%" },
];

const mockEndpointRows = [
  { id: "ep-1", endpoint: "/v1/legal/review", status: "mock-observed", latency: "280ms", note: "Sample from UI telemetry" },
  { id: "ep-2", endpoint: "/v1/legal/chat", status: "mock-observed", latency: "190ms", note: "Sample from UI telemetry" },
  { id: "ep-3", endpoint: "/health", status: "real", latency: "95ms", note: "From FastAPI health probe" },
];

export default function SystemMonitor() {
  const [health, setHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadHealth() {
    setIsLoading(true);
    setError("");
    try {
      const data = await getHealth();
      setHealth(data);
    } catch (loadError) {
      setError(loadError.message || "Không thể tải health status.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadHealth();
  }, []);

  const dependencyRows = useMemo(() => {
    if (!health?.dependencies) {
      return [];
    }
    return Object.entries(health.dependencies).map(([name, detail]) => ({
      id: `dep-${name}`,
      service: name,
      status: detail?.status || "unknown",
      detail: detail?.detail || "-",
    }));
  }, [health]);

  const dependencyColumns = [
    { key: "service", label: "Service", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "detail", label: "Detail" },
  ];

  const endpointColumns = [
    { key: "endpoint", label: "Endpoint", sortable: true },
    { key: "status", label: "Status" },
    { key: "latency", label: "Latency" },
    { key: "note", label: "Note" },
  ];

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-gradient-to-br from-white via-white to-brand-50">
        <CardContent className="space-y-4 p-6">
          <Badge className="border-slate-200 bg-slate-100 text-slate-700">Phase 3 · Stretch / post-M5</Badge>
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">System monitor</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Health của FastAPI/Postgres/Redis lấy từ endpoint thật; các chỉ số vận hành chưa có endpoint sẽ hiển thị mock-first và gắn nhãn rõ ràng.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {mockOpsMetrics.map((item) => (
          <KpiCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Health (real endpoint)</h3>
              <p className="text-sm text-slate-500">Nguồn dữ liệu: `GET /health` từ FastAPI.</p>
            </div>
            <Button variant="secondary" onClick={loadHealth} disabled={isLoading}>
              Làm mới health
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-7 w-7 text-brand-700" />
            </div>
          ) : error ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
              <Button variant="secondary" onClick={loadHealth}>
                Thử lại
              </Button>
            </div>
          ) : health ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p>service: {health.service || "legaldesk-fastapi"}</p>
                <p>status: {health.status || "unknown"}</p>
                <p>environment: {health.environment || "-"}</p>
                <p>timestamp: {formatDateTime(health.timestamp)}</p>
              </div>
              <DataTable
                columns={dependencyColumns}
                rows={dependencyRows}
                searchKeys={["service", "status", "detail"]}
                emptyTitle="Không có dependency status"
                emptyDescription="Endpoint health chưa trả về dependencies."
              />
            </div>
          ) : (
            <EmptyState title="Không có dữ liệu health" description="Bấm làm mới để tải lại trạng thái hệ thống." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Operational metrics & endpoint table</h3>
              <p className="text-sm text-slate-500">Các dữ liệu bên dưới là mock-first vì backend chưa có endpoint tổng hợp.</p>
            </div>
            <Badge className="border-amber-200 bg-amber-50 text-amber-700">Mock data</Badge>
          </div>
          <DataTable
            columns={endpointColumns}
            rows={mockEndpointRows}
            searchKeys={["endpoint", "status", "latency", "note"]}
            emptyTitle="Chưa có endpoint status"
            emptyDescription="Khi chưa có endpoint metrics thật, bảng này dùng mock-first cho demo."
          />
        </CardContent>
      </Card>
    </div>
  );
}
