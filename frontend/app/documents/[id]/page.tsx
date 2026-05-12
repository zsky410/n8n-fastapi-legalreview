"use client";

import { Download, RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { API_URL, DocumentDetail, fetchDocument, getStoredToken } from "@/lib/api";
import {
  formatBytes,
  formatDateTime,
  formatPercent,
  formatShortDate,
  humanAiSummary,
  humanRiskSnippet,
  humanRiskSuggestion,
  humanStatus,
} from "@/lib/format";
import { EmptyState, FieldValue, FlagList, PageError, RiskBadge, StatusBadge } from "@/components/ui";

const tabs = ["Overview", "Summary", "Classification", "Risks"] as const;
type DetailTab = (typeof tabs)[number];
const tabLabels: Record<DetailTab, string> = {
  Overview: "Tổng quan",
  Summary: "Tóm tắt",
  Classification: "Phân loại",
  Risks: "Rủi ro",
};

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const documentId = params.id;
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("Overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocument = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchDocument(documentId);
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

  useEffect(() => {
    if (!document || !["pending", "processing"].includes(document.review_status)) {
      return;
    }
    const timer = window.setInterval(() => {
      void loadDocument();
    }, 2500);
    return () => window.clearInterval(timer);
  }, [document, loadDocument]);

  const downloadUrl = useMemo(() => `${API_URL}/api/v1/documents/${documentId}/download`, [documentId]);

  async function openDownload() {
    const token = getStoredToken();
    if (!token) {
      setError("Phiên đăng nhập đã hết hạn");
      return;
    }
    try {
      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Tải xuống thất bại");
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = document?.filename ?? "tai-lieu";
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tải xuống thất bại");
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Chi tiết tài liệu</p>
          <h1>{document?.filename ?? "Tài liệu"}</h1>
        </div>
        <div className="header-actions">
          <button className="secondary-button" type="button" onClick={loadDocument} disabled={isLoading}>
            <RefreshCw size={16} aria-hidden="true" />
            <span>Làm mới</span>
          </button>
          <button className="secondary-button" type="button" onClick={openDownload}>
            <Download size={16} aria-hidden="true" />
            <span>Tải xuống</span>
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
            <FieldValue label="Điểm rủi ro" value={<RiskBadge score={document.risk_score} />} />
            <FieldValue label="Phân loại" value={document.classification ? humanStatus(document.classification) : "Chưa phân loại"} />
            <FieldValue label="Độ tin cậy AI" value={formatPercent(document.ai_confidence)} />
            <FieldValue label="Đã xử lý" value={formatDateTime(document.processed_at)} />
          </section>

          <div className="tab-strip">
            {tabs.map((tab) => (
              <button
                className={activeTab === tab ? "tab-button active" : "tab-button"}
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>

          <section className="data-panel detail-panel">
            {activeTab === "Overview" ? (
              <div className="detail-grid">
                <FieldValue label="Tên file" value={document.filename} />
                <FieldValue label="Dung lượng" value={formatBytes(document.size_bytes)} />
                <FieldValue label="MIME" value={document.mime} />
                <FieldValue label="Đã tải lên" value={formatDateTime(document.uploaded_at)} />
                <FieldValue label="Đã xử lý" value={formatDateTime(document.processed_at)} />
                <FieldValue label="Ngày hết hạn" value={formatShortDate(document.expiry_date)} />
              </div>
            ) : null}

            {activeTab === "Summary" ? (
              <article className="copy-panel">
                <p>{humanAiSummary(document.summary) ?? "Tóm tắt sẽ hiển thị sau khi xử lý hoàn tất."}</p>
              </article>
            ) : null}

            {activeTab === "Classification" ? (
              <div className="detail-grid">
                <FieldValue label="Loại" value={document.classification ? humanStatus(document.classification) : "Chưa rõ"} />
                <FieldValue label="Độ tin cậy" value={formatPercent(document.classification_confidence)} />
                <FieldValue label="Xử lý" value={humanStatus(document.processing_status)} />
                <FieldValue label="Cờ rủi ro" value={<FlagList flags={document.flag_reasons} />} />
              </div>
            ) : null}

            {activeTab === "Risks" ? (
              document.risk_findings.length ? (
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
                <EmptyState title="Không có phát hiện rủi ro">Tài liệu này không kích hoạt quy tắc rủi ro nào.</EmptyState>
              )
            ) : null}
          </section>
        </>
      ) : null}
    </section>
  );
}
