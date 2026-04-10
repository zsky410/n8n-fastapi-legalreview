import { Plus, PencilLine, Save } from "lucide-react";
import { useEffect, useState } from "react";

import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Input from "../../components/ui/Input.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Select from "../../components/ui/Select.jsx";
import { mockRoutingRules } from "../../lib/mockData.js";

const STORAGE_KEY = "legaldesk-ui-routing-rules";

const defaultFormState = {
  id: "",
  name: "",
  priority: "1",
  match: "",
  action: "",
  status: "Bật",
};

function readStoredRules() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : mockRoutingRules;
  } catch {
    return mockRoutingRules;
  }
}

export default function RoutingRules() {
  const [rules, setRules] = useState(() => readStoredRules());
  const [formState, setFormState] = useState(defaultFormState);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  }, [rules]);

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
              name: row.name,
              priority: String(row.priority),
              match: row.match,
              action: row.action,
              status: row.status,
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
  ];

  function closeModal() {
    setIsModalOpen(false);
    setFormState(defaultFormState);
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!formState.name.trim() || !formState.match.trim() || !formState.action.trim()) {
      setError("Điền đủ tên rule, điều kiện và hành động trước khi lưu.");
      return;
    }

    const nextRule = {
      id: formState.id || `RULE-${String(rules.length + 1).padStart(3, "0")}`,
      name: formState.name.trim(),
      priority: Number(formState.priority) || 1,
      match: formState.match.trim(),
      action: formState.action.trim(),
      status: formState.status,
    };

    setRules((currentRules) => {
      const nextRules = formState.id
        ? currentRules.map((entry) => (entry.id === formState.id ? nextRule : entry))
        : [...currentRules, nextRule];

      return [...nextRules].sort((leftRule, rightRule) => leftRule.priority - rightRule.priority);
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

          <DataTable
            columns={columns}
            rows={rules}
            searchKeys={["name", "match", "action", "status"]}
            emptyTitle="Chưa có luật định tuyến"
            emptyDescription="Thêm rule đầu tiên để mô phỏng workflow admin của Milestone 5."
          />
        </CardContent>
      </Card>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={formState.id ? "Chỉnh sửa routing rule" : "Tạo routing rule mới"}
        description="Editor này phục vụ thao tác mock-first cho admin trong Milestone 5."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tên luật"
            value={formState.name}
            onChange={(event) => setFormState((currentState) => ({ ...currentState, name: event.target.value }))}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Ưu tiên"
              type="number"
              min="1"
              value={formState.priority}
              onChange={(event) => setFormState((currentState) => ({ ...currentState, priority: event.target.value }))}
            />
            <Select
              label="Trạng thái"
              value={formState.status}
              onChange={(event) => setFormState((currentState) => ({ ...currentState, status: event.target.value }))}
              options={[
                { label: "Bật", value: "Bật" },
                { label: "Nháp", value: "Nháp" },
              ]}
            />
          </div>
          <Input
            label="Điều kiện match"
            multiline
            value={formState.match}
            onChange={(event) => setFormState((currentState) => ({ ...currentState, match: event.target.value }))}
            placeholder="Ví dụ: riskLevel = high OR docType contains SaaS"
          />
          <Input
            label="Hành động"
            multiline
            value={formState.action}
            onChange={(event) => setFormState((currentState) => ({ ...currentState, action: event.target.value }))}
            placeholder="Ví dụ: Gán nhãn urgent-commercial và đẩy vào queue khẩn"
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
