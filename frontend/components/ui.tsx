import { AlertCircle, FileText } from "lucide-react";
import { ReactNode } from "react";

import { humanStatus } from "@/lib/format";

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "ai_approved" || status === "admin_approved" || status === "reviewer_approved"
      ? "success"
      : status === "needs_reviewer" || status === "pending_admin" || status === "processing" || status === "pending"
        ? "warning"
        : status === "reviewer_rejected" || status === "admin_rejected" || status === "failed"
          ? "danger"
          : "neutral";

  return <span className={`status-pill ${tone}`}>{humanStatus(status)}</span>;
}

export function RiskBadge({ score }: { score: number }) {
  const tone = score >= 80 ? "danger" : score >= 50 ? "warning" : "success";
  return <span className={`status-pill ${tone}`}>{score}</span>;
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state rich">
      <FileText size={28} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
      {action}
    </div>
  );
}

export function PageError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="notice-panel danger">
      <AlertCircle size={18} aria-hidden="true" />
      <span>{message}</span>
      {onRetry ? (
        <button className="text-button" type="button" onClick={onRetry}>
          Thử lại
        </button>
      ) : null}
    </div>
  );
}

export function FieldValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="field-value">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function FlagList({ flags }: { flags: string[] }) {
  if (!flags.length) {
    return <span className="muted-text">Không có cờ rủi ro</span>;
  }

  return (
    <div className="flag-list">
      {flags.map((flag) => (
        <span key={flag}>{humanStatus(flag)}</span>
      ))}
    </div>
  );
}
