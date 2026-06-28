import { cn } from "@/lib/utils/cn";

/**
 * Liberty & Liberty Logistics eagle mark — a right-facing falcon head with a
 * three-stripe motion wing. Pure, dependency-free SVG. `fill` colours the bird
 * (defaults to currentColor so it inherits text colour); `eyeFill` is the small
 * eye highlight (use the surrounding background colour to "cut" the eye).
 *
 * NOTE: this is a faithful in-house recreation of the supplied logo so the brand
 * is live everywhere. Drop the official artwork into /public/images/ to swap to
 * pixel-perfect raster lockups.
 */
export function Eagle({
  className,
  fill = "currentColor",
  eyeFill = "#ffffff",
  style,
}: {
  className?: string;
  fill?: string;
  eyeFill?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 300 250"
      className={cn("h-9 w-9", className)}
      style={style}
      role="img"
      aria-label="Liberty & Liberty Logistics"
      fill="none"
    >
      <g fill={fill}>
        {/* top motion stripe */}
        <path d="M16 78 L150 52 Q172 49 188 60 L150 74 L40 92 Z" />
        {/* middle motion stripe */}
        <path d="M30 104 L150 84 Q176 81 196 92 L150 104 L52 116 Z" />
        {/* crown + hooked beak */}
        <path d="M150 70 C176 58 206 56 232 70 C250 80 262 96 270 112 C274 120 270 126 262 124 L236 116 C246 128 252 140 250 150 C236 138 220 132 206 132 L150 104 C150 104 150 70 150 70 Z" />
        {/* breast sweeping to the tail point */}
        <path d="M150 104 L206 132 C214 150 210 172 192 190 C170 212 140 220 96 226 L150 150 Z" />
        {/* under-wing / lower stripe into the body */}
        <path d="M44 130 L150 116 L150 150 L96 226 L70 168 Z" />
      </g>
      {/* eye highlight */}
      <path d="M222 84 Q240 82 251 90 Q239 92 226 91 Z" fill={eyeFill} />
    </svg>
  );
}
