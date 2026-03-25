import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "blue" | "green" | "amber" | "slate";

export function Badge({
  className,
  tone = "slate",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tone === "blue" && "bg-brand-50 text-brand-700",
        tone === "green" && "bg-emerald-50 text-emerald-700",
        tone === "amber" && "bg-amber-50 text-amber-700",
        tone === "slate" && "bg-slate-100 text-slate-700",
        className
      )}
      {...props}
    />
  );
}

