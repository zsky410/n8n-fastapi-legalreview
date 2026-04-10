import { ChevronDown } from "lucide-react";

import { cn } from "../../lib/cn.js";

export default function Select({ className, label, options = [], ...props }) {
  return (
    <label className="flex w-full flex-col gap-2">
      {label ? <span className="text-sm font-semibold text-ink">{label}</span> : null}
      <span className="relative">
        <select
          className={cn(
            "min-h-11 w-full appearance-none rounded-sm border border-line bg-white px-4 py-3 pr-11 text-sm text-ink outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15",
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
