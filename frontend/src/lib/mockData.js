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
      docType: "Phụ lục hợp đồng thuê",
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
      docType: "Hợp đồng dịch vụ SaaS",
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
      docType: "Thỏa thuận bảo mật (NDA)",
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
  {
    id: "USR-004",
    name: "Nguyen Thanh Dat",
    email: "dat.procurement@kimthao.vn",
    role: "client",
    company: "Kim Thao Garment",
    status: "Đang hoạt động",
    lastSeenAt: "2026-04-08T08:12:00+07:00",
  },
  {
    id: "USR-005",
    name: "Admin Operations 2",
    email: "ops.admin@legaldesk.vn",
    role: "admin",
    company: "LegalDesk AI",
    status: "Đã mời",
    lastSeenAt: "2026-04-04T16:21:00+07:00",
  },
];

export const mockRoutingRules = [
  {
    id: "RULE-001",
    metric: "riskScore",
    operator: ">=",
    value: 70,
    action: "needs_attention",
    active: true,
  },
  {
    id: "RULE-002",
    metric: "confidence",
    operator: "<",
    value: 0.55,
    action: "quality_warning",
    active: true,
  },
  {
    id: "RULE-003",
    metric: "slaHours",
    operator: "<",
    value: 4,
    action: "escalate",
    active: true,
  },
];

export const mockAuditLogs = [
  {
    id: "AUD-001",
    eventType: "case_created",
    caseId: "CASE-2604-001",
    userId: "client@demo.vn",
    description: "Khách hàng tạo hồ sơ mới từ giao diện nộp tài liệu.",
    details: "title=Gia hạn hợp đồng thuê văn phòng",
    timestamp: "2026-04-08T09:20:00+07:00",
  },
  {
    id: "AUD-002",
    eventType: "status_changed",
    caseId: "CASE-2604-001",
    userId: "system",
    description: "Hồ sơ chuyển từ bước phân tích AI sang công bố kết quả.",
    details: "from=ai_analyzing,to=auto_published",
    timestamp: "2026-04-08T10:35:00+07:00",
  },
  {
    id: "AUD-003",
    eventType: "rule_updated",
    caseId: "-",
    userId: "admin@demo.vn",
    description: "Admin cập nhật RULE-002.",
    details: "confidence < 0.55 => quality_warning",
    timestamp: "2026-04-08T11:02:00+07:00",
  },
  {
    id: "AUD-004",
    eventType: "chat_message",
    caseId: "CASE-2604-002",
    userId: "client@demo.vn",
    description: "Khách hàng gửi câu hỏi bổ sung trong mục trao đổi.",
    details: "question=SLA cam kết bao nhiêu phút?",
    timestamp: "2026-04-08T11:18:00+07:00",
  },
  {
    id: "AUD-005",
    eventType: "routing_decision",
    caseId: "CASE-2604-002",
    userId: "system",
    description: "Áp dụng RULE-001 và đặt cờ needs_attention.",
    details: "riskScore=81,rule=RULE-001",
    timestamp: "2026-04-08T11:20:00+07:00",
  },
];

export const mockWorkflowExecutions = [
  {
    id: "WF-001",
    executionId: "WF-001",
    workflowName: "legal-review-main",
    caseId: "CASE-2604-001",
    status: "success",
    startedAt: "2026-04-08T10:30:00+07:00",
    durationMs: 202000,
    stepsCompleted: "5/5",
    steps: [
      { label: "intake", status: "success", durationMs: 12000 },
      { label: "ocr", status: "success", durationMs: 63000 },
      { label: "ai_review", status: "success", durationMs: 78000, model: "gemini-2.5-flash" },
      { label: "routing", status: "success", durationMs: 11000 },
      { label: "publish", status: "success", durationMs: 38000 },
    ],
  },
  {
    id: "WF-002",
    executionId: "WF-002",
    workflowName: "legal-review-main",
    caseId: "CASE-2604-002",
    status: "retry",
    startedAt: "2026-04-07T15:00:00+07:00",
    durationMs: 312000,
    stepsCompleted: "4/5",
    steps: [
      { label: "intake", status: "success", durationMs: 14000 },
      { label: "ocr", status: "success", durationMs: 54000 },
      { label: "ai_review", status: "retry", durationMs: 141000, model: "gemini-2.5-flash", fallback: "retry x1" },
      { label: "routing", status: "success", durationMs: 19000 },
      { label: "publish", status: "queued", durationMs: 0 },
    ],
  },
  {
    id: "WF-003",
    executionId: "WF-003",
    workflowName: "ocr-intensive",
    caseId: "CASE-2604-003",
    status: "failed",
    startedAt: "2026-04-06T09:00:00+07:00",
    durationMs: 74000,
    stepsCompleted: "2/5",
    steps: [
      { label: "intake", status: "success", durationMs: 9000 },
      { label: "ocr", status: "failed", durationMs: 65000, fallback: "scan quality too low" },
      { label: "ai_review", status: "queued", durationMs: 0 },
      { label: "routing", status: "queued", durationMs: 0 },
      { label: "publish", status: "queued", durationMs: 0 },
    ],
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

function normalizeReviewInput(caseRecord, payload = {}) {
  return {
    title: caseRecord?.title || payload.title || "Hồ sơ pháp lý",
    description: caseRecord?.description || payload.description || "",
    domain: caseRecord?.domain || payload.metadata?.domain || payload.domain || "",
    extractedText: caseRecord?.extractedText || payload.extractedText || "",
    documentName: caseRecord?.documentName || payload.metadata?.documentName || payload.documentName || "tai_lieu_mau.pdf",
  };
}

function deriveReviewHeuristics(caseRecord, payload = {}) {
  const source = normalizeReviewInput(caseRecord, payload);
  const combinedText = `${source.title} ${source.description} ${source.domain} ${source.extractedText}`.toLowerCase();
  const shortExcerpt = source.extractedText || source.description || source.title;
  const reviewSummary =
    shortExcerpt.length > 220
      ? `${shortExcerpt.slice(0, 217).trim()}...`
      : shortExcerpt || "Hệ thống chưa nhận đủ nội dung để tạo tóm tắt dài hơn.";

  if (combinedText.includes("saas") || combinedText.includes("phần mềm") || combinedText.includes("sla") || combinedText.includes("cloud")) {
    return {
      docType: "Hợp đồng dịch vụ SaaS",
      confidence: 0.89,
      riskScore: 82,
      riskLevel: "high",
      riskFlags: [
        "Thiếu cam kết SLA hoặc chưa định nghĩa RTO/RPO rõ ràng",
        "Điều khoản thay đổi dịch vụ có thể quá rộng cho môi trường vận hành thực tế",
      ],
      extractedFields: {
        domain: source.domain || "Hợp đồng thương mại",
        document: source.documentName,
        keyFocus: "SLA, giới hạn trách nhiệm, bảo mật dữ liệu",
      },
      recommendedAction: "Bổ sung phụ lục SLA, làm rõ phạm vi thay đổi dịch vụ và nâng ngưỡng thông báo.",
      summary: reviewSummary,
      needsAttention: true,
      qualityWarning: source.extractedText ? "Kết quả hiện đang dựa trên phần nội dung trích xuất do người dùng cung cấp." : "Chưa có nhiều nội dung OCR nên kết quả mang tính định hướng.",
    };
  }

  if (combinedText.includes("thuê") || combinedText.includes("lease") || combinedText.includes("gia hạn") || combinedText.includes("bất động sản")) {
    return {
      docType: "Hợp đồng thuê / bất động sản",
      confidence: 0.86,
      riskScore: 61,
      riskLevel: "medium",
      riskFlags: [
        "Cần rà lại cơ chế gia hạn và điều chỉnh phí để tránh khoảng mở quá rộng",
        "Nên kiểm tra điều khoản phạt và nghĩa vụ bảo trì giữa các bên",
      ],
      extractedFields: {
        domain: source.domain || "Bất động sản",
        document: source.documentName,
        keyFocus: "Gia hạn, phạt chậm thanh toán, phí quản lý",
      },
      recommendedAction: "Chuẩn hóa lại điều khoản gia hạn, mức phạt và phạm vi điều chỉnh chi phí trước khi ký.",
      summary: reviewSummary,
      needsAttention: false,
      qualityWarning: "Một số điều khoản nên được đối chiếu thêm trước khi chốt quyết định.",
    };
  }

  if (combinedText.includes("bảo mật") || combinedText.includes("nda") || combinedText.includes("dữ liệu")) {
    return {
      docType: "Thỏa thuận bảo mật / phụ lục xử lý dữ liệu",
      confidence: 0.92,
      riskScore: 33,
      riskLevel: "low",
      riskFlags: ["Cần xác minh lại thời hạn bảo mật và phạm vi chia sẻ cho bên thứ ba nếu tài liệu là bản scan."],
      extractedFields: {
        domain: source.domain || "Doanh nghiệp",
        document: source.documentName,
        keyFocus: "Thời hạn bảo mật, chuyển giao dữ liệu, điều khoản xử lý dữ liệu",
      },
      recommendedAction: "Đối chiếu chữ ký và phạm vi chia sẻ dữ liệu ở bản gốc trước khi lưu hồ sơ.",
      summary: reviewSummary,
      needsAttention: false,
      qualityWarning: source.extractedText ? "Nội dung đầu vào khá rõ ràng, tuy nhiên vẫn nên đối chiếu với bản gốc khi cần quyết định chính thức." : "Không có nhiều nội dung OCR nên kết quả hiện dựa nhiều hơn vào thông tin mô tả và metadata.",
    };
  }

  return {
    docType: "Tài liệu pháp lý tổng quát",
    confidence: 0.84,
    riskScore: 48,
    riskLevel: "medium",
    riskFlags: ["Chưa đủ tín hiệu để phân loại tài liệu vào nhóm hợp đồng chuyên biệt."],
    extractedFields: {
      domain: source.domain || "Hợp đồng thương mại",
      document: source.documentName,
      keyFocus: "Đối chiếu điều khoản chính, trách nhiệm và nghĩa vụ",
    },
    recommendedAction: "Bổ sung thêm nội dung trích xuất hoặc tài liệu gốc trước khi đưa sang bước xử lý tiếp theo.",
    summary: reviewSummary,
    needsAttention: false,
    qualityWarning: "Dữ liệu đầu vào còn khá ngắn nên độ tin cậy sẽ thấp hơn so với tài liệu đầy đủ.",
  };
}

export function buildReviewResponseFromCase(caseRecord, payload = {}) {
  if (caseRecord?.review) {
    return caseRecord.review;
  }

  const derivedReview = deriveReviewHeuristics(caseRecord, payload);

  return {
    ...derivedReview,
    disclaimer: "Kết quả AI chỉ mang tính tham khảo và cần được đối chiếu với tài liệu gốc.",
    meta: {
      latencyMs: 950 + Math.min((payload.extractedText || "").length * 2, 1200),
      model: "mock-legal-review-v1",
    },
  };
}

export function buildChatResponse({ question, caseRecord }) {
  const title = caseRecord?.title ?? "hồ sơ này";

  return {
    answer:
      `Với ${title}, điểm cần quan tâm nhất là: ${question || "cần đối chiếu điều khoản và risk flag"}. ` +
      "Bạn nên đối chiếu thêm với điều khoản liên quan trong tài liệu gốc để ra quyết định chính xác hơn.",
    citations: [
      {
        id: "cit-fallback-001",
        label: caseRecord?.documentName ?? "tai-lieu-tham-chieu.txt",
        excerpt: "Thông tin trích dẫn mẫu để tái hiện giao diện citation card.",
      },
    ],
    caution: "Cần đối chiếu với tài liệu gốc trước khi ra quyết định nghiệp vụ.",
    confidence: 0.82,
    needsAttention: Boolean(caseRecord?.needsAttention),
    disclaimer: "Câu trả lời này chỉ mang tính tham khảo và không thay thế tư vấn pháp lý chuyên nghiệp.",
  };
}
