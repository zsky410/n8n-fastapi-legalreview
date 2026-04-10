import { AlertTriangle, Bot, Clock3, FileSearch, RefreshCcw, ShieldAlert, Sparkles, TimerReset } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

import ChatPanel from "../../components/chat/ChatPanel.jsx";
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
import { PIPELINE_STAGES } from "../../lib/constants.js";
import { formatConfidence, formatDateTime, formatSlaLabel } from "../../lib/formatters.js";
import { reviewLegal } from "../../lib/api.js";

const tabItems = [
  { label: "Tổng quan", value: "overview" },
  { label: "Chat", value: "chat" },
  { label: "Timeline", value: "timeline" },
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
  return caseRecord.timeline?.at(-1)?.stage || "Chờ review";
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
        },
      });

      updateReview(currentCase.id, response);
    } catch (error) {
      setReviewError(error.message || "Không thể chạy review cho hồ sơ này.");
    } finally {
      setIsReviewLoading(false);
    }
  }

  if (!isReady) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="loading-shimmer h-36 rounded-[24px]" />
        </CardContent>
      </Card>
    );
  }

  if (!currentCase) {
    return (
      <EmptyState
        title="Không tìm thấy hồ sơ"
        description="Case này chưa tồn tại trong local state. Hãy quay lại dashboard hoặc tạo hồ sơ mới."
      />
    );
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_36%),linear-gradient(135deg,#ffffff_0%,#eef8ff_50%,#ecfeff_100%)]">
        <CardContent className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <Badge className="border-brand-100 bg-white/80 text-brand-700">Case detail nội bộ 3 tab</Badge>
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">{currentCase.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{currentCase.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <StatusBadge status={currentCase.status} />
              <RiskBadge level={currentCase.riskLevel} />
              <Badge className="border-slate-200 bg-white/80 text-slate-700">{currentCase.documentName}</Badge>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Snapshot</p>
            <div className="mt-4 grid gap-4">
              <div>
                <p className="text-sm text-white/60">Case ID</p>
                <p className="mt-1 text-lg font-semibold">{currentCase.id}</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Updated</p>
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={tabItems} value={activeTab} onChange={setActiveTab} />
        <p className="text-sm text-slate-500">Lĩnh vực: {currentCase.domain || "Chưa gắn lĩnh vực"}</p>
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
                <h3 className="text-xl font-semibold text-slate-900">Không thể chạy review lúc này</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{reviewError}</p>
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
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">AI review result</p>
                      <h3 className="mt-2 text-2xl font-semibold text-slate-900">{review.docType}</h3>
                    </div>
                    <Button variant="secondary" onClick={handleRequestReview}>
                      <RefreshCcw className="h-4 w-4" />
                      Chạy lại mock review
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-sm text-slate-500">Risk score</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">{review.riskScore}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Mức {review.riskLevel}</p>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-sm text-slate-500">Confidence</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">{formatConfidence(review.confidence)}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Model {review.meta?.model || "mock"}</p>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-sm text-slate-500">Latency</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">{review.meta?.latencyMs || 0}ms</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Mock-first engine</p>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Tóm tắt hồ sơ</p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{review.summary}</p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-5">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                        <p className="text-sm font-semibold text-slate-900">Risk flags</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {review.riskFlags?.length ? (
                          review.riskFlags.map((flag) => (
                            <div key={flag} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                              {flag}
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            Chưa có cảnh báo rủi ro nổi bật.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-5">
                      <div className="flex items-center gap-2">
                        <FileSearch className="h-4 w-4 text-brand-700" />
                        <p className="text-sm font-semibold text-slate-900">Extracted fields</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {Object.entries(review.extractedFields || {}).map(([key, value]) => (
                          <div key={key} className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{key}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-700">{renderFieldValue(value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-5">
              <Card className="bg-slate-950 text-white">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm text-white/60">Recommended action</p>
                      <p className="mt-1 text-lg font-semibold text-white">{review.recommendedAction}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center gap-2 text-slate-900">
                    <TimerReset className="h-4 w-4 text-brand-700" />
                    <p className="text-sm font-semibold">Disclaimers & quality warning</p>
                  </div>
                  <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
                    {review.qualityWarning}
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                    {review.disclaimer}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4 p-6">
                  <p className="text-sm font-semibold text-slate-900">Đoạn trích văn bản đầu vào</p>
                  <p className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                    {currentCase.extractedText || "Chưa có nội dung trích xuất. Review đang dựa nhiều hơn vào metadata hồ sơ."}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Chưa có kết quả review"
            description="Case mới tạo sẽ hiển thị risk score, summary, extracted fields và disclaimer sau khi bạn chạy AI mock-first."
            action={{
              label: "Chạy phân tích AI mock",
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
                <h3 className="text-xl font-semibold text-slate-900">Trao đổi theo từng hồ sơ</h3>
                <p className="text-sm text-slate-500">Chat panel đang chạy bằng mock/hybrid mode và giữ hội thoại theo từng case trong local state.</p>
              </div>
              <Badge className="border-slate-200 bg-slate-100 text-slate-700">
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
              hint="Typing indicator, error handling và lưu hội thoại theo case đã được bật trong Phase 2."
            />
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel activeValue={activeTab} value="timeline">
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardContent className="space-y-2 p-6">
                <p className="text-sm text-slate-500">Stage hiện tại</p>
                <p className="text-2xl font-semibold text-slate-900">{currentStage}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2 p-6">
                <p className="text-sm text-slate-500">SLA</p>
                <p className="text-2xl font-semibold text-slate-900">{formatSlaLabel(currentCase.slaDueAt)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2 p-6">
                <p className="text-sm text-slate-500">Lần cập nhật cuối</p>
                <p className="text-lg font-semibold text-slate-900">{formatDateTime(currentCase.updatedAt)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-brand-700" />
                <p className="text-sm font-semibold text-slate-900">Pipeline status</p>
              </div>
              <div className="grid gap-3 md:grid-cols-5">
                {PIPELINE_STAGES.map((stage, index) => {
                  const isCompleted = completedStageIndex >= index && completedStageIndex !== -1;
                  return (
                    <div
                      key={stage}
                      className={`rounded-[24px] border px-4 py-4 text-sm font-semibold transition ${
                        isCompleted
                          ? "border-brand-200 bg-brand-50 text-brand-700"
                          : "border-slate-200 bg-slate-50 text-slate-500"
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
                <h3 className="text-xl font-semibold text-slate-900">Lịch sử xử lý</h3>
                <p className="text-sm text-slate-500">Case mới sẽ hiển thị empty state cho đến khi review được chạy và pipeline được cập nhật.</p>
              </div>
              {currentCase.timeline?.length ? (
                <Timeline items={currentCase.timeline} />
              ) : (
                <EmptyState
                  title="Chưa có sự kiện timeline"
                  description="Đây là trạng thái đúng cho case mới tạo. Hãy chạy review ở tab Tổng quan để tạo pipeline event và SLA progression."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </TabPanel>
    </div>
  );
}
