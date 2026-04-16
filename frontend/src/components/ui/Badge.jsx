import { cn } from "../../lib/cn.js";

export default function Badge({ children, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]",
        className,
      )}
    >
      {children}
    </span>
  );
}
