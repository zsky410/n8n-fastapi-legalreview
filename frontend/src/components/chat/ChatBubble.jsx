import { cn } from "../../lib/cn.js";
import { formatDateTime } from "../../lib/formatters.js";
import CitationCard from "./CitationCard.jsx";

export default function ChatBubble({ message }) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={cn("flex", isAssistant ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-2xl rounded-card-md px-5 py-4 shadow-[0_18px_36px_rgba(15,23,42,0.05)]",
          isAssistant ? "border border-slate-200/80 bg-white/94 text-ink" : "bg-warm-900 text-white",
        )}
      >
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
          <span>{isAssistant ? "Trợ lý AI" : "Bạn"}</span>
          <span className={cn(isAssistant ? "text-muted" : "text-white/60")}>{formatDateTime(message.createdAt)}</span>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7">{message.content}</p>
        {message.caution ? (
          <p className="mt-3 rounded-card border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
            {message.caution}
          </p>
        ) : null}
        {typeof message.confidence === "number" ? (
          <p className={cn("mt-2 text-xs", isAssistant ? "text-muted" : "text-white/65")}>
            Độ tin cậy: {Math.round(message.confidence * 100)}%
          </p>
        ) : null}
        {message.citations?.length ? (
          <div className="mt-4 space-y-3">
            {message.citations.map((citation) => (
              <CitationCard key={citation.id || citation.label} citation={citation} />
            ))}
          </div>
        ) : null}
        {message.disclaimer ? (
          <p className={cn("mt-3 border-t pt-3 text-xs", isAssistant ? "border-slate-200 text-muted" : "border-white/10 text-white/60")}>
            {message.disclaimer}
          </p>
        ) : null}
      </div>
    </div>
  );
}
