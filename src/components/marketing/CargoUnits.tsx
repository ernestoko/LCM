import { SEA_UNIT_DEFS } from "@/constants/seaUnits";
import { Eagle } from "@/components/brand/Eagle";
import { Container } from "./Container";

const NAVY = "#0a1230";
const GOLD = "#e6c44d";
const GOLD_SOFT = "#f6edc7";
const GOLD_MID = "#eed892";

/** Line-art shipping drum. */
function DrumArt() {
  return (
    <svg viewBox="0 0 120 132" className="h-20 w-20" role="img" aria-label="Shipping drum">
      <path
        d="M22 28 V104 a38 13 0 0 0 76 0 V28"
        fill={GOLD_SOFT}
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse cx="60" cy="28" rx="38" ry="13" fill={GOLD} stroke={NAVY} strokeWidth="3" />
      <path d="M22 56 a38 13 0 0 0 76 0" fill="none" stroke={NAVY} strokeWidth="2.5" opacity="0.45" />
      <path d="M22 82 a38 13 0 0 0 76 0" fill="none" stroke={NAVY} strokeWidth="2.5" opacity="0.45" />
    </svg>
  );
}

/** Line-art isometric cardboard box. */
function BoxArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-20 w-20" role="img" aria-label="Cardboard box">
      <path
        d="M18 40 L60 62 L60 108 L18 86 Z"
        fill={GOLD_SOFT}
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M102 40 L60 62 L60 108 L102 86 Z"
        fill={GOLD_MID}
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M60 16 L102 40 L60 62 L18 40 Z"
        fill={GOLD}
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M60 16 L60 62" stroke={NAVY} strokeWidth="2.5" opacity="0.4" />
    </svg>
  );
}

/**
 * Marketing showcase of the standard sea-cargo units customers can ship by —
 * drawn straight from the live SEA_UNIT_DEFS catalog so the samples always match
 * what the platform actually prices.
 */
export function CargoUnits() {
  return (
    <section className="bg-white py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
            Sea Cargo Units
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
            Ship by the box, the drum, or the cubic metre
          </h2>
          <p className="mt-4 text-lg text-navy-500">
            For ocean freight we charge by volume (CBM) or by these standard units. Pack into any
            of them — or send loose cargo and we&apos;ll measure it for you.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {SEA_UNIT_DEFS.map((u) => (
            <div
              key={u.key}
              className="flex flex-col items-center rounded-2xl border border-navy-100 bg-navy-50/40 p-5 text-center shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="relative flex h-24 w-24 items-center justify-center rounded-xl bg-white">
                {u.key.startsWith("drum") ? <DrumArt /> : <BoxArt />}
                {/* Liberty brand mark stamped on the unit */}
                <Eagle
                  className="pointer-events-none absolute left-1/2 top-[56%] h-4 w-7 -translate-x-1/2 -translate-y-1/2 opacity-90"
                  fill="#0a1230"
                  eyeFill="#f6edc7"
                />
              </div>
              <p className="mt-3 text-sm font-semibold leading-tight text-navy-900">{u.label}</p>
              <span className="mt-2 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                ≈ {u.approxCbm} CBM
              </span>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-navy-400">
          Air cargo is priced by weight; sea cargo by volume (CBM) or by the units above. Not sure
          which fits? Ask our assistant or request a quote.
        </p>
      </Container>
    </section>
  );
}
