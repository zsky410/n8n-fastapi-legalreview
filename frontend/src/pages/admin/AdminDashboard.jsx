import Badge from "../../components/ui/Badge.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";

export default function AdminDashboard() {
  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-gradient-to-br from-white via-white to-brand-50">
        <CardContent className="space-y-4 p-6">
          <Badge className="border-slate-200 bg-slate-100 text-slate-700">Stretch / post-M5</Badge>
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">AdminDashboard đang ở chế độ placeholder.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Route này đã được khai báo từ sớm để Phase 3 có chỗ dựng KPI strip, chart và system overview mà không đổi login flow.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
