import { cn } from "../../lib/cn.js";
import { formatDateTime } from "../../lib/formatters.js";
import CitationCard from "./CitationCard.jsx";

export default function ChatBubble({ message }) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={cn("flex", isAssistant ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-2xl rounded-[24px] px-4 py-4 shadow-sm",
          isAssistant ? "border border-slate-200 bg-white text-slate-700" : "bg-brand-900 text-white",
        )}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
          <span>{isAssistant ? "Trợ lý AI" : "Bạn"}</span>
          <span className={cn(isAssistant ? "text-slate-400" : "text-brand-100")}>{formatDateTime(message.createdAt)}</span>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
        {message.caution ? (
          <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            {message.caution}
          </p>
        ) : null}
        {typeof message.confidence === "number" ? (
          <p className="mt-2 text-xs text-slate-500">Confidence: {Math.round(message.confidence * 100)}%</p>
        ) : null}
        {message.citations?.length ? (
          <div className="mt-4 space-y-3">
            {message.citations.map((citation) => (
              <CitationCard key={citation.id || citation.label} citation={citation} />
            ))}
          </div>
        ) : null}
        {message.disclaimer ? (
          <p className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-500">{message.disclaimer}</p>
        ) : null}
      </div>
    </div>
  );
}
