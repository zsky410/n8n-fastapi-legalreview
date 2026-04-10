import { createContext, createElement, useContext, useEffect, useState } from "react";

import { mockCases } from "../lib/mockData.js";

const STORAGE_KEY = "legaldesk-ui-cases";
const CasesContext = createContext(null);

function getRiskLevelFromReview(review) {
  if (review?.riskLevel) {
    return review.riskLevel;
  }

  if ((review?.riskScore || 0) >= 75) {
    return "high";
  }

  if ((review?.riskScore || 0) >= 45) {
    return "medium";
  }

  return "low";
}

function buildTimelineAfterReview(caseRecord, review) {
  const createdAt = new Date(caseRecord.createdAt || Date.now());
  const ocrAt = new Date(createdAt.getTime() + 2 * 60 * 1000).toISOString();
  const reviewAt = new Date(createdAt.getTime() + 5 * 60 * 1000).toISOString();
  const publishedAt = new Date(createdAt.getTime() + 7 * 60 * 1000).toISOString();

  if (caseRecord.timeline?.length) {
    const existingStages = new Set(caseRecord.timeline.map((entry) => entry.stage));
    const nextTimeline = [...caseRecord.timeline];

    if (!existingStages.has("OCR")) {
      nextTimeline.push({
        id: `timeline-${caseRecord.id}-ocr`,
        title: "OCR và trích xuất hoàn tất",
        detail: "Hệ thống đã chuẩn hóa nội dung để chuẩn bị cho phân tích AI.",
        stage: "TextExtractOrOCR",
        at: ocrAt,
      });
    }

    if (!existingStages.has("AIAnalyzing")) {
      nextTimeline.push({
        id: `timeline-${caseRecord.id}-review`,
        title: "AI đã hoàn tất đánh giá",
        detail: `${review.riskFlags?.length || 0} cảnh báo đã được ghi nhận vào báo cáo tự động.`,
        stage: "AIAnalyzing",
        at: reviewAt,
      });
    }

    if (!existingStages.has("AutoPublished")) {
      nextTimeline.push({
        id: `timeline-${caseRecord.id}-published`,
        title: "Báo cáo đã sẵn sàng",
        detail: "Client có thể xem kết quả review và tiếp tục trao đổi theo case.",
        stage: "AutoPublished",
        at: publishedAt,
      });
    }

    return nextTimeline;
  }

  return [
    {
      id: `timeline-${caseRecord.id}-uploaded`,
      title: "Hồ sơ đã tiếp nhận",
      detail: "Client đã tạo hồ sơ mới từ CreateCase và chờ xử lý tự động.",
      stage: "Uploaded",
      at: caseRecord.createdAt,
    },
    {
      id: `timeline-${caseRecord.id}-ocr`,
      title: "OCR và trích xuất hoàn tất",
      detail: "Hệ thống đã chuẩn hóa nội dung từ tài liệu để chuẩn bị cho AI review.",
      stage: "TextExtractOrOCR",
      at: ocrAt,
    },
    {
      id: `timeline-${caseRecord.id}-review`,
      title: "AI đã hoàn tất đánh giá",
      detail: `${review.riskFlags?.length || 0} cảnh báo đã được ghi nhận vào báo cáo tự động.`,
      stage: "AIAnalyzing",
      at: reviewAt,
    },
    {
      id: `timeline-${caseRecord.id}-published`,
      title: "Báo cáo được công bố",
      detail: "Kết quả review đã sẵn sàng trong client portal cùng disclaimer và khuyến nghị.",
      stage: "AutoPublished",
      at: publishedAt,
    },
  ];
}

function readStoredCases() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : mockCases;
  } catch {
    return mockCases;
  }
}

export function CasesProvider({ children }) {
  const [cases, setCases] = useState(() => readStoredCases());
  const isReady = true;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  }, [cases]);

  function getCaseById(caseId) {
    return cases.find((entry) => entry.id === caseId) ?? null;
  }

  function createCase(payload) {
    const createdAt = new Date().toISOString();
    const createdAtMs = new Date(createdAt).getTime();
    const generatedId = `CASE-LOCAL-${String(cases.length + 1).padStart(3, "0")}`;
    const normalizedFiles = (payload.files || []).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    const nextCase = {
      id: generatedId,
      title: payload.title || "Hồ sơ mới",
      documentName: payload.documentName || "draft-upload.pdf",
      description: payload.description || "Hồ sơ được tạo từ luồng demo Milestone 5.",
      domain: payload.domain || "",
      status: "uploaded",
      riskLevel: "medium",
      needsAttention: false,
      createdAt,
      updatedAt: createdAt,
      extractedText: payload.extractedText || payload.description || "",
      attachments: normalizedFiles,
      slaDueAt: payload.slaDueAt || new Date(createdAtMs + 4 * 60 * 60 * 1000).toISOString(),
      review: null,
      timeline: [],
      chatMessages: [],
    };

    setCases((currentCases) => [nextCase, ...currentCases]);
    return nextCase;
  }

  function appendChatMessage(caseId, message) {
    setCases((currentCases) =>
      currentCases.map((entry) =>
        entry.id === caseId
          ? {
              ...entry,
              updatedAt: new Date().toISOString(),
              chatMessages: [...(entry.chatMessages || []), message],
            }
          : entry,
      ),
    );
  }

  function appendTimelineEvent(caseId, event) {
    setCases((currentCases) =>
      currentCases.map((entry) =>
        entry.id === caseId
          ? {
              ...entry,
              updatedAt: event.at || new Date().toISOString(),
              timeline: [...(entry.timeline || []), event],
            }
          : entry,
      ),
    );
  }

  function updateReview(caseId, review) {
    setCases((currentCases) =>
      currentCases.map((entry) =>
        entry.id === caseId
          ? {
              ...entry,
              review,
              riskLevel: getRiskLevelFromReview(review),
              needsAttention: Boolean(review?.needsAttention || getRiskLevelFromReview(review) === "high"),
              status: "auto_published",
              updatedAt: new Date().toISOString(),
              timeline: buildTimelineAfterReview(entry, review),
            }
          : entry,
      ),
    );
  }

  const value = {
    cases,
    isReady,
    getCaseById,
    createCase,
    appendChatMessage,
    appendTimelineEvent,
    updateReview,
  };

  return createElement(CasesContext.Provider, { value }, children);
}

export function useCases() {
  const context = useContext(CasesContext);

  if (!context) {
    throw new Error("useCases phải được dùng bên trong CasesProvider.");
  }

  return context;
}
