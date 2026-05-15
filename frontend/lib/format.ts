export function humanStatus(status: string): string {
  const labels: Record<string, string> = {
    admin_approved: "Người rà soát đã duyệt",
    admin_rejected: "Người rà soát đã từ chối",
    reviewer_approved: "Người rà soát đã duyệt",
    reviewer_rejected: "Người rà soát đã từ chối",
    ai_approved: "AI đã duyệt",
    pending_admin: "Cần người rà soát xử lý",
    needs_reviewer: "Cần người rà soát xử lý",
    processing: "Đang xử lý",
    pending_extraction: "Chờ trích xuất",
    awaiting_extraction: "Chờ trích xuất",
    extracting: "Đang trích xuất",
    extracted: "Đã trích xuất",
    awaiting_ai_review: "Chờ AI rà soát",
    ai_reviewing: "AI đang rà soát",
    pending: "Đang chờ",
    completed: "Hoàn tất",
    failed: "Thất bại",
    document_uploaded: "Đã tải tài liệu lên",
    document_processing_started: "Bắt đầu xử lý tài liệu",
    document_processing_failed: "Xử lý tài liệu thất bại",
    document_extraction_started: "Bắt đầu trích xuất văn bản",
    document_extraction_completed: "Đã trích xuất văn bản",
    document_extraction_failed: "Trích xuất văn bản thất bại",
    document_chat_completed: "Đã trả lời hỏi đáp tài liệu",
    document_chat_failed: "Hỏi đáp tài liệu thất bại",
    ai_review_queued: "Đã xếp hàng AI rà soát",
    ai_review_started: "Bắt đầu AI rà soát",
    ai_classification_completed: "Đã phân loại tài liệu",
    risk_analysis_completed: "Đã phân tích rủi ro",
    ai_summary_started: "Bắt đầu tạo phân tích AI",
    ai_summary_completed: "Đã tạo phân tích AI",
    ai_review_failed: "AI rà soát thất bại",
    ai_review_completed: "AI đã rà soát xong",
    admin_decision_submitted: "Người rà soát đã gửi quyết định",
    reviewer_decision_submitted: "Người rà soát đã gửi quyết định",
    n8n_callback_received: "Đã nhận callback từ n8n",
    notification_sent: "Đã gửi thông báo",
    notification_invalid_payload: "Payload thông báo không hợp lệ",
    notification_unknown_status: "Trạng thái thông báo chưa rõ",
    compliance_expiry_alert_completed: "Đã gửi cảnh báo hết hạn",
    compliance_expiry_alert_no_data: "Không có dữ liệu cảnh báo hết hạn",
    compliance_weekly_audit_created: "Đã tạo kiểm soát hằng tuần",
    compliance_weekly_audit_no_data: "Không có dữ liệu kiểm soát hằng tuần",
    compliance_weekly_summary_sent: "Đã gửi tổng kết hằng tuần",
    legal_obligations_extracted: "Đã trích xuất cam kết/mốc cần theo dõi",
    legal_obligations_detected: "Đã gửi cam kết/mốc sang n8n",
    legal_obligations_alert_sent: "Đã gửi cảnh báo cam kết/mốc",
    legal_obligations_no_data: "Không có cam kết/mốc cần cảnh báo",
    overdue: "Quá hạn",
    due_soon: "Sắp đến hạn",
    normal: "Đang theo dõi",
    no_deadline: "Chưa có hạn cụ thể",
    open: "Đang mở",
    payment: "Thanh toán",
    filing: "Nộp hồ sơ",
    reporting: "Báo cáo",
    approval: "Phê duyệt",
    notice: "Thông báo",
    renewal: "Gia hạn",
    termination: "Chấm dứt",
    security: "Bảo đảm",
    other: "Khác",
    document: "Tài liệu",
    n8n_event: "Sự kiện n8n",
    contract: "Hợp đồng",
    nda: "Thỏa thuận bảo mật",
    invoice: "Hóa đơn",
    policy: "Chính sách",
    court_judgment: "Bản án / văn bản tố tụng",
    unknown: "Chưa rõ",
    good: "Tốt",
    low: "Thấp",
    medium: "Trung bình",
    high: "Cao",
    critical: "Rất cao",
    JUDICIAL_DOCUMENT: "Tài liệu tố tụng/tư pháp",
    SENSITIVE_PERSONAL_DATA: "Dữ liệu cá nhân nhạy cảm",
    MISSING_SIGNATURE: "Thiếu chữ ký",
    HIGH_VALUE: "Giá trị cao",
    EXPIRY_SOON: "Sắp hết hạn",
    NO_TERMINATION_CLAUSE: "Thiếu điều khoản chấm dứt",
    NO_GOVERNING_LAW: "Thiếu luật điều chỉnh",
    BROAD_INDEMNITY: "Bồi thường quá rộng",
    AUTO_RENEWAL: "Tự động gia hạn",
    LOW_EXTRACTION_QUALITY: "Chất lượng trích xuất thấp",
    UNKNOWN_DOC_TYPE: "Loại tài liệu chưa rõ",
    CONFIDENCE_LOW: "Độ tin cậy thấp",
    HIGH_RISK_SCORE: "Điểm rủi ro cao",
  };

  const normalizedStatus = status.replaceAll(" ", "_").replaceAll(".", "_");
  return labels[status] ?? labels[normalizedStatus] ?? status.replaceAll("_", " ").replaceAll(".", " ");
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "Chưa có";
  }
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatShortDate(value: string | null): string {
  if (!value) {
    return "Chưa đặt";
  }
  return new Intl.DateTimeFormat("vi-VN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatPercent(value: string | number | null): string {
  if (value === null) {
    return "Không có";
  }
  const numericValue = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(numericValue)) {
    return "Không có";
  }
  return `${Math.round(numericValue * 100)}%`;
}

export function humanRiskSnippet(ruleCode: string, snippet: string | null): string {
  if (!snippet) {
    return "Không có đoạn trích phù hợp.";
  }

  const amount = snippet.match(/^Detected amount (.+)\.$/);
  if (amount) {
    return `Phát hiện giá trị ${amount[1]}.`;
  }

  const expiryDate = snippet.match(/^Document appears to expire on (.+)$/);
  if (expiryDate) {
    return `Tài liệu có vẻ hết hạn vào ${expiryDate[1]}.`;
  }

  const confidence = snippet.match(/^Classification confidence is (.+)\.$/);
  if (confidence) {
    return `Độ tin cậy phân loại là ${confidence[1]}.`;
  }

  const labels: Record<string, string> = {
    MISSING_SIGNATURE: "Không phát hiện nội dung về chữ ký.",
    NO_TERMINATION_CLAUSE: "Không tìm thấy từ khóa về điều khoản chấm dứt.",
    NO_GOVERNING_LAW: "Không phát hiện điều khoản luật điều chỉnh hoặc thẩm quyền giải quyết tranh chấp.",
    BROAD_INDEMNITY: "Phát hiện nội dung về bồi thường.",
    AUTO_RENEWAL: "Phát hiện nội dung tự động gia hạn.",
    LOW_EXTRACTION_QUALITY: "Văn bản trích xuất quá ngắn hoặc chất lượng thấp.",
    UNKNOWN_DOC_TYPE: "Không thể phân loại tài liệu một cách chắc chắn.",
    JUDICIAL_DOCUMENT: "Tài liệu có dấu hiệu là bản án hoặc văn bản tố tụng; AI phân loại riêng vì ngữ cảnh pháp lý khác hợp đồng/chứng từ.",
    SENSITIVE_PERSONAL_DATA: "Tài liệu có thông tin cá nhân cần kiểm soát quyền truy cập.",
  };

  return labels[ruleCode] ?? snippet;
}

export function humanRiskSuggestion(ruleCode: string, suggestion: string | null): string | null {
  if (!suggestion) {
    return null;
  }

  const labels: Record<string, string> = {
    MISSING_SIGNATURE: "Kiểm tra tài liệu có đầy đủ phần chữ ký và thông tin ký kết.",
    HIGH_VALUE: "Chuyển tài liệu giá trị cao sang duyệt thủ công.",
    EXPIRY_SOON: "Kiểm tra điều khoản gia hạn hoặc gia hạn trước khi tài liệu hết hiệu lực.",
    NO_TERMINATION_CLAUSE: "Bổ sung quyền chấm dứt và thời hạn thông báo rõ ràng.",
    NO_GOVERNING_LAW: "Nêu rõ luật điều chỉnh và địa điểm giải quyết tranh chấp.",
    BROAD_INDEMNITY: "Kiểm tra trách nhiệm bồi thường có được giới hạn phù hợp hay không.",
    AUTO_RENEWAL: "Xác nhận thời hạn thông báo gia hạn và điều kiện từ chối gia hạn.",
    LOW_EXTRACTION_QUALITY: "Kiểm tra chất lượng file gốc hoặc tải lên phiên bản có văn bản rõ hơn.",
    UNKNOWN_DOC_TYPE: "Chuyển sang rà soát thủ công hoặc cải thiện quy tắc phân loại tài liệu.",
    CONFIDENCE_LOW: "Rà soát thủ công trước khi tin vào kết luận tự động.",
    JUDICIAL_DOCUMENT: "Kiểm tra nội dung phán quyết, thông tin đương sự và phạm vi sử dụng tài liệu.",
    SENSITIVE_PERSONAL_DATA: "Che hoặc giới hạn chia sẻ CCCD/số điện thoại/địa chỉ khi không cần thiết.",
  };

  return labels[ruleCode] ?? suggestion;
}

export function humanAiSummary(summary: string | null): string | null {
  if (!summary) {
    return null;
  }

  const flagged = summary.match(/^This (.+) was flagged with a risk score of (.+)\. Top issues: (.+)\.$/);
  if (flagged) {
    const [, documentType, score, issues] = flagged;
    const translatedIssues = issues
      .split(", ")
      .map((issue) => humanStatus(issue))
      .join(", ");
    return localizeAiReviewText(`Tài liệu ${humanStatus(documentType).toLowerCase()} bị gắn cờ với điểm rủi ro ${score}. Vấn đề chính: ${translatedIssues}.`);
  }

  const lowRisk = summary.match(/^This (.+) appears low risk with extracted text quality rated (.+)\.$/);
  if (lowRisk) {
    const [, documentType, quality] = lowRisk;
    return localizeAiReviewText(`Tài liệu ${humanStatus(documentType).toLowerCase()} có vẻ rủi ro thấp, chất lượng trích xuất được đánh giá là ${humanStatus(quality).toLowerCase()}.`);
  }

  return localizeAiReviewText(summary);
}

export function localizeAiReviewText(text: string): string {
  const replacements: Array<[RegExp, string]> = [
    [/\bneeds_review\b/gi, "cần người rà soát"],
    [/\bapprove\b/gi, "có thể duyệt tự động"],
    [/\bapproved\b/gi, "đã được duyệt"],
    [/\brejected\b/gi, "đã bị từ chối"],
    [/\bescalated\b/gi, "được chuyển người rà soát"],
    [/\bescalate\b/gi, "chuyển người rà soát"],
    [/\bescalation\b/gi, "việc chuyển người rà soát"],
    [/\bBlocker\b/g, "Điểm chặn"],
    [/\bblocker\b/g, "điểm chặn"],
    [/\brisk code(s)?\b/gi, "mã rủi ro"],
    [/\brisk score\b/gi, "điểm rủi ro"],
    [/\brule engine\b/gi, "bộ quy tắc"],
    [/\bseverity\b/gi, "mức độ"],
    [/\bcritical\b/gi, "rất cao"],
    [/\bhigh\b/gi, "cao"],
    [/\bmedium\b/gi, "trung bình"],
    [/\blow\b/gi, "thấp"],
    [/\bfinding(s)?\b/gi, "phát hiện"],
    [/\breviewer\b/gi, "người rà soát"],
    [/\breview\b/gi, "rà soát"],
    [/\bcollateral\b/gi, "tài sản bảo đảm"],
    [/\bprovisioning\b/gi, "trích lập dự phòng"],
    [/\bdefault(s)?\b/gi, "sự kiện vi phạm"],
    [/\bwaiver(s)?\b/gi, "miễn trừ"],
    [/\bforbearance(s)?\b/gi, "tạm hoãn thực thi"],
    [/\blender(s)?\b/gi, "bên cho vay"],
    [/\bborrower(s)?\b/gi, "bên vay"],
    [/\bcounsel\b/gi, "luật sư phụ trách"],
    [/\bops\b/gi, "bộ phận vận hành"],
    [/\bdue diligence\b/gi, "thẩm tra"],
    [/\bclient\b/gi, "khách hàng"],
  ];

  return text
    .split(/(“[^”]*”)/g)
    .map((segment) => {
      if (segment.startsWith("“") && segment.endsWith("”")) {
        return segment;
      }
      return replacements.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), segment);
    })
    .join("");
}

export function ageFromNow(value: string): string {
  const deltaMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(deltaMs / 60000));
  if (minutes < 60) {
    return `${minutes} phút trước`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 48) {
    return `${hours} giờ trước`;
  }
  return `${Math.round(hours / 24)} ngày trước`;
}
