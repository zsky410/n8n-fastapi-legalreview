import { X } from "lucide-react";
import { useEffect } from "react";

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
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.4)] px-4 py-10 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn("surface-panel max-h-[90vh] w-full max-w-lg overflow-hidden rounded-card-md", className)}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h3 className="text-[1.38rem] font-semibold leading-tight text-ink">{title}</h3>
            {description ? <p className="mt-2 text-lg leading-relaxed text-muted">{description}</p> : null}
          </div>
          <Button variant="ghost" size="sm" className="h-9 w-9 shrink-0 px-0" onClick={onClose} aria-label="Đóng modal">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
