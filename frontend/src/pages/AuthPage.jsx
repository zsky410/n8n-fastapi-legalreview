import { ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Button from "../components/ui/Button.jsx";
import Card, { CardContent } from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";
import { DEMO_ACCOUNTS } from "../lib/constants.js";
import { formatRoleLabel } from "../lib/formatters.js";
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
    <main className="min-h-screen bg-[#fafafa] px-4 py-5 lg:px-6">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_480px]">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-ink via-brand-800 to-brand-900 text-white shadow-sm">
          <CardContent className="flex h-full flex-col justify-between gap-8 p-8 lg:p-10">
            <div className="space-y-6">
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gold/90 hover:text-gold">
                <ShieldCheck className="h-4 w-4" />
                Về landing page
              </Link>
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold leading-tight text-balance">
                  Đăng nhập bằng tài khoản dùng thử và đi thẳng vào đúng khu vực làm việc.
                </h1>
                <p className="max-w-xl text-base leading-7 text-white/70">
                  Mỗi tài khoản sẽ được đưa tới giao diện phù hợp theo vai trò, giúp bạn bắt đầu xem luồng khách hàng hoặc quản trị ngay lập tức.
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleQuickLogin(account.email)}
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6 p-8">
            <div className="inline-flex rounded-sm border border-line bg-[#fafafa] p-1">
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
                      ? "rounded-sm bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm"
                      : "rounded-sm px-4 py-2 text-sm font-semibold text-muted"
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div>
              <h2 className="text-3xl font-semibold text-ink">
                {activeTab === "login" ? "Đăng nhập nhanh" : "Thiết lập ban đầu"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {activeTab === "login"
                  ? "Dùng một trong hai tài khoản có sẵn để mở đúng không gian làm việc."
                  : "Điền thông tin khởi tạo để chuyển sang bước thiết lập tiếp theo."}
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
                placeholder="mat-khau-dung-thu"
                hint="Trường này đang được giữ để hoàn thiện luồng xác thực ở các bước tiếp theo."
              />
              {error ? <p className="rounded-sm bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
              <Button type="submit" className="w-full" isLoading={isLoading}>
                <UserRound className="h-4 w-4" />
                {activeTab === "login" ? "Vào khu vực làm việc" : "Tiếp tục thiết lập"}
              </Button>
            </form>

            <div className="rounded-sm border border-line bg-[#fafafa] px-4 py-4 text-sm leading-6 text-muted">
              `client@demo.vn` sẽ vào khu vực khách hàng, còn `admin@demo.vn` sẽ vào khu vực quản trị.
            </div>

            <div className="flex items-center justify-between gap-3 text-sm text-muted">
              <Link to="/onboarding" className="font-semibold text-gold hover:text-gold/90">
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
