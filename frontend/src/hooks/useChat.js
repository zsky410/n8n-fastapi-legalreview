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
    const normalizedQuestion = question.trim();

    if (!normalizedQuestion) {
      return null;
    }

    if (normalizedQuestion.length < 3) {
      setError("Câu hỏi cần ít nhất 3 ký tự để workflow và AI xử lý đúng.");
      return null;
    }

    const createdAt = new Date().toISOString();
    const userMessage = {
      id: `chat-user-${Date.now()}`,
      role: "user",
      content: normalizedQuestion,
      createdAt,
      citations: [],
    };

    appendChatMessage(caseId, userMessage);
    setIsSending(true);
    setError("");

    try {
      const response = await chatLegal({
        caseId,
        question: normalizedQuestion,
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
      const message =
        apiError.message === "Error in workflow"
          ? "Workflow n8n đang lỗi khi xử lý câu hỏi này. Hãy mở execution trong n8n để xem node bị lỗi."
          : apiError.message || "Không thể gửi câu hỏi lúc này.";

      setError(message);
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
