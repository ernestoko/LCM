import { cn } from "@/lib/utils/cn";

/**
 * The LCM Logistics glyph — a stylized navigation/forward-arrow mark inside a
 * rounded badge with a gold accent stroke. Purely presentational; pass a
 * `className` to size it (defaults to a 36px square).
 */
export function LcmMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-label="LCM Logistics mark"
      className={cn("h-9 w-9", className)}
    >
      <defs>
        <linearGradient id="lcm-mark-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1d40f5" />
          <stop offset="100%" stopColor="#0f1b3d" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#lcm-mark-bg)" />
      {/* Forward motion chevrons */}
      <path
        d="M11 13.5 19 20l-8 6.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Gold accent chevron — the "lift" / premium accent */}
      <path
        d="M20 13.5 28 20l-8 6.5"
        fill="none"
        stroke="#d6a541"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Full LCM Logistics wordmark: the mark + "LCM Logistics" with a gold accent on
 * the "LCM". Use `light` for dark backgrounds (nav-on-scroll / footer).
 */
export function LcmWordmark({
  className,
  light = false,
  markClassName,
}: {
  className?: string;
  light?: boolean;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LcmMark className={markClassName} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-lg font-extrabold tracking-tight",
            light ? "text-white" : "text-navy-900",
          )}
        >
          <span className="text-gold-500">LCM</span>{" "}
          <span className={light ? "text-white" : "text-navy-900"}>Logistics</span>
        </span>
        <span
          className={cn(
            "mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]",
            light ? "text-navy-200" : "text-navy-500",
          )}
        >
          Global Shipping
        </span>
      </span>
    </span>
  );
}
