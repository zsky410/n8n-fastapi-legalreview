"use client";

import { Bot, Loader2, MessageSquareText, Send, UserRound } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  DocumentChatMessage,
  DocumentDetail,
  fetchDocumentChat,
  sendDocumentChatMessage,
} from "@/lib/api";
import { formatDateTime } from "@/lib/format";

const suggestedQuestions = [
  "Điểm nào cần sửa trước khi ký?",
  "Rủi ro cao nhất nằm ở điều khoản nào?",
  "Cần yêu cầu bổ sung tài liệu gì?",
  "Nếu tôi là bên ký, nên đàm phán lại gì?",
];

export function DocumentChatPanel({ document }: { document: DocumentDetail }) {
  const [messages, setMessages] = useState<DocumentChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const canChat = useMemo(() => {
    return document.processing_status === "completed" && Boolean(document.extracted_text?.trim());
  }, [document.extracted_text, document.processing_status]);

  useEffect(() => {
    if (!canChat) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);
    fetchDocumentChat(document.id)
      .then((items) => {
        if (isMounted) {
          setMessages(items);
        }
      })
      .catch((caught) => {
        if (isMounted) {
          setError(caught instanceof Error ? caught.message : "Không thể tải hội thoại AI");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [canChat, document.id]);

  useEffect(() => {
    if (!threadRef.current) {
      return;
    }
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, isSending]);

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const message = draft.trim();
    if (!message || isSending || !canChat) {
      return;
    }

    setDraft("");
    setError(null);
    setIsSending(true);
    try {
      const response = await sendDocumentChatMessage(document.id, message);
      setMessages(response.messages);
    } catch (caught) {
      setDraft(message);
      setError(caught instanceof Error ? caught.message : "Không thể gửi câu hỏi cho AI");
    } finally {
      setIsSending(false);
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void handleSubmit();
    }
  }

  function useSuggestion(question: string) {
    setDraft(question);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  if (!canChat) {
    return (
      <div className="document-chat-panel">
        <div className="chat-intro">
          <div className="chat-intro-icon">
            <MessageSquareText size={20} aria-hidden="true" />
          </div>
          <div>
            <h2>Hỏi AI theo tài liệu</h2>
            <p>Phần hỏi AI sẽ mở khi tài liệu đã trích xuất văn bản và hoàn tất bước AI rà soát.</p>
          </div>
        </div>
        <div className="chat-empty">
          Hệ thống vẫn đang xử lý hoặc chưa có văn bản trích xuất đủ để AI trả lời theo nội dung file.
        </div>
      </div>
    );
  }

  return (
    <div className="document-chat-panel">
      <div className="chat-intro">
        <div className="chat-intro-icon">
          <MessageSquareText size={20} aria-hidden="true" />
        </div>
        <div className="chat-intro-copy">
          <h2>Hỏi AI theo tài liệu</h2>
          <p>
            Hỏi tiếp về rủi ro, điều khoản cần sửa, tài liệu cần bổ sung hoặc cách đàm phán. AI sẽ bám vào
            văn bản trích xuất và kết quả rà soát hiện tại.
          </p>
        </div>
      </div>

      <div className="chat-suggestions" aria-label="Câu hỏi gợi ý">
        {suggestedQuestions.map((question) => (
          <button
            className="suggestion-chip"
            key={question}
            type="button"
            onClick={() => useSuggestion(question)}
            disabled={isSending}
          >
            {question}
          </button>
        ))}
      </div>

      {error ? <div className="chat-error">{error}</div> : null}

      <div className="chat-thread" ref={threadRef} aria-live="polite">
        {isLoading ? (
          <div className="chat-empty inline">
            <Loader2 className="spin-icon" size={18} aria-hidden="true" />
            Đang tải hội thoại
          </div>
        ) : messages.length ? (
          messages.map((message) => <ChatMessageBubble key={message.id} message={message} />)
        ) : (
          <div className="chat-empty">
            Chưa có câu hỏi nào. Bạn có thể bắt đầu bằng một câu rất cụ thể, ví dụ: “điểm nào nên sửa trước
            khi ký?”.
          </div>
        )}
        {isSending ? (
          <div className="chat-message assistant">
            <div className="chat-avatar">
              <Bot size={16} aria-hidden="true" />
            </div>
            <div className="chat-bubble">
              <div className="chat-message-meta">AI đang đọc lại ngữ cảnh tài liệu</div>
              <div className="chat-message-content loading-answer">
                <Loader2 className="spin-icon" size={16} aria-hidden="true" />
                Đang trả lời theo nội dung file...
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <form className="chat-composer" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleComposerKeyDown}
          placeholder="Hỏi AI về điều khoản, rủi ro, điểm cần sửa hoặc tài liệu cần bổ sung..."
          maxLength={4000}
          rows={3}
        />
        <div className="chat-send-row">
          <span className="chat-disclaimer">AI chỉ trả lời theo tài liệu đã upload. Nhấn Ctrl/⌘ + Enter để gửi.</span>
          <button className="primary-button compact" type="submit" disabled={!draft.trim() || isSending}>
            {isSending ? <Loader2 className="spin-icon" size={16} aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
            <span>{isSending ? "Đang gửi" : "Gửi câu hỏi"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

function ChatMessageBubble({ message }: { message: DocumentChatMessage }) {
  const isUser = message.role === "user";
  return (
    <article className={isUser ? "chat-message user" : "chat-message assistant"}>
      <div className="chat-avatar">
        {isUser ? <UserRound size={16} aria-hidden="true" /> : <Bot size={16} aria-hidden="true" />}
      </div>
      <div className={message.provider === "unavailable" ? "chat-bubble unavailable" : "chat-bubble"}>
        <div className="chat-message-meta">
          <span>{isUser ? "Bạn" : "AI pháp lý"}</span>
          <span>{formatDateTime(message.created_at)}</span>
        </div>
        <ChatMessageContent content={message.content} />
      </div>
    </article>
  );
}

function ChatMessageContent({ content }: { content: string }) {
  const lines = content.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) {
    return <div className="chat-message-content">Không có nội dung phản hồi.</div>;
  }
  return (
    <div className="chat-message-content">
      {lines.map((line, index) => (
        <p key={`${line.slice(0, 32)}-${index}`}>{renderInlineMarkdown(line)}</p>
      ))}
    </div>
  );
}

function renderInlineMarkdown(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
