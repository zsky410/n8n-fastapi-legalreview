import {
  AlertTriangle,
  Bot,
  Clock3,
  FileSearch,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

import ChatPanel from "../../components/chat/ChatPanel.jsx";
import PageFrame from "../../components/layout/PageFrame.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card, { CardContent, CardHeader, CardTitle } from "../../components/ui/Card.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import RiskBadge from "../../components/ui/RiskBadge.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import Tabs, { TabPanel } from "../../components/ui/Tabs.jsx";
import Timeline from "../../components/ui/Timeline.jsx";
import { useCases } from "../../hooks/useCases.js";
import { useChat } from "../../hooks/useChat.js";
import { PIPELINE_STAGES } from "../../lib/constants.js";
import {
  formatConfidence,
  formatDateTime,
  formatPriorityLabel,
  formatReviewAction,
  formatRiskLevelLabel,
  formatSlaLabel,
  formatStageLabel,
} from "../../lib/formatters.js";
import { reviewLegal } from "../../lib/api.js";

const tabItems = [
  { label: "Tổng quan", value: "overview" },
  { label: "Trao đổi", value: "chat" },
  { label: "Tiến trình", value: "timeline" },
];

function renderFieldValue(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object" && value) {
    return Object.values(value).join(", ");
  }

  return value || "Chưa có dữ liệu";
}

function getCurrentStage(caseRecord) {
  const stage = caseRecord.timeline?.at(-1)?.stage;
  return formatStageLabel(stage || "Đã tải lên");
}

function getReviewSourceLabel(review) {
  if (!review?.meta) {
    return "Nguồn AI chưa xác định";
  }

  if (review.meta.provider === "gemini") {
    return `Mô hình ${review.meta.model || "Gemini"}`;
  }

  return review.meta.model || "Chế độ dự phòng nội bộ";
}

function SummaryCell({ label, value }) {
  return (
    <div className="rounded-[22px] border border-slate-200/80 bg-white/82 px-4 py-4 shadow-[0_14px_28px_rgba(15,23,42,0.05)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

function ReviewMetric({ label, value, note }) {
  return (
    <div className="rounded-[22px] border border-slate-200/80 bg-[#f8fafc] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink">{value}</p>
      {note ? <p className="mt-2 text-sm leading-6 text-muted">{note}</p> : null}
    </div>
  );
}

export default function CaseDetail() {
  const { id } = useParams();
  const { error: casesError, getCaseById, isReady, updateReview } = useCases();
  const { messages, isSending, error: chatError, sendMessage } = useChat(id);
  const [activeTab, setActiveTab] = useState("overview");
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const currentCase = getCaseById(id);
  const currentStage = currentCase ? getCurrentStage(currentCase) : "Chưa xác định";
  const review = currentCase?.review;
  const completedStageIndex = PIPELINE_STAGES.findIndex((stage) => stage === currentStage);
  const slaMs = currentCase?.slaDueAt ? new Date(currentCase.slaDueAt).getTime() - Date.now() : null;
  const slaStatus = slaMs === null ? "on_time" : slaMs < 0 ? "overdue" : slaMs < 60 * 60 * 1000 ? "at_risk" : "on_time";
  const reviewSourceLabel = getReviewSourceLabel(review);

  async function handleRequestReview() {
    if (!currentCase) {
      return;
    }

    setIsReviewLoading(true);
    setReviewError("");

    try {
      const response = await reviewLegal({
        caseId: currentCase.id,
        title: currentCase.title,
        description: currentCase.description,
        extractedText: currentCase.extractedText,
        language: "vi",
        metadata: {
          domain: currentCase.domain,
          documentName: currentCase.documentName,
          priority: currentCase.priority,
        },
      });

      await updateReview(currentCase.id, response);
    } catch (error) {
      setReviewError(error.message || "Không thể chạy phân tích AI cho hồ sơ này.");
    } finally {
      setIsReviewLoading(false);
    }
  }

  if (!isReady) {
    return (
      <PageFrame eyebrow="Matter Review" title="Hồ sơ chi tiết">
        <Card>
          <CardContent className="space-y-4">
            <div className="loading-shimmer h-28 rounded-[24px]" />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="loading-shimmer h-24 rounded-[22px]" />
              <div className="loading-shimmer h-24 rounded-[22px]" />
              <div className="loading-shimmer h-24 rounded-[22px]" />
            </div>
          </CardContent>
        </Card>
      </PageFrame>
    );
  }

  if (!currentCase) {
    return (
      <PageFrame eyebrow="Matter Review" title="Hồ sơ chi tiết">
        <EmptyState
          title="Không tìm thấy hồ sơ"
          description={
            casesError
              ? `Không thể tải hồ sơ từ máy chủ: ${casesError}`
              : "Hồ sơ này chưa tồn tại trong tài khoản hiện tại. Hãy quay lại danh sách hoặc tạo hồ sơ mới."
          }
        />
      </PageFrame>
    );
  }

  const extractedFields = Object.entries(review?.extractedFields || {});

  return (
    <PageFrame
      eyebrow="Matter Review"
      title={currentCase.title}
      actions={
        <Button onClick={handleRequestReview} isLoading={isReviewLoading} variant={review ? "secondary" : "primary"}>
          <RefreshCcw className="h-4 w-4" />
          {review ? "Phân tích lại" : "Chạy phân tích AI"}
        </Button>
      }
    >
      <Card>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={currentCase.status} />
            <RiskBadge level={currentCase.riskLevel} />
            <Badge className="border-slate-200 bg-slate-50 text-slate-700">{currentCase.documentName}</Badge>
            <Badge className="border-slate-200 bg-slate-50 text-slate-700">Ưu tiên {formatPriorityLabel(currentCase.priority)}</Badge>
            {review?.needsAttention ? <Badge className="border-rose-200 bg-rose-50 text-rose-700">Cần chú ý</Badge> : null}
            {review?.qualityWarning ? <Badge className="border-amber-200 bg-amber-50 text-amber-900">OCR cần kiểm tra</Badge> : null}
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_340px]">
            <div className="space-y-4">
              <div className="rounded-[30px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(238,244,255,0.9),rgba(255,255,255,0.96))] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">Matter Summary</p>
                    <h2 className="mt-3 font-serif text-[2rem] leading-tight tracking-[-0.04em] text-ink">
                      {review?.docType || currentCase.documentName}
                    </h2>
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-500/12 bg-white text-brand-700">
                    <Sparkles className="h-5 w-5" />
                  </span>
                </div>
                {review?.summary ? <p className="mt-4 text-[15px] leading-7 text-muted">{review.summary}</p> : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCell label="Mã hồ sơ" value={currentCase.id} />
                <SummaryCell label="Lĩnh vực" value={currentCase.domain || "Chưa gắn"} />
                <SummaryCell label="Ngày tạo" value={formatDateTime(currentCase.createdAt)} />
                <SummaryCell label="Cập nhật" value={formatDateTime(currentCase.updatedAt)} />
              </div>
            </div>

            <div className="rounded-[30px] bg-warm-900 p-6 text-white shadow-[0_28px_60px_rgba(15,23,42,0.18)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/44">Tóm tắt</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/44">Stage hiện tại</p>
                  <p className="mt-2 text-lg font-semibold text-white">{currentStage}</p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/44">SLA</p>
                  <p className="mt-2 text-lg font-semibold text-white">{formatSlaLabel(currentCase.slaDueAt)}</p>
                  <div className="mt-3">
                    <span
                      className={
                        slaStatus === "overdue"
                          ? "rounded-full border border-rose-200/40 bg-rose-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-200"
                          : slaStatus === "at_risk"
                            ? "rounded-full border border-amber-200/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200"
                            : "rounded-full border border-emerald-200/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200"
                      }
                    >
                      {slaStatus === "overdue" ? "Quá hạn" : slaStatus === "at_risk" ? "Sắp đến hạn" : "Đúng hạn"}
                    </span>
                  </div>
                </div>
                {review ? (
                  <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/44">Nguồn review</p>
                    <p className="mt-2 text-base font-semibold text-white">{reviewSourceLabel}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            Kết quả AI chỉ có giá trị tham khảo.
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Tabs tabs={tabItems} value={activeTab} onChange={setActiveTab} />
          </div>

          <TabPanel activeValue={activeTab} value="overview">
            {isReviewLoading ? (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_340px]">
                <Card>
                  <CardContent className="space-y-4">
                    <div className="loading-shimmer h-16 rounded-[22px]" />
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="loading-shimmer h-28 rounded-[22px]" />
                      <div className="loading-shimmer h-28 rounded-[22px]" />
                      <div className="loading-shimmer h-28 rounded-[22px]" />
                    </div>
                    <div className="loading-shimmer h-40 rounded-[24px]" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="space-y-4">
                    <div className="loading-shimmer h-28 rounded-[22px]" />
                    <div className="loading-shimmer h-28 rounded-[22px]" />
                  </CardContent>
                </Card>
              </div>
            ) : reviewError ? (
              <Card>
                <CardContent className="space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-[1.7rem] leading-tight tracking-[-0.03em] text-ink">Không thể chạy phân tích lúc này</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{reviewError}</p>
                  </div>
                  <Button onClick={handleRequestReview}>
                    <RefreshCcw className="h-4 w-4" />
                    Thử lại
                  </Button>
                </CardContent>
              </Card>
            ) : review ? (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_340px]">
                <div className="space-y-5">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">AI Review</p>
                          <CardTitle>{review.docType}</CardTitle>
                        </div>
                        <Button variant="secondary" onClick={handleRequestReview}>
                          <RefreshCcw className="h-4 w-4" />
                          Phân tích lại
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="grid gap-4 md:grid-cols-3">
                        <ReviewMetric
                          label="Điểm rủi ro"
                          value={review.riskScore}
                          note={`Mức ${formatRiskLevelLabel(review.riskLevel)}`}
                        />
                        <ReviewMetric
                          label="Độ tin cậy"
                          value={formatConfidence(review.confidence)}
                          note=""
                        />
                        <ReviewMetric
                          label="Phản hồi"
                          value={`${review.meta?.latencyMs || 0}ms`}
                          note=""
                        />
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-[24px] border border-slate-200/80 bg-white px-5 py-5">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-amber-500" />
                            <p className="text-sm font-semibold text-ink">Cảnh báo rủi ro</p>
                          </div>
                          <div className="mt-4 space-y-3">
                            {review.riskFlags?.length ? (
                              review.riskFlags.map((flag, index) => (
                                <div key={`risk-flag-${index}`} className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                                  {typeof flag === "string" ? flag : flag.label || flag.excerpt || "Cảnh báo rủi ro"}
                                </div>
                              ))
                            ) : (
                              <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
                                Chưa có cảnh báo rủi ro nổi bật.
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-slate-200/80 bg-white px-5 py-5">
                          <div className="flex items-center gap-2">
                            <FileSearch className="h-4 w-4 text-brand-700" />
                            <p className="text-sm font-semibold text-ink">Trường đã trích xuất</p>
                          </div>
                          <div className="mt-4 grid gap-3">
                            {extractedFields.length ? (
                              extractedFields.map(([key, value]) => (
                                <div key={key} className="rounded-[18px] border border-slate-200/70 bg-[#f8fafc] px-4 py-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{key}</p>
                                  <p className="mt-2 text-sm leading-6 text-ink">{renderFieldValue(value)}</p>
                                </div>
                              ))
                            ) : (
                              <div className="rounded-[18px] border border-dashed border-slate-300 bg-[#f8fafc] px-4 py-6 text-sm text-muted">
                                Chưa có trường nào được trích xuất.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-5">
                  <Card className="!bg-warm-900 !text-white">
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                          <Sparkles className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm text-white/60">Khuyến nghị xử lý</p>
                          <p className="mt-1 text-lg font-semibold text-white">{formatReviewAction(review.recommendedAction)}</p>
                        </div>
                      </div>
                      
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2 text-ink">
                        <TimerReset className="h-4 w-4 text-brand-700" />
                        <CardTitle className="text-[1.4rem]">Chất lượng và lưu ý</CardTitle>
                      </div>
                      
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {review.qualityWarning ? (
                        <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
                          {review.qualityWarning}
                        </div>
                      ) : null}
                      <div className="rounded-[22px] border border-slate-200/80 bg-[#f8fafc] px-4 py-4 text-sm leading-6 text-muted">
                        {review.disclaimer}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-[1.4rem]">Thông tin matter</CardTitle>
                      
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { label: "Tài liệu", value: currentCase.documentName },
                        { label: "Ưu tiên", value: formatPriorityLabel(currentCase.priority) },
                        { label: "Lĩnh vực", value: currentCase.domain || "Chưa gắn" },
                        { label: "Updated", value: formatDateTime(currentCase.updatedAt) },
                      ].map((item) => (
                        <div key={item.label} className="rounded-[18px] border border-slate-200/70 bg-[#f8fafc] px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{item.label}</p>
                          <p className="mt-2 text-sm font-semibold text-ink">{item.value}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Chưa có kết quả phân tích"
                description="Matter mới tạo sẽ hiển thị điểm rủi ro, tóm tắt, trường trích xuất và lưu ý sau khi bạn chạy phân tích AI."
                action={{
                  label: "Chạy phân tích AI",
                  props: {
                    onClick: handleRequestReview,
                  },
                }}
              />
            )}
          </TabPanel>

          <TabPanel activeValue={activeTab} value="chat">
            <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-brand-700" />
                    <CardTitle className="text-[1.4rem]">Matter chat</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-[18px] border border-slate-200/70 bg-[#f8fafc] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Tin nhắn</p>
                    <p className="mt-2 text-lg font-semibold text-ink">{messages.length}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <ChatPanel
                    messages={messages}
                    error={chatError}
                    isSending={isSending}
                    onSubmit={sendMessage}
                    placeholder={`Hỏi thêm về ${currentCase.title.toLowerCase()}...`}
                  />
                </CardContent>
              </Card>
            </div>
          </TabPanel>

          <TabPanel activeValue={activeTab} value="timeline">
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-3">
                <SummaryCell label="Stage hiện tại" value={currentStage} />
                <SummaryCell label="SLA" value={formatSlaLabel(currentCase.slaDueAt)} />
                <SummaryCell label="Cập nhật cuối" value={formatDateTime(currentCase.updatedAt)} />
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-brand-700" />
                    <CardTitle className="text-[1.4rem]">Tiến trình pipeline</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-5">
                  {PIPELINE_STAGES.map((stage, index) => {
                    const isCompleted = completedStageIndex >= index && completedStageIndex !== -1;
                    return (
                      <div
                        key={stage}
                        className={
                          isCompleted
                            ? "rounded-[20px] border border-brand-500/12 bg-brand-50 px-4 py-4 text-sm font-semibold text-brand-700"
                            : "rounded-[20px] border border-slate-200/80 bg-[#f8fafc] px-4 py-4 text-sm font-semibold text-muted"
                        }
                      >
                        {stage}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-[1.4rem]">Lịch sử xử lý</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentCase.timeline?.length ? (
                    <Timeline items={currentCase.timeline} />
                  ) : (
                    <EmptyState
                      title="Chưa có mốc xử lý"
                      description="Đây là trạng thái bình thường của hồ sơ mới. Hãy chạy phân tích AI ở tab Tổng quan để tạo thêm mốc trong timeline."
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabPanel>
        </CardContent>
      </Card>
    </PageFrame>
  );
}
