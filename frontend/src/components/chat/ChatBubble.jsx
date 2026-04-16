import { cn } from "../../lib/cn.js";
import { formatDateTime } from "../../lib/formatters.js";
import CitationCard from "./CitationCard.jsx";

export default function ChatBubble({ message }) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={cn("flex", isAssistant ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-2xl rounded-card-md px-4 py-4 shadow-ring",
          isAssistant ? "border border-line bg-[#fffefa] text-ink" : "bg-brand-500 text-brand-foreground",
        )}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
          <span>{isAssistant ? "Trợ lý AI" : "Bạn"}</span>
          <span className={cn(isAssistant ? "text-muted" : "text-brand-700/70")}>{formatDateTime(message.createdAt)}</span>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-lg leading-relaxed">{message.content}</p>
        {message.caution ? (
          <p className="mt-3 rounded-card bg-wise-warning/20 px-3 py-2 text-xs font-semibold text-amber-900">
            {message.caution}
          </p>
        ) : null}
        {typeof message.confidence === "number" ? (
          <p className="mt-2 text-xs text-muted">Độ tin cậy: {Math.round(message.confidence * 100)}%</p>
        ) : null}
        {message.citations?.length ? (
          <div className="mt-4 space-y-3">
            {message.citations.map((citation) => (
              <CitationCard key={citation.id || citation.label} citation={citation} />
            ))}
          </div>
        ) : null}
        {message.disclaimer ? (
          <p className="mt-3 border-t border-line pt-3 text-xs text-muted">{message.disclaimer}</p>
        ) : null}
      </div>
    </div>
  );
}
