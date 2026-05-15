"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, RefreshCw, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ClientPortfolio,
  collectObligations,
  daysUntil,
  documentsNeedingAction,
  loadClientPortfolio,
} from "@/lib/client-insights";
import { formatDateTime, formatShortDate, humanStatus } from "@/lib/format";
import { EmptyState, FlagList, PageError, RiskBadge, StatusBadge } from "@/components/ui";

export default function ClientActionsPage() {
  const [portfolio, setPortfolio] = useState<ClientPortfolio>({ documents: [], details: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      setPortfolio(await loadClientPortfolio());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tải việc cần xử lý");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const obligations = useMemo(() => collectObligations(portfolio.details), [portfolio.details]);
  const actionItems = useMemo(() => documentsNeedingAction(portfolio.documents, portfolio.details), [portfolio]);
  const urgentObligations = obligations.filter((item) => ["overdue", "due_soon"].includes(item.urgency) || ["high", "critical"].includes(item.severity));
  const highRiskDocs = portfolio.documents
    .filter((document) => document.risk_score >= 50)
    .sort((left, right) => right.risk_score - left.risk_score);

  return (
    <section className="page-stack client-command-center">
      <header className="client-hero">
        <div>
          <p className="eyebrow">Danh sách ưu tiên</p>
          <h1>Cần xử lý</h1>
          <p>Gom các việc đáng chú ý nhất: tài liệu cần xem lại, mốc sắp đến hạn và hồ sơ có rủi ro cao.</p>
        </div>
        <button className="secondary-button" type="button" onClick={load} disabled={isLoading}>
          <RefreshCw className={isLoading ? "spin-icon" : undefined} size={16} aria-hidden="true" />
          <span>Làm mới</span>
        </button>
      </header>

      {error ? <PageError message={error} onRetry={load} /> : null}

      <section className="client-kpi-grid compact-three">
        <article className="client-kpi-card warning">
          <AlertTriangle size={20} aria-hidden="true" />
          <span>Cần xem lại</span>
          <strong>{actionItems.length}</strong>
          <small>Tài liệu có lỗi, bị từ chối hoặc cần đọc kỹ hơn</small>
        </article>
        <article className="client-kpi-card warning">
          <CalendarClock size={20} aria-hidden="true" />
          <span>Mốc quan trọng</span>
          <strong>{urgentObligations.length}</strong>
          <small>Cam kết hoặc hạn cần chú ý trước</small>
        </article>
        <article className="client-kpi-card danger">
          <ShieldAlert size={20} aria-hidden="true" />
          <span>Rủi ro cao</span>
          <strong>{highRiskDocs.length}</strong>
          <small>Tài liệu có điểm rủi ro từ 50 trở lên</small>
        </article>
      </section>

      <section className="data-panel client-panel action-board-panel">
        <div className="client-panel-heading">
          <span className="client-panel-icon"><AlertTriangle size={17} aria-hidden="true" /></span>
          <div>
            <span>Việc nên làm trước</span>
            <h2>{actionItems.length} tài liệu cần chú ý</h2>
            <p>Ưu tiên các tài liệu có trạng thái chưa ổn, điểm rủi ro cao hoặc có mốc quan trọng liên quan.</p>
          </div>
        </div>
        {isLoading ? (
          <div className="empty-state">Đang tải việc cần xử lý</div>
        ) : actionItems.length ? (
          <div className="action-board-list">
            {actionItems.map((document) => (
              <Link className="action-board-row" href={`/documents/${document.id}`} key={document.id} prefetch={false}>
                <div>
                  <strong>{document.filename}</strong>
                  <span>{document.classification ? humanStatus(document.classification) : "Chưa phân loại"} · cập nhật {formatDateTime(document.processed_at ?? document.uploaded_at)}</span>
                </div>
                <StatusBadge status={document.review_status} />
                <FlagList flags={document.flag_reasons.slice(0, 3)} />
                <RiskBadge score={document.risk_score} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Không có việc cần xử lý" action={<CheckCircle2 size={28} aria-hidden="true" />}>
            Tài liệu hiện không có lỗi, từ chối hoặc rủi ro cao cần bạn can thiệp.
          </EmptyState>
        )}
      </section>

      <section className="client-dashboard-grid">
        <article className="data-panel client-panel spacious">
          <div className="client-panel-heading">
            <span className="client-panel-icon"><CalendarClock size={17} aria-hidden="true" /></span>
            <div>
              <span>Mốc cần nhớ</span>
              <h2>Cam kết và thời hạn</h2>
              <p>Các hạn thanh toán, phản hồi, gia hạn hoặc nghĩa vụ nên được theo dõi sớm.</p>
            </div>
          </div>
          {urgentObligations.length ? (
            <div className="obligation-list single-column">
              {urgentObligations.slice(0, 6).map((obligation) => {
                const days = daysUntil(obligation.due_date);
                return (
                  <Link className={`obligation-card ${obligation.severity}`} href={`/documents/${obligation.document_id}`} key={obligation.id} prefetch={false}>
                    <div className="obligation-card-top">
                      <div className="obligation-icon"><CalendarClock size={18} aria-hidden="true" /></div>
                      <div>
                        <h3>{obligation.title}</h3>
                        <p>{obligation.document_filename}</p>
                      </div>
                    </div>
                    <div className="obligation-meta">
                      <span>{formatShortDate(obligation.due_date)}</span>
                      <span>{days === null ? "Chưa rõ hạn" : days < 0 ? `Quá hạn ${Math.abs(days)} ngày` : `Còn ${days} ngày`}</span>
                      <span>{humanStatus(obligation.severity)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Chưa có mốc gấp">Các cam kết hoặc thời hạn quan trọng sẽ xuất hiện tại đây.</EmptyState>
          )}
        </article>

        <article className="data-panel client-panel spacious">
          <div className="client-panel-heading">
            <span className="client-panel-icon"><ShieldAlert size={17} aria-hidden="true" /></span>
            <div>
              <span>Rủi ro cần đọc kỹ</span>
              <h2>Tài liệu nên xem lại</h2>
              <p>Danh sách này giúp bạn biết tài liệu nào nên được ưu tiên đọc trước.</p>
            </div>
          </div>
          {highRiskDocs.length ? (
            <div className="risk-document-list">
              {highRiskDocs.slice(0, 8).map((document) => (
                <Link className="risk-document-row" href={`/documents/${document.id}`} key={document.id} prefetch={false}>
                  <div>
                    <strong>{document.filename}</strong>
                    <span>{document.classification ? humanStatus(document.classification) : "Chưa phân loại"}</span>
                  </div>
                  <RiskBadge score={document.risk_score} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Chưa có tài liệu rủi ro cao">Các tài liệu hiện đều dưới ngưỡng ưu tiên.</EmptyState>
          )}
        </article>
      </section>
    </section>
  );
}
