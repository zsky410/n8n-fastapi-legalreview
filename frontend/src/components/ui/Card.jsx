import { cn } from "../../lib/cn.js";

export default function Card({ children, className }) {
  return <section className={cn("surface-panel rounded-card-md", className)}>{children}</section>;
}

export function CardHeader({ children, className }) {
  return <div className={cn("flex flex-col gap-2 border-b border-slate-200/70 px-6 py-5 lg:px-7", className)}>{children}</div>;
}

export function CardTitle({ children, className }) {
  return (
    <h2 className={cn("font-serif text-[1.6rem] leading-tight tracking-[-0.03em] text-ink", className)}>{children}</h2>
  );
}

export function CardDescription({ children, className }) {
  return <p className={cn("max-w-3xl text-sm leading-6 text-muted", className)}>{children}</p>;
}

export function CardContent({ children, className }) {
  return <div className={cn("px-6 py-6 lg:px-7", className)}>{children}</div>;
}

export function CardFooter({ children, className }) {
  return <div className={cn("border-t border-slate-200/70 px-6 py-4 lg:px-7", className)}>{children}</div>;
}
