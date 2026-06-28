# Liberty & Liberty Logistics — Brand & Frontend Guide

The single source of truth for naming, colour and imagery across the platform.
Read this before touching any user-facing copy or marketing UI.

## 1. Name

- **Full / display name:** `Liberty & Liberty Logistics`
- **Short name (tight spaces, PWA):** `Liberty`
- **Wordmark eyebrow:** `Logistics & Trading`
- **Never** use the retired names in user-visible copy: ~~`LCM Logistics`~~,
  ~~`Liberty Cargo Movers`~~. Replace any you find with `Liberty & Liberty Logistics`.
- Contact (placeholders, keep consistent): `hello@libertylogistics.com`,
  `+1 (800) 526-5555`, USA hub Houston TX, Ghana hub Tema/Accra.

### The LIBERTY promise (acrostic — use on About / brand moments)

| L | I | B | E | R | T | Y |
|---|---|---|---|---|---|---|
| Logistics | Innovation | Bringing | Exceptional | Reliability | & Timeliness | for You |

Reads as: *“Logistics Innovation, Bringing Exceptional Reliability & Timeliness — for You.”*
A ready-made component exists: `import { LibertyAcronym } from "@/components/marketing"`
(`tone="light"` on white/navy-50, `tone="dark"` on navy surfaces).

## 2. DO NOT TOUCH (identifiers, not brand copy)

These contain the token `LCM` but are **data formats / internal keys** — leave them exactly as-is:

- `src/lib/utils/ids.ts` and the `LCM-…` prefixes on tracking numbers, invoices,
  manifests, payments, tickets, customer codes (covered by tests + live data).
- `firestore.rules`, `storage.rules`, `package.json` name, any field/type/key
  name, route path, env var, or test fixture/expectation.

Only change **human-readable display strings** (JSX text, headings, descriptions,
email/SMS body copy, document headers, metadata titles).

## 3. Colour system (intentional & coherent)

Three Tailwind families, each with one job. Use these tokens — do not introduce new hex.

- **`navy`** — primary ink & dark surfaces (trust, depth). Headings (`navy-900`),
  body (`navy-600`), dark sections (`navy-900`/`navy-950`), borders (`navy-100`).
- **`brand`** — the royal-blue **action** colour. Buttons, links, focus rings,
  active states (`brand-600` primary, `brand-700` hover, `brand-50`/`brand-100` tints).
- **`gold`** — the premium **signature accent**, used sparingly: eyebrows,
  underline accents, key highlights, the mark. On dark use `gold-300`/`gold-400`;
  on light use `gold-500`/`gold-600`.

Rule of thumb: a section is navy-structured, blue is what you click, gold is the
one thing that should catch the eye. Never let gold compete with itself.

## 4. Imagery

Real photos live in `/public/images/` (referenced as `/images/<name>.jpg`).
Always render through the shared `Photo` component (or `next/image` with `fill`
inside a `relative` container) so overlays stay coherent. `next/image` is set to
`unoptimized` — no sharp dependency; assets are already export-sized.

| Path | Subject | Use for |
| --- | --- | --- |
| `/images/hero-port.jpg` | Aerial container terminal | Hero backgrounds |
| `/images/ocean-freight.jpg` | Container ship at sea | Ocean freight, CTA bg |
| `/images/air-freight.jpg` | Aircraft on tarmac, golden hour | Air freight |
| `/images/air-sky.jpg` | Aircraft climbing | Air freight (alt) |
| `/images/air-wing.jpg` | Wing above clouds | Express / accents |
| `/images/global-window.jpg` | View at altitude | Global reach |
| `/images/warehouse.jpg` | Warehouse racking aisle | Warehousing |
| `/images/fulfillment.jpg` | Parcels on the fulfilment floor | E-commerce / parcels |
| `/images/trucking.jpg` | Line-haul truck | Door-to-door / last mile |
| `/images/world-map.jpg` | World map | Coverage / network |
| `/images/team.jpg` | Operations team at work | About / support / why-us |
| `/images/handshake.jpg` | Partnership handshake | About / trust |
| `/images/seller-pos.jpg` | Seller at point of sale | E-commerce sellers |

### Shared components available (`@/components/marketing`)

- `Photo` — `{ src, alt, overlay?: "none"|"navy"|"hero"|"feature"|"soft", priority?, sizes?, position?, className }`.
  The wrapper has no height — size it (`aspect-[4/3]`, `h-72`, or `absolute inset-0`).
- `ImageFeature` — alternating image/text band: `{ eyebrow?, icon?, title, description, image, imageAlt, bullets?, cta?, reverse? }`.
- `ServiceCard` — now supports optional `image` + `imageAlt` for a photo-topped tile.
- `CTASection` — supports optional `image` + `imageAlt` background.
- `CoverageStrip` — supports optional `image` (defaults to the world map).
- Plus `Container`, `Section`, `SectionHeading` (`light` for dark bg), `MButton`,
  `StatsBand` (`dark`), `ProcessSteps`, `TestimonialGrid`, `FeatureCard`,
  `LibertyWordmark` / `LibertyMark`, `LibertyAcronym`.

## 5. Quality bar

- TypeScript strict must stay clean (`npx tsc --noEmit`). No new dependencies.
- Mobile-first and responsive; preserve a11y (`alt`, focus styles, semantic order).
- Match the home page (`src/app/(marketing)/page.tsx`) for tone, spacing and polish.
- PWA: everything stays static/SSR-friendly; don't break the service worker scope.
