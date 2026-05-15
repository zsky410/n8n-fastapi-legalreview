"use client";

import { Download, Loader2, RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { API_URL, DocumentDetail, RiskFinding, fetchDocument, getStoredToken } from "@/lib/api";
import { DocumentChatPanel } from "@/components/document-chat-panel";
import { ExtractedTextPanel, LegalObligationsPanel } from "@/components/document-panels";
import {
  formatDateTime,
  formatPercent,
  humanRiskSnippet,
  humanRiskSuggestion,
  humanStatus,
} from "@/lib/format";
import { AiFormattedSummary } from "@/components/ai-formatted-summary";
import { EmptyState, FieldValue, FlagList, PageError, RiskBadge, StatusBadge } from "@/components/ui";

const tabs = ["Overview", "Risks", "Chat"] as const;
type DetailTab = (typeof tabs)[number];
const tabLabels: Record<DetailTab, string> = {
  Overview: "Tổng quan",
  Risks: "Rủi ro",
  Chat: "Hỏi trợ lý",
};

const workflowStepLabels = ["Tải lên", "Trích xuất", "Rà soát", "Hoàn tất"] as const;

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
            <FieldValue label="Độ tin cậy" value={formatPercent(document.ai_confidence)} />
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
            <>
              <AIResultPanel document={document} />
              <LegalObligationsPanel obligations={document.legal_obligations} />
            </>
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

            {activeTab === "Chat" ? (
              <DocumentChatPanel document={document} />
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
  return (
    <div className="live-log-stack">
      <div className="live-log" aria-live="polite">
        <Loader2 className="spin-icon" size={18} aria-hidden="true" />
        <div>
          <strong>
            {document.processing_status === "ai_reviewing" || document.review_status === "processing"
              ? "Đang rà soát"
              : "Đang trích xuất văn bản"}
          </strong>
          <span>
            Hệ thống đang tự động đọc file, phân loại và tính điểm rủi ro. Kết quả sẽ tự cập nhật khi hoàn tất.
          </span>
        </div>
      </div>
    </div>
  );
}

function AIResultPanel({ document }: { document: DocumentDetail }) {
  return (
    <section className="ai-result-panel" aria-label="Kết quả phân tích AI">
      <div className="ai-result-header">
        <div>
          <p className="eyebrow">Phân tích pháp lý</p>
          <h2>{resultTitle(document)}</h2>
          <p className="ai-result-meta-line">{aiResultMetaLine(document)}</p>
        </div>
        <div className="result-score">
          <span>Điểm rủi ro</span>
          <strong>{document.risk_score}</strong>
        </div>
      </div>

      <div className="ai-analysis-primary">
        <div className="ai-analysis-primary-label">Trọng tâm rà soát rủi ro</div>
        <AiFormattedSummary text={document.summary} />
      </div>
    </section>
  );
}

function aiResultMetaLine(document: DocumentDetail): string {
  const type = document.classification ? humanStatus(document.classification) : "Chưa rõ";
  const status = humanStatus(document.review_status);
  return `Trạng thái: ${status} · Phân loại: ${type} · Điểm rủi ro: ${document.risk_score}`;
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
      <RiskScalePanel />

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
                    <dt>Điểm được phát hiện</dt>
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

function RiskScalePanel() {
  return (
    <section className="risk-scale-panel" aria-label="Thang điểm rủi ro">
      <div>
        <span>Thang điểm phát hiện</span>
        <p>Mỗi phát hiện cộng điểm theo mức độ; tổng điểm tối đa là 100.</p>
      </div>
      <dl>
        <div>
          <dt>Rất cao</dt>
          <dd>+40 điểm</dd>
        </div>
        <div>
          <dt>Cao</dt>
          <dd>+25 điểm</dd>
        </div>
        <div>
          <dt>Trung bình</dt>
          <dd>+15 điểm</dd>
        </div>
        <div>
          <dt>Thấp</dt>
          <dd>+10 điểm</dd>
        </div>
      </dl>
      <p className="risk-scale-note">Tài liệu từ 70 điểm trở lên, hoặc có tín hiệu chặn nghiêm trọng, sẽ được đưa sang người rà soát xử lý.</p>
    </section>
  );
}

function workflowTitle(document: DocumentDetail): string {
  if (document.review_status === "awaiting_ai_review") {
    return "Đã đọc xong nội dung, đang rà soát tự động";
  }
  if (document.processing_status === "pending_extraction" || document.processing_status === "extracting") {
    return "Đang trích xuất văn bản từ file";
  }
  if (document.processing_status === "ai_reviewing" || document.review_status === "processing") {
    return "Đang đánh giá và ghi nhận rủi ro";
  }
  if (document.processing_status === "failed") {
    return "Quy trình xử lý thất bại";
  }
  if (document.processing_status === "completed") {
    return "Đã rà soát xong";
  }
  return humanStatus(document.processing_status);
}

function workflowDescription(document: DocumentDetail): string {
  if (document.review_status === "awaiting_ai_review") {
    return "Hệ thống đã đọc xong nội dung và tự động chuyển sang bước rà soát, bạn chưa cần thao tác thêm.";
  }
  if (document.processing_status === "pending_extraction" || document.processing_status === "extracting") {
    return "Hệ thống đang đọc file. Văn bản trích xuất sẽ hiển thị trong phần Tổng quan khi sẵn sàng.";
  }
  if (document.processing_status === "ai_reviewing" || document.review_status === "processing") {
    return "Hệ thống đang đọc nội dung, phân loại tài liệu, tính điểm rủi ro và ghi nhận các điểm cần lưu ý.";
  }
  if (document.processing_status === "failed") {
    return "Quá trình xử lý chưa hoàn tất. Hãy thử tải lại file có văn bản rõ hơn hoặc dùng DOCX/PDF có lớp văn bản.";
  }
  if (document.processing_status === "completed") {
    return "Kết quả rà soát, phân tích rủi ro và nội dung trích xuất đã sẵn sàng.";
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
  if (isNeedsReviewer(document.review_status)) {
    return "Cần người rà soát trước khi duyệt";
  }
  if (document.review_status === "ai_approved") {
    return "Chưa thấy rủi ro trọng yếu";
  }
  if (["reviewer_rejected", "admin_rejected"].includes(document.review_status)) {
    return "Người rà soát đã từ chối tài liệu";
  }
  if (["reviewer_approved", "admin_approved"].includes(document.review_status)) {
    return "Người rà soát đã duyệt tài liệu";
  }
  return humanStatus(document.review_status);
}

function riskScoreExplanation(document: DocumentDetail): string {
  if (document.risk_findings.length) {
    return "Điểm rủi ro được cộng từ các phát hiện trong văn bản. Hệ thống chỉ đưa sang người rà soát khi tổng điểm vượt ngưỡng hoặc có dấu hiệu nghiêm trọng.";
  }
  return "Điểm rủi ro thấp vì chưa có quy tắc rủi ro nào được kích hoạt từ văn bản trích xuất.";
}

function riskPanelTitle(document: DocumentDetail): string {
  if (isNeedsReviewer(document.review_status)) {
    return `Điểm rủi ro ${document.risk_score}: cần người rà soát kiểm tra`;
  }
  return `Điểm rủi ro ${document.risk_score}: Tự động xử lý`;
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
    return "Điểm đã vượt ngưỡng tự động, nên cần người rà soát nghiệp vụ kiểm tra trước.";
  }
  if (document.risk_score >= 40) {
    return "Có một số điều khoản hoặc dữ liệu cần chú ý, nhưng chưa đủ cao để chặn tự động.";
  }
  if (document.risk_score > 0) {
    return "Chỉ ghi nhận các điểm cần lưu ý, chưa thấy rủi ro trọng yếu.";
  }
  return "Chưa phát hiện tín hiệu rủi ro từ nội dung đã đọc.";
}

function automationExplanation(document: DocumentDetail): string {
  if (isNeedsReviewer(document.review_status)) {
    return "Tài liệu được đưa sang hàng chờ người rà soát vì vượt ngưỡng rủi ro hoặc có phát hiện nghiêm trọng.";
  }
  if (document.review_status === "ai_approved") {
    return "Tài liệu tiếp tục luồng tự động; các phát hiện được lưu để tham khảo, không phải yêu cầu xử lý thủ công.";
  }
  return "Hệ thống đang chờ kết quả xử lý cuối cùng.";
}

function riskImpactText(finding: RiskFinding): string {
  const labels: Record<string, string> = {
    JUDICIAL_DOCUMENT: "Đây là loại tài liệu pháp lý chuyên biệt. Cần tránh xem bản án hoặc văn bản tố tụng như hợp đồng thông thường.",
    SENSITIVE_PERSONAL_DATA: "Tài liệu có dữ liệu cá nhân. Rủi ro chính nằm ở việc chia sẻ hoặc lưu hành file ngoài đúng phạm vi.",
    MISSING_SIGNATURE: "Hợp đồng hoặc NDA thiếu dấu hiệu phần ký kết, nên hiệu lực hoặc khả năng thực thi có thể chưa rõ.",
    HIGH_VALUE: "Giá trị tài liệu lớn làm tăng tác động tài chính nếu điều khoản bị sai hoặc thiếu kiểm soát.",
    EXPIRY_SOON: "Tài liệu gần hết hạn, có thể ảnh hưởng đến quyền lợi hoặc cam kết đang có hiệu lực nếu không gia hạn đúng lúc.",
    NO_TERMINATION_CLAUSE: "Thiếu điều khoản chấm dứt làm giảm khả năng thoát khỏi cam kết khi có tranh chấp hoặc thay đổi nhu cầu.",
    NO_GOVERNING_LAW: "Thiếu luật điều chỉnh hoặc thẩm quyền xử lý tranh chấp làm tăng độ bất định khi phát sinh mâu thuẫn.",
    BROAD_INDEMNITY: "Điều khoản bồi thường rộng có thể khiến trách nhiệm vượt quá phạm vi mong muốn.",
    AUTO_RENEWAL: "Tự động gia hạn có thể làm cam kết tiếp tục hiệu lực nếu không theo dõi thời hạn thông báo.",
    LOW_EXTRACTION_QUALITY: "Nội dung đọc được chưa rõ nên kết quả rà soát có thể kém tin cậy.",
    UNKNOWN_DOC_TYPE: "Chưa nhận diện rõ loại tài liệu, nên kết luận phân loại có độ chắc chắn thấp.",
    CONFIDENCE_LOW: "Độ tin cậy phân loại thấp khiến kết quả cần được xem như tín hiệu tham khảo.",
  };
  return labels[finding.rule_code] ?? `Mức độ ${humanStatus(finding.severity).toLowerCase()}, cần đọc cùng nội dung tài liệu.`;
}

function riskAutomationText(document: DocumentDetail, finding: RiskFinding): string {
  if (isNeedsReviewer(document.review_status)) {
    return "Phát hiện này góp phần làm tài liệu cần người rà soát trước khi duyệt tự động.";
  }
  if (finding.severity === "critical") {
    return "Phát hiện có mức rất cao; hệ thống sẽ chuyển người rà soát nếu tổng điểm rủi ro hoặc quy tắc chặn vượt ngưỡng.";
  }
  return "Phát hiện được ghi nhận để minh bạch, nhưng tổng điểm rủi ro vẫn dưới ngưỡng chuyển người rà soát nên tài liệu tiếp tục được xử lý tự động.";
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

function isNeedsReviewer(status: string): boolean {
  return status === "needs_reviewer" || status === "pending_admin";
}
