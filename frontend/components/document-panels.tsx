"use client";

import { AlertTriangle, CalendarClock, Clipboard, FileSearch, Loader2 } from "lucide-react";
import { useState } from "react";

import type { LegalObligation } from "@/lib/api";
import { formatBytes, formatShortDate, humanStatus } from "@/lib/format";

type ExtractedTextPanelProps = {
  text: string | null;
  processingStatus?: string | null;
  reviewStatus?: string | null;
};

type SummaryPanelProps = {
  summary: string | null;
  fallback: string;
};

type LegalObligationsPanelProps = {
  obligations: LegalObligation[];
  title?: string;
  emptyCopy?: string;
};

export function SummaryPanel({ summary, fallback }: SummaryPanelProps) {
  const paragraphs = (summary ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    return (
      <article className="copy-panel">
        <p>{fallback}</p>
      </article>
    );
  }

  return (
    <article className="copy-panel rich-copy">
      {paragraphs.map((paragraph, index) => (
        <p key={`${paragraph.slice(0, 24)}-${index}`}>{paragraph}</p>
      ))}
    </article>
  );
}

export function ExtractedTextPanel({ text, processingStatus, reviewStatus }: ExtractedTextPanelProps) {
  const [copyState, setCopyState] = useState<"idle" | "done">("idle");
  const extractedText = text?.trim() ?? "";
  const wordCount = extractedText ? extractedText.split(/\s+/).filter(Boolean).length : 0;

  async function copyText() {
    if (!extractedText) {
      return;
    }
    await navigator.clipboard.writeText(extractedText);
    setCopyState("done");
    window.setTimeout(() => setCopyState("idle"), 1800);
  }

  if (!extractedText) {
    if (!isExtractionTerminal(processingStatus, reviewStatus)) {
      return (
        <div className="extraction-pending" aria-live="polite">
          <Loader2 className="spin-icon" size={24} aria-hidden="true" />
          <div>
            <strong>{processingStatus === "ai_reviewing" || reviewStatus === "processing" ? "Đang rà soát văn bản" : "Đang trích xuất văn bản"}</strong>
            <p>Hệ thống vẫn đang đọc file và tự động cập nhật nội dung khi bước này hoàn tất.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="extraction-empty">
        <FileSearch size={28} aria-hidden="true" />
        <div>
          <strong>Chưa trích xuất được văn bản từ file này</strong>
          <p>
            File có thể là PDF scan/ảnh hoặc nội dung không có lớp văn bản. Hãy thử bản PDF có lớp văn bản, DOCX,
            hoặc chạy OCR rồi tải lại để kết quả rà soát đầy đủ hơn.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="extracted-text-panel">
      <div className="text-toolbar">
        <div className="text-metrics">
          <span>{wordCount.toLocaleString("vi-VN")} từ</span>
          <span>{formatBytes(new Blob([extractedText]).size)}</span>
        </div>
        <button className="secondary-button compact" type="button" onClick={copyText}>
          <Clipboard size={15} aria-hidden="true" />
          <span>{copyState === "done" ? "Đã sao chép" : "Sao chép"}</span>
        </button>
      </div>
      <pre className="extracted-text-box">{extractedText}</pre>
    </div>
  );
}

export function LegalObligationsPanel({
  obligations,
  title = "Cam kết & mốc cần theo dõi",
  emptyCopy = "Chưa phát hiện cam kết, hạn chót hoặc mốc theo dõi rõ ràng trong tài liệu này.",
}: LegalObligationsPanelProps) {
  const sortedObligations = [...obligations].sort((left, right) => {
    const leftDate = left.due_date ? new Date(left.due_date).getTime() : Number.POSITIVE_INFINITY;
    const rightDate = right.due_date ? new Date(right.due_date).getTime() : Number.POSITIVE_INFINITY;
    return leftDate - rightDate;
  });
  const highPriority = sortedObligations.filter((item) => ["high", "critical"].includes(item.severity)).length;

  return (
    <section className="obligation-panel" aria-label={title}>
      <div className="obligation-heading">
        <div>
          <p className="eyebrow">Theo dõi cam kết</p>
          <h2>{title}</h2>
          <span>
            Các cam kết, hạn chót và việc cần xử lý sẽ được ghi lại để bạn dễ theo dõi.
          </span>
        </div>
        <div className="obligation-counter">
          <strong>{sortedObligations.length}</strong>
          <span>{highPriority ? `${highPriority} mục ưu tiên cao` : "mục theo dõi"}</span>
        </div>
      </div>

      {sortedObligations.length ? (
        <div className="obligation-list">
          {sortedObligations.map((obligation) => (
            <article className={`obligation-card ${obligation.severity}`} key={obligation.id}>
              <div className="obligation-card-top">
                <div className="obligation-icon" aria-hidden="true">
                  {["high", "critical"].includes(obligation.severity) ? <AlertTriangle size={18} /> : <CalendarClock size={18} />}
                </div>
                <div>
                  <h3>{obligation.title}</h3>
                  <p>{obligation.responsible_party ? `Bên phụ trách: ${obligation.responsible_party}` : "Chưa xác định rõ bên phụ trách"}</p>
                </div>
              </div>

              <div className="obligation-meta">
                <span>{formatShortDate(obligation.due_date)}</span>
                <span>{humanStatus(obligation.urgency)}</span>
                <span>{humanStatus(obligation.severity)}</span>
              </div>

              {obligation.consequence ? (
                <p className="obligation-copy">
                  <strong>Rủi ro nếu bỏ sót:</strong> {obligation.consequence}
                </p>
              ) : null}
              {obligation.recommended_action ? (
                <p className="obligation-copy">
                  <strong>Việc nên làm:</strong> {obligation.recommended_action}
                </p>
              ) : null}
              {obligation.source_excerpt ? <blockquote>{obligation.source_excerpt}</blockquote> : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="obligation-empty">
          <CalendarClock size={24} aria-hidden="true" />
          <p>{emptyCopy}</p>
        </div>
      )}
    </section>
  );
}

function isExtractionTerminal(processingStatus?: string | null, reviewStatus?: string | null): boolean {
  const terminalReviewStatuses = [
    "ai_approved",
    "needs_reviewer",
    "pending_admin",
    "reviewer_approved",
    "reviewer_rejected",
    "admin_approved",
    "admin_rejected",
    "failed",
  ];
  return processingStatus === "completed" || processingStatus === "failed" || terminalReviewStatuses.includes(reviewStatus ?? "");
}
