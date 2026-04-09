import { createContext, createElement, useContext, useEffect, useState } from "react";

import { mockCases } from "../lib/mockData.js";

const STORAGE_KEY = "legaldesk-ui-cases";
const CasesContext = createContext(null);

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
    const generatedId = `CASE-LOCAL-${String(cases.length + 1).padStart(3, "0")}`;
    const nextCase = {
      id: generatedId,
      title: payload.title || "Hồ sơ mới",
      documentName: payload.documentName || "draft-upload.pdf",
      description: payload.description || "Hồ sơ nháp được tạo từ scaffold Phase 1.",
      status: "uploaded",
      riskLevel: "low",
      needsAttention: false,
      createdAt,
      updatedAt: createdAt,
      extractedText: payload.extractedText || "",
      review: null,
      timeline: [
        {
          id: `timeline-${generatedId}`,
          title: "Đã tạo hồ sơ nháp",
          detail: "Hồ sơ được tạo từ scaffold local state.",
          stage: "Đã tải lên",
          at: createdAt,
        },
      ],
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
              updatedAt: new Date().toISOString(),
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
