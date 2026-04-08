import { useEffect, useMemo, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

const features = [
  {
    title: "Upload & Quản lý hồ sơ",
    desc: "Hỗ trợ PDF, DOCX, ảnh scan. OCR tự động trích xuất văn bản với độ chính xác cao.",
    icon: "↥",
  },
  {
    title: "AI Phân loại & Đánh giá rủi ro",
    desc: "Mô hình AI phân tích điều khoản, nhận diện rủi ro pháp lý và cho điểm tự động.",
    icon: "✦",
  },
  {
    title: "Human-in-the-Loop",
    desc: "Luật sư duyệt và xác nhận mọi phân tích AI trước khi gửi kết quả cho khách hàng.",
    icon: "◌",
  },
  {
    title: "Điều phối SLA",
    desc: "Theo dõi thời hạn xử lý theo thỏa thuận dịch vụ. Cảnh báo tự động khi sắp vi phạm.",
    icon: "◷",
  },
  {
    title: "Bảo mật & Tuân thủ",
    desc: "Mã hóa đầu cuối, nhật ký kiểm toán đầy đủ, phù hợp với quy định PDPA/GDPR.",
    icon: "▣",
  },
  {
    title: "Báo cáo & Phân tích",
    desc: "Thống kê hiệu suất xử lý, phân bố rủi ro và năng suất theo luật sư và danh mục.",
    icon: "◫",
  },
];

const processSteps = [
  {
    label: "BƯỚC 01",
    title: "Upload hồ sơ",
    desc: "Khách hàng upload tài liệu pháp lý qua giao diện bảo mật hoặc API tích hợp.",
  },
  {
    label: "BƯỚC 02",
    title: "AI xử lý tự động",
    desc: "Hệ thống OCR trích xuất - AI phân loại loại hợp đồng - Tính điểm rủi ro.",
  },
  {
    label: "BƯỚC 03",
    title: "Luật sư duyệt",
    desc: "Luật sư xem xét kết quả AI, bổ sung ghi chú và phê duyệt hoặc điều chỉnh.",
  },
  {
    label: "BƯỚC 04",
    title: "Bàn giao kết quả",
    desc: "Báo cáo rủi ro chi tiết và khuyến nghị pháp lý được gửi đến khách hàng.",
  },
];

const testimonials = [
  {
    quote:
      '"LegalDesk AI giảm 70% thời gian rà soát hợp đồng ban đầu. Đội ngũ luật sư tập trung vào ca vấn đề phức tạp hơn thay vì xử lý hồ sơ thủ công."',
    name: "Nguyễn Hoàng Minh",
    role: "Trưởng phòng pháp chế - Tập đoàn Vingroup",
    avatar: "N",
  },
  {
    quote:
      '"Tính năng human-in-the-loop rất phù hợp với văn phòng pháp lý. AI hỗ trợ tốt nhưng luật sư vẫn là người quyết định cuối cùng - điều này tạo sự tin tưởng."',
    name: "Trần Thị Phương",
    role: "Luật sư điều hành - Văn phòng Luật PT & Partners",
    avatar: "T",
  },
  {
    quote:
      '"API tích hợp đơn giản, tài liệu rõ ràng. Chúng tôi tích hợp được vào workflow nội bộ chỉ trong 2 ngày làm việc."',
    name: "Lê Văn Đức",
    role: "CTO - Fintech Startup VN",
    avatar: "L",
  },
];

const authBullets = [
  "AI phân loại và đánh giá rủi ro tự động",
  "Luật sư duyệt trước khi gửi kết quả",
  "Theo dõi SLA thời gian thực",
  "Nhật ký kiểm toán đầy đủ",
];

const customerTypes = [
  {
    id: "business",
    title: "Doanh nghiệp",
    desc: "Công ty, tập đoàn cần tư vấn pháp lý thường xuyên",
    icon: "▤",
  },
  {
    id: "individual",
    title: "Cá nhân",
    desc: "Cá nhân có nhu cầu tư vấn pháp lý dân sự, lao động",
    icon: "◌",
  },
  {
    id: "law_firm",
    title: "Văn phòng luật",
    desc: "Tổ chức hành nghề luật sư sử dụng nền tảng cho khách hàng",
    icon: "◍",
  },
];

const legalDomains = [
  "Hợp đồng thương mại",
  "Bất động sản",
  "Lao động",
  "Sở hữu trí tuệ",
  "Doanh nghiệp & M&A",
  "Tranh tụng",
  "Đầu tư & Tài chính",
  "Dân sự gia đình",
  "Hành chính công",
  "Luật thuế",
];

const notificationDefaults = {
  email: true,
  inApp: true,
  sms: false,
};

function HomePage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-900 text-sm font-bold text-white">
              O
            </span>
            <span className="text-lg font-bold text-slate-900">LegalDesk AI</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 lg:flex">
            <a href="#tinh-nang" className="transition hover:text-slate-900">
              Tính năng
            </a>
            <a href="#quy-trinh" className="transition hover:text-slate-900">
              Quy trình
            </a>
            <a href="#tai-nguyen" className="transition hover:text-slate-900">
              Tài nguyên
            </a>
            <a href="#ho-tro" className="transition hover:text-slate-900">
              Hỗ trợ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/auth?tab=login")}
              className="hidden h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => navigate("/auth?tab=register")}
              className="h-11 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Xem demo
            </button>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-14 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-brand-100">
              Nền tảng pháp lý thế hệ mới
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Văn phòng luật{" "}
              <span className="text-brand-100">thông minh hơn với AI</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-200 md:text-lg">
              LegalDesk AI tự động hóa quy trình rà soát hồ sơ pháp lý - từ OCR,
              phân loại, đánh giá rủi ro đến điều phối luật sư - giúp văn phòng
              luật xử lý nhanh hơn, chính xác hơn.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/auth?tab=register")}
                className="h-12 rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white transition hover:bg-brand-400"
              >
                Bắt đầu ngay
              </button>
              <button
                onClick={() => navigate("/auth?tab=login")}
                className="h-12 rounded-xl border border-white/25 bg-white/10 px-6 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Xem demo
              </button>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-5">
              <div>
                <p className="text-3xl font-bold">50+</p>
                <p className="mt-1 text-sm text-brand-100">Văn phòng luật</p>
              </div>
              <div>
                <p className="text-3xl font-bold">12,000+</p>
                <p className="mt-1 text-sm text-brand-100">Hồ sơ đã xử lý</p>
              </div>
              <div>
                <p className="text-3xl font-bold">98.2%</p>
                <p className="mt-1 text-sm text-brand-100">Độ chính xác AI</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-white/20 bg-slate-300">
              <img
                src="https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=1200&q=80"
                alt="Luật sư đang làm việc cùng AI"
                className="h-[360px] w-full object-cover"
              />
            </div>
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/25 bg-brand-900/90 p-4 shadow-card backdrop-blur">
              <div className="flex items-center justify-between text-sm">
                <p className="font-semibold text-white">AI đang phân tích</p>
                <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-200">
                  Cao
                </span>
              </div>
              <p className="mt-2 text-sm text-brand-100">
                HS-2024-0087 · Rủi ro cao phát hiện
              </p>
              <div className="mt-3 h-2 w-full rounded-full bg-brand-100/25">
                <div className="h-full w-[72%] rounded-full bg-brand-400" />
              </div>
              <p className="mt-2 text-right text-xs text-brand-100">
                72% hoàn thành
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 py-5">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 text-sm text-slate-500 lg:px-8">
          <span>Tin dùng bởi:</span>
          <span className="font-medium text-slate-700">Văn phòng Luật HLP</span>
          <span className="font-medium text-slate-700">LexVN Partners</span>
          <span className="font-medium text-slate-700">
            Công ty CP Tư vấn Pháp lý Minh Đức
          </span>
          <span className="font-medium text-slate-700">Legal360 Vietnam</span>
          <span className="font-medium text-slate-700">Tập đoàn Đất Xanh</span>
        </div>
      </section>

      <section id="tinh-nang" className="mx-auto w-full max-w-6xl px-4 py-20 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Toàn bộ quy trình pháp lý trong một nền tảng
          </h2>
          <p className="mt-4 text-base text-slate-500 md:text-lg">
            Từ tiếp nhận hồ sơ đến bàn giao kết quả - tự động hóa toàn diện với
            sự giám sát của con người.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-lg font-semibold text-brand-700">
                {item.icon}
              </span>
              <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="quy-trinh" className="bg-slate-50 py-20">
        <div className="mx-auto w-full max-w-6xl px-4 lg:px-8">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Quy trình 4 bước
            </h2>
            <p className="mt-4 text-base text-slate-500 md:text-lg">
              Đơn giản, minh bạch và có thể theo dõi từng giai đoạn.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((item, idx) => (
              <article
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-900 text-white">
                  {idx + 1}
                </span>
                <p className="text-xs font-bold text-slate-500">{item.label}</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="tai-nguyen" className="mx-auto w-full max-w-6xl px-4 py-20 lg:px-8">
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
          Ý kiến từ khách hàng
        </h2>
        <div className="grid gap-5 lg:grid-cols-3">
          {testimonials.map((item) => (
            <article
              key={item.name}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-base leading-7 text-slate-600">{item.quote}</p>
              <div className="mt-6 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-sm font-bold text-white">
                  {item.avatar}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="ho-tro" className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 py-16 text-white">
        <div className="mx-auto w-full max-w-4xl px-4 text-center lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Sẵn sàng hiện đại hóa văn phòng luật?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-brand-100 md:text-lg">
            Liên hệ đội ngũ LegalDesk AI để được tư vấn triển khai phù hợp với quy
            mô tổ chức của bạn.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate("/auth?tab=login")}
              className="h-12 rounded-xl bg-white px-7 text-sm font-semibold text-brand-900 transition hover:bg-slate-100"
            >
              Đăng nhập hệ thống
            </button>
            <button
              onClick={() => navigate("/auth?tab=register")}
              className="h-12 rounded-xl border border-white/25 bg-white/10 px-7 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Xem demo
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 lg:flex-row lg:px-8">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand-900 text-xs font-bold text-white">
              O
            </span>
            <span className="font-semibold">LegalDesk AI</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="/" className="hover:text-slate-700">
              Chính sách bảo mật
            </a>
            <a href="/" className="hover:text-slate-700">
              Điều khoản sử dụng
            </a>
            <a href="/" className="hover:text-slate-700">
              API Documentation
            </a>
            <a href="/" className="hover:text-slate-700">
              Hỗ trợ kỹ thuật
            </a>
          </div>
          <p>© 2024 LegalDesk AI. Bảo lưu mọi quyền.</p>
        </div>
      </footer>
    </main>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const currentTab = useMemo(
    () => (tabParam === "register" ? "register" : "login"),
    [tabParam],
  );
  const [tab, setTab] = useState(currentTab);

  useEffect(() => {
    setTab(currentTab);
  }, [currentTab]);

  const onTabChange = (nextTab) => {
    setTab(nextTab);
    setSearchParams({ tab: nextTab }, { replace: true });
  };

  const onLoginSubmit = (event) => {
    event.preventDefault();
    navigate("/onboarding");
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto grid min-h-screen max-w-[1280px] lg:grid-cols-[0.95fr_1.65fr]">
        <aside className="flex flex-col justify-between bg-[#0f1b66] px-8 py-10 text-white lg:px-10 lg:py-12">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#2544d3] text-sm font-bold">
                O
              </span>
              <span className="text-xl font-semibold">LegalDesk AI</span>
            </div>
            <h1 className="mt-14 max-w-sm text-4xl font-bold leading-tight">
              Nền tảng pháp lý thông minh cho văn phòng luật hiện đại
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-blue-100/90">
              Tự động hoá OCR, phân loại AI và điều phối luật sư - tất cả trong
              một hệ thống bảo mật.
            </p>
            <ul className="mt-10 space-y-4">
              {authBullets.map((item) => (
                <li key={item} className="flex items-start gap-3 text-base text-blue-100">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#2544d3] text-xs">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <blockquote className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-blue-50/95">
              "LegalDesk AI giúp chúng tôi xử lý gấp 3 lần số hồ sơ mà không cần
              tuyển thêm nhân sự."
              <footer className="mt-3 text-blue-100/70">
                Trần Thị Phương - Luật sư điều hành, PT & Partners
              </footer>
            </blockquote>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-blue-100 transition hover:text-white"
            >
              ← Về trang chủ
            </Link>
          </div>
        </aside>
        <section className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[520px] rounded-2xl bg-slate-100 p-2 sm:p-4">
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-slate-700">
              <span className="font-semibold text-brand-700">Demo:</span> Dùng{" "}
              <strong>client@demo.vn</strong>, <strong>lawyer@demo.vn</strong>{" "}
              hoặc <strong>admin@demo.vn</strong> với mật khẩu bất kỳ.
            </div>
            <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-200 p-1">
              <button
                type="button"
                onClick={() => onTabChange("login")}
                className={`h-11 rounded-lg text-base font-semibold transition ${
                  tab === "login"
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => onTabChange("register")}
                className={`h-11 rounded-lg text-base font-semibold transition ${
                  tab === "register"
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                }`}
              >
                Đăng ký
              </button>
            </div>
            {tab === "login" ? (
              <form className="mt-8" noValidate onSubmit={onLoginSubmit}>
                <h2 className="text-5xl font-bold leading-tight text-slate-900">
                  Chào mừng trở lại
                </h2>
                <p className="mt-3 text-base text-slate-500">
                  Đăng nhập để tiếp tục vào hệ thống
                </p>
                <div className="mt-7 space-y-5">
                  <div>
                    <label
                      htmlFor="login-email"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Địa chỉ email
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      placeholder="example@email.com"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="login-password"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Mật khẩu
                    </label>
                    <input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <a href="/" className="text-sm font-medium text-brand-700 hover:text-brand-800">
                    Quên mật khẩu?
                  </a>
                </div>
                <button
                  type="submit"
                  className="mt-6 h-12 w-full rounded-xl bg-brand-500 text-base font-semibold text-white transition hover:bg-brand-700"
                >
                  Đăng nhập
                </button>
              </form>
            ) : (
              <form className="mt-8" noValidate>
                <h2 className="text-5xl font-bold leading-tight text-slate-900">
                  Tạo tài khoản mới
                </h2>
                <p className="mt-3 text-base text-slate-500">
                  Điền thông tin để bắt đầu sử dụng LegalDesk AI
                </p>
                <div className="mt-7 space-y-5">
                  <div>
                    <label
                      htmlFor="reg-name"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Họ và tên
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      placeholder="Nguyễn Văn An"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="reg-company"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Tên tổ chức
                    </label>
                    <input
                      id="reg-company"
                      type="text"
                      placeholder="Công ty TNHH ABC"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="reg-email"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Địa chỉ email
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      placeholder="example@email.com"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="reg-password"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Mật khẩu
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      placeholder="Tối thiểu 8 ký tự"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-6 h-12 w-full rounded-xl bg-brand-500 text-base font-semibold text-white transition hover:bg-brand-700"
                >
                  Tạo tài khoản
                </button>
              </form>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function OnboardingStepper({ step }) {
  const stepLabels = ["Loại khách hàng", "Lĩnh vực pháp lý", "Thông báo"];
  return (
    <div className="mt-4 flex items-center">
      {stepLabels.map((label, index) => {
        const idx = index + 1;
        const done = idx < step;
        const current = idx === step;
        return (
          <div key={label} className="flex flex-1 items-center">
            <div
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                done
                  ? "bg-emerald-500 text-white"
                  : current
                    ? "bg-brand-500 text-white"
                    : "bg-white/15 text-white/80"
              }`}
            >
              {done ? "✓" : idx}
            </div>
            <span
              className={`ml-2 text-xs ${
                current ? "text-white" : "text-white/65"
              }`}
            >
              {label}
            </span>
            {idx !== 3 && <span className="mx-3 h-px flex-1 bg-white/20" />}
          </div>
        );
      })}
    </div>
  );
}

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [customerType, setCustomerType] = useState("");
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [notifications, setNotifications] = useState(notificationDefaults);

  const canGoNext =
    (step === 1 && !!customerType) ||
    (step === 2 && selectedDomains.length > 0) ||
    step === 3;

  const toggleDomain = (name) => {
    setSelectedDomains((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name],
    );
  };

  const toggleNotification = (key) => {
    setNotifications((current) => ({ ...current, [key]: !current[key] }));
  };

  const nextStep = () => {
    if (!canGoNext) return;
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    navigate("/");
  };

  const prevStep = () => {
    if (step === 1) {
      navigate("/auth?tab=login");
      return;
    }
    setStep(step - 1);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-[820px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-brand-900 px-8 py-5">
          <div className="flex items-center gap-3 text-white">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-xs font-semibold">
              O
            </span>
            <span className="font-semibold">LegalDesk AI</span>
          </div>
          <OnboardingStepper step={step} />
        </div>

        <div className="px-8 py-7">
          {step === 1 && (
            <>
              <h2 className="text-4xl font-bold text-slate-900">Bạn là ai?</h2>
              <p className="mt-2 text-slate-500">
                Thông tin này giúp chúng tôi cá nhân hoá trải nghiệm phù hợp với
                nhu cầu của bạn.
              </p>
              <div className="mt-6 space-y-3">
                {customerTypes.map((item) => {
                  const active = customerType === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setCustomerType(item.id)}
                      className={`flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left transition ${
                        active
                          ? "border-brand-700 bg-brand-50 ring-1 ring-brand-700"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className="flex items-center gap-4">
                        <span
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                            active
                              ? "bg-brand-600 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span>
                          <span className="block font-semibold text-slate-900">
                            {item.title}
                          </span>
                          <span className="block text-sm text-slate-500">
                            {item.desc}
                          </span>
                        </span>
                      </span>
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs">
                        <span
                          className={`inline-flex h-3 w-3 rounded-full ${active ? "bg-brand-700" : "bg-transparent"}`}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-4xl font-bold text-slate-900">
                Lĩnh vực pháp lý quan tâm
              </h2>
              <p className="mt-2 text-slate-500">
                Chọn một hoặc nhiều lĩnh vực. Hệ thống sẽ ưu tiên phân công luật
                sư phù hợp.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {legalDomains.map((name) => {
                  const active = selectedDomains.includes(name);
                  return (
                    <button
                      type="button"
                      key={name}
                      onClick={() => toggleDomain(name)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "border-brand-700 bg-brand-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {active ? "✓ " : ""}
                      {name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Đã chọn {selectedDomains.length} lĩnh vực
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-4xl font-bold text-slate-900">
                Cài đặt thông báo
              </h2>
              <p className="mt-2 text-slate-500">
                Chọn cách bạn muốn nhận cập nhật về trạng thái hồ sơ và SLA.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  {
                    key: "email",
                    title: "Email",
                    desc: "Nhận cập nhật qua email khi hồ sơ thay đổi trạng thái hoặc SLA sắp hết hạn",
                  },
                  {
                    key: "inApp",
                    title: "Thông báo trong ứng dụng",
                    desc: "Hiển thị badge và panel thông báo thời gian thực trên giao diện",
                  },
                  {
                    key: "sms",
                    title: "SMS",
                    desc: "Nhận tin nhắn SMS cho các trường hợp khẩn cấp (SLA vi phạm, rủi ro cao)",
                  },
                ].map((item) => {
                  const active = notifications[item.key];
                  return (
                    <div
                      key={item.key}
                      className={`flex items-center justify-between rounded-xl border px-5 py-4 ${
                        active ? "border-brand-200 bg-white" : "border-slate-200 bg-white"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="text-sm text-slate-500">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleNotification(item.key)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                          active ? "bg-brand-600" : "bg-slate-300"
                        }`}
                        aria-pressed={active}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                            active ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-8 py-4">
          <button
            type="button"
            onClick={prevStep}
            className="text-slate-500 transition hover:text-slate-700"
          >
            {step === 1 ? "Hủy" : "← Quay lại"}
          </button>
          <p className="text-sm text-slate-400">Bước {step} / 3</p>
          <button
            type="button"
            onClick={nextStep}
            disabled={!canGoNext}
            className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition ${
              canGoNext
                ? "bg-brand-600 text-white hover:bg-brand-700"
                : "border border-slate-200 bg-slate-100 text-slate-400"
            }`}
          >
            {step === 3 ? "Hoàn tất thiết lập  ›" : "Tiếp theo  ›"}
          </button>
        </div>
      </section>
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
