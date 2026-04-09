import { useState } from "react";
import { useParams } from "react-router-dom";

import ChatPanel from "../../components/chat/ChatPanel.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import RiskBadge from "../../components/ui/RiskBadge.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import Tabs, { TabPanel } from "../../components/ui/Tabs.jsx";
import Timeline from "../../components/ui/Timeline.jsx";
import { useCases } from "../../hooks/useCases.js";

const tabItems = [
  { label: "Tổng quan", value: "overview" },
  { label: "Chat", value: "chat" },
  { label: "Timeline", value: "timeline" },
];

export default function CaseDetail() {
  const { id } = useParams();
  const { getCaseById, isReady } = useCases();
  const [activeTab, setActiveTab] = useState("overview");
  const currentCase = getCaseById(id);
  const chatPlaceholder = `Hỏi thêm về ${currentCase?.title || "hồ sơ"} sau khi Phase 2.5 nối API chat thật...`;

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
      <Card className="overflow-hidden bg-gradient-to-br from-white via-white to-brand-50">
        <CardContent className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <Badge className="border-brand-100 bg-brand-50 text-brand-700">Scaffold tab của CaseDetail</Badge>
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">{currentCase.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{currentCase.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <StatusBadge status={currentCase.status} />
              <RiskBadge level={currentCase.riskLevel} />
            </div>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">Ghi chú nền tảng</p>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Route đã đúng theo semantics `/client/cases/:id` và tab được giữ nội bộ, không tách thành page riêng.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={tabItems} value={activeTab} onChange={setActiveTab} />
        <p className="text-sm text-slate-500">Tài liệu: {currentCase.documentName}</p>
      </div>

      <TabPanel activeValue={activeTab} value="overview">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card>
            <CardContent className="space-y-4 p-6">
              <h3 className="text-xl font-semibold text-slate-900">Tổng quan hồ sơ</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm text-slate-500">Case ID</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{currentCase.id}</p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm text-slate-500">Updated</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{currentCase.updatedAt}</p>
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-slate-700">Đoạn trích văn bản</p>
                <p className="mt-3 text-sm leading-7 text-slate-500">{currentCase.extractedText}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-950 text-white">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">Kế hoạch Phase 2</p>
              <p className="text-lg font-semibold">Tab Overview sẽ được nối vào review response thật ở Phase 2.5.</p>
              <ul className="space-y-3 text-sm leading-6 text-slate-300">
                <li>Render LegalReviewResponse đầy đủ.</li>
                <li>Hiển thị risk flag, extracted field và disclaimer.</li>
                <li>Đồng bộ timeline với local state.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </TabPanel>

      <TabPanel activeValue={activeTab} value="chat">
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm leading-6 text-slate-500">
              Chat panel đã có component và message layout. Wiring submit thật vào hook/useChat sẽ được bật ở phase sau.
            </p>
            <ChatPanel messages={currentCase.chatMessages} disabled error="" placeholder={chatPlaceholder} />
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel activeValue={activeTab} value="timeline">
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm leading-6 text-slate-500">
              Timeline component đã sẵn sàng cho event history, SLA marker và workflow provenance.
            </p>
            <Timeline items={currentCase.timeline} />
          </CardContent>
        </Card>
      </TabPanel>
    </div>
  );
}
