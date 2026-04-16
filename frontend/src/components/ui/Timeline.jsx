import { Clock3 } from "lucide-react";

import { formatDateTime } from "../../lib/formatters.js";

export default function Timeline({ items = [] }) {
  return (
    <div className="space-y-5">
      {items.map((item, index) => (
        <div key={item.id || `${item.title}-${index}`} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-500/12 bg-brand-50 text-brand-700 shadow-[0_12px_24px_rgba(30,58,138,0.08)]">
              <Clock3 className="h-4 w-4" />
            </span>
            {index !== items.length - 1 ? <span className="mt-2 h-full w-px bg-slate-200" /> : null}
          </div>
          <div className="flex-1 rounded-card-md border border-slate-200/80 bg-white/90 px-5 py-4 shadow-[0_14px_28px_rgba(15,23,42,0.05)]">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                {item.stage}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{formatDateTime(item.at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
