import { useEffect, useMemo, useState } from "react";

import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import KpiCard from "../../components/ui/KpiCard.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { getHealth } from "../../lib/api.js";
import { formatDateTime, formatHealthStatus } from "../../lib/formatters.js";

const mockOpsMetrics = [
  { label: "Điều phối n8n", value: "Kết nối" },
  { label: "Thời gian hoạt động", value: "6 ngày 11 giờ" },
  { label: "Yêu cầu hôm nay", value: "1.284" },
  { label: "Phản hồi trung bình", value: "312ms" },
  { label: "Tỷ lệ lỗi", value: "1,8%" },
];

const kpiVariants = ["total", "processing", "published", "attention", "quality"];

const mockEndpointRows = [
  { id: "ep-1", endpoint: "/v1/legal/review", status: "đang theo dõi", latency: "280ms", note: "Tổng hợp từ nhật ký giao diện" },
  { id: "ep-2", endpoint: "/v1/legal/chat", status: "đang theo dõi", latency: "190ms", note: "Tổng hợp từ nhật ký giao diện" },
  { id: "ep-3", endpoint: "/health", status: "kết nối thật", latency: "95ms", note: "Lấy trực tiếp từ FastAPI health probe" },
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
    { key: "service", label: "Dịch vụ", sortable: true },
    { key: "status", label: "Trạng thái", sortable: true, render: (row) => formatHealthStatus(row.status) },
    { key: "detail", label: "Chi tiết" },
  ];

  const endpointColumns = [
    { key: "endpoint", label: "Điểm gọi API", sortable: true },
    { key: "status", label: "Trạng thái", render: (row) => formatHealthStatus(row.status) },
    { key: "latency", label: "Độ trễ" },
    { key: "note", label: "Nguồn dữ liệu" },
  ];

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-gradient-to-br from-white via-white to-brand-50">
        <CardContent className="space-y-4 p-6">
          <div>
            <h2 className="text-3xl font-semibold text-ink">Theo dõi hệ thống</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
              Theo dõi nhanh tình trạng dịch vụ, kết nối phụ thuộc và một số chỉ số vận hành quan trọng trong cùng một màn hình.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {mockOpsMetrics.map((item, index) => (
          <KpiCard
            key={item.label}
            label={item.label}
            value={item.value}
            variant={kpiVariants[index % kpiVariants.length]}
          />
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-ink">Tình trạng dịch vụ</h3>
              <p className="text-sm text-muted">Nguồn dữ liệu: `GET /health` từ FastAPI.</p>
            </div>
            <Button variant="secondary" onClick={loadHealth} disabled={isLoading}>
              Làm mới trạng thái
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-7 w-7 text-gold" />
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
              <div className="rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm text-ink">
                <p>Dịch vụ: {health.service || "legaldesk-fastapi"}</p>
                <p>Trạng thái: {formatHealthStatus(health.status)}</p>
                <p>Môi trường: {health.environment || "-"}</p>
                <p>Thời gian: {formatDateTime(health.timestamp)}</p>
              </div>
              <DataTable
                columns={dependencyColumns}
                rows={dependencyRows}
                searchKeys={["service", "status", "detail"]}
                emptyTitle="Không có trạng thái phụ thuộc"
                emptyDescription="Dữ liệu health chưa trả về danh sách phụ thuộc."
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
              <h3 className="text-xl font-semibold text-ink">Chỉ số vận hành và endpoint</h3>
              <p className="text-sm text-muted">Tổng hợp một số số liệu hữu ích để theo dõi khả năng phản hồi của hệ thống.</p>
            </div>
            <Badge className="border-amber-200 bg-amber-50 text-amber-700">Dữ liệu tham khảo</Badge>
          </div>
          <DataTable
            columns={endpointColumns}
            rows={mockEndpointRows}
            searchKeys={["endpoint", "status", "latency", "note"]}
            emptyTitle="Chưa có endpoint status"
            emptyDescription="Bảng sẽ hiển thị thêm dữ liệu khi hệ thống ghi nhận được nhiều lần gọi hơn."
          />
        </CardContent>
      </Card>
    </div>
  );
}
