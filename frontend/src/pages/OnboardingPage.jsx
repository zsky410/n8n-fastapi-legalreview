import { CheckCircle2, ChevronRight, Layers3, RadioTower, Scale } from "lucide-react";
import { useMemo, useState } from "react";

import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card.jsx";
import { useAuthModal } from "../hooks/useAuthModal.js";
import Select from "../components/ui/Select.jsx";
import { CUSTOMER_TYPES, LEGAL_DOMAINS } from "../lib/constants.js";
import { onboardingDefaults } from "../lib/mockData.js";

const notificationLabels = {
  email: "Email",
  inApp: "Trong ứng dụng",
  sms: "Tin nhắn SMS",
};

export default function OnboardingPage() {
  const { openAuthModal } = useAuthModal();
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
    <main className="portal-shell min-h-screen px-4 py-5 lg:px-6">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <div className="portal-kicker">Workspace Setup</div>
            <h1 className="mt-4 font-serif text-[3rem] leading-[0.95] tracking-[-0.05em] text-ink">
              Cấu hình nhanh để legal workspace phản ánh đúng cách doanh nghiệp của bạn xử lý matter.
            </h1>
            <p className="mt-4 max-w-3xl text-[15px] leading-7 text-muted">
              Onboarding ở đây không nhằm tạo thêm bước thừa, mà để làm rõ đối tượng sử dụng, domain ưu tiên và cách nhận tín hiệu vận hành ngay từ đầu.
            </p>
          </div>
          <Button variant="secondary" onClick={() => openAuthModal("login")}>
            Về đăng nhập
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">Step 1</p>
                    <CardTitle>Chọn loại khách hàng</CardTitle>
                  </div>
                  <Scale className="h-5 w-5 text-brand-700" />
                </div>
                <CardDescription>Thông tin này định hình giọng điệu, mức độ data density và ưu tiên hiển thị của workspace.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
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
                      className={
                        customerType === entry.id
                          ? "rounded-[22px] border border-brand-500/15 bg-brand-50 px-4 py-4 text-left shadow-[0_12px_24px_rgba(30,58,138,0.06)]"
                          : "rounded-[22px] border border-slate-200/80 bg-white px-4 py-4 text-left transition hover:border-brand-500/15 hover:bg-[#f8fafc]"
                      }
                    >
                      <p className="text-sm font-semibold text-ink">{entry.title}</p>
                      <p className="mt-2 text-sm leading-6 text-muted">{entry.description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">Step 2</p>
                    <CardTitle>Lĩnh vực ưu tiên</CardTitle>
                  </div>
                  <Layers3 className="h-5 w-5 text-brand-700" />
                </div>
                <CardDescription>Chọn các domain xuất hiện nhiều nhất trong intake để hệ thống ưu tiên language và nhịp review phù hợp.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {LEGAL_DOMAINS.map((domain) => (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => toggleDomain(domain)}
                    className={
                      selectedDomains.includes(domain)
                        ? "rounded-full border border-brand-500/15 bg-brand-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700"
                        : "rounded-full border border-slate-200/80 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted transition hover:border-brand-500/15 hover:text-brand-700"
                    }
                  >
                    {domain}
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">Step 3</p>
                    <CardTitle>Kênh thông báo</CardTitle>
                  </div>
                  <RadioTower className="h-5 w-5 text-brand-700" />
                </div>
                <CardDescription>Chọn cách workspace gửi tín hiệu cập nhật để không bỏ lỡ mốc cần action nhưng cũng không gây quá tải.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                {Object.entries(notifications).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleNotification(key)}
                    className={
                      value
                        ? "rounded-[22px] border border-brand-500/15 bg-brand-50 px-4 py-4 text-left shadow-[0_12px_24px_rgba(30,58,138,0.06)]"
                        : "rounded-[22px] border border-slate-200/80 bg-white px-4 py-4 text-left transition hover:border-brand-500/15 hover:bg-[#f8fafc]"
                    }
                  >
                    <p className="text-sm font-semibold text-ink">{notificationLabels[key] || key}</p>
                    <p className="mt-2 text-sm text-muted">{value ? "Đang bật" : "Đang tắt"}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <Card className="!bg-warm-900 !text-white">
              <CardContent className="space-y-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/44">Workspace Summary</p>
                  <p className="mt-2 font-serif text-[2rem] leading-tight tracking-[-0.04em] text-white">{currentCustomer.title}</p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/44">Domain ưu tiên</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedDomains.map((domain) => (
                        <Badge key={domain} className="border-white/10 bg-white/10 text-white">
                          {domain}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/44">Thông báo</p>
                    <div className="mt-3 space-y-3">
                      {Object.entries(notifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-white/74">{notificationLabels[key] || key}</span>
                          <span className={value ? "text-emerald-300" : "text-white/44"}>
                            {value ? <CheckCircle2 className="h-4 w-4" /> : "Tắt"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Button className="w-full" onClick={() => openAuthModal("login")}>
                  Hoàn tất thiết lập
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[1.4rem]">Kỳ vọng khi hoàn tất</CardTitle>
                <CardDescription>Ba thay đổi này sẽ xuất hiện ngay ở lần đăng nhập đầu tiên.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Màn dashboard nhấn vào matter cần ưu tiên thay vì chỉ liệt kê card.",
                  "Intake page phản ánh đúng loại hồ sơ bạn xử lý thường xuyên.",
                  "Thông báo và tín hiệu follow-up bớt ồn, tập trung vào việc cần action.",
                ].map((item) => (
                  <div key={item} className="rounded-[20px] border border-slate-200/80 bg-[#f8fafc] px-4 py-4 text-sm leading-6 text-muted">
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
