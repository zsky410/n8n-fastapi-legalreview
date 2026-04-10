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
      {label ? <span className="text-sm font-semibold text-ink">{label}</span> : null}
      <Element
        className={cn(
          "min-h-11 w-full rounded-sm border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-gold focus:ring-4 focus:ring-gold/15",
          multiline && "min-h-32 resize-y",
          error && "border-rose-300 focus:border-rose-400 focus:ring-rose-100",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-rose-600">{error}</span> : null}
      {!error && hint ? <span className="text-sm text-muted">{hint}</span> : null}
    </label>
  );
}
