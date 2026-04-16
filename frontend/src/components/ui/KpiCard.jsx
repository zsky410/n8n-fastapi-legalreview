import { ArrowUpRight } from "lucide-react";

import { cn } from "../../lib/cn.js";
import Card, { CardContent } from "./Card.jsx";

/**
 * variant: màu nền + vạch trái để phân biệt KPI.
 * tone="accent" (legacy) ~ variant="attention"
 */
const variantStyles = {
  default: {
    card: "border-line bg-[#fffefa]",
    label: "text-muted-strong font-semibold",
    value: "text-ink",
  },
  total: {
    card: "border-line bg-[#fffefa]",
    label: "text-muted-strong font-semibold",
    value: "text-ink",
  },
  processing: {
    card: "border-brand-500/30 bg-brand-50",
    label: "text-brand-700 font-semibold",
    value: "text-brand-700",
  },
  published: {
    card: "border-wise-positive/25 bg-wise-mint/60",
    label: "text-wise-positive font-semibold",
    value: "text-wise-positive",
  },
  attention: {
    card: "border-wise-warning/40 bg-yellow-50",
    label: "text-amber-950 font-semibold",
    value: "text-amber-950",
  },
  quality: {
    card: "border-wise-danger/30 bg-red-50",
    label: "text-wise-danger font-semibold",
    value: "text-wise-danger",
  },
};

export default function KpiCard({ label, value, trend, className, tone = "default", variant }) {
  const resolvedVariant =
    variant ?? (tone === "accent" ? "attention" : "default");
  const v = variantStyles[resolvedVariant] ?? variantStyles.default;

  return (
    <Card className={cn("rounded-card", v.card, className)}>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-4">
          <span className={cn("text-sm", v.label)}>{label}</span>
          {trend ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-ring",
                resolvedVariant === "attention"
                  ? "bg-wise-warning/30 text-amber-950"
                  : resolvedVariant === "quality"
                    ? "bg-wise-danger/15 text-wise-danger"
                    : "bg-wise-mint text-wise-positive",
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
