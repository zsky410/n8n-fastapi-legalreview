import { cn } from "../../lib/cn.js";
import Spinner from "./Spinner.jsx";

const variantClasses = {
  primary:
    "bg-brand-500 text-brand-foreground shadow-ring hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-brand-700/30 focus-visible:ring-offset-2",
  secondary:
    "bg-brand-200 text-ink shadow-ring hover:bg-brand-200 focus-visible:ring-2 focus-visible:ring-brand-700/25 focus-visible:ring-offset-2",
  ghost: "bg-transparent text-ink shadow-none hover:bg-brand-200/80 focus-visible:ring-2 focus-visible:ring-brand-700/25 focus-visible:ring-offset-2",
  dark: "bg-warm-900 text-white shadow-ring hover:bg-warm-900 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2",
};

const sizeClasses = {
  sm: "h-10 min-h-[40px] px-4 text-base font-semibold",
  md: "h-11 min-h-[44px] px-4 text-lg font-semibold",
  lg: "h-12 min-h-[48px] px-5 text-lg font-semibold",
};

const motionScale =
  "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-reduce:hover:scale-100 motion-reduce:active:scale-100";

export default function Button({
  children,
  className,
  isLoading = false,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:motion-safe:hover:scale-100 disabled:motion-safe:active:scale-100",
        motionScale,
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Spinner className="h-4 w-4 text-current" /> : null}
      {children}
    </button>
  );
}
