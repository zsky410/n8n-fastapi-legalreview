import { AlertTriangle, Bot, Clock3, FileSearch, RefreshCcw, ShieldAlert, Sparkles, TimerReset } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

import ChatPanel from "../../components/chat/ChatPanel.jsx";
import PageFrame from "../../components/layout/PageFrame.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import RiskBadge from "../../components/ui/RiskBadge.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import Tabs, { TabPanel } from "../../components/ui/Tabs.jsx";
import Timeline from "../../components/ui/Timeline.jsx";
import { useCases } from "../../hooks/useCases.js";
import { useChat } from "../../hooks/useChat.js";
import { PIPELINE_STAGES, ROLE_LABELS } from "../../lib/constants.js";
import { formatConfidence, formatDateTime, formatPriorityLabel, formatReviewAction, formatRiskLevelLabel, formatSlaLabel, formatStageLabel } from "../../lib/formatters.js";
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

  return "Chế độ dự phòng nội bộ";
}

export default function CaseDetail() {
  const { id } = useParams();
  const { getCaseById, isReady, updateReview } = useCases();
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

      updateReview(currentCase.id, response);
    } catch (error) {
      setReviewError(error.message || "Không thể chạy phân tích AI cho hồ sơ này.");
    } finally {
      setIsReviewLoading(false);
    }
  }

  if (!isReady) {
    return (
      <PageFrame segments={[ROLE_LABELS.client, "Chi tiết hồ sơ"]}>
        <Card>
          <CardContent className="p-6">
            <div className="loading-shimmer h-36 rounded-[24px]" />
          </CardContent>
        </Card>
      </PageFrame>
    );
  }

  if (!currentCase) {
    return (
      <PageFrame segments={[ROLE_LABELS.client, "Chi tiết hồ sơ"]}>
        <EmptyState
          title="Không tìm thấy hồ sơ"
          description="Hồ sơ này chưa tồn tại trên trình duyệt hiện tại. Hãy quay lại danh sách hoặc tạo hồ sơ mới."
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame segments={[ROLE_LABELS.client, "Chi tiết hồ sơ"]}>
    <div className="space-y-5">
      <Card className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_36%),linear-gradient(135deg,#ffffff_0%,#eef8ff_50%,#ecfeff_100%)]">
        <CardContent className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div>
              <h2 className="text-3xl font-semibold text-ink">{currentCase.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{currentCase.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <StatusBadge status={currentCase.status} />
              <RiskBadge level={currentCase.riskLevel} />
              <Badge className="border-line bg-white/80 text-ink">{currentCase.documentName}</Badge>
              <Badge className="border-line bg-white/80 text-ink">Ưu tiên {formatPriorityLabel(currentCase.priority)}</Badge>
              {review?.needsAttention ? <Badge className="border-rose-200 bg-rose-50 text-rose-700">Cần chú ý</Badge> : null}
              {review?.qualityWarning ? <Badge className="border-amber-200 bg-amber-50 text-amber-700">Cảnh báo chất lượng</Badge> : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-ink p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Tóm tắt nhanh</p>
            <div className="mt-4 grid gap-4">
              <div>
                <p className="text-sm text-white/60">Mã hồ sơ</p>
                <p className="mt-1 text-lg font-semibold">{currentCase.id}</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Ngày tạo</p>
                <p className="mt-1 text-sm font-medium text-slate-200">{formatDateTime(currentCase.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Cập nhật</p>
                <p className="mt-1 text-sm font-medium text-slate-200">{formatDateTime(currentCase.updatedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-white/60">SLA</p>
                <p className="mt-1 text-sm font-medium text-slate-200">{formatSlaLabel(currentCase.slaDueAt)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Kết quả AI chỉ có giá trị tham khảo, không thay thế tư vấn pháp lý chuyên nghiệp.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={tabItems} value={activeTab} onChange={setActiveTab} />
        <p className="text-sm text-muted">Lĩnh vực: {currentCase.domain || "Chưa gắn lĩnh vực"}</p>
      </div>

      <TabPanel activeValue={activeTab} value="overview">
        {isReviewLoading ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="loading-shimmer h-10 rounded-2xl" />
                <div className="loading-shimmer h-28 rounded-[24px]" />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="loading-shimmer h-32 rounded-[24px]" />
                  <div className="loading-shimmer h-32 rounded-[24px]" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="loading-shimmer h-32 rounded-[24px]" />
                <div className="loading-shimmer h-32 rounded-[24px]" />
              </CardContent>
            </Card>
          </div>
        ) : reviewError ? (
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-ink">Không thể chạy phân tích lúc này</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{reviewError}</p>
              </div>
              <Button onClick={handleRequestReview}>
                <RefreshCcw className="h-4 w-4" />
                Thử lại
              </Button>
            </CardContent>
          </Card>
        ) : review ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              <Card>
                <CardContent className="space-y-5 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Kết quả phân tích</p>
                      <h3 className="mt-2 text-2xl font-semibold text-ink">{review.docType}</h3>
                    </div>
                    <Button variant="secondary" onClick={handleRequestReview}>
                      <RefreshCcw className="h-4 w-4" />
                      Phân tích lại
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[24px] border border-line bg-slate-50 px-4 py-4">
                      <p className="text-sm text-muted">Điểm rủi ro</p>
                      <p className="mt-2 text-3xl font-semibold text-ink">{review.riskScore}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">Mức {formatRiskLevelLabel(review.riskLevel)}</p>
                    </div>
                    <div className="rounded-[24px] border border-line bg-slate-50 px-4 py-4">
                      <p className="text-sm text-muted">Độ tin cậy</p>
                      <p className="mt-2 text-3xl font-semibold text-ink">{formatConfidence(review.confidence)}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">{reviewSourceLabel}</p>
                    </div>
                    <div className="rounded-[24px] border border-line bg-slate-50 px-4 py-4">
                      <p className="text-sm text-muted">Thời gian phản hồi</p>
                      <p className="mt-2 text-3xl font-semibold text-ink">{review.meta?.latencyMs || 0}ms</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">Xử lý tự động</p>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-line bg-white px-5 py-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Tóm tắt hồ sơ</p>
                    <p className="mt-3 text-sm leading-7 text-muted">{review.summary}</p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[28px] border border-line bg-white px-5 py-5">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                        <p className="text-sm font-semibold text-ink">Cảnh báo rủi ro</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {review.riskFlags?.length ? (
                          review.riskFlags.map((flag, index) => (
                            <div key={`risk-flag-${index}`} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                              {typeof flag === "string" ? flag : flag.label || flag.excerpt || "Cảnh báo rủi ro"}
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            Chưa có cảnh báo rủi ro nổi bật.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-line bg-white px-5 py-5">
                      <div className="flex items-center gap-2">
                        <FileSearch className="h-4 w-4 text-gold" />
                        <p className="text-sm font-semibold text-ink">Trường đã trích xuất</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {Object.entries(review.extractedFields || {}).map(([key, value]) => (
                          <div key={key} className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{key}</p>
                            <p className="mt-2 text-sm leading-6 text-ink">{renderFieldValue(value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-5">
              <Card className="!bg-ink !text-white">
                <CardContent className="space-y-4 p-6">
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
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center gap-2 text-ink">
                    <TimerReset className="h-4 w-4 text-gold" />
                    <p className="text-sm font-semibold">Lưu ý và cảnh báo chất lượng</p>
                  </div>
                  {review.qualityWarning ? (
                    <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
                      {review.qualityWarning}
                    </div>
                  ) : null}
                  <div className="rounded-[24px] border border-line bg-slate-50 px-4 py-4 text-sm leading-6 text-muted">
                    {review.disclaimer}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Chưa có kết quả phân tích"
            description="Hồ sơ mới tạo sẽ hiển thị điểm rủi ro, tóm tắt, trường trích xuất và lưu ý sau khi bạn chạy phân tích AI."
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
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-ink">Trao đổi theo từng hồ sơ</h3>
                <p className="text-sm text-muted">Đặt câu hỏi theo đúng hồ sơ để làm rõ điều khoản, cảnh báo và hướng xử lý tiếp theo.</p>
              </div>
              <Badge className="border-line bg-[#f4f4f5] text-ink">
                <Bot className="mr-1 h-3.5 w-3.5" />
                {messages.length} tin nhắn
              </Badge>
            </div>
            <ChatPanel
              messages={messages}
              error={chatError}
              isSending={isSending}
              onSubmit={sendMessage}
              placeholder={`Hỏi thêm về ${currentCase.title.toLowerCase()}...`}
              hint="Mỗi tin nhắn sẽ được lưu theo hồ sơ để bạn dễ theo dõi lại nội dung trao đổi. Câu hỏi nên từ 3 ký tự trở lên."
            />
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel activeValue={activeTab} value="timeline">
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardContent className="space-y-2 p-6">
                <p className="text-sm text-muted">Stage hiện tại</p>
                <p className="text-2xl font-semibold text-ink">{currentStage}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2 p-6">
                <p className="text-sm text-muted">SLA</p>
                <p className="text-2xl font-semibold text-ink">{formatSlaLabel(currentCase.slaDueAt)}</p>
                <Badge
                  className={
                    slaStatus === "overdue"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : slaStatus === "at_risk"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }
                >
                  {slaStatus === "overdue" ? "Quá hạn" : slaStatus === "at_risk" ? "Sắp đến hạn" : "Đúng hạn"}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2 p-6">
                <p className="text-sm text-muted">Lần cập nhật cuối</p>
                <p className="text-lg font-semibold text-ink">{formatDateTime(currentCase.updatedAt)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-gold" />
                <p className="text-sm font-semibold text-ink">Tiến trình xử lý</p>
              </div>
              <div className="grid gap-3 md:grid-cols-5">
                {PIPELINE_STAGES.map((stage, index) => {
                  const isCompleted = completedStageIndex >= index && completedStageIndex !== -1;
                  return (
                    <div
                      key={stage}
                      className={`rounded-[24px] border px-4 py-4 text-sm font-semibold transition ${
                        isCompleted
                          ? "border-gold/40 bg-brand-50 text-gold"
                          : "border-line bg-slate-50 text-muted"
                      }`}
                    >
                      {stage}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <h3 className="text-xl font-semibold text-ink">Lịch sử xử lý</h3>
                <p className="text-sm text-muted">Hồ sơ mới sẽ hiển thị trạng thái trống cho đến khi phân tích được chạy và tiến trình được cập nhật.</p>
              </div>
              {currentCase.timeline?.length ? (
                <Timeline items={currentCase.timeline} />
              ) : (
                <EmptyState
                  title="Chưa có mốc xử lý"
                  description="Đây là trạng thái bình thường của hồ sơ mới. Hãy chạy phân tích AI ở tab Tổng quan để tạo các mốc tiến trình và cập nhật SLA."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </TabPanel>
    </div>
    </PageFrame>
  );
}
