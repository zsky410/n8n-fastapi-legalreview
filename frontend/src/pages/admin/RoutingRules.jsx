import { PencilLine, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Input from "../../components/ui/Input.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Select from "../../components/ui/Select.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { getRoutingRules } from "../../lib/api.js";
import { mockRoutingRules } from "../../lib/mockData.js";

const STORAGE_KEY = "legaldesk-ui-routing-rules";

const defaultFormState = {
  id: "",
  metric: "riskScore",
  operator: ">=",
  value: "",
  action: "needs_attention",
  active: true,
};

function readStoredRules() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : mockRoutingRules;
    return parsed.map((rule, index) => ({
      id: rule.id || `RULE-${String(index + 1).padStart(3, "0")}`,
      metric: rule.metric || "riskScore",
      operator: rule.operator || ">=",
      value: typeof rule.value === "number" ? rule.value : 0,
      action: rule.action || "needs_attention",
      active: typeof rule.active === "boolean" ? rule.active : true,
    }));
  } catch {
    return mockRoutingRules;
  }
}

export default function RoutingRules() {
  const [rules, setRules] = useState(() => readStoredRules());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formState, setFormState] = useState(defaultFormState);
  useEffect(() => {
    let isMounted = true;
    async function loadRules() {
      setIsLoading(true);
      setLoadError("");
      try {
        const data = await getRoutingRules();
        if (isMounted) {
          setRules(data);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error.message || "Không thể tải routing rules.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadRules();
    return () => {
      isMounted = false;
    };
  }, []);

  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  }, [rules]);

  const columns = [
    { key: "metric", label: "Metric", sortable: true },
    { key: "operator", label: "Operator", sortable: true },
    { key: "value", label: "Value", sortable: true },
    { key: "action", label: "Hành động" },
    {
      key: "active",
      label: "Trạng thái",
      render: (row) => (
        <Badge className={row.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-700"}>
          {row.active ? "active" : "inactive"}
        </Badge>
      ),
    },
    {
      key: "edit",
      label: "Sửa",
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setFormState({
              id: row.id,
              metric: row.metric,
              operator: row.operator,
              value: String(row.value),
              action: row.action,
              active: row.active,
            });
            setError("");
            setIsModalOpen(true);
          }}
        >
          <PencilLine className="h-4 w-4" />
          Chỉnh sửa
        </Button>
      ),
    },
    {
      key: "delete",
      label: "Xóa",
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRules((currentRules) => currentRules.filter((entry) => entry.id !== row.id))}
        >
          <Trash2 className="h-4 w-4" />
          Xóa
        </Button>
      ),
    },
  ];

  function closeModal() {
    setIsModalOpen(false);
    setFormState(defaultFormState);
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!formState.metric || !formState.operator || !String(formState.value).trim() || !formState.action) {
      setError("Điền đủ metric/operator/value/action trước khi lưu.");
      return;
    }

    const nextRule = {
      id: formState.id || `RULE-${String(rules.length + 1).padStart(3, "0")}`,
      metric: formState.metric,
      operator: formState.operator,
      value: Number(formState.value),
      action: formState.action,
      active: Boolean(formState.active),
    };

    setRules((currentRules) => {
      const nextRules = formState.id
        ? currentRules.map((entry) => (entry.id === formState.id ? nextRule : entry))
        : [...currentRules, nextRule];

      return nextRules;
    });
    closeModal();
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_36%),linear-gradient(135deg,#ffffff_0%,#eef8ff_52%,#f8fafc_100%)]">
        <CardContent className="space-y-4 p-6">
          <Badge className="border-brand-100 bg-white/80 text-brand-700">Admin routing workspace</Badge>
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">Quản lý luật định tuyến cho workflow full-auto.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Scope của Milestone 5 là mock-first editor đủ để admin thêm hoặc sửa routing rule mà không cần backend CRUD ở giai đoạn này.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Routing rules</h3>
              <p className="text-sm text-slate-500">Rule changes được lưu local để giữ demo ổn định khi admin di chuyển trong shell.</p>
            </div>
            <Button
              onClick={() => {
                setFormState(defaultFormState);
                setError("");
                setIsModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Thêm luật mới
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-14">
              <Spinner className="h-7 w-7 text-brand-700" />
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</div>
          ) : (
            <DataTable
              columns={columns}
              rows={rules}
              searchKeys={["metric", "operator", "action"]}
              emptyTitle="Chưa có luật định tuyến"
              emptyDescription="Thêm rule đầu tiên để mô phỏng workflow admin của Milestone 5."
            />
          )}
        </CardContent>
      </Card>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={formState.id ? "Chỉnh sửa routing rule" : "Tạo routing rule mới"}
        description="Editor này phục vụ thao tác mock-first cho admin trong Milestone 5."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Metric"
              value={formState.metric}
              onChange={(event) => setFormState((currentState) => ({ ...currentState, metric: event.target.value }))}
              options={[
                { label: "riskScore", value: "riskScore" },
                { label: "confidence", value: "confidence" },
                { label: "slaHours", value: "slaHours" },
              ]}
            />
            <Select
              label="Operator"
              value={formState.operator}
              onChange={(event) => setFormState((currentState) => ({ ...currentState, operator: event.target.value }))}
              options={[
                { label: ">=", value: ">=" },
                { label: "<=", value: "<=" },
                { label: ">", value: ">" },
                { label: "<", value: "<" },
                { label: "==", value: "==" },
              ]}
            />
          </div>
          <Input
            label="Value"
            type="number"
            value={formState.value}
            onChange={(event) => setFormState((currentState) => ({ ...currentState, value: event.target.value }))}
          />
          <Select
            label="Hành động"
            value={formState.action}
            onChange={(event) => setFormState((currentState) => ({ ...currentState, action: event.target.value }))}
            options={[
              { label: "needs_attention", value: "needs_attention" },
              { label: "quality_warning", value: "quality_warning" },
              { label: "escalate", value: "escalate" },
            ]}
          />
          <Select
            label="Trạng thái"
            value={formState.active ? "active" : "inactive"}
            onChange={(event) => setFormState((currentState) => ({ ...currentState, active: event.target.value === "active" }))}
            options={[
              { label: "active", value: "active" },
              { label: "inactive", value: "inactive" },
            ]}
          />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Hủy
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4" />
              Lưu rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
