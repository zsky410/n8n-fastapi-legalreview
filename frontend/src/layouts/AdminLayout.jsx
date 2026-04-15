import { Navigate, Outlet, useLocation } from "react-router-dom";

import AppShell from "./AppShell.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { useAuth } from "../hooks/useAuth.js";

export default function AdminLayout() {
  const location = useLocation();
  const { getRedirectPathForRole, isHydrated, user } = useAuth();

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Spinner className="h-8 w-8 text-brand-700" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?tab=login" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== "admin") {
    return <Navigate to={getRedirectPathForRole(user.role)} replace />;
  }

  return (
    <AppShell role="admin">
      <Outlet />
    </AppShell>
  );
}
