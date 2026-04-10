import { X } from "lucide-react";

import { cn } from "../../lib/cn.js";
import Button from "./Button.jsx";

export default function Modal({
  children,
  className,
  description,
  onClose,
  open,
  title,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-10">
      <div className={cn("surface-panel w-full max-w-lg overflow-hidden", className)}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
            {description ? <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}
          </div>
          <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full px-0" onClick={onClose} aria-label="Đóng modal">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
