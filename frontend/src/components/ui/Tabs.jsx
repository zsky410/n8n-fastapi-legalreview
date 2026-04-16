import { cn } from "../../lib/cn.js";

export default function Tabs({ className, tabs = [], value, onChange }) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full overflow-x-auto rounded-full border border-line bg-[#fffefa] p-1 shadow-ring",
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            "motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:scale-105 motion-safe:active:scale-95 whitespace-nowrap rounded-full px-4 py-2 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/30",
            value === tab.value
              ? "bg-brand-500 text-brand-foreground shadow-ring"
              : "text-muted hover:bg-[rgba(122,31,43,0.08)] hover:text-ink",
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
