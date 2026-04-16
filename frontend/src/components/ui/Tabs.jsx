import { cn } from "../../lib/cn.js";

export default function Tabs({ className, tabs = [], value, onChange }) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full overflow-x-auto rounded-[18px] border border-slate-200/80 bg-white/70 p-1.5 shadow-[0_10px_26px_rgba(15,23,42,0.05)] backdrop-blur",
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            "whitespace-nowrap rounded-[14px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/10",
            value === tab.value
              ? "bg-brand-500 text-white shadow-[0_12px_24px_rgba(24,49,115,0.18)]"
              : "text-muted hover:text-ink",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ activeValue, className, value, children }) {
  if (activeValue !== value) {
    return null;
  }

  return <div className={cn("space-y-6", className)}>{children}</div>;
}
