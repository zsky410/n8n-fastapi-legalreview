"use client";

import { Download, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { API_URL, DocumentDetail, RiskFinding, fetchDocument, getStoredToken, startAiReview } from "@/lib/api";
import { ExtractedTextPanel } from "@/components/document-panels";
import {
  formatDateTime,
  formatPercent,
  humanRiskSnippet,
  humanRiskSuggestion,
  humanStatus,
} from "@/lib/format";
import { AiFormattedSummary } from "@/components/ai-formatted-summary";
import { EmptyState, FieldValue, FlagList, PageError, RiskBadge, StatusBadge } from "@/components/ui";

const tabs = ["Overview", "Risks"] as const;
type DetailTab = (typeof tabs)[number];
const tabLabels: Record<DetailTab, string> = {
  Overview: "Tổng quan",
  Risks: "Rủi ro",
};

const workflowStepLabels = ["Tải lên", "Trích xuất", "AI review", "Hoàn tất"] as const;

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const documentId = params.id;
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("Overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReReviewing, setIsReReviewing] = useState(false);

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
    const activeStatuses = ["pending_extraction", "extracting", "ai_reviewing"];
    if (
      !document ||
      (!activeStatuses.includes(document.processing_status) && !["awaiting_extraction", "processing"].includes(document.review_status))
    ) {
      return;
    }
    const pollMs = document.processing_status === "ai_reviewing" || document.review_status === "processing" ? 850 : 2000;
    const timer = window.setInterval(() => {
      void loadDocument();
    }, pollMs);
    return () => window.clearInterval(timer);
  }, [document, loadDocument]);

  const canReReview = useMemo(() => {
    if (!document) return false;
    const blockedProcessing = ["pending_extraction", "extracting", "ai_reviewing"];
    const blockedReview = ["awaiting_extraction", "processing"];
    if (blockedProcessing.includes(document.processing_status)) return false;
    if (blockedReview.includes(document.review_status)) return false;
    if (!document.extracted_text || !document.extracted_text.trim()) return false;
    return true;
  }, [document]);

  const handleReReview = useCallback(async () => {
    if (!document || !canReReview) return;
    setError(null);
    setIsReReviewing(true);
    try {
      await startAiReview(document.id);
      await loadDocument();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể chạy lại AI review");
    } finally {
      setIsReReviewing(false);
    }
  }, [canReReview, document, loadDocument]);

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
          <button
            className="secondary-button"
            type="button"
            onClick={handleReReview}
            disabled={!canReReview || isReReviewing}
            title="Chạy lại AI review với prompt và cấu hình hiện tại"
          >
            {isReReviewing ? (
              <Loader2 size={16} aria-hidden="true" className="spin-icon" />
            ) : (
              <Sparkles size={16} aria-hidden="true" />
            )}
            <span>{isReReviewing ? "Đang xếp hàng..." : "Review lại bằng AI"}</span>
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
            <FieldValue label="Quy trình" value={humanStatus(document.processing_status)} />
          </section>

          <section className="workflow-panel">
            <div className="workflow-copy">
              <span>Quy trình xử lý</span>
              <strong>{workflowTitle(document)}</strong>
              <p>{workflowDescription(document)}</p>
            </div>
            <ol className="workflow-steps" aria-label="Các bước xử lý tài liệu">
              {workflowStepLabels.map((label, index) => (
                <li className="workflow-step-item" key={label}>
                  <span className={`workflow-step-pill ${workflowStepClass(document, index + 1)}`}>{label}</span>
                  {index < workflowStepLabels.length - 1 ? (
                    <span className="workflow-step-arrow" aria-hidden="true">
                      →
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
            {isWorkflowLive(document) ? <LiveProcessingLog document={document} /> : null}
          </section>

          {document.processing_status === "completed" ? (
            <AIResultPanel document={document} />
          ) : null}

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
              <>
                <div className="detail-grid compact-user-meta">
                  <FieldValue label="Tên file" value={document.filename} />
                  <FieldValue label="Phân loại" value={document.classification ? humanStatus(document.classification) : "Chưa rõ"} />
                  <FieldValue label="Đã xử lý" value={formatDateTime(document.processed_at)} />
                </div>
                <section className="overview-text" aria-label="Văn bản trích xuất">
                  <h2>Văn bản trích xuất</h2>
                  <ExtractedTextPanel
                    text={document.extracted_text}
                    processingStatus={document.processing_status}
                    reviewStatus={document.review_status}
                  />
                </section>
              </>
            ) : null}

            {activeTab === "Risks" ? (
              <RiskExplanationPanel document={document} />
            ) : null}
          </section>
        </>
      ) : null}
    </section>
  );
}

function isWorkflowLive(document: DocumentDetail): boolean {
  return (
    document.processing_status === "pending_extraction" ||
    document.processing_status === "extracting" ||
    document.processing_status === "ai_reviewing" ||
    document.review_status === "awaiting_extraction" ||
    document.review_status === "processing"
  );
}

function LiveProcessingLog({ document }: { document: DocumentDetail }) {
  const showThinking =
    document.processing_status === "ai_reviewing" || document.review_status === "processing";
  const thinkingText = (document.ai_thinking_log ?? "").trim();

  return (
    <div className="live-log-stack">
      <div className="live-log" aria-live="polite">
        <Loader2 className="spin-icon" size={18} aria-hidden="true" />
        <div>
          <strong>
            {document.processing_status === "ai_reviewing" || document.review_status === "processing"
              ? "AI đang phân tích"
              : "Đang trích xuất văn bản"}
          </strong>
          <span>
            Hệ thống đang tự động đọc file, phân loại và tính điểm rủi ro. Kết quả sẽ tự cập nhật khi hoàn tất.
          </span>
        </div>
      </div>
      {showThinking ? (
        <div className="ai-thinking-log" aria-live="polite" aria-label="Nhật ký suy luận AI">
          <div className="ai-thinking-log-header">
            <span className="eyebrow">Luồng suy luận (stream)</span>
            <span className="ai-thinking-hint">Cập nhật theo thời gian thực từ LLM</span>
          </div>
          <pre className="ai-thinking-log-body">
            {thinkingText || "Đang chờ token đầu tiên từ model…"}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

function AIResultPanel({ document }: { document: DocumentDetail }) {
  return (
    <section className="ai-result-panel" aria-label="Kết quả phân tích AI">
      <div className="ai-result-header">
        <div>
          <p className="eyebrow">Phân tích pháp lý (AI)</p>
          <h2>{resultTitle(document)}</h2>
          <p className="ai-result-meta-line">{aiResultMetaLine(document)}</p>
          <p className="ai-result-context">{resultDescription(document)}</p>
        </div>
        <div className="result-score">
          <span>Risk score</span>
          <strong>{document.risk_score}</strong>
        </div>
      </div>

      <div className="ai-analysis-primary">
        <div className="ai-analysis-primary-label">Trọng tâm review rủi ro</div>
        <AiFormattedSummary text={document.summary} />
      </div>
    </section>
  );
}

function aiResultMetaLine(document: DocumentDetail): string {
  const type = document.classification ? humanStatus(document.classification) : "Chưa rõ";
  const status = humanStatus(document.review_status);
  return `Trạng thái: ${status} · Phân loại: ${type} · Risk score: ${document.risk_score}`;
}

function RiskExplanationPanel({ document }: { document: DocumentDetail }) {
  return (
    <div className="risk-explanation">
      <div className="risk-explanation-header">
        <div>
          <h2>{riskPanelTitle(document)}</h2>
          <p>{riskScoreExplanation(document)}</p>
        </div>
        <FlagList flags={document.flag_reasons} />
      </div>

      {document.risk_findings.length ? (
        <>
          <div className="risk-insight-grid">
            <article>
              <span>Mức rủi ro</span>
              <strong>{riskLevelLabel(document.risk_score)}</strong>
              <p>{riskLevelDescription(document)}</p>
            </article>
            <article>
              <span>Kết quả tự động</span>
              <strong>{humanStatus(document.review_status)}</strong>
              <p>{automationExplanation(document)}</p>
            </article>
          </div>
          <div className="finding-list">
            {document.risk_findings.map((finding) => {
              const suggestion = humanRiskSuggestion(finding.rule_code, finding.suggestion);
              return (
                <article className="finding-row detailed" key={finding.id}>
                  <div>
                    <strong>{humanStatus(finding.rule_code)}</strong>
                    <span>{humanStatus(finding.severity)}</span>
                  </div>
                  <dl>
                    <dt>AI phát hiện gì</dt>
                    <dd>{humanRiskSnippet(finding.rule_code, finding.snippet)}</dd>
                    <dt>Mức ảnh hưởng</dt>
                    <dd>{riskImpactText(finding)}</dd>
                    <dt>Cách hệ thống xử lý</dt>
                    <dd>{riskAutomationText(document, finding)}</dd>
                    {suggestion ? (
                      <>
                        <dt>Gợi ý cho người dùng</dt>
                        <dd>{userFacingSuggestion(document, finding, suggestion)}</dd>
                      </>
                    ) : null}
                  </dl>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <EmptyState title="Không có phát hiện rủi ro">Tài liệu này không kích hoạt quy tắc rủi ro nào.</EmptyState>
      )}
    </div>
  );
}

function workflowTitle(document: DocumentDetail): string {
  if (document.review_status === "awaiting_ai_review") {
    return "Đã trích xuất văn bản, đang vào bước AI review tự động";
  }
  if (document.processing_status === "pending_extraction" || document.processing_status === "extracting") {
    return "Đang trích xuất văn bản từ file";
  }
  if (document.processing_status === "ai_reviewing" || document.review_status === "processing") {
    return "AI đang đánh giá và gắn cờ rủi ro";
  }
  if (document.processing_status === "failed") {
    return "Quy trình xử lý thất bại";
  }
  if (document.processing_status === "completed") {
    return "AI review đã hoàn tất";
  }
  return humanStatus(document.processing_status);
}

function workflowDescription(document: DocumentDetail): string {
  if (document.review_status === "awaiting_ai_review") {
    return "Hệ thống đã trích xuất xong và tự động chuyển sang AI review, không cần thao tác tay thêm.";
  }
  if (document.processing_status === "pending_extraction" || document.processing_status === "extracting") {
    return "Hệ thống đang đọc file. Văn bản trích xuất sẽ hiển thị trong phần Tổng quan khi sẵn sàng.";
  }
  if (document.processing_status === "ai_reviewing" || document.review_status === "processing") {
    return "AI đang đọc văn bản trích xuất, phân loại tài liệu, tính risk score và ghi nhận các finding cần lưu ý.";
  }
  if (document.processing_status === "failed") {
    return "Quá trình xử lý chưa hoàn tất. Hãy thử tải lại file rõ text hơn hoặc dùng định dạng DOCX/PDF text-based.";
  }
  if (document.processing_status === "completed") {
    return "Kết quả AI, phân tích rủi ro và văn bản trích xuất đã sẵn sàng.";
  }
  return "Hệ thống đang xử lý tài liệu.";
}

function workflowStepClass(document: DocumentDetail, step: number): string {
  const currentStep = getWorkflowStep(document);
  if (currentStep > step) {
    return "done";
  }
  if (currentStep === step) {
    return "active";
  }
  return "";
}

function getWorkflowStep(document: DocumentDetail): number {
  if (document.processing_status === "pending_extraction" || document.processing_status === "extracting") {
    return 2;
  }
  if (document.review_status === "awaiting_ai_review") {
    return 3;
  }
  if (document.processing_status === "ai_reviewing" || document.review_status === "processing") {
    return 3;
  }
  if (document.processing_status === "completed") {
    return 4;
  }
  return 1;
}

function resultTitle(document: DocumentDetail): string {
  if (document.review_status === "pending_admin") {
    return "Cần người rà soát trước khi duyệt";
  }
  if (document.review_status === "ai_approved") {
    return "AI chưa thấy rủi ro trọng yếu";
  }
  if (document.review_status === "admin_rejected") {
    return "Admin đã từ chối tài liệu";
  }
  if (document.review_status === "admin_approved") {
    return "Admin đã duyệt tài liệu";
  }
  return humanStatus(document.review_status);
}

function resultDescription(document: DocumentDetail): string {
  if (document.risk_findings.length) {
    const reasons = document.risk_findings.slice(0, 3).map((finding) => humanStatus(finding.rule_code)).join(", ");
    return `AI ghi nhận các điểm cần lưu ý: ${reasons}. Tài liệu chuyển admin khi tổng risk score vượt ngưỡng hoặc có finding nghiêm trọng cần người rà soát.`;
  }
  if (document.flag_reasons.length) {
    return `Tài liệu có cờ: ${document.flag_reasons.map((flag) => humanStatus(flag)).join(", ")}.`;
  }
  return "Không có finding rủi ro cụ thể từ văn bản trích xuất.";
}

function riskScoreExplanation(document: DocumentDetail): string {
  if (document.risk_findings.length) {
    return "Risk score được cộng từ các điểm AI phát hiện trong văn bản. Hệ thống chuyển admin khi tổng điểm vượt ngưỡng hoặc có finding nghiêm trọng.";
  }
  return "Risk score thấp vì chưa có quy tắc rủi ro nào được kích hoạt từ văn bản trích xuất.";
}

function riskPanelTitle(document: DocumentDetail): string {
  if (document.review_status === "pending_admin") {
    return `Risk score ${document.risk_score}: cần admin kiểm tra`;
  }
  return `Risk score ${document.risk_score}: AI tự xử lý`;
}

function riskLevelLabel(score: number): string {
  if (score >= 70) {
    return "Cao";
  }
  if (score >= 40) {
    return "Trung bình";
  }
  if (score > 0) {
    return "Thấp";
  }
  return "Không đáng kể";
}

function riskLevelDescription(document: DocumentDetail): string {
  if (document.risk_score >= 70) {
    return "Điểm đã vượt ngưỡng tự động, nên cần người có quyền duyệt kiểm tra trước.";
  }
  if (document.risk_score >= 40) {
    return "Có một số điều khoản hoặc dữ liệu cần chú ý, nhưng chưa đủ cao để chặn tự động.";
  }
  if (document.risk_score > 0) {
    return "AI chỉ ghi nhận các tín hiệu cần lưu ý, chưa thấy rủi ro trọng yếu.";
  }
  return "AI chưa phát hiện tín hiệu rủi ro từ văn bản đã trích xuất.";
}

function automationExplanation(document: DocumentDetail): string {
  if (document.review_status === "pending_admin") {
    return "Tài liệu được đưa sang hàng chờ admin vì vượt ngưỡng rủi ro hoặc có finding nghiêm trọng cần người rà soát.";
  }
  if (document.review_status === "ai_approved") {
    return "Tài liệu tiếp tục luồng tự động; các finding được lưu để tham khảo, không phải yêu cầu xử lý thủ công.";
  }
  return "Hệ thống đang chờ kết quả xử lý cuối cùng.";
}

function riskImpactText(finding: RiskFinding): string {
  const labels: Record<string, string> = {
    JUDICIAL_DOCUMENT: "Đây là loại tài liệu pháp lý có ngữ cảnh chuyên biệt. AI ghi nhận để tránh dùng nhầm bản án/văn bản tố tụng như hợp đồng thông thường.",
    SENSITIVE_PERSONAL_DATA: "Tài liệu có dữ liệu cá nhân. Rủi ro chính nằm ở việc chia sẻ hoặc lưu hành file ngoài đúng phạm vi.",
    MISSING_SIGNATURE: "Hợp đồng hoặc NDA thiếu dấu hiệu phần ký kết, nên hiệu lực hoặc khả năng thực thi có thể chưa rõ.",
    HIGH_VALUE: "Giá trị tài liệu lớn làm tăng tác động tài chính nếu điều khoản bị sai hoặc thiếu kiểm soát.",
    EXPIRY_SOON: "Tài liệu gần hết hạn, có thể ảnh hưởng đến quyền lợi hoặc nghĩa vụ nếu không gia hạn đúng lúc.",
    NO_TERMINATION_CLAUSE: "Thiếu điều khoản chấm dứt làm giảm khả năng thoát khỏi cam kết khi có tranh chấp hoặc thay đổi nhu cầu.",
    NO_GOVERNING_LAW: "Thiếu luật điều chỉnh hoặc thẩm quyền xử lý tranh chấp làm tăng độ bất định khi phát sinh mâu thuẫn.",
    BROAD_INDEMNITY: "Điều khoản bồi thường rộng có thể khiến nghĩa vụ vượt quá phạm vi mong muốn.",
    AUTO_RENEWAL: "Tự động gia hạn có thể tạo nghĩa vụ tiếp tục nếu không theo dõi thời hạn thông báo.",
    LOW_EXTRACTION_QUALITY: "Văn bản trích xuất yếu làm giảm độ tin cậy của kết quả AI.",
    UNKNOWN_DOC_TYPE: "AI chưa nhận diện rõ loại tài liệu, nên kết luận phân loại có độ chắc chắn thấp.",
    CONFIDENCE_LOW: "Độ tin cậy phân loại thấp khiến kết quả cần được xem như tín hiệu tham khảo.",
  };
  return labels[finding.rule_code] ?? `Mức độ ${humanStatus(finding.severity).toLowerCase()}, cần đọc cùng ngữ cảnh tài liệu.`;
}

function riskAutomationText(document: DocumentDetail, finding: RiskFinding): string {
  if (document.review_status === "pending_admin") {
    return "Finding này góp phần làm tài liệu cần người rà soát trước khi duyệt tự động.";
  }
  if (finding.severity === "critical") {
    return "Finding có mức rất cao; hệ thống sẽ chuyển admin nếu tổng risk score hoặc rule chặn vượt ngưỡng.";
  }
  return "Finding được ghi nhận để minh bạch, nhưng tổng risk score vẫn dưới ngưỡng chuyển admin nên AI tiếp tục duyệt tự động.";
}

function userFacingSuggestion(document: DocumentDetail, finding: RiskFinding, suggestion: string): string {
  if (document.review_status === "ai_approved" && finding.rule_code === "JUDICIAL_DOCUMENT") {
    return "Dùng đúng mục đích tham khảo pháp lý/tố tụng; tránh xem đây là hợp đồng hoặc chứng từ giao dịch.";
  }
  if (document.review_status === "ai_approved" && finding.rule_code === "SENSITIVE_PERSONAL_DATA") {
    return "Chỉ chia sẻ file cho người có quyền xem; cân nhắc che CCCD/số điện thoại/địa chỉ khi gửi ra ngoài.";
  }
  return suggestion;
}
