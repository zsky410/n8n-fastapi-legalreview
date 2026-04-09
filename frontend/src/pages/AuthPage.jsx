import { ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Card, { CardContent } from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";
import { DEMO_ACCOUNTS } from "../lib/constants.js";
import { getApiMode } from "../lib/api.js";
import { useAuth } from "../hooks/useAuth.js";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "register" ? "register" : "login";
  const { login, getRedirectPathForRole } = useAuth();
  const [email, setEmail] = useState(activeTab === "register" ? "client@demo.vn" : "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (activeTab === "register") {
      navigate("/onboarding");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const sessionUser = await login({ email, password });
      navigate(getRedirectPathForRole(sessionUser.role));
    } catch (authError) {
      setError(authError.message || "Không thể đăng nhập lúc này.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleQuickLogin(nextEmail) {
    setEmail(nextEmail);
    setIsLoading(true);
    setError("");

    try {
      const sessionUser = await login({ email: nextEmail });
      navigate(getRedirectPathForRole(sessionUser.role));
    } catch (authError) {
      setError(authError.message || "Không thể đăng nhập lúc này.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 lg:px-6">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_480px]">
        <Card className="overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 text-white">
          <CardContent className="flex h-full flex-col justify-between gap-8 p-8 lg:p-10">
            <div className="space-y-6">
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-100">
                <ShieldCheck className="h-4 w-4" />
                Về landing page
              </Link>
              <Badge className="border-white/20 bg-white/10 text-brand-100">API {getApiMode().toUpperCase()}</Badge>
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold leading-tight text-balance">
                  Đăng nhập vào bộ khung Milestone 5 với 2 role demo đã được cấu hình sẵn.
                </h1>
                <p className="max-w-xl text-base leading-7 text-brand-100">
                  Auth flow này có local persistence, role redirect và shell-aware navigation để Phase 2 có thể cắm feature vào ngay.
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleQuickLogin(account.email)}
                  className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/10 px-4 py-4 text-left transition hover:bg-white/15"
                >
                  <div>
                    <p className="font-semibold text-white">{account.email}</p>
                    <p className="mt-1 text-sm text-brand-100">{account.company}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                    {account.role}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6 p-8">
            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {[
                { label: "Đăng nhập", value: "login" },
                { label: "Đăng ký", value: "register" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setSearchParams({ tab: tab.value });
                    if (tab.value === "register") {
                      setEmail("client@demo.vn");
                    }
                  }}
                  className={
                    activeTab === tab.value
                      ? "rounded-[14px] bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm"
                      : "rounded-[14px] px-4 py-2 text-sm font-semibold text-slate-500"
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div>
              <h2 className="text-3xl font-semibold text-slate-900">
                {activeTab === "login" ? "Đăng nhập demo" : "Khởi động onboarding"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {activeTab === "login"
                  ? "Dùng một trong hai email demo để vào đúng shell theo role."
                  : "Bạn đang ở bộ khung Phase 1, onboarding hiện tại là bản wizard mẫu."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="client@demo.vn"
              />
              <Input
                label="Mật khẩu"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="demo-password"
                hint="Mật khẩu hiện chỉ là placeholder cho UI scaffold."
              />
              {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
              <Button type="submit" className="w-full" isLoading={isLoading}>
                <UserRound className="h-4 w-4" />
                {activeTab === "login" ? "Vào dashboard" : "Mở onboarding"}
              </Button>
            </form>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-semibold text-slate-700">Ghi chú nhanh</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                `client@demo.vn` vào <strong>/client/dashboard</strong>, `admin@demo.vn` vào <strong>/admin/routing</strong>.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
              <Link to="/onboarding" className="font-semibold text-brand-700">
                Xem wizard onboarding
              </Link>
              <Link to="/" className="font-semibold text-slate-700">
                Quay về home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
