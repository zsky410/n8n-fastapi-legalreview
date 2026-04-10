import { FileSearch } from "lucide-react";

import Button from "./Button.jsx";

export default function EmptyState({
  action,
  compact = false,
  description,
  title,
}) {
  return (
    <div className={compact ? "text-center" : "flex flex-col items-center rounded-sm border border-dashed border-line bg-white px-6 py-12 text-center"}>
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-gold">
        <FileSearch className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-lg text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-5"><Button {...action.props}>{action.label}</Button></div> : null}
    </div>
  );
}
