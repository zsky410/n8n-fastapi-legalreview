import Badge from "../../components/ui/Badge.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";

export default function SystemMonitor() {
  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-gradient-to-br from-white via-white to-brand-50">
        <CardContent className="space-y-4 p-6">
          <Badge className="border-slate-200 bg-slate-100 text-slate-700">Stretch / post-M5</Badge>
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">System monitor đang là placeholder.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Phase 1 chỉ đặt route và shell. Phase 3 mới nối health thật và tách rõ phần real / mock trên UI.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
