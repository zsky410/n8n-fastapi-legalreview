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
                "flex items-center gap-3 rounded-sm px-4 py-3 text-sm font-semibold transition",
                isActive ? "bg-white/12 text-gold" : "text-white/70 hover:bg-white/10 hover:text-white",
              )
            }
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

function SidebarContent({ role, onNavigate, onLogout }) {
  const { user } = useAuth();
  const navItems = (role === "admin" ? ADMIN_NAV_ITEMS : CLIENT_NAV_ITEMS).filter((item) => item.showInNav);

  return (
    <div className="surface-sidebar flex h-full flex-col p-5">
      <div className="flex items-center gap-3 border-b border-white/10 pb-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-sm border border-white/15 bg-white/5 text-white">
          <Scale className="h-5 w-5" />
        </span>
        <div>
          <p className="text-base font-semibold">{APP_NAME}</p>
          <p className="text-sm text-white/65">{ROLE_LABELS[role]}</p>
        </div>
      </div>

      <div className="mt-6 flex-1 space-y-6">
        <SidebarNav items={navItems} onNavigate={onNavigate} />
      </div>

      <div className="mt-6 rounded-sm border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">{user?.name}</p>
        <p className="mt-1 text-sm text-white/65">{user?.company}</p>
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/50">{user?.subtitle}</p>
      </div>

      {onLogout ? (
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              onLogout();
              onNavigate?.();
            }}
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default function AppShell({ children, role }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    setIsSidebarOpen(false);
    navigate("/auth?tab=login");
  }

  return (
    <div className="min-h-screen bg-[#fafafa] p-4 lg:p-5">
      <div className="legal-grid min-h-[calc(100vh-2rem)] rounded-sm border border-line bg-white p-3 shadow-sm lg:p-4">
        <div className="grid min-h-[calc(100vh-3.5rem)] gap-4 lg:grid-cols-[310px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <SidebarContent role={role} onLogout={handleLogout} />
          </div>

          {isSidebarOpen ? (
            <div className="fixed inset-0 z-40 bg-ink/45 lg:hidden">
              <div className="h-full w-[86vw] max-w-[320px] p-4">
                <div className="relative h-full">
                  <SidebarContent role={role} onNavigate={() => setIsSidebarOpen(false)} onLogout={handleLogout} />
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
            <header className="surface-panel flex items-center px-5 py-4 lg:hidden">
              <Button
                variant="secondary"
                size="sm"
                aria-label="Mở sidebar"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </header>
            <main>{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
