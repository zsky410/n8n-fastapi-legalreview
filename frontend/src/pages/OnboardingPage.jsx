import { CheckCircle2, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Card, { CardContent } from "../components/ui/Card.jsx";
import Select from "../components/ui/Select.jsx";
import { CUSTOMER_TYPES, LEGAL_DOMAINS } from "../lib/constants.js";
import { onboardingDefaults } from "../lib/mockData.js";

const notificationLabels = {
  email: "Email",
  inApp: "Trong ứng dụng",
  sms: "Tin nhắn SMS",
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [customerType, setCustomerType] = useState(onboardingDefaults.customerType);
  const [selectedDomains, setSelectedDomains] = useState(onboardingDefaults.legalDomains);
  const [notifications, setNotifications] = useState(onboardingDefaults.notifications);

  const currentCustomer = useMemo(
    () => CUSTOMER_TYPES.find((entry) => entry.id === customerType) || CUSTOMER_TYPES[0],
    [customerType],
  );

  function toggleDomain(domain) {
    setSelectedDomains((currentDomains) =>
      currentDomains.includes(domain)
        ? currentDomains.filter((entry) => entry !== domain)
        : [...currentDomains, domain],
    );
  }

  function toggleNotification(key) {
    setNotifications((currentValues) => ({
      ...currentValues,
      [key]: !currentValues[key],
    }));
  }

  return (
    <main className="min-h-screen px-4 py-5 lg:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge className="border-brand-100 bg-brand-50 text-brand-700">Thiết lập ban đầu</Badge>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">Cấu hình nhanh không gian làm việc</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Chọn loại hình khách hàng, lĩnh vực ưu tiên và kênh thông báo để LegalDesk AI gợi ý trải nghiệm phù hợp hơn.
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate("/auth?tab=login")}>
            Về đăng nhập
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <Card>
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">1</span>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Chọn loại khách hàng</h2>
                    <p className="text-sm text-slate-500">Thông tin này giúp điều chỉnh ngôn ngữ và mức độ ưu tiên của giao diện.</p>
                  </div>
                </div>
                <Select
                  label="Loại khách hàng"
                  value={customerType}
                  onChange={(event) => setCustomerType(event.target.value)}
                  options={CUSTOMER_TYPES.map((entry) => ({
                    label: entry.title,
                    value: entry.id,
                  }))}
                />
                <div className="grid gap-3 md:grid-cols-3">
                  {CUSTOMER_TYPES.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setCustomerType(entry.id)}
                      className={`rounded-[24px] border px-4 py-4 text-left transition ${
                        customerType === entry.id
                          ? "border-brand-300 bg-brand-50"
                          : "border-slate-200 bg-slate-50 hover:border-brand-200 hover:bg-brand-50/40"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">{entry.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{entry.description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">2</span>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Lĩnh vực ưu tiên</h2>
                    <p className="text-sm text-slate-500">Chọn các nhóm tài liệu bạn xử lý thường xuyên để cá nhân hóa trải nghiệm ban đầu.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {LEGAL_DOMAINS.map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => toggleDomain(domain)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        selectedDomains.includes(domain)
                          ? "border-brand-300 bg-brand-50 text-brand-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-brand-200"
                      }`}
                    >
                      {domain}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">3</span>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Kênh thông báo</h2>
                    <p className="text-sm text-slate-500">Bật hoặc tắt các kênh nhận cập nhật để phù hợp với quy trình làm việc của bạn.</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {Object.entries(notifications).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleNotification(key)}
                      className={`rounded-[24px] border px-4 py-4 text-left transition ${
                        value ? "border-brand-300 bg-brand-50" : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">{notificationLabels[key] || key}</p>
                      <p className="mt-2 text-sm text-slate-500">{value ? "Đang bật" : "Đang tắt"}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-950 text-white">
            <CardContent className="space-y-5 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">Tóm tắt thiết lập</p>
              <div className="space-y-4">
                <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm text-white/70">Loại khách hàng</p>
                  <p className="mt-2 text-lg font-semibold text-white">{currentCustomer.title}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm text-white/70">Lĩnh vực ưu tiên</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedDomains.map((domain) => (
                      <Badge key={domain} className="border-white/10 bg-white/10 text-white">
                        {domain}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm text-white/70">Thông báo</p>
                  <div className="mt-3 space-y-3">
                    {Object.entries(notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-slate-200">{notificationLabels[key] || key}</span>
                        <span className={value ? "text-emerald-300" : "text-slate-500"}>
                          {value ? <CheckCircle2 className="h-4 w-4" /> : "Tắt"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Button className="w-full" onClick={() => navigate("/auth?tab=login")}>
                Hoàn tất thiết lập
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
