import { ArrowRight, Gavel, Landmark, Mail, Scale, ShieldCheck, Trophy, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import { APP_NAME, HOME_HERO_IMAGE_URL } from "../lib/constants.js";

const practiceAreas = [
  {
    title: "Corporate & Commercial",
    description: "Tư vấn cấu trúc giao dịch, rà soát hợp đồng và quy trình pháp lý cho doanh nghiệp tăng trưởng.",
    icon: Landmark,
  },
  {
    title: "Dispute Resolution",
    description: "Đại diện tố tụng và thương lượng theo chiến lược ưu tiên kết quả và kiểm soát rủi ro.",
    icon: Scale,
  },
  {
    title: "Compliance & Governance",
    description: "Thiết lập khung kiểm soát nội bộ, chuẩn hóa vận hành và cơ chế cảnh báo sớm.",
    icon: ShieldCheck,
  },
  {
    title: "Employment Advisory",
    description: "Tư vấn chính sách nhân sự, kỷ luật lao động và xử lý tranh chấp nhạy cảm.",
    icon: Gavel,
  },
];

const trustStats = [
  { value: "18+", label: "Năm kinh nghiệm trung bình đội ngũ" },
  { value: "450+", label: "Khách hàng doanh nghiệp" },
  { value: "97%", label: "Vụ việc đạt mục tiêu đề ra" },
  { value: "24h", label: "Phản hồi tư vấn ban đầu" },
];

const caseResults = [
  {
    title: "Tranh chấp hợp đồng cung ứng xuyên biên giới",
    result: "Giảm 58% nghĩa vụ bồi thường dự kiến",
    detail: "Tái cấu trúc điều khoản và thương lượng theo lộ trình pháp lý, tránh kiện tụng kéo dài.",
  },
  {
    title: "Thương vụ M&A lĩnh vực logistics",
    result: "Hoàn tất due diligence trong 8 tuần",
    detail: "Chuẩn hóa checklist hồ sơ và xử lý đồng bộ hơn 120 tài liệu trước ngày ký.",
  },
  {
    title: "Kiểm tra tuân thủ tập đoàn đa ngành",
    result: "Khôi phục hệ thống kiểm soát trong 30 ngày",
    detail: "Ma trận trách nhiệm và cơ chế theo dõi rủi ro cho các đơn vị vận hành.",
  },
];

const attorneys = [
  {
    name: "Trần Minh Khôi",
    role: "Managing Partner",
    speciality: "M&A và chiến lược doanh nghiệp",
  },
  {
    name: "Nguyễn Hà Linh",
    role: "Partner, Dispute Practice",
    speciality: "Tranh chấp thương mại và trọng tài",
  },
  {
    name: "Phạm Đức An",
    role: "Counsel, Compliance",
    speciality: "Tuân thủ, quản trị và kiểm soát nội bộ",
  },
];

const trustPillars = [
  { title: "Bảo mật", copy: "Hồ sơ xử lý theo chuẩn phân quyền và bảo mật rõ ràng." },
  { title: "Minh bạch", copy: "Tiến độ và rủi ro được báo cáo ngắn gọn, dễ ra quyết định." },
  { title: "Kết quả", copy: "Chiến lược bám mục tiêu kinh doanh, không chỉ lý thuyết pháp lý." },
];

export default function HomePage() {
  const navigate = useNavigate();

  function handleConsultationSubmit(event) {
    event.preventDefault();
    navigate("/onboarding");
  }

  return (
    <main className="min-h-screen bg-[#fafafa] text-ink antialiased">
      <header className="sticky top-0 z-50 border-b border-line/80 bg-[#fafafa]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <Link to="/" className="group flex cursor-pointer items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center border border-ink/10 bg-white">
              <Scale className="h-4 w-4 text-ink" aria-hidden />
            </span>
            <div>
              <p className="font-sans text-xl tracking-tight text-ink">{APP_NAME}</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted">Legal</p>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-2 sm:gap-3" aria-label="Chính">
            <button
              type="button"
              className="cursor-pointer px-3 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:text-ink"
              onClick={() => navigate("/auth?tab=login")}
            >
              Đăng nhập
            </button>
            <Button
              className="rounded-sm bg-ink px-5 text-sm text-white hover:bg-ink/90"
              onClick={() => navigate("/onboarding")}
            >
              Đặt lịch tư vấn
            </Button>
          </nav>
        </div>
      </header>

      <section className="border-b border-line px-5 pt-16 pb-20 sm:px-8 lg:px-10 lg:pt-24 lg:pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
            <div className="home-reveal" style={{ animationDelay: "40ms" }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gold">Tư vấn pháp lý</p>
              <div className="mt-6 h-px w-12 bg-gold/90" aria-hidden />
              <h1 className="mt-8 font-sans text-[2.65rem] font-medium leading-[1.08] tracking-tight text-balance text-ink sm:text-5xl lg:text-[3.15rem]">
                Quyết định quan trọng cần luật sư rõ ràng, kín đáo và đúng hướng.
              </h1>
              <p className="mt-8 max-w-xl text-[17px] leading-[1.75] text-muted">
                Chúng tôi đồng hành cùng doanh nghiệp trong tư vấn, tranh tụng và tuân thủ — giảm rủi ro pháp lý và giữ nhịp vận hành ổn định.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button
                  className="rounded-sm bg-ink px-6 text-white hover:bg-ink/90"
                  onClick={() => navigate("/onboarding")}
                >
                  Yêu cầu tư vấn
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-sm border border-line bg-white px-6 text-ink ring-0 hover:bg-[#f4f4f5]"
                  onClick={() => navigate("/auth?tab=login")}
                >
                  Khu vực khách hàng
                </Button>
              </div>
            </div>

            <figure
              className="home-reveal relative border border-line bg-white p-2 shadow-[0_24px_60px_-28px_rgba(12,15,20,0.35)]"
              style={{ animationDelay: "90ms" }}
            >
              <div className="pointer-events-none absolute -right-2 -top-2 h-16 w-16 border border-gold/40 bg-[#fafafa]/90" aria-hidden />
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-line">
                <img
                  src={HOME_HERO_IMAGE_URL}
                  alt="Kệ sách và tài liệu pháp lý trong môi trường văn phòng luật chuyên nghiệp"
                  className="h-full w-full object-cover object-center"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  sizes="(max-width: 1024px) 100vw, 42vw"
                />
              </div>
              <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2.5 text-xs text-muted">
                <span className="font-medium text-ink">Hình minh họa pháp lý</span>
                <span className="text-muted/90">Ảnh: Unsplash</span>
              </figcaption>
            </figure>
          </div>

          <div className="home-reveal mt-16 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4 lg:mt-20" style={{ animationDelay: "120ms" }}>
            {trustStats.map((stat) => (
              <div key={stat.label} className="bg-[#fafafa] px-4 py-8 sm:px-6">
                <p className="font-sans text-4xl tabular-nums text-ink">{stat.value}</p>
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-white px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">Lĩnh vực</p>
            <h2 className="mt-4 font-sans text-4xl font-normal tracking-tight text-ink lg:text-[2.75rem]">
              Trọng tâm hành nghề
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Bốn nhóm dịch vụ cốt lõi, triển khai theo quy trình rõ ràng và có thể đo lường.
            </p>
          </div>

          <div className="mt-16 grid gap-0 divide-y divide-line border border-line sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {practiceAreas.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="group flex flex-col bg-white p-8 transition-colors duration-200 hover:bg-[#fafafa]">
                  <Icon className="h-5 w-5 text-gold" strokeWidth={1.25} aria-hidden />
                  <h3 className="mt-6 font-sans text-xl text-ink">{item.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{item.description}</p>
                  <span className="mt-8 inline-block h-px w-8 bg-gold/40 transition-all duration-200 group-hover:w-12 group-hover:bg-gold" aria-hidden />
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-line px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-20">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">Vì sao chọn chúng tôi</p>
              <h2 className="mt-4 font-sans text-4xl font-normal tracking-tight text-ink lg:text-[2.65rem]">
                Tối giản trong cách trình bày, nghiêm ngặt trong cách làm việc.
              </h2>
            </div>
            <ul className="space-y-10">
              {trustPillars.map((row) => (
                <li key={row.title} className="border-l-2 border-gold/70 pl-6">
                  <p className="font-sans text-2xl text-ink">{row.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{row.copy}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-white px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">Luật sư</p>
          <h2 className="mt-4 font-sans text-4xl font-normal tracking-tight text-ink lg:text-[2.75rem]">
            Đội ngũ phụ trách
          </h2>
          <div className="mt-14 grid gap-px bg-line sm:grid-cols-3">
            {attorneys.map((item) => (
              <article key={item.name} className="bg-white p-8">
                <div className="flex h-12 w-12 items-center justify-center border border-line bg-[#fafafa] font-medium tabular-nums text-ink">
                  {item.name
                    .split(" ")
                    .slice(-2)
                    .map((part) => part[0])
                    .join("")}
                </div>
                <h3 className="mt-6 font-sans text-2xl text-ink">{item.name}</h3>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{item.role}</p>
                <p className="mt-4 text-sm leading-relaxed text-muted">{item.speciality}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-ink px-5 py-20 text-white sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/90">Kết quả</p>
          <h2 className="mt-4 font-sans text-4xl font-normal tracking-tight lg:text-[2.75rem]">Tiêu biểu</h2>
          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {caseResults.map((item) => (
              <article key={item.title} className="border-t border-white/15 pt-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">{item.title}</p>
                <h3 className="mt-4 font-sans text-2xl leading-snug text-white">{item.result}</h3>
                <p className="mt-4 text-sm leading-relaxed text-white/65">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">Đặt lịch</p>
            <h2 className="mt-4 font-sans text-4xl font-normal tracking-tight text-ink lg:text-[2.65rem]">
              Buổi trao đổi đầu tiên trong khoảng 30 phút
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
              Xác định mục tiêu pháp lý, phạm vi hồ sơ và lộ trình ưu tiên phù hợp doanh nghiệp của bạn.
            </p>
            <ul className="mt-10 space-y-4 text-sm text-ink">
              <li className="flex items-start gap-3">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                <span>Phiên 1:1 với luật sư phụ trách lĩnh vực</span>
              </li>
              <li className="flex items-start gap-3">
                <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                <span>Kế hoạch hành động rõ ràng sau buổi trao đổi</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                <span>Xác nhận lịch trong 24 giờ làm việc</span>
              </li>
            </ul>
          </div>

          <div className="border border-line bg-white p-8 sm:p-10">
            <h3 className="font-sans text-2xl text-ink">Thông tin liên hệ</h3>
            <p className="mt-2 text-sm text-muted">Chúng tôi chỉ dùng thông tin để sắp xếp buổi tư vấn.</p>
            <form onSubmit={handleConsultationSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
              <Input
                label="Họ tên"
                placeholder="Nguyễn Văn A"
                className="rounded-sm border-line focus:border-gold focus:ring-gold/20"
              />
              <Input
                label="Email"
                type="email"
                placeholder="email@company.vn"
                className="rounded-sm border-line focus:border-gold focus:ring-gold/20"
              />
              <Input
                label="Công ty"
                placeholder="Tên doanh nghiệp"
                className="rounded-sm border-line focus:border-gold focus:ring-gold/20"
              />
              <Input
                label="Nhu cầu"
                placeholder="Tranh chấp, due diligence, tuân thủ…"
                className="rounded-sm border-line focus:border-gold focus:ring-gold/20"
              />
              <div className="flex flex-wrap gap-3 pt-2 md:col-span-2">
                <Button type="submit" className="rounded-sm bg-ink px-6 text-white hover:bg-ink/90">
                  Gửi yêu cầu
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-sm border border-line bg-transparent px-6 text-ink ring-0 hover:bg-[#f4f4f5]"
                  onClick={() => navigate("/auth?tab=login")}
                >
                  Đăng nhập
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-white px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-sans text-2xl text-ink">{APP_NAME}</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
              Dịch vụ pháp lý chuyên nghiệp cho doanh nghiệp hiện đại.
            </p>
          </div>
          <div className="space-y-2 text-sm text-muted">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gold" aria-hidden /> support@legaldesk.vn
            </p>
            <p className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-gold" aria-hidden /> Quận 1, TP. Hồ Chí Minh
            </p>
          </div>
          <div className="text-sm text-muted">
            <p>Thứ Hai — Thứ Sáu · 08:30 — 18:00</p>
            <p className="mt-2 text-xs text-muted/80">
              © {new Date().getFullYear()} {APP_NAME}. Bảo lưu mọi quyền.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
