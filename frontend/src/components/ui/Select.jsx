import { ChevronDown } from "lucide-react";

import { cn } from "../../lib/cn.js";

export default function Select({ className, label, options = [], ...props }) {
  return (
    <label className="flex w-full flex-col gap-2">
      {label ? <span className="text-sm font-semibold text-ink">{label}</span> : null}
      <span className="relative">
        <select
          className={cn(
            "min-h-11 w-full appearance-none rounded-[10px] border border-line bg-white px-3 py-2 pr-11 text-lg text-ink outline-none transition focus-visible:border-muted-strong focus-visible:shadow-[inset_0_0_0_1px_rgb(134,134,133)]",
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
