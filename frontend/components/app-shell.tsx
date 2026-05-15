"use client";

import {
  ClipboardList,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Scale,
  UserCog,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";

import { fetchMe, User } from "@/lib/api";

type AppShellProps = {
  children: ReactNode;
  area: "client" | "admin";
};

const clientNav = [
  { href: "/documents/overview", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/documents", label: "Tài liệu", icon: FileText },
  { href: "/documents/actions", label: "Cần xử lý", icon: ClipboardList },
  { href: "/documents/profile", label: "Thông tin & trợ lý", icon: UserCog },
];
const reviewerNav = [
  { href: "/admin/queue", label: "Hàng chờ ngoại lệ", icon: ClipboardList },
];
const adminNav = [
  { href: "/admin/dashboard", label: "Dashboard n8n", icon: Workflow },
  { href: "/admin/queue", label: "Hàng chờ rà soát", icon: ClipboardList },
  { href: "/admin/audit-logs", label: "Nhật ký kiểm soát", icon: History },
];

export function AppShell({ children, area }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const navItems = useMemo(() => {
    if (area !== "admin") {
      return clientNav;
    }
    return user?.role === "reviewer" ? reviewerNav : adminNav;
  }, [area, user?.role]);

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
        <Link className="sidebar-brand" href={area === "admin" ? homeHref(user.role) : "/documents/overview"} prefetch={false}>
          <span className="brand-mark small" aria-hidden="true">
            <Scale size={18} />
          </span>
          <span>LegalReview</span>
        </Link>

        <nav className="nav-list" aria-label={area === "admin" ? "Điều hướng nội bộ" : "Điều hướng khách hàng"}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveNavItem(pathname, item.href);
            return (
              <Link className={isActive ? "nav-item active" : "nav-item"} href={item.href} key={item.href} prefetch={false}>
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div>
            <p>{user.email}</p>
            <span>{roleLabel(user.role)}</span>
          </div>
          <button className="icon-button" type="button" onClick={logout} aria-label="Đăng xuất" title="Đăng xuất">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="workspace">{children}</main>
    </div>
  );
}

function homeHref(role: string): string {
  return role === "admin" ? "/admin/dashboard" : "/admin/queue";
}

const clientSectionRoutes = new Set([
  "overview",
  "actions",
  "obligations",
  "risks",
  "assistant",
  "reports",
  "notifications",
  "profile",
  "upload",
]);

function isActiveNavItem(pathname: string, href: string): boolean {
  if (href === "/documents") {
    if (pathname === "/documents") {
      return true;
    }
    const child = pathname.match(/^\/documents\/([^/]+)$/)?.[1];
    return Boolean(child && !clientSectionRoutes.has(child));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function roleLabel(role: string): string {
  return {
    admin: "Admin",
    client: "Khách hàng",
    reviewer: "Người rà soát",
  }[role] ?? role;
}
