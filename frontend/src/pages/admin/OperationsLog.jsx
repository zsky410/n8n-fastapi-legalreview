import { useState } from "react";

import Badge from "../../components/ui/Badge.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Tabs, { TabPanel } from "../../components/ui/Tabs.jsx";
import { mockAuditLogs, mockWorkflowExecutions } from "../../lib/mockData.js";

const auditColumns = [
  { key: "actor", label: "Tác nhân", sortable: true },
  { key: "action", label: "Hành động" },
  { key: "scope", label: "Phạm vi", sortable: true },
  { key: "timestamp", label: "Thời gian", sortable: true },
];

const workflowColumns = [
  { key: "workflow", label: "Workflow", sortable: true },
  { key: "caseId", label: "Case ID", sortable: true },
  { key: "status", label: "Trạng thái", sortable: true },
  { key: "lastStep", label: "Bước cuối" },
  { key: "duration", label: "Thời lượng" },
];

const tabs = [
  { label: "Nhật ký kiểm toán", value: "audit" },
  { label: "Lượt chạy workflow", value: "workflow" },
];

export default function OperationsLog() {
  const [activeTab, setActiveTab] = useState("audit");

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-gradient-to-br from-white via-white to-brand-50">
        <CardContent className="space-y-4 p-6">
          <Badge className="border-brand-100 bg-brand-50 text-brand-700">Scaffold nhật ký vận hành</Badge>
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">Tab cho audit và workflow execution đã sẵn sàng.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Đây là surface quan trọng của admin M5. Phase 1 dựng shell, tab và cấu trúc bảng; Phase 2 sẽ đào sâu vào interaction và data state.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
        <Badge className="border-slate-200 bg-slate-100 text-slate-700">Tab workflow đang mock-first</Badge>
      </div>

      <TabPanel activeValue={activeTab} value="audit">
        <Card>
          <CardContent className="p-6">
            <DataTable
              columns={auditColumns}
              rows={mockAuditLogs}
              searchKeys={["actor", "action", "scope", "timestamp"]}
              emptyTitle="Chưa có audit log"
              emptyDescription="Phase 2 sẽ thêm filter và row detail."
            />
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel activeValue={activeTab} value="workflow">
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm leading-6 text-slate-500">
              Workflow execution hiện đang là enhanced surface theo hướng mock-first để giữ đúng demo readiness mà không chặn Milestone 5 core.
            </p>
            <DataTable
              columns={workflowColumns}
              rows={mockWorkflowExecutions}
              searchKeys={["workflow", "caseId", "status", "lastStep"]}
              emptyTitle="Chưa có workflow execution"
              emptyDescription="Surface này sẽ được mở rộng ở Phase 2."
            />
          </CardContent>
        </Card>
      </TabPanel>
    </div>
  );
}
