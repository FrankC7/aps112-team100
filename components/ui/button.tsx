import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "md" | "lg" | "xl";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

export function buttonStyles({
  variant = "primary",
  size = "md"
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variant === "primary" &&
      "bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700",
    variant === "secondary" &&
      "border border-brand-200 bg-white text-brand-800 hover:border-brand-300 hover:bg-brand-50",
    variant === "ghost" && "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700",
    size === "md" && "h-11 px-4 text-sm",
    size === "lg" && "h-12 px-5 text-sm",
    size === "xl" && "h-14 px-6 text-base"
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(buttonStyles({ variant, size }), className)} {...props}>
      {children}
    </button>
  );
}

