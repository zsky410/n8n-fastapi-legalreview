import { cn } from "../../lib/cn.js";

export default function Tabs({ className, tabs = [], value, onChange }) {
  return (
    <div className={cn("inline-flex max-w-full overflow-x-auto rounded-sm border border-line bg-white p-1 shadow-sm", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            "whitespace-nowrap rounded-sm px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
            value === tab.value
              ? "bg-ink text-white shadow-sm"
              : "text-muted hover:bg-[#f4f4f5] hover:text-ink",
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
