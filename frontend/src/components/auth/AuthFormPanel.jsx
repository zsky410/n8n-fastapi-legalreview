import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth.js";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Tabs from "../ui/Tabs.jsx";

const EMPTY_FIELD_ERRORS = {
  name: "",
  company: "",
  email: "",
  password: "",
};

function normalizeTab(value) {
  return value === "register" ? "register" : "login";
}

function getValidationMessage(detail) {
  const field = String(detail?.field || "").split(".").pop();
  const code = detail?.code;

  if (field === "email") {
    if (code === "string_pattern_mismatch") {
      return "Email chưa đúng định dạng.";
    }
    return "Vui lòng nhập email hợp lệ.";
  }

  if (field === "password") {
    if (code === "string_too_short") {
      return "Mật khẩu cần ít nhất 8 ký tự.";
    }
    return "Mật khẩu hiện chưa hợp lệ.";
  }

  if (field === "name") {
    if (code === "string_too_short") {
      return "Tên hiển thị cần ít nhất 2 ký tự.";
    }
    return "Tên hiển thị hiện chưa hợp lệ.";
  }

  if (field === "company") {
    return "Tên công ty hiện chưa hợp lệ.";
  }

  return detail?.message || "Thông tin nhập vào chưa hợp lệ.";
}

export default function AuthFormPanel({
  initialTab = "login",
  onSuccess,
  onTabChange,
  showHeading = true,
  showInfoNote = true,
}) {
  const navigate = useNavigate();
  const { login, register, getRedirectPathForRole } = useAuth();
  const [activeTab, setActiveTab] = useState(() => normalizeTab(initialTab));
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState(EMPTY_FIELD_ERRORS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setActiveTab(normalizeTab(initialTab));
    setError("");
    setFieldErrors(EMPTY_FIELD_ERRORS);
  }, [initialTab]);

  function resetErrors() {
    setError("");
    setFieldErrors(EMPTY_FIELD_ERRORS);
  }

  function handleAuthError(authError) {
    const nextFieldErrors = { ...EMPTY_FIELD_ERRORS };
    const details = Array.isArray(authError?.details) ? authError.details : [];

    details.forEach((detail) => {
      const field = String(detail?.field || "").split(".").pop();
      if (field in nextFieldErrors) {
        nextFieldErrors[field] = getValidationMessage(detail);
      }
    });

    setFieldErrors(nextFieldErrors);

    const normalizedMessage = String(authError?.message || "").toLowerCase();
    if (!details.length && (authError?.status === 409 || (authError?.status === 400 && normalizedMessage.includes("email")))) {
      setFieldErrors((current) => ({
        ...current,
        email: authError.message || "Email này hiện chưa dùng được.",
      }));
      setError("");
      return;
    }

    const hasFieldErrors = Object.values(nextFieldErrors).some(Boolean);
    if (hasFieldErrors && authError?.code === "validation_error") {
      setError("Vui lòng kiểm tra lại các trường đang báo lỗi.");
      return;
    }

    setError(authError?.message || "Không thể xác thực lúc này.");
  }

  function handleTabValueChange(nextTab) {
    const normalizedTab = normalizeTab(nextTab);
    setActiveTab(normalizedTab);
    resetErrors();
    onTabChange?.(normalizedTab);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsLoading(true);
    resetErrors();

    try {
      const sessionUser =
        activeTab === "register"
          ? await register({ email, password, name, company })
          : await login({ email, password });

      await onSuccess?.(sessionUser);
      navigate(getRedirectPathForRole(sessionUser.role));
    } catch (authError) {
      handleAuthError(authError);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Tabs
        className="bg-slate-50 shadow-none"
        value={activeTab}
        onChange={handleTabValueChange}
        tabs={[
          { label: "Đăng nhập", value: "login" },
          { label: "Đăng ký", value: "register" },
        ]}
      />

      {showHeading ? (
        <div className="space-y-3">
          <div className="portal-kicker">Client Access</div>
          <h2 className="font-serif text-[2.2rem] leading-tight tracking-[-0.04em] text-ink">
            {activeTab === "login" ? "Đăng nhập khách hàng" : "Tạo tài khoản khách hàng"}
          </h2>
          <p className="max-w-xl text-sm leading-6 text-muted">
            {activeTab === "login"
              ? "Dùng email và mật khẩu đã tạo để vào cổng khách hàng."
              : "Điền thông tin thật để tạo tài khoản khách hàng đầu tiên trên hệ thống."}
          </p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === "register" ? (
          <>
            <Input
              label="Tên hiển thị"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setFieldErrors((current) => ({ ...current, name: "" }));
              }}
              placeholder="Nguyễn Minh An"
              autoComplete="name"
              error={fieldErrors.name}
            />
            <Input
              label="Công ty"
              value={company}
              onChange={(event) => {
                setCompany(event.target.value);
                setFieldErrors((current) => ({ ...current, company: "" }));
              }}
              placeholder="Công ty ABC"
              autoComplete="organization"
              error={fieldErrors.company}
            />
          </>
        ) : null}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldErrors((current) => ({ ...current, email: "" }));
          }}
          placeholder="ban@congty.vn"
          autoComplete="email"
          error={fieldErrors.email}
        />
        <Input
          label="Mật khẩu"
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, password: "" }));
          }}
          placeholder="Tối thiểu 8 ký tự"
          autoComplete={activeTab === "login" ? "current-password" : "new-password"}
          hint={activeTab === "register" ? "Chọn mật khẩu đủ mạnh để dùng lại cho các lần đăng nhập sau." : undefined}
          error={fieldErrors.password}
        />

        {error ? <p className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        <Button type="submit" className="w-full" isLoading={isLoading}>
          <UserRound className="h-4 w-4" />
          {activeTab === "login" ? "Vào cổng khách hàng" : "Tạo tài khoản và bắt đầu"}
        </Button>
      </form>

      {showInfoNote ? (
        <div className="rounded-[22px] border border-slate-200/80 bg-[#f8fafc] px-4 py-4 text-sm leading-6 text-muted">
          Luồng khách hàng đã dùng xác thực thật. Tài khoản `admin@demo.vn` vẫn được giữ riêng cho demo quản trị.
        </div>
      ) : null}
    </div>
  );
}
