import { CUSTOMER_TYPES, LEGAL_DOMAINS, NOTIFICATION_DEFAULTS } from "./constants.js";

export const mockCases = [
  {
    id: "CASE-2604-001",
    title: "Gia hạn hợp đồng thuê văn phòng",
    documentName: "gia_han_thue_van_phong.pdf",
    description: "Rà soát điều khoản gia hạn, cơ chế phạt và nghĩa vụ bảo trì.",
    status: "finalized",
    riskLevel: "medium",
    needsAttention: false,
    createdAt: "2026-04-08T09:20:00+07:00",
    updatedAt: "2026-04-08T10:35:00+07:00",
    extractedText:
      "Bên thuê có quyền gia hạn trong 24 tháng. Điều khoản phạt chậm thanh toán 8%/năm. Chủ nhà được quyền điều chỉnh phí quản lý sau 30 ngày thông báo.",
    review: {
      docType: "Lease Addendum",
      confidence: 0.91,
      riskScore: 63,
      riskLevel: "medium",
      riskFlags: [
        "Điều khoản điều chỉnh phí quản lý có biên độ mở rộng",
        "Cơ chế phạt chậm thanh toán chưa quy định trần rõ ràng",
      ],
      extractedFields: {
        parties: ["Kim Thao Garment", "Saigon Office Tower"],
        effectiveDate: "2026-05-01",
        renewalTerm: "24 months",
      },
      recommendedAction:
        "Làm rõ trần điều chỉnh phí quản lý và thêm thông báo trước ít nhất 45 ngày.",
      summary:
        "Tài liệu phù hợp cho bối cảnh gia hạn thuê, nhưng nên thu hẹp biên độ điều chỉnh phí quản lý.",
      needsAttention: false,
      qualityWarning: "OCR ổn định, không có trang nào bị mờ.",
      disclaimer:
        "Kết quả do AI tổng hợp cho mục đích tham khảo, cần đối chiếu với tài liệu gốc.",
      meta: {
        latencyMs: 1840,
        model: "mock-legal-review-v1",
      },
    },
    timeline: [
      {
        id: "tl-001",
        title: "Hồ sơ được tải lên",
        detail: "Client đã gửi bản PDF bổ sung gia hạn.",
        stage: "Đã tải lên",
        at: "2026-04-08T09:20:00+07:00",
      },
      {
        id: "tl-002",
        title: "OCR và trích xuất",
        detail: "Hệ thống trích xuất 5 trang văn bản thành công.",
        stage: "OCR",
        at: "2026-04-08T09:26:00+07:00",
      },
      {
        id: "tl-003",
        title: "AI đánh giá rủi ro",
        detail: "Mô hình tìm thấy 2 cảnh báo mức trung bình.",
        stage: "Phân tích AI",
        at: "2026-04-08T09:48:00+07:00",
      },
      {
        id: "tl-004",
        title: "Tự động công bố",
        detail: "Báo cáo đã sẵn sàng trong cổng client.",
        stage: "Đã công bố",
        at: "2026-04-08T10:35:00+07:00",
      },
    ],
    chatMessages: [
      {
        id: "msg-001",
        role: "assistant",
        content:
          "Mình đã tóm tắt 2 điểm cần cân nhắc trong phụ lục gia hạn: phí quản lý có thể thay đổi và điều khoản phạt chậm thanh toán chưa có trần rõ ràng.",
        createdAt: "2026-04-08T10:40:00+07:00",
        citations: [
          {
            id: "cit-001",
            label: "Điều 4.2",
            excerpt: "Chủ nhà có quyền điều chỉnh phí quản lý sau khi thông báo bằng văn bản.",
          },
        ],
      },
    ],
  },
  {
    id: "CASE-2604-002",
    title: "Hợp đồng cung cấp phần mềm",
    documentName: "hop_dong_saas_master.docx",
    description: "Review SLA, giới hạn trách nhiệm và bảo mật dữ liệu.",
    status: "ai_analyzing",
    riskLevel: "high",
    needsAttention: true,
    createdAt: "2026-04-07T14:10:00+07:00",
    updatedAt: "2026-04-07T15:02:00+07:00",
    extractedText:
      "Bên cung cấp có quyền thay đổi phạm vi dịch vụ với thông báo 7 ngày. Giới hạn trách nhiệm bằng tổng phí 3 tháng gần nhất. Không có phụ lục SLA cụ thể.",
    review: {
      docType: "SaaS Service Agreement",
      confidence: 0.88,
      riskScore: 81,
      riskLevel: "high",
      riskFlags: [
        "Không có phụ lục SLA cụ thể",
        "Thời gian thông báo thay đổi dịch vụ quá ngắn",
      ],
      extractedFields: {
        parties: ["Kim Thao Garment", "Cloud Nova"],
        governingLaw: "Vietnam",
        liabilityCap: "3 months fee",
      },
      recommendedAction:
        "Bổ sung SLA định nghĩa RTO/RPO và yêu cầu thông báo 30 ngày cho thay đổi dịch vụ.",
      summary:
        "Hợp đồng chưa đủ chặt cho mô hình vận hành quan trọng; cần bổ sung mức cam kết dịch vụ và bảo mật.",
      needsAttention: true,
      qualityWarning: "Bản DOCX sạch, không có lỗi OCR.",
      disclaimer:
        "AI chỉ đánh giá sơ bộ. Đội ngũ pháp lý nên xem lại các điều khoản nghiêm trọng.",
      meta: {
        latencyMs: 2260,
        model: "mock-legal-review-v1",
      },
    },
    timeline: [
      {
        id: "tl-101",
        title: "Hồ sơ đã tiếp nhận",
        detail: "Tài liệu Word được nhận từ cổng client.",
        stage: "Đã tải lên",
        at: "2026-04-07T14:10:00+07:00",
      },
      {
        id: "tl-102",
        title: "Đang phân tích AI",
        detail: "Hệ thống đang gắn nhãn điều khoản SLA và bảo mật.",
        stage: "Phân tích AI",
        at: "2026-04-07T15:02:00+07:00",
      },
    ],
    chatMessages: [
      {
        id: "msg-101",
        role: "assistant",
        content:
          "Tài liệu này đang ở mức cần chú ý cao vì thiếu phụ lục SLA và cho phép thay đổi dịch vụ khá rộng.",
        createdAt: "2026-04-07T15:04:00+07:00",
        citations: [],
      },
    ],
  },
  {
    id: "CASE-2604-003",
    title: "Thỏa thuận bảo mật dữ liệu",
    documentName: "nda_du_lieu_scan.jpg",
    description: "Kiểm tra điều khoản chia sẻ dữ liệu và thời hạn bảo mật.",
    status: "extracting",
    riskLevel: "low",
    needsAttention: false,
    createdAt: "2026-04-06T08:45:00+07:00",
    updatedAt: "2026-04-06T09:00:00+07:00",
    extractedText:
      "Bên nhận thông tin phải bảo mật trong 36 tháng. Dữ liệu không được chuyển giao cho bên thứ ba nếu không có chấp thuận bằng văn bản.",
    review: {
      docType: "NDA",
      confidence: 0.93,
      riskScore: 28,
      riskLevel: "low",
      riskFlags: [],
      extractedFields: {
        confidentialityTerm: "36 months",
        transferRestriction: "Written consent required",
      },
      recommendedAction: "Theo dõi thêm kết quả OCR và đối chiếu trang ký tên.",
      summary:
        "Nội dung bảo mật khá chặt, cần xác thực thêm phần chữ ký sau khi OCR hoàn tất.",
      needsAttention: false,
      qualityWarning: "Ảnh scan có một góc bị tối, độ tin cậy OCR sẽ thấp hơn.",
      disclaimer:
        "Cần kiểm tra bản scan gốc trước khi sử dụng kết quả cho quyết định nghiệp vụ.",
      meta: {
        latencyMs: 0,
        model: "pending",
      },
    },
    timeline: [
      {
        id: "tl-201",
        title: "Ảnh scan được tải lên",
        detail: "Hệ thống nhận 1 file JPG chất lượng trung bình.",
        stage: "Đã tải lên",
        at: "2026-04-06T08:45:00+07:00",
      },
      {
        id: "tl-202",
        title: "Đang OCR",
        detail: "Đang cân bằng ảnh và trích xuất văn bản từ file scan.",
        stage: "OCR",
        at: "2026-04-06T09:00:00+07:00",
      },
    ],
    chatMessages: [],
  },
];

export const mockUsers = [
  {
    id: "USR-001",
    name: "Kim Thao Ops",
    email: "client@demo.vn",
    role: "client",
    company: "Kim Thao Garment",
    status: "Đang hoạt động",
    lastSeenAt: "2026-04-08T10:42:00+07:00",
  },
  {
    id: "USR-002",
    name: "LegalDesk Admin",
    email: "admin@demo.vn",
    role: "admin",
    company: "LegalDesk AI",
    status: "Đang hoạt động",
    lastSeenAt: "2026-04-08T10:46:00+07:00",
  },
  {
    id: "USR-003",
    name: "Tran Minh Chau",
    email: "chau.operations@kimthao.vn",
    role: "client",
    company: "Kim Thao Garment",
    status: "Đã mời",
    lastSeenAt: "2026-04-05T11:18:00+07:00",
  },
];

export const mockRoutingRules = [
  {
    id: "RULE-001",
    name: "SaaS và hợp đồng công nghệ",
    priority: 1,
    match: "docType contains SaaS OR software",
    action: "Gán nhãn commercial-tech",
    status: "Bật",
  },
  {
    id: "RULE-002",
    name: "Tài liệu cần chú ý cao",
    priority: 2,
    match: "riskLevel = high",
    action: "Đánh dấu pipeline khẩn",
    status: "Bật",
  },
  {
    id: "RULE-003",
    name: "Scan chất lượng thấp",
    priority: 3,
    match: "qualityWarning exists",
    action: "Tăng cảnh báo OCR",
    status: "Nháp",
  },
];

export const mockAuditLogs = [
  {
    id: "AUD-001",
    actor: "client@demo.vn",
    action: "Tạo hồ sơ CASE-2604-001",
    scope: "Cổng khách hàng",
    timestamp: "2026-04-08T09:20:00+07:00",
  },
  {
    id: "AUD-002",
    actor: "system",
    action: "Hoàn tất AI review cho CASE-2604-001",
    scope: "Đánh giá pháp lý",
    timestamp: "2026-04-08T10:35:00+07:00",
  },
  {
    id: "AUD-003",
    actor: "admin@demo.vn",
    action: "Cập nhật luật định tuyến RULE-002",
    scope: "Trang quản trị",
    timestamp: "2026-04-08T11:02:00+07:00",
  },
];

export const mockWorkflowExecutions = [
  {
    id: "WF-001",
    workflow: "Intake -> OCR -> Review",
    caseId: "CASE-2604-001",
    status: "Hoàn tất",
    duration: "3m 22s",
    lastStep: "Đã công bố",
    timestamp: "2026-04-08T10:35:00+07:00",
  },
  {
    id: "WF-002",
    workflow: "Intake -> Review",
    caseId: "CASE-2604-002",
    status: "Đang chạy",
    duration: "52s",
    lastStep: "Phân tích AI",
    timestamp: "2026-04-07T15:02:00+07:00",
  },
  {
    id: "WF-003",
    workflow: "Intake -> OCR",
    caseId: "CASE-2604-003",
    status: "Đã xếp hàng",
    duration: "14s",
    lastStep: "OCR",
    timestamp: "2026-04-06T09:00:00+07:00",
  },
];

export const mockHealthResponse = {
  status: "healthy",
  service: "legaldesk-fastapi",
  environment: "development",
  timestamp: "2026-04-09T09:15:00+07:00",
  dependencies: {
    postgres: {
      status: "healthy",
      detail: "Connected",
    },
    redis: {
      status: "healthy",
      detail: "Connected",
    },
  },
};

export const onboardingDefaults = {
  customerType: CUSTOMER_TYPES[0].id,
  legalDomains: LEGAL_DOMAINS.slice(0, 2),
  notifications: NOTIFICATION_DEFAULTS,
};

export function getCaseById(caseId) {
  return mockCases.find((entry) => entry.id === caseId) ?? null;
}

export function buildReviewResponseFromCase(caseRecord) {
  if (caseRecord?.review) {
    return caseRecord.review;
  }

  return {
    docType: "General Legal Document",
    confidence: 0.84,
    riskScore: 45,
    riskLevel: "medium",
    riskFlags: ["Không đủ dữ liệu để map đến case mock cụ thể."],
    extractedFields: {},
    recommendedAction: "Kiểm tra thêm thông tin trước khi xử lý tiếp.",
    summary: "Mock review được tạo từ payload đầu vào.",
    needsAttention: false,
    qualityWarning: "Dữ liệu này được sinh ra từ fallback mock.",
    disclaimer: "Mock response chỉ phục vụ UI integration.",
    meta: {
      latencyMs: 950,
      model: "mock-legal-review-v1",
    },
  };
}

export function buildChatResponse({ question, caseRecord }) {
  const title = caseRecord?.title ?? "hồ sơ này";

  return {
    answer:
      `Với ${title}, điểm cần quan tâm nhất là: ${question || "cần đối chiếu điều khoản và risk flag"}. ` +
      "Trong Phase 1, câu trả lời này đang được mock để giữ cho luồng UI ổn định.",
    citations: [
      {
        id: "cit-fallback-001",
        label: caseRecord?.documentName ?? "mock-source.txt",
        excerpt: "Thông tin trích dẫn mẫu để tái hiện giao diện citation card.",
      },
    ],
    caution: "Cần đối chiếu với tài liệu gốc trước khi ra quyết định nghiệp vụ.",
    confidence: 0.82,
    needsAttention: Boolean(caseRecord?.needsAttention),
    disclaimer: "Mock chat response chỉ phục vụ UI integration.",
  };
}
