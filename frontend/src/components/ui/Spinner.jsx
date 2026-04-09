import { cn } from "../../lib/cn.js";

export default function Spinner({ className }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent",
        className,
      )}
      aria-hidden="true"
    />
  );
}
