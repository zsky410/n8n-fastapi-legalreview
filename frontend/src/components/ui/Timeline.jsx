import { Clock3 } from "lucide-react";

import { formatDateTime } from "../../lib/formatters.js";

export default function Timeline({ items = [] }) {
  return (
    <div className="space-y-5">
      {items.map((item, index) => (
        <div key={item.id || `${item.title}-${index}`} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-gold">
              <Clock3 className="h-4 w-4" />
            </span>
            {index !== items.length - 1 ? <span className="mt-2 h-full w-px bg-line" /> : null}
          </div>
          <div className="flex-1 rounded-sm border border-line bg-white px-4 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
              <span className="rounded-full bg-[#f4f4f5] px-2.5 py-1 text-xs font-semibold text-muted">
                {item.stage}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-muted">{formatDateTime(item.at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
