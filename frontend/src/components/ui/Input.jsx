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
    <label className="flex w-full flex-col gap-2">
      {label ? <span className="text-sm font-semibold text-slate-700">{label}</span> : null}
      <Element
        className={cn(
          "min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100",
          multiline && "min-h-32 resize-y",
          error && "border-rose-300 focus:border-rose-400 focus:ring-rose-100",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-rose-600">{error}</span> : null}
      {!error && hint ? <span className="text-sm text-slate-500">{hint}</span> : null}
    </label>
  );
}
