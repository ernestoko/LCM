import {
  AlertCircle,
  AlertTriangle,
  BellRing,
  Boxes,
  Building2,
  CheckCircle2,
  CircleAlert,
  CircleCheck,
  ClipboardCheck,
  ClipboardList,
  Clock,
  DollarSign,
  FileText,
  Gauge,
  Globe,
  Inbox,
  Package,
  PackageCheck,
  PackageOpen,
  Plane,
  Receipt,
  Route,
  Scale,
  TrendingUp,
  TriangleAlert,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Curated icon set used by stat cards — keeps the full lucide library out of the bundle. */
const STAT_ICONS = {
  AlertCircle,
  AlertTriangle,
  BellRing,
  Boxes,
  Building2,
  CheckCircle2,
  CircleAlert,
  CircleCheck,
  ClipboardCheck,
  ClipboardList,
  Clock,
  DollarSign,
  FileText,
  Gauge,
  Globe,
  Inbox,
  Package,
  PackageCheck,
  PackageOpen,
  Plane,
  Receipt,
  Route,
  Scale,
  TrendingUp,
  TriangleAlert,
  Truck,
  Wallet,
} satisfies Record<string, LucideIcon>;

type IconName = keyof typeof STAT_ICONS;

export function StatCard({
  label,
  value,
  icon,
  tone = "brand",
  hint,
  href,
}: {
  label: string;
  value: string | number;
  icon?: IconName;
  tone?: "brand" | "emerald" | "amber" | "red" | "violet" | "gold" | "navy";
  hint?: string;
  href?: string;
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    violet: "bg-violet-50 text-violet-600",
    gold: "bg-gold-50 text-gold-600",
    navy: "bg-navy-100 text-navy-700",
  };
  const Icon = icon ? STAT_ICONS[icon] : null;

  const inner = (
    <div className="flex items-center gap-4 rounded-xl border border-navy-100 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover">
      {Icon && (
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-navy-400">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-navy-900">{value}</p>
        {hint && <p className="truncate text-xs text-navy-400">{hint}</p>}
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {inner}
      </a>
    );
  }
  return inner;
}
