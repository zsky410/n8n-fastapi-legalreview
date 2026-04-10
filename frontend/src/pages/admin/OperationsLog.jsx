import { ChevronRight, Filter, ScrollText, Workflow } from "lucide-react";
import { useMemo, useState } from "react";

import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Tabs, { TabPanel } from "../../components/ui/Tabs.jsx";
import { formatDateTime } from "../../lib/formatters.js";
import { mockAuditLogs, mockWorkflowExecutions } from "../../lib/mockData.js";

const auditColumns = [
  { key: "actor", label: "Tác nhân", sortable: true },
  { key: "action", label: "Hành động" },
  { key: "scope", label: "Phạm vi", sortable: true },
  {
    key: "timestamp",
    label: "Thời gian",
    sortable: true,
    render: (row) => formatDateTime(row.timestamp),
  },
];

const tabs = [
  { label: "Nhật ký kiểm toán", value: "audit" },
  { label: "Lượt chạy workflow", value: "workflow" },
];

function getExecutionBadgeClass(status) {
  if (status === "Hoàn tất") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Đang chạy") {
    return "border-brand-100 bg-brand-50 text-brand-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function OperationsLog() {
  const [activeTab, setActiveTab] = useState("audit");
  const [scopeFilter, setScopeFilter] = useState("Tất cả");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(mockWorkflowExecutions[0]?.id || "");

  const scopes = ["Tất cả", ...new Set(mockAuditLogs.map((entry) => entry.scope))];
  const filteredAuditLogs =
    scopeFilter === "Tất cả"
      ? mockAuditLogs
      : mockAuditLogs.filter((entry) => entry.scope === scopeFilter);

  const workflowColumns = [
    { key: "workflow", label: "Workflow", sortable: true },
    { key: "caseId", label: "Case ID", sortable: true },
    {
      key: "status",
      label: "Trạng thái",
      sortable: true,
      render: (row) => <Badge className={getExecutionBadgeClass(row.status)}>{row.status}</Badge>,
    },
    { key: "lastStep", label: "Bước cuối" },
    { key: "duration", label: "Thời lượng" },
    {
      key: "detail",
      label: "Chi tiết",
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => setSelectedWorkflowId(row.id)}>
          <ChevronRight className="h-4 w-4" />
          Mở
        </Button>
      ),
    },
  ];

  const selectedWorkflow = useMemo(
    () => mockWorkflowExecutions.find((entry) => entry.id === selectedWorkflowId) || mockWorkflowExecutions[0],
    [selectedWorkflowId],
  );

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_36%),linear-gradient(135deg,#ffffff_0%,#eef8ff_52%,#f8fafc_100%)]">
        <CardContent className="space-y-4 p-6">
          <Badge className="border-brand-100 bg-white/80 text-brand-700">Admin operations workspace</Badge>
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">Audit trail và workflow execution cho demo Milestone 5.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Surface này giữ đúng scope plan: audit logs có filter, workflow executions có bảng và panel chi tiết mở rộng nhưng vẫn hoàn toàn mock-first.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
        <Badge className="border-slate-200 bg-slate-100 text-slate-700">Workflow execution đang mock-first</Badge>
      </div>

      <TabPanel activeValue={activeTab} value="audit">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Audit logs</h3>
                <p className="text-sm text-slate-500">Lọc nhanh theo scope để kiểm tra luồng client, admin và review engine.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {scopes.map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => setScopeFilter(scope)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      scopeFilter === scope
                        ? "bg-brand-500 text-white shadow-sm shadow-brand-200"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700"
                    }`}
                  >
                    {scope}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Filter className="h-4 w-4 text-brand-700" />
                Bộ lọc hiện tại: {scopeFilter}
              </div>
            </div>

            <DataTable
              columns={auditColumns}
              rows={filteredAuditLogs}
              searchKeys={["actor", "action", "scope", "timestamp"]}
              emptyTitle="Không có audit log khớp bộ lọc"
              emptyDescription="Thử chuyển sang scope khác hoặc xóa bộ lọc để xem đầy đủ lịch sử."
            />
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel activeValue={activeTab} value="workflow">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Workflow executions</h3>
                <p className="text-sm text-slate-500">Chọn một execution để mở panel chi tiết và mô phỏng insight vận hành.</p>
              </div>
              <DataTable
                columns={workflowColumns}
                rows={mockWorkflowExecutions}
                searchKeys={["workflow", "caseId", "status", "lastStep"]}
                emptyTitle="Chưa có workflow execution"
                emptyDescription="Surface này sẽ hiển thị execution khi có dữ liệu mock phù hợp."
              />
            </CardContent>
          </Card>

          <Card className="bg-slate-950 text-white">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Workflow className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm text-white/60">Execution detail</p>
                  <p className="mt-1 text-lg font-semibold text-white">{selectedWorkflow?.workflow || "Chưa chọn execution"}</p>
                </div>
              </div>

              {selectedWorkflow ? (
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Snapshot</p>
                    <div className="mt-3 grid gap-3 text-sm text-slate-200">
                      <p>Case: {selectedWorkflow.caseId}</p>
                      <p>Trạng thái: {selectedWorkflow.status}</p>
                      <p>Bước cuối: {selectedWorkflow.lastStep}</p>
                      <p>Thời gian: {formatDateTime(selectedWorkflow.timestamp)}</p>
                      <p>Kích hoạt bởi: {selectedWorkflow.triggeredBy}</p>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <ScrollText className="h-4 w-4" />
                      Execution steps
                    </div>
                    <div className="mt-4 space-y-3">
                      {selectedWorkflow.steps.map((step) => (
                        <div key={`${selectedWorkflow.id}-${step.label}`} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm">
                          <span>{step.label}</span>
                          <Badge className={getExecutionBadgeClass(step.status === "done" ? "Hoàn tất" : step.status === "running" ? "Đang chạy" : "Đã xếp hàng")}>
                            {step.status === "done" ? "done" : step.status === "running" ? "running" : "queued"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-slate-300">
                    {selectedWorkflow.notes}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </TabPanel>
    </div>
  );
}
