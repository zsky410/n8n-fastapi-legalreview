import { FileSearch } from "lucide-react";

import Button from "./Button.jsx";

export default function EmptyState({
  action,
  compact = false,
  description,
  title,
}) {
  return (
    <div
      className={
        compact
          ? "text-center"
          : "flex flex-col items-center rounded-card-md border border-dashed border-slate-300 bg-white/82 px-6 py-12 text-center shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
      }
    >
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-brand-500/15 bg-brand-50 text-brand-700 shadow-[0_10px_26px_rgba(30,58,138,0.08)]">
        <FileSearch className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-serif text-[1.65rem] leading-tight tracking-[-0.03em] text-ink">{title}</h3>
      <p className="mt-2 max-w-lg text-[15px] leading-7 text-muted">{description}</p>
      {action ? (
        <div className="mt-5">
          <Button {...action.props}>{action.label}</Button>
        </div>
      ) : null}
    </div>
  );
}
