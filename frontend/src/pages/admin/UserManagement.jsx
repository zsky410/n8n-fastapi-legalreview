import Badge from "../../components/ui/Badge.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import { mockUsers } from "../../lib/mockData.js";

const columns = [
  { key: "name", label: "Tên", sortable: true },
  { key: "email", label: "Email" },
  { key: "role", label: "Vai trò", sortable: true },
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
];

export default function UserManagement() {
  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-gradient-to-br from-white via-white to-brand-50">
        <CardContent className="space-y-4 p-6">
          <Badge className="border-brand-100 bg-brand-50 text-brand-700">Scaffold quản lý người dùng</Badge>
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">Bảng người dùng demo đã vào đúng shell admin.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Scope phase này giữ 2 role là client và admin, đúng với capstone plan đã được chốt.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <DataTable
            columns={columns}
            rows={mockUsers}
            searchKeys={["name", "email", "company", "role", "status"]}
            emptyTitle="Chưa có người dùng nào"
            emptyDescription="Danh sách người dùng sẽ được mở rộng với thao tác ở Phase 2."
          />
        </CardContent>
      </Card>
    </div>
  );
}
