import { cn } from "@/lib/utils/cn";
import type { BadgeTone, StatusMeta } from "@/constants/statuses";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-navy-100 text-navy-700 ring-navy-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  purple: "bg-violet-50 text-violet-700 ring-violet-200",
  gold: "bg-gold-50 text-gold-700 ring-gold-200",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Render a Badge from a StatusMeta map entry. */
export function StatusBadge({ meta, fallback }: { meta?: StatusMeta; fallback?: string }) {
  if (!meta) return <Badge tone="neutral">{fallback ?? "Unknown"}</Badge>;
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
