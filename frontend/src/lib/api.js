import {
  API_MODE_OPTIONS,
} from "./constants.js";
import {
  buildChatResponse,
  buildReviewResponseFromCase,
  getCaseById,
  mockAuditLogs,
  mockCases,
  mockHealthResponse,
  mockRoutingRules,
  mockUsers,
  mockWorkflowExecutions,
} from "./mockData.js";

const DEFAULT_BASE_URL = "http://localhost:8080";
const DEFAULT_N8N_BASE_URL = "http://localhost:5678";
const DEFAULT_DISCLAIMER = "Kết quả AI chỉ có giá trị tham khảo, không thay thế tư vấn pháp lý chuyên nghiệp.";
const REVIEW_MIN_TEXT_LENGTH = 50;
const REVIEW_TRANSPORT_OPTIONS = ["api", "n8n"];

function normalizeMode(mode) {
  return API_MODE_OPTIONS.includes(mode) ? mode : "mock";
}

function wait(ms = 320) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function normalizeTransport(transport) {
  return REVIEW_TRANSPORT_OPTIONS.includes(transport) ? transport : "api";
}

function createApiError({ response, payload, fallbackMessage }) {
  const error = new Error(payload?.detail || payload?.message || fallbackMessage);
  error.name = "ApiError";
  error.status = response?.status || 0;
  error.code = payload?.error || "api_error";
  error.details = Array.isArray(payload?.details) ? payload.details : [];
  error.requestId = payload?.requestId || "";
  return error;
}

async function requestJson(baseUrl, path, options = {}) {
  let response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    const error = new Error("Không thể kết nối tới máy chủ lúc này.");
    error.name = "NetworkError";
    error.code = "network_error";
    error.details = [];
    error.requestId = "";
    throw error;
  }

  if (!response.ok) {
    const fallbackMessage = `${response.status} ${response.statusText}`;
    let payload = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw createApiError({ response, payload, fallbackMessage });
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function requestFormData(baseUrl, path, options = {}) {
  let response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: options.method || "POST",
      headers: {
        ...(options.headers || {}),
      },
      body: options.body,
    });
  } catch {
    const error = new Error("Không thể kết nối tới máy chủ lúc này.");
    error.name = "NetworkError";
    error.code = "network_error";
    error.details = [];
    error.requestId = "";
    throw error;
  }

  if (!response.ok) {
    const fallbackMessage = `${response.status} ${response.statusText}`;
    let payload = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw createApiError({ response, payload, fallbackMessage });
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function fetchJson(path, options = {}) {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  return requestJson(baseUrl, path, options);
}

async function fetchN8nJson(path, options = {}) {
  const baseUrl = (import.meta.env.VITE_N8N_BASE_URL || DEFAULT_N8N_BASE_URL).replace(/\/$/, "");
  const payload = await requestJson(baseUrl, path, options);

  if (payload?.success === false) {
    throw new Error(payload?.error?.message || "Workflow n8n trả về trạng thái thất bại.");
  }

  return payload;
}

async function postFormData(path, formData) {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  return requestFormData(baseUrl, path, {
    method: "POST",
    body: formData,
  });
}

export function getApiMode() {
  return normalizeMode((import.meta.env.VITE_API_MODE || "hybrid").toLowerCase());
}

export function getReviewTransport() {
  return normalizeTransport((import.meta.env.VITE_REVIEW_TRANSPORT || "api").toLowerCase());
}

export function isN8nTransport() {
  return getReviewTransport() === "n8n";
}

export function isMockMode() {
  return getApiMode() === "mock";
}

export function isHybridMode() {
  return getApiMode() === "hybrid";
}

export function isRealMode() {
  return getApiMode() === "real";
}

async function runWithMode({ mockHandler, realHandler, allowFallback = false }) {
  if (isMockMode()) {
    await wait();
    return mockHandler();
  }

  try {
    return await realHandler();
  } catch (error) {
    if (allowFallback && isHybridMode()) {
      await wait();
      return mockHandler();
    }

    throw error;
  }
}

function buildReviewInputText(payload = {}) {
  const extractedText = String(payload.extractedText || "").trim();

  if (extractedText.length >= REVIEW_MIN_TEXT_LENGTH) {
    return extractedText;
  }

  const synthesizedText = [
    extractedText,
    payload.description ? `Mô tả hồ sơ: ${payload.description}` : "",
    payload.title ? `Tiêu đề hồ sơ: ${payload.title}` : "",
    payload.metadata?.documentName ? `Tên tài liệu: ${payload.metadata.documentName}` : "",
    payload.metadata?.documentTypeHint || payload.metadata?.domain || payload.domain
      ? `Lĩnh vực: ${payload.metadata?.documentTypeHint || payload.metadata?.domain || payload.domain}`
      : "",
    payload.metadata?.priority || payload.priority
      ? `Mức ưu tiên: ${payload.metadata?.priority || payload.priority}`
      : "",
  ]
    .filter(Boolean)
    .join(". ");

  if (synthesizedText.length >= REVIEW_MIN_TEXT_LENGTH) {
    return synthesizedText;
  }

  return `${synthesizedText}. Người dùng cần đánh giá sơ bộ tài liệu dựa trên thông tin hiện có.`.trim();
}

function normalizeReviewPayload(payload = {}) {
  return {
    caseId: payload.caseId,
    extractedText: buildReviewInputText(payload),
    language: payload.language || "vi",
    metadata: {
      documentName: payload.metadata?.documentName || payload.documentName || "tai_lieu_moi.pdf",
      documentTypeHint: payload.metadata?.documentTypeHint || payload.metadata?.domain || payload.domain || "general legal document",
      priority: payload.metadata?.priority || payload.priority || "medium",
      submittedBy: payload.metadata?.submittedBy || "client_portal",
      sourceSystem: payload.metadata?.sourceSystem || "web_app",
      tags: Array.isArray(payload.metadata?.tags) ? payload.metadata.tags : [],
    },
  };
}

function normalizeReviewRiskFlags(flags = []) {
  if (!Array.isArray(flags)) {
    return [];
  }
  return flags.map((flag, index) => {
    if (typeof flag === "string") {
      return {
        code: `risk_${index + 1}`,
        label: flag,
        severity: "medium",
        excerpt: flag,
        rationale: "",
      };
    }
    return {
      code: flag.code || `risk_${index + 1}`,
      label: flag.label || flag.excerpt || "Cảnh báo rủi ro",
      severity: flag.severity || "medium",
      excerpt: flag.excerpt || "",
      rationale: flag.rationale || "",
    };
  });
}

function normalizeReviewResponse(raw = {}, fallbackPayload = {}) {
  const qualityWarningText =
    typeof raw.qualityWarning === "string"
      ? raw.qualityWarning
      : raw.qualityWarning
        ? "Chất lượng dữ liệu đầu vào cần được kiểm tra thêm."
        : "";

  return {
    caseId: raw.caseId || fallbackPayload.caseId || "",
    docType: raw.docType || "Tài liệu pháp lý tổng quát",
    confidence: Number(raw.confidence ?? 0),
    riskScore: Number(raw.riskScore ?? 0),
    riskLevel: raw.riskLevel || "low",
    riskFlags: normalizeReviewRiskFlags(raw.riskFlags),
    extractedFields: raw.extractedFields || {},
    recommendedAction: raw.recommendedAction || "review",
    summary: raw.summary || "Chưa có tóm tắt chi tiết từ hệ thống.",
    needsAttention: Boolean(raw.needsAttention),
    qualityWarning: qualityWarningText,
    disclaimer: raw.disclaimer || DEFAULT_DISCLAIMER,
    meta: {
      requestId: raw.meta?.requestId || "",
      provider: raw.meta?.provider || "mock",
      model: raw.meta?.model || "mock-legal-review-v1",
      latencyMs: Number(raw.meta?.latencyMs ?? raw.meta?.processingMs ?? 0),
    },
  };
}

function normalizeChatResponse(raw = {}, fallbackPayload = {}) {
  const normalizedCitations = Array.isArray(raw.citations)
    ? raw.citations.map((citation, index) => ({
        id: `cit-${Date.now()}-${index}`,
        label: citation.label || citation.source || `Trích dẫn ${index + 1}`,
        excerpt: citation.excerpt || "",
        source: citation.source || citation.label || "",
        rationale: citation.rationale || "",
      }))
    : [];

  return {
    caseId: raw.caseId || fallbackPayload.caseId || "",
    answer: raw.answer || "Hệ thống chưa trả về câu trả lời.",
    citations: normalizedCitations,
    caution: raw.caution || "",
    confidence: Number(raw.confidence ?? 0),
    needsAttention: Boolean(raw.needsAttention),
    disclaimer: raw.disclaimer || DEFAULT_DISCLAIMER,
  };
}

function normalizeReviewTransportResponse(raw = {}, fallbackPayload = {}) {
  const reviewPayload = raw?.review && typeof raw.review === "object" ? raw.review : raw;
  return {
    ...normalizeReviewResponse(reviewPayload, fallbackPayload),
    routeDecision: raw?.routeDecision || null,
    timelineEvent: raw?.timelineEvent || null,
    notification: raw?.notification || null,
    orchestration: raw?.orchestration || null,
    nextStep: raw?.nextStep || null,
  };
}

function normalizeChatTransportResponse(raw = {}, fallbackPayload = {}) {
  const chatPayload = raw?.chat && typeof raw.chat === "object" ? raw.chat : raw;
  return {
    ...normalizeChatResponse(chatPayload, fallbackPayload),
    routeDecision: raw?.routeDecision || null,
    timelineEvent: raw?.timelineEvent || null,
    nextStep: raw?.nextStep || null,
  };
}

export async function getCases() {
  await wait();
  return mockCases;
}

export async function getUsers() {
  await wait();
  return mockUsers;
}

export async function getRoutingRules() {
  await wait();
  return mockRoutingRules;
}

export async function getAuditLogs() {
  await wait();
  return mockAuditLogs;
}

export async function getWorkflowExecutions() {
  await wait();
  return mockWorkflowExecutions;
}

export async function getHealth() {
  return runWithMode({
    allowFallback: true,
    mockHandler: () => mockHealthResponse,
    realHandler: () => fetchJson("/health"),
  });
}

export async function registerClientAccount(payload) {
  return fetchJson("/v1/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function loginClientAccount(payload) {
  return fetchJson("/v1/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function getCurrentClientAccount(accessToken) {
  return fetchJson("/v1/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function extractDocumentText(file, language = "vi") {
  if (!(file instanceof File)) {
    throw new Error("Chưa có tệp hợp lệ để OCR.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("language", language);

  return runWithMode({
    allowFallback: false,
    mockHandler: async () => {
      const isTextFile = String(file.type || "").startsWith("text/") || /\.(txt|md|markdown|csv|json|xml|html?)$/i.test(file.name);
      if (!isTextFile) {
        throw new Error("OCR thật cho PDF hoặc ảnh chỉ hoạt động khi frontend đang dùng API thật.");
      }

      const extractedText = String(await file.text()).trim();
      return {
        fileName: file.name,
        mimeType: file.type || null,
        extractedText,
        provider: "browser",
        source: "direct_text",
        textLength: extractedText.length,
        truncated: false,
        warning: "OCR thật chỉ hoạt động khi frontend đang dùng API thật.",
      };
    },
    realHandler: () => postFormData("/v1/legal/ocr", formData),
  });
}

export async function reviewLegal(payload) {
  const normalizedPayload = normalizeReviewPayload(payload);
  return runWithMode({
    allowFallback: true,
    mockHandler: () => normalizeReviewTransportResponse(buildReviewResponseFromCase(getCaseById(payload.caseId), normalizedPayload), normalizedPayload),
    realHandler: () => {
      if (isN8nTransport()) {
        return fetchN8nJson("/webhook/legaldesk-review-fastapi", {
          method: "POST",
          body: normalizedPayload,
        }).then((response) => normalizeReviewTransportResponse(response, normalizedPayload));
      }

      return fetchJson("/v1/legal/review", {
        method: "POST",
        body: normalizedPayload,
      }).then((response) => normalizeReviewTransportResponse(response, normalizedPayload));
    },
  });
}

export async function chatLegal(payload) {
  const normalizedPayload = {
    caseId: payload.caseId,
    question: String(payload.question || "").trim(),
    language: payload.language || "vi",
    conversationContext: Array.isArray(payload.conversationContext) ? payload.conversationContext : [],
  };
  return runWithMode({
    allowFallback: true,
    mockHandler: () =>
      normalizeChatTransportResponse(
        buildChatResponse({ question: normalizedPayload.question, caseRecord: getCaseById(normalizedPayload.caseId) }),
        normalizedPayload,
      ),
    realHandler: () => {
      if (isN8nTransport()) {
        return fetchN8nJson("/webhook/legaldesk-chat-fastapi", {
          method: "POST",
          body: normalizedPayload,
        }).then((response) => normalizeChatTransportResponse(response, normalizedPayload));
      }

      return fetchJson("/v1/legal/chat", {
        method: "POST",
        body: normalizedPayload,
      }).then((response) => normalizeChatTransportResponse(response, normalizedPayload));
    },
  });
}
