import { Activity, FilePlus2, GaugeCircle, LayoutDashboard, LogOut, Logs, Menu, PanelLeftClose, PanelLeftOpen, Scale, Settings2, Users2, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
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

function SidebarNav({ items, onNavigate, collapsed }) {
  return (
    <nav className={cn("space-y-0.5", collapsed ? "px-2.5" : "px-3")}>
      {items.map((item) => {
        const Icon = iconMap[item.icon] || LayoutDashboard;

        return (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-lg transition-colors text-[13px] font-medium",
                collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-white/[0.08] text-white"
                  : "text-white/50 hover:bg-white/[0.04] hover:text-white/80",
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <Icon className="h-[18px] w-[18px]" />
            {collapsed ? null : <span className="whitespace-nowrap">{item.label}</span>}
          </NavLink>
        );
      })}
    </nav>
  );
}

function Sidebar({ role, onNavigate, onLogout, collapsed, showCollapseToggle = false, onToggleCollapse }) {
  const { user } = useAuth();
  const navItems = (role === "admin" ? ADMIN_NAV_ITEMS : CLIENT_NAV_ITEMS).filter((item) => item.showInNav);

  return (
    <div className="flex h-full flex-col bg-[#1a1614]">
      <div
        className={cn(
          "flex items-center gap-3 px-5 py-5",
          collapsed ? "px-3" : "",
          collapsed && showCollapseToggle ? "gap-0 justify-between" : "",
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7a1f2b]">
          <Scale className="h-4 w-4 text-white" />
        </div>

        {collapsed ? null : (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{APP_NAME}</p>
            <p className="text-[11px] text-white/40">{ROLE_LABELS[role]}</p>
          </div>
        )}

        {showCollapseToggle ? (
          <button
            type="button"
            aria-label={collapsed ? "Mở sidebar" : "Thu gọn sidebar"}
            onClick={onToggleCollapse}
            className={cn(
              "ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.06] text-white/75",
              "transition-colors hover:bg-white/[0.10] hover:text-white",
            )}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        ) : null}
      </div>

      <div className="mx-4 h-px bg-white/[0.06]" />

      <div className="mt-4 flex-1 overflow-y-auto">
        {collapsed ? null : (
          <p className="mb-2 px-6 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25">
            Điều hướng
          </p>
        )}

        <SidebarNav items={navItems} onNavigate={onNavigate} collapsed={collapsed} />
      </div>

      <div className="mx-4 h-px bg-white/[0.06]" />

      <div className="p-3">
        <div className={cn("flex items-center gap-3 rounded-lg bg-white/[0.04] px-3 py-2.5", collapsed ? "justify-center px-2" : "")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#b38a2e] text-xs font-bold text-white">
            {(user?.name || "U")[0].toUpperCase()}
          </div>

          {collapsed ? null : (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white/80">{user?.name || "Người dùng"}</p>
              <p className="truncate text-[11px] text-white/30">{user?.company || ""}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onLogout}
          className={cn(
            "mt-1.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white/70",
            collapsed ? "justify-center px-2" : "",
          )}
        >
          <LogOut className="h-4 w-4" />
          {collapsed ? null : "Đăng xuất"}
        </button>
      </div>
    </div>
  );
}

export default function AppShell({ children, role }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    setIsMobileOpen(false);
    navigate("/auth?tab=login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f7f4]">
      <aside
        className={cn(
          "hidden h-full shrink-0 lg:block bg-[#1a1614] w-[260px]",
        )}
      >
        <Sidebar
          role={role}
          onNavigate={() => {}}
          onLogout={handleLogout}
          collapsed={false}
        />
      </aside>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <aside className="relative h-full w-[280px] max-w-[85vw] shadow-2xl">
            <Sidebar role={role} onNavigate={() => setIsMobileOpen(false)} onLogout={handleLogout} collapsed={false} />
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg bg-white/10 p-1.5 text-white/60 hover:bg-white/20 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-black/[0.06] bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="rounded-lg p-1.5 text-[#1a1614] hover:bg-black/[0.04]"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-[#7a1f2b]" />
            <span className="text-sm font-semibold text-[#1a1614]">{APP_NAME}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
