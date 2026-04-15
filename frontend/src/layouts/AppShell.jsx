import { Activity, FilePlus2, GaugeCircle, LayoutDashboard, LogOut, Logs, Menu, Scale, Settings2, Users2, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

import { ADMIN_NAV_ITEMS, APP_NAME, CLIENT_NAV_ITEMS, ROLE_LABELS } from "../lib/constants.js";
import { cn } from "../lib/cn.js";
import { useAuth } from "../hooks/useAuth.js";
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

function SidebarNav({ collapsed, items, onNavigate }) {
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
                "group flex items-center rounded-full text-lg font-semibold transition",
                collapsed ? "h-11 w-11 justify-center px-0 py-0" : "gap-3 px-4 py-3",
                isActive ? "bg-brand-50 text-brand-700 shadow-ring" : "text-muted hover:bg-[rgba(211,242,192,0.4)] hover:text-ink",
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <Icon className="h-4 w-4" />
            <span
              className={cn(
                "whitespace-nowrap transition-all duration-200",
                collapsed ? "max-w-0 translate-x-1 overflow-hidden opacity-0" : "max-w-[160px] translate-x-0 opacity-100",
              )}
            >
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function SidebarContent({ collapsed, role, onNavigate, onLogout }) {
  const { user } = useAuth();
  const navItems = (role === "admin" ? ADMIN_NAV_ITEMS : CLIENT_NAV_ITEMS).filter((item) => item.showInNav);

  return (
    <div className={cn("surface-sidebar flex h-full flex-col p-5", collapsed ? "items-center px-3" : "")}>
      <div className={cn("flex border-b border-line pb-5", collapsed ? "w-full justify-center" : "items-center gap-3")}>
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-ring">
          <Scale className="h-5 w-5" />
        </span>
        <div
          className={cn(
            "transition-all duration-200",
            collapsed ? "max-w-0 -translate-x-1 overflow-hidden opacity-0" : "max-w-[180px] translate-x-0 opacity-100",
          )}
        >
          <p className="text-base font-semibold">{APP_NAME}</p>
          <p className="text-sm text-muted">{ROLE_LABELS[role]}</p>
        </div>
      </div>

      <div className={cn("mt-6 flex-1 space-y-6", collapsed ? "w-full" : "")}>
        <SidebarNav collapsed={collapsed} items={navItems} onNavigate={onNavigate} />
      </div>

      {collapsed ? null : (
        <div className="mt-6 rounded-card border border-line bg-surface p-4 shadow-ring">
          <p className="text-sm font-semibold text-ink">{user?.name}</p>
          <p className="mt-1 text-sm text-muted">{user?.company}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted">{user?.subtitle}</p>
        </div>
      )}

      {onLogout ? (
        <div className="mt-4 w-full">
          <Button
            type="button"
            variant="secondary"
            className={cn("w-full", collapsed ? "h-11 w-11 px-0" : "")}
            onClick={() => {
              onLogout();
              onNavigate?.();
            }}
            title={collapsed ? "Đăng xuất" : undefined}
          >
            <LogOut className="h-4 w-4" />
            {collapsed ? null : "Đăng xuất"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default function AppShell({ children, role }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    setIsDesktopSidebarOpen(false);
    setIsMobileSidebarOpen(false);
    navigate("/auth?tab=login");
  }

  return (
    <div className="min-h-screen bg-white px-3 py-3 lg:px-6 lg:py-5">
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          aria-label="Bật tắt sidebar"
          className="hidden lg:inline-flex"
          onClick={() => setIsDesktopSidebarOpen((current) => !current)}
        >
          <Menu className="h-4 w-4" />
          {isDesktopSidebarOpen ? "Ẩn menu" : "Mở menu"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          aria-label="Mở sidebar"
          className="lg:hidden"
          onClick={() => setIsMobileSidebarOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex min-h-[calc(100vh-5.5rem)] gap-4">
        <aside className={cn("hidden shrink-0 overflow-hidden transition-[width] duration-300 ease-out lg:block", isDesktopSidebarOpen ? "w-[300px]" : "w-[86px]")}>
          <div className="h-full">
            <SidebarContent collapsed={!isDesktopSidebarOpen} role={role} onLogout={handleLogout} />
          </div>
        </aside>

        {isMobileSidebarOpen ? (
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden">
            <div className="h-full w-[86vw] max-w-[320px] p-4">
              <div className="relative h-full">
                <SidebarContent collapsed={false} role={role} onNavigate={() => setIsMobileSidebarOpen(false)} onLogout={handleLogout} />
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Đóng sidebar"
                  className="absolute right-4 top-4 h-9 w-9 rounded-full bg-white px-0"
                  onClick={() => setIsMobileSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
