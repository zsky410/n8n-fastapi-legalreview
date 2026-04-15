import { Fragment } from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "../../lib/cn.js";

/** Khung trang: breadcrumb + body. `bodyClassName` ghi đè padding mặc định nếu cần. */
export default function PageFrame({ segments, children, className, bodyClassName }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="px-1 py-1">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          {segments.map((label, index) => (
            <Fragment key={`${index}-${label}`}>
              {index > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0" /> : null}
              <span className={index === segments.length - 1 ? "text-brand-700" : undefined}>{label}</span>
            </Fragment>
          ))}
        </div>
      </div>
      <div className={cn("space-y-4", bodyClassName)}>{children}</div>
    </div>
  );
}
