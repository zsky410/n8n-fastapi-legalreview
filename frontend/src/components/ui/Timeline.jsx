import { Clock3 } from "lucide-react";

import { formatDateTime } from "../../lib/formatters.js";

export default function Timeline({ items = [] }) {
  return (
    <div className="space-y-5">
      {items.map((item, index) => (
        <div key={item.id || `${item.title}-${index}`} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <Clock3 className="h-4 w-4" />
            </span>
            {index !== items.length - 1 ? <span className="mt-2 h-full w-px bg-slate-200" /> : null}
          </div>
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                {item.stage}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{formatDateTime(item.at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
