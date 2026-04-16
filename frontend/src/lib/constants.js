export const APP_NAME = "LegalDesk AI";

/** Ảnh hero trang chủ — URL bên ngoài (Unsplash). Đổi link tại đây nếu cần ảnh khác. */
export const HOME_HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1600&q=85";

export const API_MODE_OPTIONS = ["mock", "hybrid", "real"];

export const ROLE_LABELS = {
  client: "Cổng khách hàng",
  admin: "Trang quản trị",
};

export const ROLE_REDIRECTS = {
  client: "/client/dashboard",
  admin: "/admin/routing",
};

export const DEMO_ACCOUNTS = [
  {
    email: "client@demo.vn",
    role: "client",
    name: "Kim Thao Ops",
    company: "Kim Thao Garment",
    subtitle: "Tài khoản khách hàng dùng thử",
  },
  {
    email: "admin@demo.vn",
    role: "admin",
    name: "LegalDesk Admin",
    company: "LegalDesk AI",
    subtitle: "Tài khoản quản trị vận hành",
  },
];

export const CLIENT_NAV_ITEMS = [
  {
    label: "Tổng quan",
    href: "/client/dashboard",
    icon: "LayoutDashboard",
    showInNav: true,
  },
  {
    label: "Tạo hồ sơ",
    href: "/client/cases/new",
    icon: "FilePlus2",
    showInNav: true,
  },
];

export const ADMIN_NAV_ITEMS = [
  {
    label: "Luật định tuyến",
    href: "/admin/routing",
    icon: "Settings2",
    showInNav: true,
  },
  {
    label: "Nhật ký vận hành",
    href: "/admin/logs",
    icon: "Logs",
    showInNav: true,
  },
  {
    label: "Người dùng",
    href: "/admin/users",
    icon: "Users2",
    showInNav: true,
  },
  {
    label: "Bảng điều khiển",
    href: "/admin/dashboard",
    icon: "GaugeCircle",
    showInNav: true,
  },
  {
    label: "Hệ thống",
    href: "/admin/system",
    icon: "Activity",
    showInNav: true,
  },
];

export const STATUS_META = {
  uploaded: {
    label: "Đã tải lên",
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
  extracting: {
    label: "Đang OCR",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  ai_analyzing: {
    label: "AI đang phân tích",
    className: "border-brand-500/15 bg-brand-50 text-brand-700",
  },
  auto_published: {
    label: "Đã công bố",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  finalized: {
    label: "Hoàn tất",
    className: "border-brand-500/15 bg-brand-50 text-brand-700",
  },
};

export const RISK_META = {
  low: {
    label: "Thấp",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  medium: {
    label: "Trung bình",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  high: {
    label: "Cao",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

export const PIPELINE_STAGES = [
  "Đã tải lên",
  "OCR",
  "Phân tích AI",
  "Đã công bố",
  "Hoàn tất",
];

export const LEGAL_DOMAINS = [
  "Hợp đồng thương mại",
  "Bất động sản",
  "Lao động",
  "Sở hữu trí tuệ",
  "Doanh nghiệp",
  "Thuế và tài chính",
];

export const CUSTOMER_TYPES = [
  {
    id: "business",
    title: "Doanh nghiệp",
    description: "Công ty cần xử lý hồ sơ theo luồng ổn định",
  },
  {
    id: "individual",
    title: "Cá nhân",
    description: "Khách hàng cần giao diện đơn giản và rõ ràng",
  },
  {
    id: "law-office",
    title: "Văn phòng luật",
    description: "Đơn vị vận hành nhiều hồ sơ và SLA đồng thời",
  },
];

export const NOTIFICATION_DEFAULTS = {
  email: true,
  inApp: true,
  sms: false,
};
