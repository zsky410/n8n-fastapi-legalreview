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

const DEFAULT_BASE_URL = "http://localhost:8000";

function normalizeMode(mode) {
  return API_MODE_OPTIONS.includes(mode) ? mode : "mock";
}

function wait(ms = 320) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function fetchJson(path, options = {}) {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const fallbackMessage = `${response.status} ${response.statusText}`;
    let payload = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw new Error(payload?.detail || payload?.message || fallbackMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function getApiMode() {
  return normalizeMode((import.meta.env.VITE_API_MODE || "mock").toLowerCase());
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

export async function reviewLegal(payload) {
  return runWithMode({
    allowFallback: true,
    mockHandler: () => buildReviewResponseFromCase(getCaseById(payload.caseId), payload),
    realHandler: () =>
      fetchJson("/v1/legal/review", {
        method: "POST",
        body: payload,
      }),
  });
}

export async function chatLegal(payload) {
  return runWithMode({
    allowFallback: true,
    mockHandler: () => buildChatResponse({ question: payload.question, caseRecord: getCaseById(payload.caseId) }),
    realHandler: () =>
      fetchJson("/v1/legal/chat", {
        method: "POST",
        body: payload,
      }),
  });
}
