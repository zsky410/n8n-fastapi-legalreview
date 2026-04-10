import {
  Activity,
  Bell,
  ChevronRight,
  FilePlus2,
  GaugeCircle,
  LayoutDashboard,
  LogOut,
  Logs,
  Menu,
  Scale,
  Settings2,
  Users2,
  X,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import { ADMIN_NAV_ITEMS, APP_NAME, CLIENT_NAV_ITEMS, ROLE_LABELS } from "../lib/constants.js";
import { getApiMode } from "../lib/api.js";
import { cn } from "../lib/cn.js";
import { useAuth } from "../hooks/useAuth.js";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";

const iconMap = {
  Activity,
  FilePlus2,
  GaugeCircle,
  LayoutDashboard,
  Logs,
  Settings2,
  Users2,
};

const routeLabels = {
  "/client/dashboard": "Dashboard",
  "/client/cases/new": "Tạo hồ sơ",
  "/admin/dashboard": "Bảng điều khiển",
  "/admin/routing": "Luật định tuyến",
  "/admin/logs": "Nhật ký vận hành",
  "/admin/users": "Người dùng",
  "/admin/system": "Hệ thống",
};

function SidebarNav({ items, onNavigate }) {
  return (
    <nav className="space-y-1.5">
      {items.map((item) => {
        const Icon = iconMap[item.icon] || LayoutDashboard;

        return (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                isActive ? "bg-white/12 text-white" : "text-brand-100 hover:bg-white/10 hover:text-white",
              )
            }
          >
            <span className="flex items-center gap-3">
              <Icon className="h-4 w-4" />
              {item.label}
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/50">{item.phase}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function SidebarContent({ role, onNavigate }) {
  const { user } = useAuth();
  const navItems = (role === "admin" ? ADMIN_NAV_ITEMS : CLIENT_NAV_ITEMS).filter((item) => item.showInNav);

  return (
    <div className="surface-sidebar flex h-full flex-col p-5">
      <div className="flex items-center gap-3 border-b border-white/10 pb-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
          <Scale className="h-5 w-5" />
        </span>
        <div>
          <p className="text-base font-semibold">{APP_NAME}</p>
          <p className="text-sm text-brand-100">{ROLE_LABELS[role]}</p>
        </div>
      </div>

      <div className="mt-6 flex-1 space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">API mode</p>
          <p className="mt-2 text-lg font-semibold text-white">{getApiMode().toUpperCase()}</p>
          <p className="mt-1 text-sm text-brand-100">Nền tảng mock-first cho UI Milestone 5.</p>
        </div>
        <SidebarNav items={navItems} onNavigate={onNavigate} />
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">{user?.name}</p>
        <p className="mt-1 text-sm text-brand-100">{user?.company}</p>
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/50">{user?.subtitle}</p>
      </div>
    </div>
  );
}

export default function AppShell({ children, role }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const currentLabel =
    routeLabels[location.pathname] ||
    (location.pathname.startsWith("/client/cases/") ? "Chi tiết hồ sơ" : "Tổng quan");

  function handleLogout() {
    logout();
    navigate("/auth?tab=login");
  }

  return (
    <div className="min-h-screen p-4 lg:p-5">
      <div className="legal-grid min-h-[calc(100vh-2rem)] rounded-[36px] border border-white/70 bg-white/30 p-3 shadow-card lg:p-4">
        <div className="grid min-h-[calc(100vh-3.5rem)] gap-4 lg:grid-cols-[310px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <SidebarContent role={role} />
          </div>

          {isSidebarOpen ? (
            <div className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden">
              <div className="h-full w-[86vw] max-w-[320px] p-4">
                <div className="relative h-full">
                  <SidebarContent role={role} onNavigate={() => setIsSidebarOpen(false)} />
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Đóng sidebar"
                    className="absolute right-4 top-4 h-9 w-9 rounded-full bg-white/10 px-0 text-white hover:bg-white/20"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            <header className="surface-panel flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label="Mở sidebar"
                  className="lg:hidden"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    <span>{ROLE_LABELS[role]}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-brand-700">{currentLabel}</span>
                  </div>
                  <h1 className="mt-1 text-2xl font-semibold capitalize text-slate-900">{currentLabel}</h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="border-brand-100 bg-brand-50 text-brand-700">Phase 1 foundation</Badge>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
                  <Bell className="h-4 w-4" />
                </span>
                <Button variant="secondary" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </Button>
              </div>
            </header>
            <main className="space-y-5">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
