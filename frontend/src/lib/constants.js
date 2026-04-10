export const APP_NAME = "LegalDesk AI";

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
    subtitle: "Khách hàng demo",
  },
  {
    email: "admin@demo.vn",
    role: "admin",
    name: "LegalDesk Admin",
    company: "LegalDesk AI",
    subtitle: "Vận hành workflow",
  },
];

export const CLIENT_NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/client/dashboard",
    icon: "LayoutDashboard",
    showInNav: true,
    phase: "M5 core",
  },
  {
    label: "Tạo hồ sơ",
    href: "/client/cases/new",
    icon: "FilePlus2",
    showInNav: true,
    phase: "M5 core",
  },
];

export const ADMIN_NAV_ITEMS = [
  {
    label: "Luật định tuyến",
    href: "/admin/routing",
    icon: "Settings2",
    showInNav: true,
    phase: "M5 core",
  },
  {
    label: "Nhật ký vận hành",
    href: "/admin/logs",
    icon: "Logs",
    showInNav: true,
    phase: "M5 core",
  },
  {
    label: "Người dùng",
    href: "/admin/users",
    icon: "Users2",
    showInNav: true,
    phase: "M5 core",
  },
  {
    label: "Bảng điều khiển",
    href: "/admin/dashboard",
    icon: "GaugeCircle",
    showInNav: false,
    phase: "Stretch",
  },
  {
    label: "Hệ thống",
    href: "/admin/system",
    icon: "Activity",
    showInNav: false,
    phase: "Stretch",
  },
];

export const STATUS_META = {
  uploaded: {
    label: "Uploaded",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  extracting: {
    label: "TextExtractOrOCR",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  ai_analyzing: {
    label: "AIAnalyzing",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  auto_published: {
    label: "AutoPublished",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  finalized: {
    label: "Finalized",
    className: "border-brand-100 bg-brand-50 text-brand-700",
  },
};

export const RISK_META = {
  low: {
    label: "Thấp",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  medium: {
    label: "Trung bình",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  high: {
    label: "Cao",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

export const PIPELINE_STAGES = [
  "Uploaded",
  "TextExtractOrOCR",
  "AIAnalyzing",
  "AutoPublished",
  "Finalized",
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

export const PHASE_ONE_FOUNDATION_MODULES = [
  "AppShell có sidebar theo role và topbar dùng chung",
  "Routing cho Home / Auth / Onboarding / Client / Admin",
  "Auth context với 2 tài khoản demo và redirect theo role",
  "API layer hỗ trợ mock | hybrid | real",
  "UI primitives cho card, tab, bảng, upload và empty state",
  "Placeholder routes sẵn sàng để mở rộng sang Phase 2",
];
