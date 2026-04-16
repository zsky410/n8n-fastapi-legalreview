import { ChevronDown } from "lucide-react";

import { cn } from "../../lib/cn.js";

export default function Select({ className, label, options = [], ...props }) {
  return (
    <label className="flex w-full flex-col gap-2.5">
      {label ? <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{label}</span> : null}
      <span className="relative">
        <select
          className={cn(
            "min-h-[52px] w-full appearance-none rounded-[18px] border border-slate-200/80 bg-[#f8fafc] px-4 py-3 pr-12 text-[15px] leading-6 text-ink outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition duration-200 focus-visible:border-brand-500/30 focus-visible:bg-white focus-visible:shadow-[0_0_0_4px_rgba(30,58,138,0.08)]",
            className,
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      </span>
    </label>
  );
}
