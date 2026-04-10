import { ChevronRight, ScrollText, Workflow } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import Tabs, { TabPanel } from "../../components/ui/Tabs.jsx";
import { getAuditLogs, getWorkflowExecutions } from "../../lib/api.js";
import { formatDateTime } from "../../lib/formatters.js";

const tabs = [
  { label: "Nhật ký kiểm toán", value: "audit" },
  { label: "Lượt chạy workflow", value: "workflow" },
];

function getExecutionBadgeClass(status) {
  if (status === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "retry") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "failed") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (status === "running") {
    return "border-brand-100 bg-brand-50 text-brand-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

export default function OperationsLog() {
  const [activeTab, setActiveTab] = useState("audit");
  const [auditLogs, setAuditLogs] = useState([]);
  const [workflowRows, setWorkflowRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [caseIdFilter, setCaseIdFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [workflowStatusFilter, setWorkflowStatusFilter] = useState("all");
  const [workflowNameFilter, setWorkflowNameFilter] = useState("all");
  const [auditFrom, setAuditFrom] = useState("");
  const [auditTo, setAuditTo] = useState("");
  const [workflowFrom, setWorkflowFrom] = useState("");
  const [workflowTo, setWorkflowTo] = useState("");
  const [selectedAuditId, setSelectedAuditId] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      setLoadError("");
      try {
        const [auditData, workflowData] = await Promise.all([getAuditLogs(), getWorkflowExecutions()]);
        if (isMounted) {
          setAuditLogs(auditData);
          setWorkflowRows(workflowData);
          setSelectedWorkflowId(workflowData[0]?.id || "");
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error.message || "Không thể tải logs vận hành.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const auditColumns = [
    { key: "timestamp", label: "Timestamp", sortable: true, render: (row) => formatDateTime(row.timestamp) },
    { key: "eventType", label: "Event type", sortable: true },
    { key: "caseId", label: "caseId", sortable: true },
    { key: "userId", label: "userId", sortable: true },
    { key: "description", label: "Mô tả" },
    {
      key: "details",
      label: "Chi tiết",
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => setSelectedAuditId(row.id)}>
          <ChevronRight className="h-4 w-4" />
          Xem
        </Button>
      ),
    },
  ];

  const eventTypes = ["all", ...new Set(auditLogs.map((entry) => entry.eventType))];
  const workflowNames = ["all", ...new Set(workflowRows.map((entry) => entry.workflowName))];
  const filteredAuditLogs = auditLogs.filter((entry) => {
    if (eventTypeFilter !== "all" && entry.eventType !== eventTypeFilter) {
      return false;
    }
    if (caseIdFilter.trim() && !String(entry.caseId || "").toLowerCase().includes(caseIdFilter.trim().toLowerCase())) {
      return false;
    }
    if (userIdFilter.trim() && !String(entry.userId || "").toLowerCase().includes(userIdFilter.trim().toLowerCase())) {
      return false;
    }
    if (auditFrom && new Date(entry.timestamp).getTime() < new Date(auditFrom).getTime()) {
      return false;
    }
    if (auditTo && new Date(entry.timestamp).getTime() > new Date(auditTo).getTime()) {
      return false;
    }
    return true;
  });

  const filteredWorkflows = workflowRows.filter((entry) => {
    if (workflowStatusFilter !== "all" && entry.status !== workflowStatusFilter) {
      return false;
    }
    if (workflowNameFilter !== "all" && entry.workflowName !== workflowNameFilter) {
      return false;
    }
    if (workflowFrom && new Date(entry.startedAt).getTime() < new Date(workflowFrom).getTime()) {
      return false;
    }
    if (workflowTo && new Date(entry.startedAt).getTime() > new Date(workflowTo).getTime()) {
      return false;
    }
    return true;
  });

  const workflowColumns = [
    { key: "executionId", label: "Execution ID", sortable: true },
    { key: "caseId", label: "Case ID", sortable: true },
    { key: "workflowName", label: "Workflow", sortable: true },
    { key: "startedAt", label: "Started at", sortable: true, render: (row) => formatDateTime(row.startedAt) },
    { key: "durationMs", label: "Duration", sortable: true, render: (row) => `${Math.round((row.durationMs || 0) / 1000)}s` },
    {
      key: "status",
      label: "Trạng thái",
      sortable: true,
      render: (row) => <Badge className={getExecutionBadgeClass(row.status)}>{row.status}</Badge>,
    },
    { key: "stepsCompleted", label: "Steps" },
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
    () => filteredWorkflows.find((entry) => entry.id === selectedWorkflowId) || filteredWorkflows[0],
    [filteredWorkflows, selectedWorkflowId],
  );
  const selectedAudit = useMemo(
    () => filteredAuditLogs.find((entry) => entry.id === selectedAuditId) || filteredAuditLogs[0],
    [filteredAuditLogs, selectedAuditId],
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
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Audit logs</h3>
              <p className="text-sm text-slate-500">Filter theo loại sự kiện, caseId, userId để xem audit trail.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              <Select
                label="Event type"
                value={eventTypeFilter}
                onChange={(event) => setEventTypeFilter(event.target.value)}
                options={eventTypes.map((entry) => ({ label: entry, value: entry }))}
              />
              <Input label="caseId" value={caseIdFilter} onChange={(event) => setCaseIdFilter(event.target.value)} placeholder="CASE-2604-001" />
              <Input label="userId" value={userIdFilter} onChange={(event) => setUserIdFilter(event.target.value)} placeholder="client@demo.vn" />
              <Input label="Từ thời gian" type="datetime-local" value={auditFrom} onChange={(event) => setAuditFrom(event.target.value)} />
              <Input label="Đến thời gian" type="datetime-local" value={auditTo} onChange={(event) => setAuditTo(event.target.value)} />
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-14">
                <Spinner className="h-7 w-7 text-brand-700" />
              </div>
            ) : loadError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</div>
            ) : (
              <DataTable
                columns={auditColumns}
                rows={filteredAuditLogs}
                searchKeys={["eventType", "caseId", "userId", "description", "details"]}
                emptyTitle="Không có audit log khớp bộ lọc"
                emptyDescription="Thử đổi event type hoặc xóa điều kiện lọc."
              />
            )}
            {selectedAudit ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Audit detail</p>
                <p className="mt-2">timestamp: {formatDateTime(selectedAudit.timestamp)}</p>
                <p>eventType: {selectedAudit.eventType}</p>
                <p>caseId: {selectedAudit.caseId}</p>
                <p>userId: {selectedAudit.userId}</p>
                <p className="mt-2">{selectedAudit.description}</p>
                <p className="mt-1 text-slate-500">{selectedAudit.details}</p>
              </div>
            ) : null}
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
              <div className="grid gap-3 md:grid-cols-4">
                <Select
                  label="Workflow"
                  value={workflowNameFilter}
                  onChange={(event) => setWorkflowNameFilter(event.target.value)}
                  options={workflowNames.map((entry) => ({ label: entry, value: entry }))}
                />
                <Select
                  label="Status"
                  value={workflowStatusFilter}
                  onChange={(event) => setWorkflowStatusFilter(event.target.value)}
                  options={[
                    { label: "all", value: "all" },
                    { label: "success", value: "success" },
                    { label: "failed", value: "failed" },
                    { label: "retry", value: "retry" },
                  ]}
                />
                <Input label="Từ thời gian" type="datetime-local" value={workflowFrom} onChange={(event) => setWorkflowFrom(event.target.value)} />
                <Input label="Đến thời gian" type="datetime-local" value={workflowTo} onChange={(event) => setWorkflowTo(event.target.value)} />
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-14">
                  <Spinner className="h-7 w-7 text-brand-700" />
                </div>
              ) : loadError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</div>
              ) : (
                <DataTable
                  columns={workflowColumns}
                  rows={filteredWorkflows}
                  searchKeys={["executionId", "workflowName", "caseId", "status"]}
                  emptyTitle="Chưa có workflow execution"
                  emptyDescription="Surface này sẽ hiển thị execution khi có dữ liệu mock phù hợp."
                />
              )}
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
                  <p className="mt-1 text-lg font-semibold text-white">{selectedWorkflow?.workflowName || "Chưa chọn execution"}</p>
                </div>
              </div>

              {selectedWorkflow ? (
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Snapshot</p>
                    <div className="mt-3 grid gap-3 text-sm text-slate-200">
                      <p>Execution: {selectedWorkflow.executionId}</p>
                      <p>Case: {selectedWorkflow.caseId}</p>
                      <p>Trạng thái: {selectedWorkflow.status}</p>
                      <p>Bắt đầu: {formatDateTime(selectedWorkflow.startedAt)}</p>
                      <p>Steps: {selectedWorkflow.stepsCompleted}</p>
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
                          <Badge className={getExecutionBadgeClass(step.status)}>
                            {step.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
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
