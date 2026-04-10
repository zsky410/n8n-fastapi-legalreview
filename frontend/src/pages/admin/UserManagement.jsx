import { PencilLine, Plus, Save, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Input from "../../components/ui/Input.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Select from "../../components/ui/Select.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { getUsers } from "../../lib/api.js";
import { formatDateTime } from "../../lib/formatters.js";
import { mockUsers } from "../../lib/mockData.js";

const STORAGE_KEY = "legaldesk-ui-users";

const defaultFormState = {
  id: "",
  name: "",
  email: "",
  role: "client",
  company: "",
  status: "Đã mời",
};

function readStoredUsers() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : mockUsers;
  } catch {
    return mockUsers;
  }
}

export default function UserManagement() {
  const [users, setUsers] = useState(() => readStoredUsers());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formState, setFormState] = useState(defaultFormState);
  useEffect(() => {
    let isMounted = true;
    async function loadUsers() {
      setIsLoading(true);
      setLoadError("");
      try {
        const data = await getUsers();
        if (isMounted) {
          setUsers(data);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error.message || "Không thể tải danh sách người dùng.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  const columns = [
    { key: "name", label: "Tên", sortable: true },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Vai trò",
      sortable: true,
      render: (row) => (
        <Badge className={row.role === "admin" ? "border-brand-100 bg-brand-50 text-brand-700" : "border-slate-200 bg-slate-100 text-slate-700"}>
          {row.role === "admin" ? "Admin" : "Client"}
        </Badge>
      ),
    },
    { key: "company", label: "Tổ chức" },
    {
      key: "status",
      label: "Trạng thái",
      render: (row) => (
        <Badge className={row.status === "Đang hoạt động" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "lastSeenAt",
      label: "Lần cuối hoạt động",
      sortable: true,
      render: (row) => formatDateTime(row.lastSeenAt),
    },
    {
      key: "edit",
      label: "Hành động",
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setFormState({
                id: row.id,
                name: row.name,
                email: row.email,
                role: row.role,
                company: row.company,
                status: row.status,
              });
              setError("");
              setIsModalOpen(true);
            }}
          >
            <PencilLine className="h-4 w-4" />
            Chỉnh sửa
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setUsers((currentUsers) =>
                currentUsers.map((entry) =>
                  entry.id === row.id ? { ...entry, status: entry.status === "Đang hoạt động" ? "Đã mời" : "Đang hoạt động" } : entry,
                ),
              )
            }
          >
            {row.status === "Đang hoạt động" ? "Disable" : "Enable"}
          </Button>
        </div>
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

    if (!formState.name.trim() || !formState.email.trim() || !formState.company.trim()) {
      setError("Điền đủ tên, email và tổ chức trước khi lưu.");
      return;
    }

    const nextUser = {
      id: formState.id || `USR-${String(users.length + 1).padStart(3, "0")}`,
      name: formState.name.trim(),
      email: formState.email.trim(),
      role: formState.role,
      company: formState.company.trim(),
      status: formState.status,
      lastSeenAt: new Date().toISOString(),
    };

    setUsers((currentUsers) =>
      formState.id
        ? currentUsers.map((entry) => (entry.id === formState.id ? nextUser : entry))
        : [nextUser, ...currentUsers],
    );
    closeModal();
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_36%),linear-gradient(135deg,#ffffff_0%,#eef8ff_52%,#f8fafc_100%)]">
        <CardContent className="space-y-4 p-6">
          <Badge className="border-brand-100 bg-white/80 text-brand-700">Admin user workspace</Badge>
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">Quản lý người dùng của client và admin trong cùng một surface.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Bản này bám đúng plan Milestone 5: chỉ có 2 role là client và admin, đủ add/edit để demo quyền truy cập và vận hành cơ bản.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Danh sách người dùng</h3>
              <p className="text-sm text-slate-500">Các thay đổi được lưu local để admin có thể quay lại kiểm tra trong cùng buổi demo.</p>
            </div>
            <Button
              onClick={() => {
                setFormState(defaultFormState);
                setError("");
                setIsModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Thêm người dùng
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
              rows={users}
              searchKeys={["name", "email", "company", "role", "status"]}
              emptyTitle="Chưa có người dùng nào"
              emptyDescription="Admin có thể thêm client hoặc admin đầu tiên trực tiếp từ modal."
            />
          )}
        </CardContent>
      </Card>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={formState.id ? "Cập nhật người dùng" : "Thêm người dùng mới"}
        description="Giới hạn role ở Client/Admin để bám đúng capstone plan."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Họ tên"
            value={formState.name}
            onChange={(event) => setFormState((currentState) => ({ ...currentState, name: event.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={formState.email}
            onChange={(event) => setFormState((currentState) => ({ ...currentState, email: event.target.value }))}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Vai trò"
              value={formState.role}
              onChange={(event) => setFormState((currentState) => ({ ...currentState, role: event.target.value }))}
              options={[
                { label: "Client", value: "client" },
                { label: "Admin", value: "admin" },
              ]}
            />
            <Select
              label="Trạng thái"
              value={formState.status}
              onChange={(event) => setFormState((currentState) => ({ ...currentState, status: event.target.value }))}
              options={[
                { label: "Đã mời", value: "Đã mời" },
                { label: "Đang hoạt động", value: "Đang hoạt động" },
              ]}
            />
          </div>
          <Input
            label="Tổ chức"
            value={formState.company}
            onChange={(event) => setFormState((currentState) => ({ ...currentState, company: event.target.value }))}
          />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Hủy
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4" />
              Lưu người dùng
            </Button>
          </div>
        </form>
      </Modal>

      <Card className="bg-slate-950 text-white">
        <CardContent className="flex items-center gap-4 p-6">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-semibold">Role scope được giữ gọn đúng plan</p>
            <p className="mt-1 text-sm text-slate-300">Không mở rộng sang Lawyer ở phase này để tránh trượt khỏi Milestone 5.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
