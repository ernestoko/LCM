import { cn } from "@/lib/utils/cn";
import { Eagle } from "@/components/brand/Eagle";

const GOLD = "#b8860b";
const GOLD_BRIGHT = "#e6c44d";
const NAVY = "#0a1230";

/**
 * Liberty & Liberty Logistics eagle mark. Pass `light` for dark backgrounds.
 */
export function LibertyMark({
  className,
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <Eagle
      className={cn("h-9 w-9", className)}
      fill={light ? GOLD_BRIGHT : GOLD}
      eyeFill={light ? NAVY : "#ffffff"}
    />
  );
}

/**
 * Full Liberty & Liberty Logistics wordmark: the eagle + bold-italic name.
 * Use `light` for dark backgrounds (footer / dark nav).
 */
export function LibertyWordmark({
  className,
  light = false,
  markClassName,
  subtitle = "Logistics",
}: {
  className?: string;
  light?: boolean;
  markClassName?: string;
  subtitle?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Eagle
        className={cn("h-9 w-9 shrink-0", markClassName)}
        fill={light ? GOLD_BRIGHT : GOLD}
        eyeFill={light ? NAVY : "#ffffff"}
      />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[15px] font-extrabold italic tracking-tight sm:text-base",
            light ? "text-white" : "text-navy-900",
          )}
        >
          Liberty &amp; Liberty
        </span>
        <span
          className={cn(
            "mt-1 text-[10px] font-bold uppercase tracking-[0.26em]",
            light ? "text-gold-300" : "text-brand-600",
          )}
        >
          {subtitle}
        </span>
      </span>
    </span>
  );
}
