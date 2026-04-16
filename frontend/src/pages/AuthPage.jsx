import { ArrowUpRight, Building2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Card, { CardContent } from "../components/ui/Card.jsx";
import AuthFormPanel from "../components/auth/AuthFormPanel.jsx";
import { DEMO_ACCOUNTS } from "../lib/constants.js";
import { formatRoleLabel } from "../lib/formatters.js";
import { useAuth } from "../hooks/useAuth.js";

function TrustTile({ label, value, hint }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/44">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-white/68">{hint}</p>
    </div>
  );
}

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
    <main className="portal-shell min-h-screen px-4 py-5 lg:px-6">
      <div className="mx-auto grid max-w-[1440px] gap-6 lg:grid-cols-[minmax(0,1.1fr)_520px]">
        <section className="rounded-[34px] bg-[linear-gradient(160deg,#0f172a_0%,#13213f_40%,#0f1a30_100%)] p-8 text-white shadow-[0_34px_80px_rgba(15,23,42,0.22)] lg:p-10">
          <div className="flex h-full flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/72 transition hover:text-white">
                <ShieldCheck className="h-4 w-4" />
                Về landing page
              </Link>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                Secure client access
              </div>
            </div>

            <div className="space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d9b265]">Legal SaaS Portal</p>
              <h1 className="max-w-3xl font-serif text-[3.15rem] leading-[0.95] tracking-[-0.05em] text-white">
                Đăng nhập vào workspace pháp lý được tổ chức để ra quyết định, không chỉ để xem trạng thái.
              </h1>
              <p className="max-w-2xl text-[15px] leading-7 text-white/72">
                Không gian client mới ưu tiên matter room rõ ràng, bề dày dữ liệu vừa đủ, trust signals mạnh và trải nghiệm intake đủ sạch để dùng cho môi trường vận hành thật.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <TrustTile label="Security" value="RBAC + audit trail" hint="Hồ sơ, chat và timeline được gom theo matter room để dễ kiểm soát truy cập." />
              <TrustTile label="Matter flow" value="OCR -> AI -> publish" hint="Từng hồ sơ đi qua pipeline rõ ràng, không phải chuỗi card rời rạc." />
              <TrustTile label="Delivery" value="Production-ready UI" hint="Typography, spacing và density được cân cho legal SaaS thay vì demo template." />
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d9b265]">Admin Demo Access</p>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/72">
                    Khu vực quản trị vẫn được giữ ở chế độ demo để kiểm thử vận hành mà không mở rộng scope xác thực quá sớm.
                  </p>
                </div>
                <LockKeyhole className="mt-1 h-5 w-5 text-white/70" />
              </div>

              <div className="mt-5 grid gap-3">
                {adminDemoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => handleQuickLogin(account.email)}
                    disabled={isQuickLoginLoading}
                    className="flex items-center justify-between gap-4 rounded-[20px] border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:bg-white/10"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{account.email}</p>
                      <p className="mt-1 text-sm text-white/60">{account.company}</p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/68">
                      {formatRoleLabel(account.role)}
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </button>
                ))}
              </div>

              {quickLoginError ? (
                <p className="mt-4 rounded-[18px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {quickLoginError}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <Card className="self-start">
          <CardContent className="space-y-6 p-8 lg:p-9">
            <AuthFormPanel
              initialTab={activeTab}
              onTabChange={(nextTab) => setSearchParams({ tab: nextTab })}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 pt-4 text-sm text-muted">
              <Link to="/onboarding" className="inline-flex items-center gap-2 font-semibold text-brand-700 hover:text-brand-600">
                <Building2 className="h-4 w-4" />
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
