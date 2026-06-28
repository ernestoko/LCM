import type { CSSProperties } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/**
 * Standardised marketing photo: a `next/image` cover fill inside a relative,
 * clipped wrapper, with an optional on-brand gradient overlay so every photo —
 * regardless of its source palette — reads coherently in navy + gold.
 *
 * Overlays are applied as inline-style gradients (not Tailwind utilities) so the
 * exact, fixed brand scrims always render and never depend on JIT class
 * generation for one-off opacity values.
 *
 * The wrapper has no intrinsic height; the consumer sizes it (e.g. `h-72`,
 * `aspect-[4/3]`, or `absolute inset-0` for full-bleed backgrounds).
 *
 * Brand stops: navy-950 #0a1230 = 10 18 48 · navy-900 #0f1b3d = 15 27 61 ·
 * brand-950 #141f4a = 20 31 74.
 */
const OVERLAYS: Record<string, CSSProperties | undefined> = {
  none: undefined,
  // Bottom-up navy scrim for text legibility over a photo.
  navy: {
    backgroundImage:
      "linear-gradient(to top, rgba(10,18,48,0.85), rgba(15,27,61,0.35) 55%, rgba(15,27,61,0.10))",
  },
  // Deep, even navy wash (subtle royal undertone) for hero / CTA backgrounds —
  // strong enough to keep white + gold text crisp over bright, busy photos.
  hero: {
    backgroundImage:
      "linear-gradient(to bottom, rgba(10,18,48,0.90), rgba(20,31,74,0.80) 50%, rgba(10,18,48,0.92))",
  },
  // Diagonal navy for side-by-side feature media.
  feature: {
    backgroundImage:
      "linear-gradient(to top right, rgba(10,18,48,0.55), rgba(15,27,61,0.12) 55%, rgba(15,27,61,0))",
  },
  // Subtle dim for decorative background imagery.
  soft: { backgroundColor: "rgba(10,18,48,0.30)" },
};

export type PhotoOverlay = "none" | "navy" | "hero" | "feature" | "soft";

export function Photo({
  src,
  alt,
  className,
  imgClassName,
  overlay = "none",
  priority = false,
  sizes = "100vw",
  position,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  overlay?: PhotoOverlay;
  priority?: boolean;
  sizes?: string;
  /** object-position, e.g. "center", "top", "50% 30%". */
  position?: string;
}) {
  const overlayStyle = OVERLAYS[overlay];
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", imgClassName)}
        style={position ? { objectPosition: position } : undefined}
      />
      {overlayStyle ? (
        <div className="absolute inset-0" style={overlayStyle} aria-hidden="true" />
      ) : null}
    </div>
  );
}
