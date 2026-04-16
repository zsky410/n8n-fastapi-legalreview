import { cn } from "../../lib/cn.js";

export default function Input({
  className,
  error,
  hint,
  label,
  multiline = false,
  ...props
}) {
  const Element = multiline ? "textarea" : "input";

  return (
    <label className="flex w-full flex-col gap-2.5">
      {label ? <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{label}</span> : null}
      <Element
        className={cn(
          "w-full rounded-[18px] border border-slate-200/80 bg-[#f8fafc] px-4 py-3 text-[15px] leading-6 text-ink outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition duration-200 placeholder:text-slate-400 focus-visible:border-brand-500/30 focus-visible:bg-white focus-visible:shadow-[0_0_0_4px_rgba(30,58,138,0.08)]",
          multiline ? "min-h-[176px] resize-y" : "min-h-[52px]",
          error && "border-wise-danger bg-rose-50/70 focus-visible:border-wise-danger focus-visible:shadow-[0_0_0_4px_rgba(180,35,24,0.08)]",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-wise-danger">{error}</span> : null}
      {!error && hint ? <span className="text-sm leading-6 text-muted">{hint}</span> : null}
    </label>
  );
}
