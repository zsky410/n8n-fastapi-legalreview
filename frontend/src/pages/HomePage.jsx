import { ArrowRight, LayoutTemplate, MessagesSquare, ShieldCheck, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../components/ui/Button.jsx";
import Card, { CardContent } from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import { APP_NAME, DEMO_ACCOUNTS, PHASE_ONE_FOUNDATION_MODULES } from "../lib/constants.js";
import { getApiMode } from "../lib/api.js";

const heroMetrics = [
  { label: "Hồ sơ trong demo", value: "3 hồ sơ" },
  { label: "Chế độ API", value: getApiMode().toUpperCase() },
  { label: "Vai trò", value: "Client + Admin" },
];

const featureCards = [
  {
    title: "Cổng client rõ ràng",
    description: "Khung dashboard, tạo hồ sơ và case detail đã được đặt đúng IA cho Milestone 5.",
    icon: LayoutTemplate,
  },
  {
    title: "Trang quản trị tập trung",
    description: "Luật định tuyến, logs và người dùng được gom trong một shell để mở rộng theo phase.",
    icon: ShieldCheck,
  },
  {
    title: "Lớp API sẵn sàng hybrid",
    description: "Frontend có sẵn mock | hybrid | real để Phase 2.5 có thể nối review/chat thật.",
    icon: Sparkles,
  },
  {
    title: "Scaffold cho chat và timeline",
    description: "CaseDetail đã có sẵn primitive cho hỏi đáp và theo dõi hành trình workflow.",
    icon: MessagesSquare,
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen px-4 py-5 lg:px-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="surface-panel flex flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-900 text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-semibold text-slate-900">{APP_NAME}</p>
              <p className="text-sm text-slate-500">Nền tảng UI cho Milestone 5</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="border-brand-100 bg-brand-50 text-brand-700">API {getApiMode().toUpperCase()}</Badge>
            <Button variant="secondary" onClick={() => navigate("/auth?tab=login")}>
              Đăng nhập demo
            </Button>
            <Button onClick={() => navigate("/onboarding")}>Xem onboarding</Button>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_360px]">
          <Card className="overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 text-white">
            <CardContent className="space-y-8 p-8 lg:p-10">
              <Badge className="border-white/20 bg-white/10 text-brand-100">Đã hoàn thành Phase 1</Badge>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-balance md:text-5xl">
                  Khung giao diện LegalDesk AI đã sẵn sàng cho từng phase triển khai Milestone 5.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-brand-100 md:text-lg">
                  Phase 1 dựng shell, auth, routing, mock data và API adapter để các phase sau có thể cắm feature nhanh hơn mà không phá vỡ cấu trúc.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" className="bg-white text-slate-900 hover:bg-brand-50" onClick={() => navigate("/auth?tab=login")}>
                  Bắt đầu với tài khoản demo
                </Button>
                <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => navigate("/client/dashboard")}>
                  Xem giao diện client
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {heroMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-[24px] border border-white/10 bg-white/8 px-4 py-4">
                    <p className="text-sm text-brand-100">{metric.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{metric.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Tài khoản demo</p>
              {DEMO_ACCOUNTS.map((account) => (
                <div key={account.email} className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{account.email}</p>
                      <p className="mt-1 text-sm text-slate-500">{account.subtitle}</p>
                    </div>
                    <Badge className="border-slate-200 bg-white text-slate-600">{account.role}</Badge>
                  </div>
                </div>
              ))}
              <Link to="/auth?tab=login" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
                Đăng nhập vào shell demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardContent className="space-y-4 p-6">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{feature.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <Card>
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Các hạng mục nền tảng</p>
              <div className="grid gap-3 md:grid-cols-2">
                {PHASE_ONE_FOUNDATION_MODULES.map((item, index) => (
                  <div key={item} className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Bước {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-950 text-white">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">Xem trước Phase 2</p>
              <h2 className="text-2xl font-semibold">Sau phase này, mình có thể cắm từng feature vào đúng chỗ trong shell.</h2>
              <p className="text-sm leading-6 text-slate-300">
                Client dashboard, create case, case detail, routing rules và operations log sẽ đi theo từng phase mà không cần sửa lại router hoặc auth flow.
              </p>
              <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-sm text-white/70">Bước tiếp theo gợi ý</p>
                <p className="mt-2 text-base font-semibold">Triển khai Phase 2 với các màn mock-first trên scaffold hiện có.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
