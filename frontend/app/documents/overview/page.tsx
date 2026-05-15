"use client";

import { AlertTriangle, CalendarClock, FileText, Gavel, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ClientPortfolio, averageRisk, buildClientNotifications, collectObligations, documentsNeedingAction, loadClientPortfolio, riskDistribution, topFlags } from "@/lib/client-insights";
import { formatDateTime, humanStatus } from "@/lib/format";
import { EmptyState, PageError, RiskBadge, StatusBadge } from "@/components/ui";

export default function ClientOverviewPage() {
  const [portfolio, setPortfolio] = useState<ClientPortfolio>({ documents: [], details: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      setPortfolio(await loadClientPortfolio());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tải tổng quan khách hàng");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const obligations = useMemo(() => collectObligations(portfolio.details), [portfolio.details]);
  const actionItems = useMemo(() => documentsNeedingAction(portfolio.documents, portfolio.details), [portfolio]);
  const flags = useMemo(() => topFlags(portfolio.documents, 4), [portfolio.documents]);
  const risk = useMemo(() => riskDistribution(portfolio.documents), [portfolio.documents]);
  const notifications = useMemo(() => buildClientNotifications(portfolio).slice(0, 5), [portfolio]);
  const dueSoon = obligations.filter((item) => ["overdue", "due_soon"].includes(item.urgency)).length;

  return (
    <section className="page-stack client-command-center">
      <header className="client-hero">
        <div>
          <p className="eyebrow">Không gian pháp lý</p>
          <h1>Tổng quan pháp lý</h1>
          <p>Theo dõi tài liệu, rủi ro, mốc hạn và việc cần làm trong một màn hình gọn gàng.</p>
        </div>
        <button className="secondary-button" type="button" onClick={load} disabled={isLoading}>
          <RefreshCw className={isLoading ? "spin-icon" : undefined} size={16} aria-hidden="true" />
          <span>Làm mới</span>
        </button>
      </header>

      {error ? <PageError message={error} onRetry={load} /> : null}

      <section className="client-kpi-grid">
        <KpiCard icon={FileText} label="Tài liệu" value={portfolio.documents.length} hint="Hồ sơ đã tải lên" />
        <KpiCard icon={AlertTriangle} label="Cần xử lý" value={actionItems.length} hint="Rủi ro, lỗi hoặc mốc gấp" tone="warning" />
        <KpiCard icon={CalendarClock} label="Mốc cần theo dõi" value={dueSoon} hint={`${obligations.length} cam kết/mốc hạn đã ghi nhận`} tone="warning" />
        <KpiCard icon={ShieldCheck} label="Rủi ro trung bình" value={averageRisk(portfolio.documents)} hint={`${risk.high} hồ sơ rủi ro cao`} tone={risk.high ? "danger" : "success"} />
      </section>

      <section className="client-dashboard-grid">
        <article className="data-panel client-panel spacious">
          <PanelHeading icon={Gavel} kicker="Điểm cần lưu ý" title="Rủi ro nổi bật" copy="Những vấn đề xuất hiện nhiều nhất trong các tài liệu của bạn." />
          {flags.length ? (
            <div className="client-bar-list">
              {flags.map((flag) => (
                <div className="client-bar-row" key={flag.label}>
                  <div>
                    <strong>{humanStatus(flag.label)}</strong>
                    <span>{flag.count} tài liệu</span>
                  </div>
                  <div className="client-bar-track"><span style={{ width: `${(flag.count / Math.max(flags[0].count, 1)) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Chưa có rủi ro nổi bật">Khi tài liệu được rà soát, các vấn đề thường gặp sẽ xuất hiện ở đây.</EmptyState>
          )}
        </article>

        <article className="data-panel client-panel spacious">
          <PanelHeading icon={Sparkles} kicker="Cập nhật gần đây" title="Tin mới trong hồ sơ" copy="Những thay đổi quan trọng về tài liệu, trạng thái xử lý và mốc cần theo dõi." />
          {notifications.length ? (
            <div className="client-feed-list">
              {notifications.map((notification) => (
                <Link className={`client-feed-item ${notification.tone}`} href={notification.href} key={notification.id} prefetch={false}>
                  <span />
                  <div>
                    <strong>{notification.title}</strong>
                    <small>{notification.copy}</small>
                  </div>
                  <time>{formatDateTime(notification.created_at)}</time>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Chưa có cập nhật">Tải tài liệu đầu tiên để xem các thay đổi quan trọng tại đây.</EmptyState>
          )}
        </article>
      </section>

      <section className="data-panel client-panel">
        <PanelHeading icon={AlertTriangle} kicker="Ưu tiên hôm nay" title="Việc cần xử lý nhanh" copy="Các tài liệu nên xem trước vì có lỗi, rủi ro cao hoặc mốc quan trọng đang đến gần." />
        {isLoading ? (
          <div className="empty-state">Đang tải tổng quan</div>
        ) : actionItems.length ? (
          <div className="client-action-strip">
            {actionItems.slice(0, 4).map((document) => (
              <Link className="client-action-card" href={`/documents/${document.id}`} key={document.id} prefetch={false}>
                <strong>{document.filename}</strong>
                <span>{document.classification ? humanStatus(document.classification) : "Chưa phân loại"}</span>
                <div>
                  <StatusBadge status={document.review_status} />
                  <RiskBadge score={document.risk_score} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Không có việc gấp">Các tài liệu hiện chưa có trạng thái cần khách hàng xử lý ngay.</EmptyState>
        )}
      </section>
    </section>
  );
}

function KpiCard({ icon: Icon, label, value, hint, tone = "neutral" }: { icon: typeof FileText; label: string; value: number; hint: string; tone?: "success" | "warning" | "danger" | "neutral" }) {
  return (
    <article className={`client-kpi-card ${tone}`}>
      <Icon size={20} aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
}

function PanelHeading({ icon: Icon, kicker, title, copy }: { icon: typeof FileText; kicker: string; title: string; copy: string }) {
  return (
    <div className="client-panel-heading">
      <span className="client-panel-icon"><Icon size={17} aria-hidden="true" /></span>
      <div>
        <span>{kicker}</span>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
    </div>
  );
}
