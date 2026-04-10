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
    return "N/A";
  }

  return `${Math.round(value * 100)}%`;
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
