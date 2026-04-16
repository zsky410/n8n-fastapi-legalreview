import {
  Activity,
  Bell,
  Building2,
  FilePlus2,
  GaugeCircle,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Logs,
  Menu,
  Scale,
  Settings2,
  Users2,
  X,
} from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import { ADMIN_NAV_ITEMS, APP_NAME, CLIENT_NAV_ITEMS, ROLE_LABELS } from "../lib/constants.js";
import { cn } from "../lib/cn.js";
import { useAuth } from "../hooks/useAuth.js";

const iconMap = {
  Activity,
  FilePlus2,
  GaugeCircle,
  LayoutDashboard,
  Logs,
  Settings2,
  Users2,
};

function getUserInitials(user) {
  const rawValue = String(user?.name || user?.email || "").trim();

  if (!rawValue) {
    return "LD";
  }

  const parts = rawValue
    .replace(/@.*$/, "")
    .split(/\s+/)
    .filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatWorkspaceDate() {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

function getRouteMeta(pathname, role) {
  if (role === "client") {
    if (pathname === "/client/dashboard") {
      return {
        eyebrow: "Client Operations",
        title: "Danh mục hồ sơ",
      };
    }

    if (pathname === "/client/cases/new") {
      return {
        eyebrow: "Intake Workspace",
        title: "Tiếp nhận hồ sơ mới",
      };
    }

    if (/^\/client\/cases\/[^/]+$/.test(pathname)) {
      return {
        eyebrow: "Matter Review",
        title: "Hồ sơ chi tiết",
      };
    }
  }

  if (role === "admin") {
    if (pathname === "/admin/routing") {
      return {
        eyebrow: "Control Room",
        title: "Luật định tuyến",
      };
    }

    if (pathname === "/admin/logs") {
      return {
        eyebrow: "Audit Trail",
        title: "Nhật ký vận hành",
      };
    }

    if (pathname === "/admin/users") {
      return {
        eyebrow: "Access Control",
        title: "Người dùng",
      };
    }

    if (pathname === "/admin/system") {
      return {
        eyebrow: "Platform Health",
        title: "Hệ thống",
      };
    }
  }

  return {
    eyebrow: role === "admin" ? "Platform Overview" : "Legal Workspace",
    title: role === "admin" ? "Bảng điều khiển" : "Không gian hồ sơ",
  };
}

function SidebarNav({ items, onNavigate }) {
  return (
    <nav className="space-y-2">
      {items.map((item) => {
        const Icon = iconMap[item.icon] || LayoutDashboard;

        return (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "group flex items-start gap-3 rounded-[20px] border px-4 py-3 transition-all duration-200",
                isActive
                  ? "border-white/10 bg-white/[0.08] shadow-[0_16px_32px_rgba(0,0,0,0.16)]"
                  : "border-transparent bg-transparent hover:border-white/8 hover:bg-white/[0.05]",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-colors",
                    isActive
                      ? "border-white/15 bg-white/10 text-white"
                      : "border-white/8 bg-white/[0.04] text-white/72 group-hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={cn("text-sm font-semibold", isActive ? "text-white" : "text-white/82")}>
                      {item.label}
                    </span>
                  </span>
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

function Sidebar({ role, onNavigate, onLogout }) {
  const { user } = useAuth();
  const navItems = (role === "admin" ? ADMIN_NAV_ITEMS : CLIENT_NAV_ITEMS).filter((item) => item.showInNav);

  return (
    <div className="flex h-full flex-col gap-4 bg-[linear-gradient(180deg,#0f172a_0%,#111d35_44%,#0c1426_100%)] p-4 text-white">
      <div className="surface-sidebar rounded-card-lg p-4">
        <Link to={role === "admin" ? "/admin/dashboard" : "/client/dashboard"} className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <Scale className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-semibold tracking-[0.01em] text-white">{APP_NAME}</span>
            <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-white/44">
              {ROLE_LABELS[role]}
            </span>
          </span>
        </Link>
      </div>

      <div className="rounded-card-lg border border-white/6 bg-white/[0.03] p-3">
        <div className="mb-3 flex items-center justify-between px-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/44">Navigation</p>
          <span className="rounded-full border border-white/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38">
            {navItems.length} mục
          </span>
        </div>
        <SidebarNav items={navItems} onNavigate={onNavigate} />
      </div>

      <div className="mt-auto">
        <div className="surface-sidebar rounded-card-lg p-3">
          <div className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.04] px-3 py-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d9b265] text-sm font-bold text-slate-950">
              {getUserInitials(user)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.name || "Người dùng"}</p>
              <p className="truncate text-xs text-white/48">{user?.company || ROLE_LABELS[role]}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="mt-3 flex w-full items-center gap-2 rounded-[18px] border border-transparent px-3 py-3 text-sm font-semibold text-white/68 transition hover:border-white/8 hover:bg-white/[0.04] hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children, role }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const routeMeta = getRouteMeta(location.pathname, role);
  const currentDateLabel = formatWorkspaceDate();

  function handleLogout() {
    logout();
    setIsMobileOpen(false);
    navigate("/auth?tab=login");
  }

  return (
    <div className="portal-shell flex min-h-screen bg-[var(--app-bg)]">
      <aside className="hidden h-screen w-[320px] shrink-0 lg:block">
        <Sidebar role={role} onNavigate={() => {}} onLogout={handleLogout} />
      </aside>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <aside className="relative h-full w-[320px] max-w-[88vw] shadow-[0_40px_100px_rgba(15,23,42,0.28)]">
            <Sidebar
              role={role}
              onNavigate={() => setIsMobileOpen(false)}
              onLogout={handleLogout}
            />
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/10 p-2 text-white/80 hover:bg-white/15 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </aside>
        </div>
      ) : null}

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
          <div className="portal-topbar rounded-card-lg px-4 py-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(true)}
                  className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-slate-200/80 bg-white text-ink shadow-[0_10px_20px_rgba(15,23,42,0.05)] lg:hidden"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                    {role === "admin" ? "Platform Console" : "Client Portal"}
                  </p>
                  <p className="mt-1 truncate text-lg font-semibold text-ink">{routeMeta.title}</p>
                  <p className="mt-1 hidden text-sm text-muted sm:block">{currentDateLabel}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700 shadow-[0_10px_20px_rgba(15,23,42,0.05)] sm:inline-flex">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  Secure workspace
                </div>
                <div className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-2 text-sm text-ink shadow-[0_10px_20px_rgba(15,23,42,0.05)] xl:inline-flex">
                  <Building2 className="h-4 w-4 text-brand-700" />
                  {user?.company || ROLE_LABELS[role]}
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-200/80 bg-white text-ink shadow-[0_10px_20px_rgba(15,23,42,0.05)]"
                  aria-label="Thông báo"
                >
                  <Bell className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] px-4 pb-8 pt-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
