const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function toDate(value) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function formatDate(value) {
  const parsedDate = toDate(value);
  return parsedDate ? dateFormatter.format(parsedDate) : value || "Chưa cập nhật";
}

export function formatDateTime(value) {
  const parsedDate = toDate(value);

  if (!parsedDate) {
    return value || "Chưa cập nhật";
  }

  return dateTimeFormatter.format(parsedDate).replace(",", " ·");
}

export function formatConfidence(value) {
  if (typeof value !== "number") {
    return "Chưa có";
  }

  return `${Math.round(value * 100)}%`;
}

export function formatPriorityLabel(value) {
  if (value === "high") {
    return "Cao";
  }

  if (value === "low") {
    return "Thấp";
  }

  return "Trung bình";
}

export function formatRoleLabel(value) {
  if (value === "admin") {
    return "Quản trị";
  }

  if (value === "client") {
    return "Khách hàng";
  }

  return value || "Chưa phân loại";
}

export function formatRiskLevelLabel(value) {
  if (value === "high" || value === "High") {
    return "Cao";
  }

  if (value === "low" || value === "Low") {
    return "Thấp";
  }

  return "Trung bình";
}

export function formatReviewAction(value) {
  if (value === "auto_publish") {
    return "Có thể công bố tự động";
  }

  if (value === "publish_with_warning") {
    return "Công bố kèm cảnh báo";
  }

  if (value === "manual_review_recommended") {
    return "Nên rà soát thủ công";
  }

  if (value === "approve") {
    return "Có thể phê duyệt";
  }

  if (value === "review") {
    return "Cần rà soát thêm";
  }

  if (value === "reject") {
    return "Không nên phê duyệt";
  }

  return value || "Chưa có khuyến nghị";
}

export function formatStageLabel(value) {
  if (value === "Uploaded") {
    return "Đã tải lên";
  }

  if (value === "TextExtractOrOCR") {
    return "OCR";
  }

  if (value === "AIAnalyzing") {
    return "Phân tích AI";
  }

  if (value === "AutoPublished") {
    return "Đã công bố";
  }

  if (value === "Finalized") {
    return "Hoàn tất";
  }

  return value || "Chưa cập nhật";
}

export function formatExecutionStatus(value) {
  if (value === "success") {
    return "Thành công";
  }

  if (value === "retry") {
    return "Thử lại";
  }

  if (value === "failed") {
    return "Thất bại";
  }

  if (value === "running") {
    return "Đang chạy";
  }

  if (value === "queued") {
    return "Chờ xử lý";
  }

  return value || "Chưa cập nhật";
}

export function formatWorkflowName(value) {
  if (value === "legal-review-main") {
    return "Rà soát pháp lý chính";
  }

  if (value === "ocr-intensive") {
    return "OCR chuyên sâu";
  }

  return value || "Chưa cập nhật";
}

export function formatWorkflowStepLabel(value) {
  if (value === "intake") {
    return "Tiếp nhận";
  }

  if (value === "ocr") {
    return "OCR";
  }

  if (value === "ai_review") {
    return "Phân tích AI";
  }

  if (value === "routing") {
    return "Định tuyến";
  }

  if (value === "publish") {
    return "Công bố";
  }

  return value || "Chưa cập nhật";
}

export function formatHealthStatus(value) {
  if (value === "healthy") {
    return "Ổn định";
  }

  if (value === "degraded") {
    return "Suy giảm";
  }

  if (value === "unhealthy") {
    return "Sự cố";
  }

  if (value === "connected") {
    return "Kết nối";
  }

  if (value === "unknown") {
    return "Chưa rõ";
  }

  return value || "Chưa cập nhật";
}

export function formatSlaLabel(dueAt) {
  const parsedDate = toDate(dueAt);

  if (!parsedDate) {
    return "Chưa có SLA";
  }

  const diffMinutes = Math.round((parsedDate.getTime() - Date.now()) / (1000 * 60));

  if (diffMinutes <= 0) {
    return "Đã quá hạn";
  }

  if (diffMinutes < 60) {
    return `Còn ${diffMinutes} phút`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (!minutes) {
    return `Còn ${hours} giờ`;
  }

  return `Còn ${hours} giờ ${minutes} phút`;
}
