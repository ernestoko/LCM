import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "outline" | "light" | "ghost";
type Size = "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-card hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card-hover active:translate-y-0",
  secondary:
    "bg-navy-900 text-white shadow-card hover:-translate-y-0.5 hover:bg-navy-950 hover:shadow-card-hover active:translate-y-0",
  outline:
    "border border-navy-300 bg-white/60 text-navy-800 hover:border-brand-400 hover:bg-white hover:text-brand-700",
  light:
    "bg-white text-navy-900 shadow-card hover:-translate-y-0.5 hover:bg-navy-50 hover:shadow-card-hover active:translate-y-0 focus-visible:ring-offset-navy-900",
  ghost: "text-navy-700 hover:bg-navy-100 hover:text-navy-900",
};

const sizes: Record<Size, string> = {
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

export function MButton({
  href,
  variant = "primary",
  size = "md",
  children,
  className,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)}>
      {children}
    </Link>
  );
}
