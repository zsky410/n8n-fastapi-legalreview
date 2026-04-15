import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Card, { CardContent } from "../components/ui/Card.jsx";
import AuthFormPanel from "../components/auth/AuthFormPanel.jsx";
import { DEMO_ACCOUNTS } from "../lib/constants.js";
import { formatRoleLabel } from "../lib/formatters.js";
import { useAuth } from "../hooks/useAuth.js";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "register" ? "register" : "login";
  const { login, getRedirectPathForRole } = useAuth();
  const adminDemoAccounts = DEMO_ACCOUNTS.filter((account) => account.role === "admin");
  const [isQuickLoginLoading, setIsQuickLoginLoading] = useState(false);
  const [quickLoginError, setQuickLoginError] = useState("");

  async function handleQuickLogin(nextEmail) {
    setIsQuickLoginLoading(true);
    setQuickLoginError("");

    try {
      const sessionUser = await login({ email: nextEmail });
      navigate(getRedirectPathForRole(sessionUser.role));
    } catch (error) {
      setQuickLoginError(error?.message || "Không thể mở tài khoản demo lúc này.");
    } finally {
      setIsQuickLoginLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-4 py-5 lg:px-6">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_480px]">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-warm-900 via-[#373634] to-[#2c2b2a] text-white shadow-ring">
          <CardContent className="flex h-full flex-col justify-between gap-8 p-8 lg:p-10">
            <div className="space-y-6">
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-200 hover:text-brand-100">
                <ShieldCheck className="h-4 w-4" />
                Về landing page
              </Link>
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold leading-tight text-balance">
                  Tài khoản khách hàng giờ có thể đăng ký và đăng nhập thật ngay trên hệ thống.
                </h1>
                <p className="max-w-xl text-base leading-7 text-white/70">
                  Luồng khách hàng đã dùng auth thật để lưu người dùng trong hệ thống. Riêng khu vực quản trị vẫn được giữ ở chế độ demo để tránh mở rộng scope quá sớm.
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {adminDemoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleQuickLogin(account.email)}
                  disabled={isQuickLoginLoading}
                  className="flex items-center justify-between rounded-sm border border-white/10 bg-white/10 px-4 py-4 text-left transition hover:bg-white/15"
                >
                  <div>
                    <p className="font-semibold text-white">{account.email}</p>
                    <p className="mt-1 text-sm text-white/65">{account.company}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                    {formatRoleLabel(account.role)}
                  </span>
                </button>
              ))}
              {quickLoginError ? <p className="rounded-sm bg-rose-500/15 px-4 py-3 text-sm text-rose-100">{quickLoginError}</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6 p-8">
            <AuthFormPanel
              initialTab={activeTab}
              onTabChange={(nextTab) => setSearchParams({ tab: nextTab })}
            />

            <div className="flex items-center justify-between gap-3 text-sm text-muted">
              <Link to="/onboarding" className="font-semibold text-brand-700 hover:text-brand-700">
                Xem thiết lập ban đầu
              </Link>
              <Link to="/" className="font-semibold text-ink">
                Quay về home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
