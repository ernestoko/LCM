import { Globe2, Plane, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Container } from "./Container";
import { Photo } from "./Photo";

const DEFAULT_COUNTRIES = [
  "United States",
  "Ghana",
  "Liberia",
  "Nigeria",
  "Cameroon",
  "Kenya",
  "South Africa",
  "United Kingdom",
  "Canada",
  "China",
  "UAE",
  "Germany",
];

/** A stylized dotted "world map" with animated trade-lane arcs — dependency-free SVG. */
function WorldRoutes() {
  // A compact field of dots evoking continents, plus a few glowing route arcs.
  const dots: { cx: number; cy: number; r: number }[] = [];
  // Pseudo-random but deterministic scatter so SSR and client match.
  let seed = 7;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 150; i += 1) {
    dots.push({
      cx: 20 + rand() * 760,
      cy: 20 + rand() * 360,
      r: rand() > 0.85 ? 2.2 : 1.4,
    });
  }

  return (
    <svg
      viewBox="0 0 800 400"
      className="h-full w-full"
      role="img"
      aria-label="Global shipping network connecting the USA, Ghana, Africa and the world"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="coverage-arc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e6c44d" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
        <radialGradient id="coverage-hub" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d6a541" />
          <stop offset="100%" stopColor="#d6a541" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Dotted "continents" backdrop */}
      <g fill="#3d5283" opacity="0.55">
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={d.r} />
        ))}
      </g>

      {/* Trade-lane arcs (USA ⇄ Ghana ⇄ world) */}
      <g fill="none" stroke="url(#coverage-arc)" strokeWidth="2" strokeLinecap="round">
        <path d="M200 250 C 320 90, 520 90, 600 220" opacity="0.9">
          <animate
            attributeName="stroke-dasharray"
            values="0 600;600 0"
            dur="3.2s"
            repeatCount="indefinite"
          />
        </path>
        <path d="M210 240 C 360 360, 540 320, 640 200" opacity="0.6">
          <animate
            attributeName="stroke-dasharray"
            values="0 600;600 0"
            dur="4s"
            repeatCount="indefinite"
          />
        </path>
        <path d="M160 180 C 300 60, 480 80, 590 150" opacity="0.45" />
      </g>

      {/* Network hubs */}
      <g>
        {[
          { x: 200, y: 250 },
          { x: 600, y: 220 },
          { x: 640, y: 200 },
          { x: 160, y: 180 },
          { x: 590, y: 150 },
        ].map((h, i) => (
          <g key={i}>
            <circle cx={h.x} cy={h.y} r="18" fill="url(#coverage-hub)" />
            <circle cx={h.x} cy={h.y} r="4" fill="#d6a541" />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function CoverageStrip({
  countries = DEFAULT_COUNTRIES,
  image = "/images/world-map.jpg",
  className,
}: {
  countries?: string[];
  image?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-950 via-navy-900 to-brand-900 px-6 py-12 shadow-lift sm:px-10 sm:py-16",
        className,
      )}
    >
      {/* Faint real-world texture behind the brand trade-lane map */}
      {image ? (
        <Photo
          src={image}
          alt=""
          overlay="none"
          sizes="100vw"
          className="absolute inset-0 opacity-[0.12] mix-blend-luminosity"
        />
      ) : null}
      {/* Animated trade-lane map sits behind, dimmed */}
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
        <WorldRoutes />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" aria-hidden="true" />

      <Container className="relative px-0">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
              <Globe2 className="h-4 w-4" aria-hidden="true" />
              Global Network
            </span>
            <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
              To &amp; from the USA. Across Africa. Worldwide.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-navy-200">
              We move air and ocean freight, express parcels and full door-to-door
              shipments along trusted lanes between the United States, Ghana and
              destinations across Africa and beyond — with customs clearance and
              real-time tracking at every step.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-white">
              <span className="inline-flex items-center gap-2">
                <Plane className="h-4 w-4 text-gold-400" aria-hidden="true" />
                USA &#8644; Ghana
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gold-400" aria-hidden="true" />
                Worldwide &#8594; USA
              </span>
              <span className="inline-flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-gold-400" aria-hidden="true" />
                USA &#8594; Africa &amp; beyond
              </span>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {countries.map((country) => (
              <li
                key={country}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:border-gold-400/50 hover:bg-white/10"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-gold-400" aria-hidden="true" />
                {country}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </div>
  );
}
