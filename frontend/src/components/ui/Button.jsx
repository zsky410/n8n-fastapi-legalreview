import { cn } from "../../lib/cn.js";
import Spinner from "./Spinner.jsx";

const variantClasses = {
  primary:
    "bg-brand-500 text-brand-foreground shadow-[0_16px_36px_rgba(24,49,115,0.22)] hover:bg-brand-600 focus-visible:ring-4 focus-visible:ring-brand-500/15 focus-visible:ring-offset-0",
  secondary:
    "border border-slate-200/80 bg-white/80 text-ink shadow-[0_10px_26px_rgba(15,23,42,0.06)] hover:bg-white focus-visible:ring-4 focus-visible:ring-brand-500/10 focus-visible:ring-offset-0",
  ghost:
    "bg-transparent text-ink shadow-none hover:bg-slate-900/[0.04] focus-visible:ring-4 focus-visible:ring-brand-500/10 focus-visible:ring-offset-0",
  dark: "bg-warm-900 text-white shadow-[0_18px_40px_rgba(15,23,42,0.2)] hover:bg-slate-800 focus-visible:ring-4 focus-visible:ring-white/15 focus-visible:ring-offset-0",
};

const sizeClasses = {
  sm: "min-h-[40px] rounded-[14px] px-3.5 text-[13px] font-semibold",
  md: "min-h-[44px] rounded-[15px] px-4.5 text-[13px] font-semibold",
  lg: "min-h-[48px] rounded-[16px] px-5 text-sm font-semibold",
};

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
        "inline-flex items-center justify-center gap-2 whitespace-nowrap tracking-[0.01em] transition-all duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
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
