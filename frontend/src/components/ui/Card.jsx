import { cn } from "../../lib/cn.js";

export default function Card({ children, className }) {
  return <section className={cn("surface-panel", className)}>{children}</section>;
}

export function CardHeader({ children, className }) {
  return <div className={cn("flex flex-col gap-2 border-b border-slate-200/80 p-6", className)}>{children}</div>;
}

export function CardTitle({ children, className }) {
  return <h2 className={cn("text-lg font-semibold text-slate-900", className)}>{children}</h2>;
}

export function CardDescription({ children, className }) {
  return <p className={cn("text-sm leading-6 text-slate-500", className)}>{children}</p>;
}

export function CardContent({ children, className }) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

export function CardFooter({ children, className }) {
  return <div className={cn("border-t border-slate-200/80 px-6 py-4", className)}>{children}</div>;
}
