# Design

Visual system for the Liberty & Liberty Logistics platform. One system, two
voices: a confident **brand** marketing site and a calm, legible **product**
app. See [PRODUCT.md](PRODUCT.md) for strategy. Tokens live in
[tailwind.config.ts](tailwind.config.ts) and [src/app/globals.css](src/app/globals.css).

## Theme

Light, institutional, trust-forward. The mood is a well-run port at dawn:
deep-navy depth, a single warm gold signal, generous white space. Dark navy is
reserved for full-bleed hero/CTA bands and the dark "LIBERTY" feature band;
content surfaces are white and `navy-50`. Not a dark-mode app; not a cream
editorial page.

## Color

Three deliberate ramps (OKLCH-friendly hex), each with a job. **Color strategy:
Restrained** — tinted navy neutrals carry the surface, gold is the ≤10% signal.

| Ramp | Role | Key stops |
|------|------|-----------|
| `navy` | Primary ink + dark surfaces (trust, depth) | `900 #0f1b3d` ink/dark band · `50 #f3f6fb` tinted surface |
| `brand` | Action gold — links, primary buttons, focus | `600 #946c12` primary button (white text, **4.76:1 AA**) · `400 #d2a32c` logo/accent |
| `gold` | Signature accent — the "torch", used sparingly | `400 #d9a738` on navy (**7.66:1**) · `600 #a4661f` solid w/ white (**4.67:1 AA**) |

### Verified text-contrast floors (WCAG AA — legibility is trust)

These are **rules**, not suggestions. Audited ratios:

- **Body / secondary text on light:** `navy-600` (5.8:1 white, 5.35:1 navy-50). ✅ The floor for body copy.
- **`navy-500`** = 4.15:1 → **large/decorative only**, never normal body text.
- **`navy-400`** = 2.83:1 → **non-text only** (icons, hairline dividers, disabled state). Never meaningful text, placeholders, or hints.
- **Form placeholders + field hints:** `navy-600` (≥4.5:1). Set on the shared `Input`/`Field` primitives.
- **On dark navy (`navy-900`):** `navy-100/200/300` (13.9 / 11.8 / 8.9:1) and `gold-300/400` (9.4 / 7.7:1). All pass comfortably.
- **Solid action colors w/ white text:** `brand-600` (4.76), `gold-600` (4.67), `navy-900`, `red-600`, `emerald-600`. The old `gold-500` button (3.15) is retired.

Status never relies on color alone — always pair with a label or icon (Badge component).

## Typography

**One family: Inter** (`next/font`, self-hosted, `--font-inter`). A committed
brand identity — single family, weight/size contrast does the work; no display
pairing. (Inter is on generic "reflex" lists, but it is the shipped identity, so
identity-preservation wins.)

- **Marketing headings:** fluid, `text-3xl → lg:text-5xl`, `font-bold`,
  `tracking-tight`, `text-balance`. Hero tops out ~`6xl`.
- **App headings:** fixed rem scale (no fluid clamp in dense UI), `font-bold`.
- **Body:** 65–75ch cap on prose; `leading-relaxed` for marketing copy.
- **Labels:** `text-xs font-medium text-navy-700`.

## Section cadence (the eyebrow rule)

**Do not put a tracked-uppercase eyebrow above every section** — that is the
generic-SaaS tell this brand explicitly avoids. Sections lead with a strong
title (and optional subtitle). At most **one deliberate kicker per page** (the
hero), plus icon-paired **category labels** on `ImageFeature` (e.g. "Air & Ocean
Freight"), which are informative, not decorative scaffolding. Numbered markers
only where the section genuinely is a sequence (e.g. the 4-step process).

## Components

Shared primitives in [src/components/ui](src/components/ui) (app) and
[src/components/marketing](src/components/marketing) (brand). Every interactive
control ships the full state set: default / hover / focus-visible (2px ring) /
active / disabled / loading.

- **Button** (app) — 7 variants (primary=brand-600, secondary=navy-900,
  outline, ghost, danger, success, gold=gold-600), 4 sizes; `Loader2` spinner on `loading`.
- **MButton** (marketing) — primary/secondary/outline/light/ghost; subtle
  `-translate-y-0.5` hover lift + shadow, `active:translate-y-0`.
- **Input / Textarea / Select / Field / Checkbox** — `rounded-lg`, `navy-200`
  border, brand-500 focus ring; placeholder & hint at `navy-600`.
- **ServiceCard / FeatureCard / Badge / StatCard / Table / Modal / Toast**.
- **Cards:** `rounded-2xl`, `border-navy-100`, `shadow-card`, hover lift to
  `shadow-card-hover`. No nested cards. No left/right side-stripe accents (the
  ServiceCard's gold edge is a bottom hover micro-interaction, not a static stripe).

### Elevation

`shadow-card` (resting) → `shadow-card-hover` (interactive lift) →
`shadow-lift` (hero media / floating panels) → `shadow-glow` (gold accent on dark).

## Layout

- Containers cap content width; sections alternate `bg-white` / `bg-navy-50`
  for rhythm, with full-bleed `navy-950` bands for hero/CTA/feature moments.
- Responsive grids: `repeat(auto-fit, minmax(...))` or explicit
  `sm/lg/xl` columns. Flex for 1D, grid for 2D.
- App responsiveness is structural (collapsing nav, responsive tables), not
  fluid type.

## Motion

Calm, trust-building, **progressive-enhancement only**. Reveal animations
enhance already-visible content — they never gate visibility (content ships
visible; `html.js` + IntersectionObserver add the entrance). See
[src/components/marketing/motion/Reveal.tsx](src/components/marketing/motion/Reveal.tsx).

- Marketing: gentle fade + 24px rise, staggered for groups, once on scroll-in.
- App: 150–250ms state transitions; motion conveys state, not decoration.
- Ease-out curves, no bounce. `prefers-reduced-motion: reduce` → content shown
  instantly, unanimated (first-class path).

## Imagery

Real photography (optimized JPEGs ≤1500px, q72, in `public/images`), full-bleed
under a navy wash in heroes for legibility. `next/image` via the `Photo`
component with `overlay` presets. Never a colored block where a photo belongs.

## Accessibility

WCAG 2.1 AA (see PRODUCT.md). Visible focus rings everywhere, full keyboard
operability, status not by color alone, reduced-motion honored, content legible
without JS.
