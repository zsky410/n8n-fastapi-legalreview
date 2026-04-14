import { createContext, createElement, useContext, useEffect, useReducer } from "react";

import { useAuth } from "./useAuth.js";
import { createClientCase, listClientCases, saveClientCaseReview } from "../lib/api.js";

const CasesContext = createContext(null);

const initialState = {
  cases: [],
  error: "",
  isReady: false,
};

function casesReducer(state, action) {
  switch (action.type) {
    case "reset":
      return {
        cases: [],
        error: "",
        isReady: true,
      };
    case "load_start":
      return {
        ...state,
        error: "",
        isReady: false,
      };
    case "load_success":
      return {
        cases: action.cases,
        error: "",
        isReady: true,
      };
    case "load_error":
      return {
        cases: [],
        error: action.error,
        isReady: true,
      };
    case "set_cases":
      return {
        ...state,
        cases: action.cases,
      };
    case "prepend_case":
      return {
        ...state,
        cases: [action.caseRecord, ...state.cases.filter((entry) => entry.id !== action.caseRecord.id)],
      };
    case "replace_case":
      return {
        ...state,
        cases: state.cases.map((entry) =>
          entry.id === action.caseId
            ? {
                ...action.caseRecord,
                chatMessages: entry.chatMessages || action.caseRecord.chatMessages,
              }
            : entry,
        ),
      };
    case "append_chat_message":
      return {
        ...state,
        cases: state.cases.map((entry) =>
          entry.id === action.caseId
            ? {
                ...entry,
                updatedAt: new Date().toISOString(),
                chatMessages: [...(entry.chatMessages || []), action.message],
              }
            : entry,
        ),
      };
    case "append_timeline_event":
      return {
        ...state,
        cases: state.cases.map((entry) =>
          entry.id === action.caseId
            ? {
                ...entry,
                updatedAt: action.event.at || new Date().toISOString(),
                timeline: [...(entry.timeline || []), action.event],
              }
            : entry,
        ),
      };
    default:
      return state;
  }
}

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

    if (!existingStages.has("OCR") && !existingStages.has("TextExtractOrOCR")) {
      nextTimeline.push({
        id: `timeline-${caseRecord.id}-ocr`,
        title: "OCR và trích xuất hoàn tất",
        detail: "Hệ thống đã chuẩn hóa nội dung để chuẩn bị cho phân tích AI.",
        stage: "OCR",
        at: ocrAt,
      });
    }

    if (!existingStages.has("AIAnalyzing") && !existingStages.has("Phân tích AI")) {
      nextTimeline.push({
        id: `timeline-${caseRecord.id}-review`,
        title: "AI đã hoàn tất đánh giá",
        detail: `${review.riskFlags?.length || 0} cảnh báo đã được ghi nhận vào báo cáo tự động.`,
        stage: "Phân tích AI",
        at: reviewAt,
      });
    }

    if (!existingStages.has("AutoPublished") && !existingStages.has("Đã công bố")) {
      nextTimeline.push({
        id: `timeline-${caseRecord.id}-published`,
        title: "Báo cáo đã sẵn sàng",
        detail: "Khách hàng có thể xem kết quả phân tích và tiếp tục trao đổi ngay trên hồ sơ.",
        stage: "Đã công bố",
        at: publishedAt,
      });
    }

    return nextTimeline;
  }

  return [
    {
      id: `timeline-${caseRecord.id}-uploaded`,
      title: "Hồ sơ đã tiếp nhận",
      detail: "Khách hàng đã tạo hồ sơ mới và đang chờ hệ thống xử lý tự động.",
      stage: "Đã tải lên",
      at: caseRecord.createdAt,
    },
    {
      id: `timeline-${caseRecord.id}-ocr`,
      title: "OCR và trích xuất hoàn tất",
      detail: "Hệ thống đã chuẩn hóa nội dung từ tài liệu để chuẩn bị cho phân tích AI.",
      stage: "OCR",
      at: ocrAt,
    },
    {
      id: `timeline-${caseRecord.id}-review`,
      title: "AI đã hoàn tất đánh giá",
      detail: `${review.riskFlags?.length || 0} cảnh báo đã được ghi nhận vào báo cáo tự động.`,
      stage: "Phân tích AI",
      at: reviewAt,
    },
    {
      id: `timeline-${caseRecord.id}-published`,
      title: "Báo cáo được công bố",
      detail: "Kết quả phân tích đã sẵn sàng cùng lưu ý sử dụng và khuyến nghị xử lý.",
      stage: "Đã công bố",
      at: publishedAt,
    },
  ];
}

function normalizeReview(review) {
  if (!review) {
    return null;
  }

  return {
    ...review,
    confidence: Number(review.confidence ?? 0),
    riskScore: Number(review.riskScore ?? 0),
    qualityWarning:
      typeof review.qualityWarning === "string"
        ? review.qualityWarning
        : review.qualityWarning
          ? "Chất lượng dữ liệu đầu vào cần được kiểm tra thêm."
          : "",
    meta: {
      ...(review.meta || {}),
      latencyMs: Number(review?.meta?.latencyMs ?? review?.meta?.processingMs ?? 0),
    },
  };
}

function normalizeChatMessage(message = {}, index = 0) {
  const citations = Array.isArray(message.citations)
    ? message.citations.map((citation, citationIndex) => ({
        id: citation.id || `chat-citation-${index}-${citationIndex}`,
        label: citation.label || citation.source || `Trích dẫn ${citationIndex + 1}`,
        excerpt: citation.excerpt || "",
        source: citation.source || citation.label || "",
        rationale: citation.rationale || "",
      }))
    : [];

  return {
    id: message.id || `chat-message-${index}`,
    role: message.role || "assistant",
    content: message.content || "",
    createdAt: message.createdAt || new Date().toISOString(),
    citations,
    caution: message.caution || "",
    confidence: typeof message.confidence === "number" ? message.confidence : null,
    disclaimer: message.disclaimer || "",
  };
}

function normalizeCaseRecord(caseRecord) {
  const review = normalizeReview(caseRecord.review);
  const nextCase = {
    id: caseRecord.id,
    title: caseRecord.title || "Hồ sơ mới",
    documentName: caseRecord.documentName || "tai_lieu_moi.pdf",
    description: caseRecord.description || "Hồ sơ đang chờ hệ thống phân tích và tổng hợp kết quả.",
    domain: caseRecord.domain || "",
    priority: caseRecord.priority || "medium",
    status: caseRecord.status || "uploaded",
    riskLevel: caseRecord.riskLevel || getRiskLevelFromReview(review),
    needsAttention: Boolean(caseRecord.needsAttention),
    createdAt: caseRecord.createdAt || new Date().toISOString(),
    updatedAt: caseRecord.updatedAt || caseRecord.createdAt || new Date().toISOString(),
    extractedText: caseRecord.extractedText || "",
    attachments: Array.isArray(caseRecord.attachments) ? caseRecord.attachments : [],
    slaDueAt: caseRecord.slaDueAt || null,
    review,
    timeline: [],
    chatMessages: Array.isArray(caseRecord.chatMessages)
      ? caseRecord.chatMessages.map((message, index) => normalizeChatMessage(message, index))
      : [],
  };

  if (review) {
    nextCase.timeline = buildTimelineAfterReview(nextCase, review);
  }

  return nextCase;
}

export function CasesProvider({ children }) {
  const { accessToken, isHydrated, user } = useAuth();
  const [{ cases, error, isReady }, dispatch] = useReducer(casesReducer, initialState);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!user || user.role !== "client" || !accessToken) {
      dispatch({ type: "reset" });
      return;
    }

    let isActive = true;

    dispatch({ type: "load_start" });

    listClientCases(accessToken)
      .then((nextCases) => {
        if (!isActive) {
          return;
        }

        dispatch({
          type: "load_success",
          cases: nextCases.map((caseRecord) => normalizeCaseRecord(caseRecord)),
        });
      })
      .catch((loadError) => {
        if (!isActive) {
          return;
        }

        dispatch({
          type: "load_error",
          error: loadError.message || "Không thể tải danh sách hồ sơ lúc này.",
        });
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, isHydrated, user]);

  function getCaseById(caseId) {
    return cases.find((entry) => entry.id === caseId) ?? null;
  }

  async function createCase(payload) {
    if (!accessToken) {
      throw new Error("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại trước khi tạo hồ sơ.");
    }

    const normalizedFiles = (payload.files || []).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    const createdCase = await createClientCase(accessToken, {
      title: payload.title || "Hồ sơ mới",
      documentName: payload.documentName || "tai_lieu_nhap_tay.pdf",
      description: payload.description || "Hồ sơ đang chờ hệ thống phân tích và tổng hợp kết quả.",
      domain: payload.domain || "",
      priority: payload.priority || "medium",
      extractedText: payload.extractedText || payload.description || "",
      attachments: normalizedFiles,
      slaDueAt: payload.slaDueAt || null,
    });

    const normalizedCase = normalizeCaseRecord(createdCase);
    dispatch({ type: "prepend_case", caseRecord: normalizedCase });
    return normalizedCase;
  }

  function appendChatMessage(caseId, message) {
    dispatch({ type: "append_chat_message", caseId, message });
  }

  function appendTimelineEvent(caseId, event) {
    dispatch({ type: "append_timeline_event", caseId, event });
  }

  async function updateReview(caseId, review) {
    if (!accessToken) {
      throw new Error("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại trước khi lưu kết quả phân tích.");
    }

    const savedCase = await saveClientCaseReview(accessToken, caseId, review);
    const normalizedCase = normalizeCaseRecord(savedCase);

    dispatch({ type: "replace_case", caseId, caseRecord: normalizedCase });

    return normalizedCase;
  }

  const value = {
    cases,
    isReady,
    error,
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
