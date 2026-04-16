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
          : "flex flex-col items-center rounded-card border border-dashed border-line bg-white px-6 py-12 text-center shadow-ring"
      }
    >
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-brand-500/25 bg-brand-50 text-brand-700 shadow-ring">
        <FileSearch className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-[1.38rem] font-semibold leading-tight text-ink">{title}</h3>
      <p className="mt-2 max-w-lg text-lg leading-relaxed text-muted">{description}</p>
      {action ? (
        <div className="mt-5">
          <Button {...action.props}>{action.label}</Button>
        </div>
      ) : null}
    </div>
  );
}
