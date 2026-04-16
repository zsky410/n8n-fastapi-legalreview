import { cn } from "../../lib/cn.js";

export default function PageFrame({ segments, title, description, actions, children, className, bodyClassName }) {
  const displayTitle = title || (Array.isArray(segments) ? segments.at(-1) : "");

  return (
    <div className={cn("space-y-6", className)}>
      {displayTitle ? (
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-[1.625rem] font-bold leading-tight tracking-[-0.02em] text-[#1a1614]">
              {displayTitle}
            </h1>
            {description ? (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#78716c]">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
