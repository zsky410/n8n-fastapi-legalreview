"use client";

import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

import {
  AdminDocumentDetail,
  fetchAdminDocument,
  submitAdminDecision,
} from "@/lib/api";
import {
  formatBytes,
  formatDateTime,
  formatPercent,
  humanAiSummary,
  humanRiskSnippet,
  humanRiskSuggestion,
  humanStatus,
} from "@/lib/format";
import { EmptyState, FieldValue, FlagList, PageError, RiskBadge, StatusBadge } from "@/components/ui";

export default function AdminDocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const documentId = params.id;
  const [document, setDocument] = useState<AdminDocumentDetail | null>(null);
  const [comment, setComment] = useState("");
  const [decision, setDecision] = useState<"approve" | "reject">("approve");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocument = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchAdminDocument(documentId);
      setDocument(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tải tài liệu");
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    void loadDocument();
  }, [loadDocument]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await submitAdminDecision(documentId, { decision, comment });
      setComment("");
      await loadDocument();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể lưu quyết định");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Tài liệu cần duyệt</p>
          <h1>{document?.filename ?? "Rà soát tài liệu"}</h1>
        </div>
        <div className="header-actions">
          <button className="secondary-button" type="button" onClick={loadDocument} disabled={isLoading}>
            <RefreshCw size={16} aria-hidden="true" />
            <span>Làm mới</span>
          </button>
          {document ? <StatusBadge status={document.review_status} /> : null}
        </div>
      </header>

      {error ? <PageError message={error} onRetry={loadDocument} /> : null}

      {isLoading && !document ? (
        <section className="data-panel">
          <div className="empty-state">Đang tải tài liệu</div>
        </section>
      ) : document ? (
        <>
          <section className="detail-hero">
            <FieldValue label="Người gửi" value={document.owner_email} />
            <FieldValue label="Điểm rủi ro" value={<RiskBadge score={document.risk_score} />} />
            <FieldValue label="Phân loại" value={document.classification ? humanStatus(document.classification) : "Chưa rõ"} />
            <FieldValue label="Độ tin cậy AI" value={formatPercent(document.ai_confidence)} />
          </section>

          <section className="admin-detail-grid">
            <section className="data-panel detail-panel">
              <h2>Thông tin tài liệu</h2>
              <div className="detail-grid">
                <FieldValue label="Tên file" value={document.filename} />
                <FieldValue label="Dung lượng" value={formatBytes(document.size_bytes)} />
                <FieldValue label="MIME" value={document.mime} />
                <FieldValue label="Đã tải lên" value={formatDateTime(document.uploaded_at)} />
                <FieldValue label="Đã xử lý" value={formatDateTime(document.processed_at)} />
                <FieldValue label="SHA-256" value={<span className="hash-text">{document.sha256}</span>} />
              </div>
            </section>

            <section className="data-panel detail-panel">
              <h2>Biểu mẫu quyết định</h2>
              {document.review_status === "pending_admin" ? (
                <form className="decision-form" onSubmit={handleSubmit}>
                  <div className="segmented-control" aria-label="Quyết định">
                    <button
                      className={decision === "approve" ? "active" : ""}
                      type="button"
                      onClick={() => setDecision("approve")}
                    >
                      <CheckCircle2 size={16} aria-hidden="true" />
                      Duyệt
                    </button>
                    <button
                      className={decision === "reject" ? "active danger" : "danger"}
                      type="button"
                      onClick={() => setDecision("reject")}
                    >
                      <XCircle size={16} aria-hidden="true" />
                      Từ chối
                    </button>
                  </div>
                  <label>
                    Ghi chú của người rà soát
                    <textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      minLength={3}
                      maxLength={2000}
                      required
                    />
                  </label>
                  <button className="primary-button" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Đang lưu" : "Gửi quyết định"}
                  </button>
                </form>
              ) : (
                <EmptyState title="Đã có quyết định">Tài liệu này không còn chờ admin duyệt.</EmptyState>
              )}
            </section>
          </section>

          <section className="data-panel detail-panel">
            <h2>Quyết định AI</h2>
            <article className="copy-panel">
              <p>{humanAiSummary(document.summary) ?? "Chưa có tóm tắt AI."}</p>
            </article>
            <div className="detail-grid compact-grid">
              <FieldValue label="Trạng thái rà soát" value={humanStatus(document.review_status)} />
              <FieldValue label="Xử lý" value={humanStatus(document.processing_status)} />
              <FieldValue label="Độ tin cậy phân loại" value={formatPercent(document.classification_confidence)} />
              <FieldValue label="Độ tin cậy AI" value={formatPercent(document.ai_confidence)} />
            </div>
          </section>

          <section className="data-panel detail-panel">
            <h2>Lý do bị gắn cờ</h2>
            <FlagList flags={document.flag_reasons} />
          </section>

          <section className="data-panel detail-panel">
            <h2>Phát hiện rủi ro</h2>
            {document.risk_findings.length ? (
              <div className="finding-list">
                {document.risk_findings.map((finding) => {
                  const suggestion = humanRiskSuggestion(finding.rule_code, finding.suggestion);
                  return (
                    <article className="finding-row" key={finding.id}>
                      <div>
                        <strong>{humanStatus(finding.rule_code)}</strong>
                        <span>{humanStatus(finding.severity)}</span>
                      </div>
                      <p>{humanRiskSnippet(finding.rule_code, finding.snippet)}</p>
                      {suggestion ? <small>{suggestion}</small> : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="Không có phát hiện">Không có quy tắc rủi ro nào được kích hoạt.</EmptyState>
            )}
          </section>

          <section className="data-panel detail-panel">
            <h2>Dòng thời gian audit</h2>
            {document.audit_logs.length ? (
              <div className="timeline-list">
                {document.audit_logs.map((log) => (
                  <div className="timeline-item" key={log.id}>
                    <strong>{humanStatus(log.action)}</strong>
                    <span>{log.actor_email ?? "Hệ thống"} · {formatDateTime(log.created_at)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Chưa có dòng thời gian audit">Tài liệu này chưa có sự kiện audit.</EmptyState>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}
