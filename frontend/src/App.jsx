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
]

const steps = [
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
]

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
]

function App() {
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
            <button className="hidden h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex">
              Đăng nhập
            </button>
            <button className="h-11 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2">
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
              <button className="h-12 rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white transition hover:bg-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-800">
                Bắt đầu ngay
              </button>
              <button className="h-12 rounded-xl border border-white/25 bg-white/10 px-6 text-sm font-semibold text-white transition hover:bg-white/20">
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
              <p className="mt-2 text-sm text-brand-100">HS-2024-0087 · Rủi ro cao phát hiện</p>
              <div className="mt-3 h-2 w-full rounded-full bg-brand-100/25">
                <div className="h-full w-[72%] rounded-full bg-brand-400" />
              </div>
              <p className="mt-2 text-right text-xs text-brand-100">72% hoàn thành</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 py-5">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 text-sm text-slate-500 lg:px-8">
          <span>Tin dùng bởi:</span>
          <span className="font-medium text-slate-700">Văn phòng Luật HLP</span>
          <span className="font-medium text-slate-700">LexVN Partners</span>
          <span className="font-medium text-slate-700">Công ty CP Tư vấn Pháp lý Minh Đức</span>
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
            Từ tiếp nhận hồ sơ đến bàn giao kết quả - tự động hóa toàn diện với sự giám sát của con người.
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
            {steps.map((item, idx) => (
              <article
                key={item.label}
                className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-900 text-white">
                  {idx + 1}
                </span>
                <p className="text-xs font-bold text-slate-500">{item.label}</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">{item.title}</h3>
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
            <article key={item.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
            Liên hệ đội ngũ LegalDesk AI để được tư vấn triển khai phù hợp với quy mô tổ chức của bạn.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button className="h-12 rounded-xl bg-white px-7 text-sm font-semibold text-brand-900 transition hover:bg-slate-100">
              Đăng nhập hệ thống
            </button>
            <button className="h-12 rounded-xl border border-white/25 bg-white/10 px-7 text-sm font-semibold text-white transition hover:bg-white/20">
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
  )
}

export default App
