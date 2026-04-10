import { ChevronRight, ScrollText, Workflow } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import PageFrame from "../../components/layout/PageFrame.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import Tabs, { TabPanel } from "../../components/ui/Tabs.jsx";
import { getAuditLogs, getWorkflowExecutions } from "../../lib/api.js";
import { ROLE_LABELS } from "../../lib/constants.js";
import { formatDateTime, formatExecutionStatus, formatWorkflowName, formatWorkflowStepLabel } from "../../lib/formatters.js";

const tabs = [
  { label: "Nhật ký kiểm toán", value: "audit" },
  { label: "Tiến trình tự động", value: "workflow" },
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
    return "border-brand-100 bg-brand-50 text-gold";
  }

  return "border-line bg-[#f4f4f5] text-ink";
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
    { key: "timestamp", label: "Thời gian", sortable: true, render: (row) => formatDateTime(row.timestamp) },
    { key: "eventType", label: "Loại sự kiện", sortable: true },
    { key: "caseId", label: "Mã hồ sơ", sortable: true },
    { key: "userId", label: "Người dùng", sortable: true },
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
    { key: "executionId", label: "Mã chạy", sortable: true },
    { key: "caseId", label: "Mã hồ sơ", sortable: true },
    { key: "workflowName", label: "Luồng xử lý", sortable: true, render: (row) => formatWorkflowName(row.workflowName) },
    { key: "startedAt", label: "Bắt đầu", sortable: true, render: (row) => formatDateTime(row.startedAt) },
    { key: "durationMs", label: "Thời lượng", sortable: true, render: (row) => `${Math.round((row.durationMs || 0) / 1000)} giây` },
    {
      key: "status",
      label: "Trạng thái",
      sortable: true,
      render: (row) => <Badge className={getExecutionBadgeClass(row.status)}>{formatExecutionStatus(row.status)}</Badge>,
    },
    { key: "stepsCompleted", label: "Số bước" },
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
    <PageFrame segments={[ROLE_LABELS.admin, "Nhật ký vận hành"]}>
    <div className="space-y-5">
      <Card className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_36%),linear-gradient(135deg,#ffffff_0%,#eef8ff_52%,#f8fafc_100%)]">
        <CardContent className="space-y-4 p-6">
          <div>
            <h2 className="text-3xl font-semibold text-ink">Nhật ký hoạt động và tiến trình xử lý tự động.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
              Theo dõi lịch sử thao tác, lần chạy tự động và từng bước xử lý để nắm rõ luồng vận hành của hệ thống.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
        <Badge className="border-line bg-[#f4f4f5] text-ink">Dữ liệu vận hành gần nhất</Badge>
      </div>

      <TabPanel activeValue={activeTab} value="audit">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div>
              <h3 className="text-xl font-semibold text-ink">Nhật ký kiểm toán</h3>
              <p className="text-sm text-muted">Lọc theo loại sự kiện, mã hồ sơ hoặc người dùng để xem lịch sử xử lý.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              <Select
                label="Loại sự kiện"
                value={eventTypeFilter}
                onChange={(event) => setEventTypeFilter(event.target.value)}
                options={eventTypes.map((entry) => ({ label: entry, value: entry }))}
              />
              <Input label="Mã hồ sơ" value={caseIdFilter} onChange={(event) => setCaseIdFilter(event.target.value)} placeholder="CASE-2604-001" />
              <Input label="Người dùng" value={userIdFilter} onChange={(event) => setUserIdFilter(event.target.value)} placeholder="client@demo.vn" />
              <Input label="Từ thời gian" type="datetime-local" value={auditFrom} onChange={(event) => setAuditFrom(event.target.value)} />
              <Input label="Đến thời gian" type="datetime-local" value={auditTo} onChange={(event) => setAuditTo(event.target.value)} />
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-14">
                <Spinner className="h-7 w-7 text-gold" />
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
              <div className="rounded-2xl border border-line bg-slate-50 px-4 py-4 text-sm text-ink">
                <p className="font-semibold text-ink">Chi tiết sự kiện</p>
                <p className="mt-2">Thời gian: {formatDateTime(selectedAudit.timestamp)}</p>
                <p>Loại sự kiện: {selectedAudit.eventType}</p>
                <p>Mã hồ sơ: {selectedAudit.caseId}</p>
                <p>Người dùng: {selectedAudit.userId}</p>
                <p className="mt-2">{selectedAudit.description}</p>
                <p className="mt-1 text-muted">{selectedAudit.details}</p>
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
                <h3 className="text-xl font-semibold text-ink">Lượt chạy tự động</h3>
                <p className="text-sm text-muted">Chọn một lượt chạy để xem trạng thái, thời lượng và tiến độ từng bước.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <Select
                  label="Luồng xử lý"
                  value={workflowNameFilter}
                  onChange={(event) => setWorkflowNameFilter(event.target.value)}
                  options={workflowNames.map((entry) => ({ label: entry === "all" ? "Tất cả" : formatWorkflowName(entry), value: entry }))}
                />
                <Select
                  label="Trạng thái"
                  value={workflowStatusFilter}
                  onChange={(event) => setWorkflowStatusFilter(event.target.value)}
                  options={[
                    { label: "Tất cả", value: "all" },
                    { label: "Thành công", value: "success" },
                    { label: "Thất bại", value: "failed" },
                    { label: "Thử lại", value: "retry" },
                  ]}
                />
                <Input label="Từ thời gian" type="datetime-local" value={workflowFrom} onChange={(event) => setWorkflowFrom(event.target.value)} />
                <Input label="Đến thời gian" type="datetime-local" value={workflowTo} onChange={(event) => setWorkflowTo(event.target.value)} />
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-14">
                  <Spinner className="h-7 w-7 text-gold" />
                </div>
              ) : loadError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</div>
              ) : (
                <DataTable
                  columns={workflowColumns}
                  rows={filteredWorkflows}
                  searchKeys={["executionId", "workflowName", "caseId", "status"]}
                  emptyTitle="Chưa có lượt chạy nào"
                  emptyDescription="Bảng sẽ hiển thị dữ liệu khi hệ thống ghi nhận thêm lượt chạy."
                />
              )}
            </CardContent>
          </Card>

          <Card className="!bg-ink !text-white">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Workflow className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm text-white/60">Chi tiết lượt chạy</p>
                  <p className="mt-1 text-lg font-semibold text-white">{selectedWorkflow ? formatWorkflowName(selectedWorkflow.workflowName) : "Chưa chọn lượt chạy"}</p>
                </div>
              </div>

              {selectedWorkflow ? (
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Tóm tắt nhanh</p>
                    <div className="mt-3 grid gap-3 text-sm text-slate-200">
                      <p>Mã chạy: {selectedWorkflow.executionId}</p>
                      <p>Mã hồ sơ: {selectedWorkflow.caseId}</p>
                      <p>Trạng thái: {formatExecutionStatus(selectedWorkflow.status)}</p>
                      <p>Bắt đầu: {formatDateTime(selectedWorkflow.startedAt)}</p>
                      <p>Số bước: {selectedWorkflow.stepsCompleted}</p>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <ScrollText className="h-4 w-4" />
                      Các bước thực thi
                    </div>
                    <div className="mt-4 space-y-3">
                      {selectedWorkflow.steps.map((step) => (
                        <div key={`${selectedWorkflow.id}-${step.label}`} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm">
                          <span>{formatWorkflowStepLabel(step.label)}</span>
                          <Badge className={getExecutionBadgeClass(step.status)}>
                            {formatExecutionStatus(step.status)}
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
    </PageFrame>
  );
}
