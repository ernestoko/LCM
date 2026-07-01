"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "gold";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500 shadow-xs",
  secondary: "bg-navy-900 text-white hover:bg-navy-800 focus-visible:ring-navy-700 shadow-xs",
  outline: "border border-navy-200 bg-white text-navy-800 hover:bg-navy-50 focus-visible:ring-brand-400",
  ghost: "text-navy-700 hover:bg-navy-100 focus-visible:ring-navy-300",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-xs",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500 shadow-xs",
  gold: "bg-gold-600 text-white hover:bg-gold-700 focus-visible:ring-gold-400 shadow-xs",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      suppressHydrationWarning
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-1",
        "disabled:opacity-50 disabled:pointer-events-none",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
