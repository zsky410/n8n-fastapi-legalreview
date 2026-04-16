import { cn } from "../../lib/cn.js";

export default function Tabs({ className, tabs = [], value, onChange }) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full overflow-x-auto rounded-lg border border-line bg-[#f5f5f3] p-1",
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            "whitespace-nowrap rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/30",
            value === tab.value
              ? "bg-white text-ink shadow-sm"
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
