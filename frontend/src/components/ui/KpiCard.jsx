import { ArrowUpRight } from "lucide-react";

import { cn } from "../../lib/cn.js";
import Card, { CardContent } from "./Card.jsx";

/**
 * variant: màu nền + vạch trái để phân biệt KPI.
 * tone="accent" (legacy) ≈ variant="attention"
 */
const variantStyles = {
  default: {
    card: "border-line bg-white border-l-4 border-l-ink/70",
    label: "text-ink/80 font-semibold",
    value: "text-ink",
  },
  total: {
    card: "border-line bg-[#f8fafc] border-l-4 border-l-slate-500",
    label: "text-slate-700 font-semibold",
    value: "text-ink",
  },
  processing: {
    card: "border-sky-200/90 bg-sky-50/95 border-l-4 border-l-sky-500",
    label: "text-sky-900 font-semibold",
    value: "text-sky-950",
  },
  published: {
    card: "border-emerald-200/90 bg-emerald-50/95 border-l-4 border-l-emerald-600",
    label: "text-emerald-900 font-semibold",
    value: "text-emerald-950",
  },
  attention: {
    card: "border-amber-200/95 bg-amber-50 border-l-4 border-l-amber-500",
    label: "text-amber-950 font-semibold",
    value: "text-amber-950",
  },
  quality: {
    card: "border-rose-200/95 bg-rose-50 border-l-4 border-l-rose-500",
    label: "text-rose-950 font-semibold",
    value: "text-rose-950",
  },
};

export default function KpiCard({ label, value, trend, className, tone = "default", variant }) {
  const resolvedVariant =
    variant ?? (tone === "accent" ? "attention" : "default");
  const v = variantStyles[resolvedVariant] ?? variantStyles.default;

  return (
    <Card className={cn("shadow-sm", v.card, className)}>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-4">
          <span className={cn("text-sm", v.label)}>{label}</span>
          {trend ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                resolvedVariant === "attention"
                  ? "bg-amber-200/80 text-amber-950"
                  : resolvedVariant === "quality"
                    ? "bg-rose-100 text-rose-900"
                    : "bg-emerald-100 text-emerald-800",
              )}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              {trend}
            </span>
          ) : null}
        </div>
        <div className={cn("text-3xl font-semibold tabular-nums tracking-tight", v.value)}>{value}</div>
      </CardContent>
    </Card>
  );
}
