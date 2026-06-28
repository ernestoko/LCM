import { cn } from "@/lib/utils/cn";
import { Eagle } from "./Eagle";

const GOLD = "#b8860b";
const GOLD_BRIGHT = "#e6c44d";
const NAVY = "#0a1230";

/** App eagle mark — the Liberty & Liberty Logistics falcon (gold). `size` in px. */
export function Logo({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <Eagle
      className={cn(className)}
      style={{ width: size, height: size }}
      fill={GOLD}
      eyeFill="#ffffff"
    />
  );
}

/**
 * App brand lockup: eagle + "Liberty & Liberty Logistics". `compact` shows the
 * mark only; `light` flips colours for dark surfaces.
 */
export function LogoWordmark({
  className,
  compact,
  light,
}: {
  className?: string;
  compact?: boolean;
  light?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Eagle
        className="h-8 w-8 shrink-0"
        fill={light ? GOLD_BRIGHT : GOLD}
        eyeFill={light ? NAVY : "#ffffff"}
      />
      {!compact && (
        <div className="leading-none">
          <p
            className={cn(
              "text-[15px] font-extrabold italic tracking-tight",
              light ? "text-white" : "text-navy-900",
            )}
          >
            Liberty &amp; Liberty
          </p>
          <p
            className={cn(
              "mt-1 text-[10px] font-bold uppercase tracking-[0.26em]",
              light ? "text-gold-300" : "text-brand-600",
            )}
          >
            Logistics
          </p>
        </div>
      )}
    </div>
  );
}
