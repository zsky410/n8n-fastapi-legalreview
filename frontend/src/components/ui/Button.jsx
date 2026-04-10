import { cn } from "../../lib/cn.js";
import Spinner from "./Spinner.jsx";

const variantClasses = {
  primary: "bg-ink text-white hover:bg-ink/90",
  secondary: "bg-white text-ink ring-1 ring-inset ring-line hover:bg-[#f4f4f5]",
  ghost: "bg-transparent text-ink hover:bg-black/[0.04]",
  dark: "bg-ink text-white hover:bg-ink/90",
};

const sizeClasses = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
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
        "inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Spinner className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}
