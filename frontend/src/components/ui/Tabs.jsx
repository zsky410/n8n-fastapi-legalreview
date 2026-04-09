import { cn } from "../../lib/cn.js";

export default function Tabs({ className, tabs = [], value, onChange }) {
  return (
    <div className={cn("inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            "rounded-[14px] px-4 py-2 text-sm font-semibold transition",
            value === tab.value
              ? "bg-brand-900 text-white shadow-sm"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
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
