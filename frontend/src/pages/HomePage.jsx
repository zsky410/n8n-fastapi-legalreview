import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Fingerprint,
  Gavel,
  Mail,
  MapPin,
  MessageSquare,
  Scale,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../components/ui/Button.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useAuthModal } from "../hooks/useAuthModal.js";
import { APP_NAME, HOME_HERO_IMAGE_URL, ROLE_LABELS } from "../lib/constants.js";

const navItems = [
  { label: "Dịch vụ", href: "#dich-vu" },
  { label: "Quy trình", href: "#quy-trinh" },
  { label: "Kết quả", href: "#ket-qua" },
  { label: "Đội ngũ", href: "#doi-ngu" },
];

const practiceAreas = [
  {
    title: "Tư vấn doanh nghiệp",
    description: "Cấu trúc giao dịch, điều lệ, nghị quyết và quyết định quản trị được rà soát theo mục tiêu kinh doanh.",
    icon: Building2,
    accent: "Hồ sơ nội bộ",
  },
  {
    title: "Rà soát hợp đồng",
    description: "Bóc tách nghĩa vụ, rủi ro phạt, cơ chế chấm dứt và điểm cần thương lượng trước khi ký.",
    icon: FileCheck2,
    accent: "Điều khoản trọng yếu",
  },
  {
    title: "Tranh tụng thương mại",
    description: "Chuẩn bị luận cứ, chứng cứ và phương án đàm phán để bảo vệ vị thế trong từng giai đoạn.",
    icon: Scale,
    accent: "Tranh chấp",
  },
  {
    title: "Tuân thủ vận hành",
    description: "Thiết lập luồng phê duyệt, phân quyền dữ liệu và cảnh báo rủi ro cho đội ngũ điều hành.",
    icon: ShieldCheck,
    accent: "Kiểm soát",
  },
];

const trustStats = [
  { value: "24h", label: "Phản hồi hồ sơ đầu tiên" },
  { value: "450+", label: "Doanh nghiệp đã đồng hành" },
  { value: "97%", label: "Vụ việc đạt mục tiêu xử lý" },
  { value: "18+", label: "Năm kinh nghiệm trung bình" },
];

const workflowSteps = [
  {
    title: "Tiếp nhận hồ sơ",
    description: "Tài liệu được phân loại theo loại việc, mức độ khẩn và người phụ trách ngay từ đầu.",
    icon: Fingerprint,
  },
  {
    title: "Lập bản đồ rủi ro",
    description: "Luật sư tóm tắt nghĩa vụ, điểm bất lợi và ưu tiên xử lý bằng ngôn ngữ dễ ra quyết định.",
    icon: BadgeCheck,
  },
  {
    title: "Soạn chiến lược",
    description: "Mỗi hồ sơ có hướng xử lý, mốc thời gian, tài liệu cần bổ sung và phương án dự phòng.",
    icon: Gavel,
  },
  {
    title: "Theo dõi thực thi",
    description: "Tiến độ, trao đổi và kết luận được lưu trong một không gian làm việc bảo mật.",
    icon: MessageSquare,
  },
];

const caseResults = [
  {
    title: "Tranh chấp hợp đồng cung ứng",
    result: "Giảm 58% nghĩa vụ bồi thường dự kiến",
    detail: "Tái cấu trúc luận điểm và đàm phán theo từng nhóm chứng cứ, giúp khách hàng tránh kiện tụng kéo dài.",
  },
  {
    title: "Thương vụ mua bán doanh nghiệp",
    result: "Hoàn tất thẩm định trong 8 tuần",
    detail: "Chuẩn hóa danh mục pháp lý, rà soát hơn 120 tài liệu và khoanh vùng các điều kiện tiên quyết.",
  },
  {
    title: "Kiểm tra tuân thủ tập đoàn",
    result: "Khôi phục kiểm soát trong 30 ngày",
    detail: "Thiết kế ma trận trách nhiệm và lịch báo cáo rủi ro cho các đơn vị đang vận hành song song.",
  },
];

const attorneys = [
  {
    name: "Trần Minh Khôi",
    role: "Luật sư điều hành",
    speciality: "Mua bán doanh nghiệp, cấu trúc đầu tư và chiến lược hội đồng quản trị.",
  },
  {
    name: "Nguyễn Hà Linh",
    role: "Luật sư thành viên, tranh tụng",
    speciality: "Tranh chấp thương mại, trọng tài và thương lượng trong giai đoạn khẩn.",
  },
  {
    name: "Phạm Đức An",
    role: "Cố vấn tuân thủ",
    speciality: "Quản trị nội bộ, dữ liệu, lao động và hệ thống kiểm soát vận hành.",
  },
];

const trustPillars = [
  { title: "Bảo mật theo vai trò", copy: "Hồ sơ, trao đổi và tài liệu nhạy cảm được phân quyền rõ ràng." },
  { title: "Ngôn ngữ dễ quyết định", copy: "Rủi ro pháp lý được chuyển thành việc cần làm, hạn xử lý và mức ưu tiên." },
  { title: "Theo sát kết quả", copy: "Luật sư bám mục tiêu kinh doanh, không dừng ở nhận định pháp lý." },
];

const deskSignals = [
  { label: "Rà soát hợp đồng", value: "Đang ưu tiên" },
  { label: "Biên bản họp", value: "Đã đối chiếu" },
  { label: "Cảnh báo rủi ro", value: "3 điểm cần ký nháy" },
];

function getUserInitials(nameOrEmail) {
  const rawValue = String(nameOrEmail || "").trim();

  if (!rawValue) {
    return "LD";
  }

  const words = rawValue
    .replace(/@.*$/, "")
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return rawValue.slice(0, 2).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function HomePage() {
  const navigate = useNavigate();
  const { getRedirectPathForRole, isHydrated, user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const accountPath = user ? getRedirectPathForRole(user.role) : null;
  const accountName = user?.name || user?.email || "Tài khoản";
  const accountMeta = user?.company || ROLE_LABELS[user?.role] || "Khách hàng";

  function handlePrimaryAction() {
    if (user && accountPath) {
      navigate(accountPath);
      return;
    }

    openAuthModal("login");
  }

  return (
    <main className="legal-page min-h-screen bg-[#fbfaf6] text-[#17130f] antialiased">
      <header className="sticky top-0 z-50 border-b border-[#17130f]/10 bg-[#fffefa]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <Link to="/" className="group flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#7a1f2b]/25 bg-[#fffefa] shadow-[0_10px_30px_rgba(122,31,43,0.08)]">
              <Scale className="h-4 w-4 text-[#7a1f2b]" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-bold tracking-normal text-[#17130f]">{APP_NAME}</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.28em] text-[#7a1f2b]">Bàn pháp lý số</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Điều hướng chính">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-[#4a463e] transition-colors hover:text-[#7a1f2b]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {!isHydrated ? (
              <div className="h-11 w-36 rounded-full bg-[#eee9dd]" aria-hidden />
            ) : user ? (
              <>
                <Link
                  to={accountPath}
                  className="hidden items-center gap-3 rounded-full border border-[#17130f]/10 bg-white/80 px-2 py-2 pr-4 shadow-[0_14px_40px_rgba(23,19,15,0.08)] sm:flex"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#7a1f2b] text-sm font-bold text-white">
                    {getUserInitials(accountName)}
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="block max-w-[150px] truncate text-sm font-bold text-[#17130f]">{accountName}</span>
                    <span className="block max-w-[170px] truncate text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a1f2b]">
                      {accountMeta}
                    </span>
                  </span>
                </Link>
                <Button
                  className="!bg-[#7a1f2b] !px-5 !text-sm !text-white hover:!bg-[#641923]"
                  onClick={handlePrimaryAction}
                >
                  {user.role === "admin" ? "Mở quản trị" : "Mở hồ sơ"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                className="!bg-[#7a1f2b] !px-5 !text-sm !text-white hover:!bg-[#641923]"
                onClick={() => openAuthModal("login")}
              >
                Đăng nhập
              </Button>
            )}
          </div>
        </div>
      </header>

      <section
        className="legal-hero-bg relative isolate overflow-hidden border-b border-[#17130f]/10 px-5 pt-14 pb-10 sm:px-8 lg:px-10"
        style={{ "--hero-image": `url(${HOME_HERO_IMAGE_URL})` }}
      >
        <div className="mx-auto grid min-h-[76svh] max-w-7xl content-end pb-8 pt-16 sm:pt-24 lg:min-h-[78svh]">
          <div className="max-w-4xl">
            <div className="legal-reveal inline-flex items-center gap-2 rounded-full border border-[#7a1f2b]/20 bg-[#fffefa]/78 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#7a1f2b] shadow-[0_18px_50px_rgba(23,19,15,0.09)] backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Bàn pháp lý số cho doanh nghiệp Việt Nam
            </div>

            <h1 className="legal-display legal-reveal mt-6 max-w-4xl text-6xl text-[#17130f] sm:text-7xl lg:text-[8.5rem]" style={{ animationDelay: "70ms" }}>
              {APP_NAME}
            </h1>

            <p className="legal-reveal mt-6 max-w-2xl text-lg font-semibold leading-8 text-[#2f2a24] sm:text-xl" style={{ animationDelay: "120ms" }}>
              Không gian làm việc pháp lý sáng rõ, kín đáo và có kỷ luật: tiếp nhận hồ sơ, rà soát rủi ro, theo dõi tiến độ và ra quyết định trong cùng một bàn làm việc.
            </p>

            <div className="legal-reveal mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "170ms" }}>
              <Button
                className="!h-12 !bg-[#7a1f2b] !px-6 !text-base !text-white shadow-[0_18px_45px_rgba(122,31,43,0.22)] hover:!bg-[#641923]"
                onClick={handlePrimaryAction}
              >
                {user ? "Mở khu vực làm việc" : "Đăng nhập để bắt đầu"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <a
                href="#dich-vu"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#17130f]/15 bg-[#fffefa]/75 px-6 text-base font-bold text-[#17130f] shadow-[0_18px_45px_rgba(23,19,15,0.08)] backdrop-blur transition hover:border-[#7a1f2b]/35 hover:text-[#7a1f2b]"
              >
                Xem năng lực pháp lý
              </a>
            </div>
          </div>

          <div className="legal-reveal mt-12 grid overflow-hidden rounded-[28px] border border-[#17130f]/10 bg-[#fffefa]/82 shadow-[0_24px_70px_rgba(23,19,15,0.11)] backdrop-blur sm:grid-cols-2 lg:grid-cols-4" style={{ animationDelay: "220ms" }}>
            {trustStats.map((stat) => (
              <div key={stat.label} className="border-b border-[#17130f]/10 px-5 py-5 last:border-b-0 sm:border-r sm:last:border-r-0 lg:border-b-0">
                <p className="legal-display text-4xl text-[#7a1f2b]">{stat.value}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-[#4a463e]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="legal-docket-slip legal-reveal pointer-events-none absolute bottom-24 right-[max(2.5rem,calc((100vw-80rem)/2))] hidden w-80 rounded-[26px] border border-[#17130f]/10 bg-[#fffefa]/86 p-5 shadow-[0_28px_80px_rgba(23,19,15,0.16)] backdrop-blur-xl xl:block" style={{ animationDelay: "260ms" }} aria-hidden>
          <div className="flex items-center justify-between border-b border-[#17130f]/10 pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7a1f2b]">Hồ sơ hôm nay</p>
              <p className="mt-1 text-lg font-bold text-[#17130f]">Bàn rà soát</p>
            </div>
            <Clock3 className="h-5 w-5 text-[#b38a2e]" />
          </div>
          <div className="mt-4 space-y-3">
            {deskSignals.map((signal) => (
              <div key={signal.label} className="flex items-center justify-between gap-4 rounded-2xl bg-[#f4efe4]/80 px-4 py-3">
                <span className="text-sm font-semibold text-[#4a463e]">{signal.label}</span>
                <span className="text-right text-xs font-bold text-[#7a1f2b]">{signal.value}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section id="dich-vu" className="border-b border-[#17130f]/10 bg-[#fbfaf6] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#7a1f2b]">Năng lực hành nghề</p>
              <h2 className="legal-display mt-4 text-5xl text-[#17130f] sm:text-6xl lg:text-7xl">Pháp lý đặt ngay trên bàn điều hành.</h2>
            </div>
            <p className="max-w-2xl text-base font-medium leading-8 text-[#5c554c] lg:justify-self-end">
              LegalDesk AI kết hợp kỷ luật của văn phòng luật với nhịp vận hành số, giúp doanh nghiệp nhìn thấy rủi ro, phân công trách nhiệm và chốt phương án xử lý nhanh hơn.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {practiceAreas.map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="legal-service-card group relative overflow-hidden rounded-[24px] border border-[#17130f]/10 bg-[#fffefa] p-6 shadow-[0_20px_60px_rgba(23,19,15,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#7a1f2b]/25 hover:shadow-[0_26px_80px_rgba(122,31,43,0.12)]"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#7a1f2b]/15 bg-[#fff4ef] text-[#7a1f2b]">
                      <Icon className="h-5 w-5" strokeWidth={1.7} aria-hidden />
                    </span>
                    <span className="rounded-full border border-[#b38a2e]/25 bg-[#fbf5df] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#87661d]">
                      {item.accent}
                    </span>
                  </div>
                  <h3 className="mt-7 text-2xl font-bold text-[#17130f]">{item.title}</h3>
                  <p className="mt-4 text-sm font-medium leading-7 text-[#5c554c]">{item.description}</p>
                  <span className="mt-8 block h-px w-full bg-gradient-to-r from-[#7a1f2b]/45 via-[#b38a2e]/40 to-transparent" aria-hidden />
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="quy-trinh" className="border-b border-[#17130f]/10 bg-[#fffefa] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#7a1f2b]">Quy trình xử lý</p>
            <h2 className="legal-display mt-4 text-5xl text-[#17130f] sm:text-6xl">Kín đáo như phòng họp luật sư, rõ ràng như bảng điều hành.</h2>
            <p className="mt-6 max-w-lg text-base font-medium leading-8 text-[#5c554c]">
              Mỗi bước đều tạo ra dấu vết xử lý, người chịu trách nhiệm và kết luận có thể tra cứu lại khi cần.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-6 top-6 hidden h-[calc(100%-3rem)] w-px bg-[#7a1f2b]/18 sm:block" aria-hidden />
            <div className="space-y-5">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article key={step.title} className="relative rounded-[26px] border border-[#17130f]/10 bg-[#fbfaf6] p-6 shadow-[0_18px_60px_rgba(23,19,15,0.05)] sm:ml-16">
                    <span className="absolute -left-[4.5rem] top-6 hidden h-12 w-12 place-items-center rounded-full border border-[#7a1f2b]/18 bg-[#fffefa] text-[#7a1f2b] shadow-[0_16px_40px_rgba(23,19,15,0.08)] sm:grid">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="flex items-start gap-4">
                      <span className="legal-display text-4xl text-[#b38a2e]">{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <h3 className="text-2xl font-bold text-[#17130f]">{step.title}</h3>
                        <p className="mt-3 text-sm font-medium leading-7 text-[#5c554c]">{step.description}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="ket-qua" className="border-b border-[#17130f]/10 bg-[#f3f5ef] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#7a1f2b]">Kết quả tiêu biểu</p>
              <h2 className="legal-display mt-4 text-5xl text-[#17130f] sm:text-6xl lg:text-7xl">Từng hồ sơ đều có một đường lối xử lý.</h2>
            </div>
            <div className="flex max-w-md items-center gap-4 rounded-[24px] border border-[#17130f]/10 bg-[#fffefa] p-5 shadow-[0_18px_60px_rgba(23,19,15,0.06)]">
              <CheckCircle2 className="h-9 w-9 shrink-0 text-[#7a1f2b]" aria-hidden />
              <p className="text-sm font-semibold leading-6 text-[#4a463e]">
                Số liệu là minh họa năng lực triển khai, không phải cam kết kết quả cho mọi vụ việc.
              </p>
            </div>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {caseResults.map((item) => (
              <article key={item.title} className="rounded-[26px] border border-[#17130f]/10 bg-[#fffefa] p-7 shadow-[0_20px_70px_rgba(23,19,15,0.06)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7a1f2b]">{item.title}</p>
                <h3 className="mt-5 text-3xl font-bold leading-tight text-[#17130f]">{item.result}</h3>
                <p className="mt-5 text-sm font-medium leading-7 text-[#5c554c]">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="doi-ngu" className="border-b border-[#17130f]/10 bg-[#fbfaf6] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#7a1f2b]">Đội ngũ phụ trách</p>
              <h2 className="legal-display mt-4 text-5xl text-[#17130f] sm:text-6xl">Luật sư đọc hồ sơ bằng mắt nghề, hệ thống giữ nhịp bằng dữ liệu.</h2>
            </div>
            <div className="grid gap-4">
              {attorneys.map((item) => (
                <article key={item.name} className="flex flex-col gap-5 rounded-[26px] border border-[#17130f]/10 bg-[#fffefa] p-6 shadow-[0_18px_60px_rgba(23,19,15,0.05)] sm:flex-row sm:items-center">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-[#7a1f2b]/18 bg-[#fff4ef] text-lg font-extrabold text-[#7a1f2b]">
                    {item.name
                      .split(" ")
                      .slice(-2)
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#17130f]">{item.name}</h3>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#7a1f2b]">{item.role}</p>
                    <p className="mt-3 text-sm font-medium leading-7 text-[#5c554c]">{item.speciality}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#17130f]/10 bg-[#fffefa] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#7a1f2b]">Chuẩn làm việc</p>
            <h2 className="legal-display mt-4 text-5xl text-[#17130f] sm:text-6xl">Một bàn pháp lý không được ồn ào, nhưng phải luôn có tín hiệu rõ.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {trustPillars.map((row) => (
              <article key={row.title} className="rounded-[24px] border border-[#17130f]/10 bg-[#fbfaf6] p-6">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-[#7a1f2b]" aria-hidden />
                  <h3 className="text-xl font-bold text-[#17130f]">{row.title}</h3>
                </div>
                <p className="mt-3 text-sm font-medium leading-7 text-[#5c554c]">{row.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f8efe9] px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#7a1f2b]">Khu vực khách hàng</p>
            <h2 className="legal-display mt-4 text-5xl text-[#17130f] sm:text-6xl">
              {user ? `Hồ sơ của ${accountName} đã sẵn sàng.` : "Đưa hồ sơ pháp lý vào một nơi có trật tự."}
            </h2>
            <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-[#5c554c]">
              {user
                ? `Bạn đang vào hệ thống với vai trò ${ROLE_LABELS[user.role] || "người dùng"}. Tiếp tục xử lý hồ sơ, theo dõi tiến độ và quản lý tài liệu trong khu vực bảo mật.`
                : "Đăng nhập để tiếp tục làm việc với hợp đồng, tranh chấp, tài liệu tuân thủ và các hồ sơ cần luật sư theo sát."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Button
              className="!h-12 !bg-[#7a1f2b] !px-6 !text-base !text-white shadow-[0_18px_45px_rgba(122,31,43,0.2)] hover:!bg-[#641923]"
              onClick={handlePrimaryAction}
            >
              {user ? "Mở khu vực làm việc" : "Đăng nhập ngay"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#17130f]/10 bg-[#fffefa] px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-2xl font-extrabold text-[#17130f]">{APP_NAME}</p>
            <p className="mt-2 max-w-xs text-sm font-medium leading-7 text-[#5c554c]">
              Bàn làm việc pháp lý cho doanh nghiệp cần sự rõ ràng, bảo mật và tốc độ xử lý.
            </p>
          </div>
          <div className="space-y-3 text-sm font-semibold text-[#5c554c]">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#7a1f2b]" aria-hidden /> support@legaldesk.vn
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#7a1f2b]" aria-hidden /> Quận 1, Thành phố Hồ Chí Minh
            </p>
          </div>
          <div className="text-sm font-semibold text-[#5c554c]">
            <p>Thứ Hai đến Thứ Sáu, 08:30 đến 18:00</p>
            <p className="mt-2 text-xs text-[#7a746a]">
              © {new Date().getFullYear()} {APP_NAME}. Bảo lưu mọi quyền.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
