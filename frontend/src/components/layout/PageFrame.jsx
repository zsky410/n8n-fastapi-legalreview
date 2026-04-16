import { cn } from "../../lib/cn.js";

export default function PageFrame({
  segments,
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  eyebrow = "Legal Workspace",
}) {
  const displayTitle = title || (Array.isArray(segments) ? segments.at(-1) : "");

  return (
    <div className={cn("space-y-8", className)}>
      {displayTitle ? (
        <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0 space-y-4">
            <div className="portal-kicker">{eyebrow}</div>
            <div className="space-y-3">
              {Array.isArray(segments) && segments.length ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                  {segments.join(" / ")}
                </p>
              ) : null}
              <h1 className="max-w-4xl font-serif text-[2.2rem] leading-[1.02] tracking-[-0.04em] text-ink sm:text-[2.6rem]">
                {displayTitle}
              </h1>
            </div>
            {description ? <p className="max-w-3xl text-[15px] leading-7 text-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("space-y-6", bodyClassName)}>{children}</div>
    </div>
  );
}
