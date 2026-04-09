import { ArrowUpRight } from "lucide-react";

import { cn } from "../../lib/cn.js";
import Card, { CardContent } from "./Card.jsx";

export default function KpiCard({ label, value, trend, className, tone = "default" }) {
  return (
    <Card
      className={cn(
        "border border-white/90 bg-white/95",
        tone === "accent" && "bg-brand-900 text-white",
        className,
      )}
    >
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-4">
          <span className={cn("text-sm font-medium", tone === "accent" ? "text-brand-100" : "text-slate-500")}>
            {label}
          </span>
          {trend ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                tone === "accent" ? "bg-white/10 text-white" : "bg-emerald-50 text-emerald-700",
              )}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              {trend}
            </span>
          ) : null}
        </div>
        <div className={cn("text-3xl font-semibold", tone === "accent" ? "text-white" : "text-slate-900")}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
