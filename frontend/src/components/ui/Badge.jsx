import { cn } from "../../lib/cn.js";

export default function Badge({ children, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold tracking-[0.125px]",
        className,
      )}
    >
      {children}
    </span>
  );
}
