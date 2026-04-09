import Badge from "../../components/ui/Badge.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import { mockRoutingRules } from "../../lib/mockData.js";

const columns = [
  { key: "name", label: "Luật", sortable: true },
  { key: "priority", label: "Ưu tiên", sortable: true },
  { key: "match", label: "Điều kiện" },
  { key: "action", label: "Hành động" },
  {
    key: "status",
    label: "Trạng thái",
    render: (row) => (
      <Badge className={row.status === "Bật" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-700"}>
        {row.status}
      </Badge>
    ),
  },
];

export default function RoutingRules() {
  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-gradient-to-br from-white via-white to-brand-50">
        <CardContent className="space-y-4 p-6">
          <Badge className="border-brand-100 bg-brand-50 text-brand-700">Route lõi của admin</Badge>
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">Shell của luật định tuyến đã sẵn sàng.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Phase 1 đồng bộ admin login redirect đến đây và đặt sẵn DataTable primitive để Phase 2 có thể thêm editing/filtering mà không đổi route semantics.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Xem trước luật</h3>
              <p className="text-sm text-slate-500">Bảng mock chỉ đọc cho foundation pass.</p>
            </div>
            <Badge className="border-slate-200 bg-slate-100 text-slate-700">Phase 2 sẽ thêm form chỉnh sửa</Badge>
          </div>
          <DataTable
            columns={columns}
            rows={mockRoutingRules}
            searchKeys={["name", "match", "action", "status"]}
            emptyTitle="Chưa có luật định tuyến"
            emptyDescription="Rule editor cho admin sẽ được thêm ở Phase 2."
          />
        </CardContent>
      </Card>
    </div>
  );
}
