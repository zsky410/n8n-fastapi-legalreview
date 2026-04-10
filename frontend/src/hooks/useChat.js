import { useState } from "react";

import { chatLegal } from "../lib/api.js";
import { useCases } from "./useCases.js";

export function useChat(caseId) {
  const { appendChatMessage, getCaseById } = useCases();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const currentCase = getCaseById(caseId);
  const messages = currentCase?.chatMessages || [];

  async function sendMessage(question) {
    if (!question.trim()) {
      return null;
    }

    const createdAt = new Date().toISOString();
    const userMessage = {
      id: `chat-user-${Date.now()}`,
      role: "user",
      content: question.trim(),
      createdAt,
      citations: [],
    };

    appendChatMessage(caseId, userMessage);
    setIsSending(true);
    setError("");

    try {
      const response = await chatLegal({
        caseId,
        question: question.trim(),
        language: "vi",
        conversationContext: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      });

      appendChatMessage(caseId, {
        id: `chat-assistant-${Date.now()}`,
        role: "assistant",
        content: response.answer,
        createdAt: new Date().toISOString(),
        citations: response.citations || [],
        caution: response.caution,
        confidence: response.confidence,
        disclaimer: response.disclaimer,
      });

      return response;
    } catch (apiError) {
      setError(apiError.message || "Không thể gửi câu hỏi lúc này.");
      throw apiError;
    } finally {
      setIsSending(false);
    }
  }

  return {
    messages,
    isSending,
    error,
    clearError() {
      setError("");
    },
    sendMessage,
  };
}
