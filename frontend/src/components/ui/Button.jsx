import { cn } from "../../lib/cn.js";
import Spinner from "./Spinner.jsx";

const variantClasses = {
  primary:
    "bg-brand-500 text-brand-foreground shadow-sm hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-brand-700/30 focus-visible:ring-offset-2",
  secondary:
    "bg-white text-ink border border-line shadow-sm hover:bg-[#f5f5f3] focus-visible:ring-2 focus-visible:ring-brand-700/20 focus-visible:ring-offset-2",
  ghost:
    "bg-transparent text-ink shadow-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-brand-700/20 focus-visible:ring-offset-2",
  dark: "bg-[#1a1614] text-white shadow-sm hover:bg-[#2a2624] focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2",
};

const sizeClasses = {
  sm: "h-9 min-h-[36px] px-3 text-[13px] font-medium",
  md: "h-10 min-h-[40px] px-4 text-sm font-medium",
  lg: "h-11 min-h-[44px] px-5 text-sm font-medium",
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
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
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
