import { PencilLine, Plus, Save, Trash2 } from "lucide-react";
import { Fragment, useEffect, useState } from "react";

import PageFrame from "../../components/layout/PageFrame.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Input from "../../components/ui/Input.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Select from "../../components/ui/Select.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { getRoutingRules } from "../../lib/api.js";
import { ROLE_LABELS } from "../../lib/constants.js";
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

function hasStoredRules() {
  try {
    return Boolean(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
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
      if (hasStoredRules()) {
        setIsLoading(false);
        return;
      }

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
    { key: "metric", label: "Chỉ số", sortable: true },
    { key: "operator", label: "Điều kiện", sortable: true },
    { key: "value", label: "Ngưỡng", sortable: true },
    { key: "action", label: "Hành động" },
    {
      key: "active",
      label: "Trạng thái",
      render: (row) => (
        <Badge className={row.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-line bg-[#f4f4f5] text-ink"}>
          {row.active ? "Đang bật" : "Tạm tắt"}
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
      setError("Điền đủ chỉ số, điều kiện, ngưỡng và hành động trước khi lưu.");
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
    <Fragment>
    <PageFrame segments={[ROLE_LABELS.admin, "Luật định tuyến"]}>
    <div className="space-y-5">
      <Card className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_36%),linear-gradient(135deg,#ffffff_0%,#eef8ff_52%,#f8fafc_100%)]">
        <CardContent className="space-y-4 p-6">
          <div>
            <h2 className="text-3xl font-semibold text-ink">Quản lý luật định tuyến cho workflow full-auto.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
              Thêm, sửa hoặc tạm tắt các luật tự động để phân luồng hồ sơ theo mức độ rủi ro và chất lượng dữ liệu.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-ink">Luật định tuyến</h3>
              <p className="text-sm text-muted">Các thay đổi được giữ lại trên trình duyệt hiện tại để bạn kiểm tra nhanh nhiều kịch bản xử lý.</p>
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
              <Spinner className="h-7 w-7 text-gold" />
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</div>
          ) : (
            <DataTable
              columns={columns}
              rows={rules}
              searchKeys={["metric", "operator", "action"]}
              emptyTitle="Chưa có luật định tuyến"
              emptyDescription="Thêm luật đầu tiên để bắt đầu cấu hình luồng xử lý hồ sơ."
            />
          )}
        </CardContent>
      </Card>
    </div>
    </PageFrame>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={formState.id ? "Chỉnh sửa routing rule" : "Tạo routing rule mới"}
        description="Điều chỉnh ngưỡng và hành động tự động áp dụng cho từng nhóm hồ sơ."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Chỉ số"
              value={formState.metric}
              onChange={(event) => setFormState((currentState) => ({ ...currentState, metric: event.target.value }))}
              options={[
                { label: "riskScore", value: "riskScore" },
                { label: "confidence", value: "confidence" },
                { label: "slaHours", value: "slaHours" },
              ]}
            />
            <Select
              label="Toán tử"
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
            label="Ngưỡng"
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
              { label: "Đang bật", value: "active" },
              { label: "Tạm tắt", value: "inactive" },
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
    </Fragment>
  );
}
