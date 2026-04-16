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
          "min-h-11 w-full rounded-[10px] border border-line bg-[#fffefa] px-3 py-2 text-lg text-ink outline-none transition placeholder:text-muted focus-visible:border-muted-strong focus-visible:shadow-[inset_0_0_0_1px_rgb(134,134,133)]",
          multiline && "min-h-32 resize-y",
          error && "border-wise-danger focus-visible:border-wise-danger focus-visible:shadow-none",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-wise-danger">{error}</span> : null}
      {!error && hint ? <span className="text-sm text-muted">{hint}</span> : null}
    </label>
  );
}
