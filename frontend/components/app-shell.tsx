"use client";

import {
  ClipboardList,
  FileText,
  Gauge,
  History,
  LogOut,
  Scale,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";

import { fetchMe, User } from "@/lib/api";

type AppShellProps = {
  children: ReactNode;
  area: "client" | "admin";
};

const clientNav = [{ href: "/documents", label: "Documents", icon: FileText }];
const adminNav = [
  { href: "/admin/queue", label: "Queue", icon: ClipboardList },
  { href: "/admin/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/admin/audit-logs", label: "Audit logs", icon: History },
];

export function AppShell({ children, area }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const navItems = useMemo(() => (area === "admin" ? adminNav : clientNav), [area]);

  useEffect(() => {
    const token = localStorage.getItem("legalreview_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    fetchMe(token)
      .then((currentUser) => {
        if (
          area === "admin" &&
          currentUser.role !== "admin" &&
          currentUser.role !== "reviewer"
        ) {
          router.replace("/documents");
          return;
        }
        setUser(currentUser);
      })
      .catch(() => {
        localStorage.removeItem("legalreview_token");
        localStorage.removeItem("legalreview_user");
        router.replace("/login");
      })
      .finally(() => setIsLoading(false));
  }, [area, router]);

  function logout() {
    localStorage.removeItem("legalreview_token");
    localStorage.removeItem("legalreview_user");
    router.replace("/login");
  }

  if (isLoading) {
    return (
      <main className="loading-screen">
        <div className="loader-line" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link className="sidebar-brand" href={area === "admin" ? "/admin/queue" : "/documents"}>
          <span className="brand-mark small" aria-hidden="true">
            <Scale size={18} />
          </span>
          <span>LegalReview</span>
        </Link>

        <nav className="nav-list" aria-label={`${area} navigation`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link className={isActive ? "nav-item active" : "nav-item"} href={item.href} key={item.href}>
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div>
            <p>{user.email}</p>
            <span>{user.role}</span>
          </div>
          <button className="icon-button" type="button" onClick={logout} aria-label="Log out" title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="workspace">{children}</main>
    </div>
  );
}

