# LCM Logistics — Marketing Website Build Contract

You are building the **public marketing website** for **LCM Logistics — Global Logistics & International Shipping**. Next.js 14 App Router + TypeScript + Tailwind. Project root: `i:\My Drive\USA CARGO\LCM`.

Design inspiration: **DHL** and **FedEx** — confident, bold, lots of whitespace, strong accent color, big type, full-bleed hero, clear service cards, global-network storytelling, a prominent "track your shipment" bar, sticky nav, and a rich footer. Premium, trustworthy, modern.

## Hard rules
1. These are PUBLIC pages OUTSIDE the `(app)` group — they live under `src/app/(marketing)/` and get NO app shell / auth. Interactive components start with `"use client";`; pure presentational ones can be server components.
2. **Never mention "SEAL"** anywhere. The brand is **LCM Logistics** (company: LCM Logistics). Operations partners are never named.
3. Mobile-first and fully responsive. Use semantic HTML, good a11y (alt text, aria-labels, focus states).
4. Tailwind only — no new dependencies. Icons from `lucide-react`. Use `cn` from `@/lib/utils/cn`.
5. Keep copy realistic for an international cargo company shipping **to and from the USA, to and from Ghana, and across Africa & beyond** (packages can originate anywhere → USA, and USA → many countries). Mention real services: air freight, ocean freight, express parcel, door-to-door, customs clearance, warehousing, e-commerce/online-seller shipping.
6. The tracking input must route to `/track/{trackingNumber}` (an existing page). Use `next/navigation` `useRouter`.

## Brand & design tokens (Tailwind classes already configured)
- **Navy** (primary dark / headers / footer): `navy-900` `#0f1b3d`, `navy-950`. Text on dark: white / `navy-100/200`.
- **Brand blue** (primary action): `brand-600`/`brand-500` (`#3463ff`/`#1d40f5`).
- **Gold** (premium accent, underlines, highlights): `gold-500` `#c78d2c`, `gold-400`.
- Neutrals: `navy-50` (light bg), white, `navy-600` (body text).
- Use generous gradients (`from-navy-900 to-brand-800`, gold accents), big rounded cards (`rounded-2xl`), soft shadows (`shadow-card`, `shadow-card-hover`), and section padding (`py-16 sm:py-24`).
- Headings: bold, large (`text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight`). Body: `text-navy-600 leading-relaxed`.
- Add tasteful motion: hover lifts, transitions, and scroll-reveal/count-up where specified (use IntersectionObserver in client components; keep it dependency-free).

## Component contract — `src/components/marketing/`
Agent **F1** implements these EXACTLY (names, exports, props). Agents **F2/F3** import and compose them. Each file `"use client";` only if it uses hooks/interactivity.

Create `src/components/marketing/index.ts` re-exporting all of the below.

- `MarketingNav` — sticky translucent-on-scroll top nav. Left: LCM Logistics wordmark (build an inline SVG mark + "LCM Logistics" text, gold accent). Center/right links: Home (`/`), Services (`/services`), Coverage (`/coverage`), About (`/about`), Contact (`/contact`). Right buttons: "Track" (outline → `/track`), "Sign in" (ghost → `/login`), "Get a Quote" (primary → `/contact`). Mobile hamburger → slide-down menu. Props: none.
- `MarketingFooter` — dark (`navy-950`) footer: wordmark + short blurb + columns (Services, Company, Support, Legal) with links, a contact block (phone/email/address placeholders), social icon row (lucide), and a bottom bar "© {year} LCM Logistics. All rights reserved." Props: none.
- `Container({ className?, children })` — `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8`.
- `Section({ id?, className?, children })` — `<section>` with `py-16 sm:py-24` + optional id.
- `SectionHeading({ eyebrow?, title, subtitle?, align?: "left"|"center", light?: boolean })` — eyebrow (small gold uppercase), big title, optional subtitle. `light` = white text for dark backgrounds.
- `MButton({ href, variant?: "primary"|"secondary"|"outline"|"light"|"ghost", size?: "md"|"lg", children, className? })` — a `next/link` styled CTA. primary=brand blue, secondary=navy, outline=bordered, light=white bg (for dark sections), ghost=text. Include an arrow icon affordance option via children.
- `TrackingBar({ className?, variant?: "hero"|"inline" })` — `"use client"`. A tracking-number input + "Track" button; on submit routes to `/track/{encoded value}`. `hero` = large white card with shadow; `inline` = compact.
- `ServiceCard({ icon, title, description, href? })` — `icon` is a lucide component (pass the component, e.g. `Plane`). Card with icon chip, title, description, "Learn more →" if href.
- `FeatureCard({ icon, title, description })` — simpler value/benefit card.
- `StatCounter({ value: number, suffix?, prefix?, label })` — `"use client"`, counts up from 0 to `value` when scrolled into view.
- `StatsBand({ stats: { value: number, suffix?, prefix?, label: string }[], dark?: boolean })` — a row of `StatCounter`s.
- `ProcessSteps({ steps: { icon, title, description }[] })` — numbered horizontal/stacked steps with connectors.
- `Testimonial({ quote, name, role, company? })` and `TestimonialGrid({ items })`.
- `CTASection({ title, subtitle?, primary: { label, href }, secondary?: { label, href } })` — full-width dark gradient band with CTAs.
- `CoverageStrip({ countries?: string[] })` — a visually rich "global network" block: a stylized dotted world/route SVG or an animated lanes graphic + a list/grid of served countries (default to: United States, Ghana, Liberia, Nigeria, Cameroon, Kenya, South Africa, United Kingdom, Canada, China, UAE, Germany). Convey "to & from the USA" and "across Africa & worldwide". Keep the SVG dependency-free and lightweight.
- `LogoCloud()` — a subtle "trusted by businesses & individuals" strip (use tasteful text/badges, not real third-party logos).

If F1 adds extra helper components, also export them. F2/F3: if you need something not in the contract, build it locally inside your own page file rather than adding to `marketing/`.

## Pages
**F2 — Home** `src/app/(marketing)/page.tsx` (route `/`). Compose a rich landing page in this order: (1) Hero — full-bleed navy→brand gradient, bold headline about global logistics & international shipping, subcopy, primary "Get a quote" + secondary "Our services", and a prominent `TrackingBar variant="hero"`; (2) `LogoCloud`; (3) Services section (`SectionHeading` + grid of `ServiceCard`s: Air Freight `Plane`, Ocean Freight `Ship`, Express Parcel `Package`, Door-to-Door `Truck`, Customs Clearance `FileCheck2`, Warehousing `Warehouse`, E-commerce Shipping `ShoppingCart`); (4) `CoverageStrip`; (5) Why-choose-us (`FeatureCard` grid: real-time tracking, transparent pricing, secure handling, dedicated support, fast transit, global reach); (6) `ProcessSteps` (Book → Collect/Intake → In Transit → Delivered); (7) `StatsBand` (e.g. 12+ countries, 50k+ shipments, 99% on-time, 24/7 support — pick believable numbers); (8) `TestimonialGrid`; (9) `CTASection`. Include `export const metadata`.

**F3 — Inner pages** (each composes F1 components, each with `export const metadata`):
- `src/app/(marketing)/services/page.tsx` — detailed services: hero, then a section per service (air, ocean, express, door-to-door, customs, warehousing, e-commerce) with features + CTA. Mention to/from USA & Ghana and worldwide.
- `src/app/(marketing)/coverage/page.tsx` — global network: `CoverageStrip`, lanes ("USA ⇄ Ghana", "Worldwide → USA", "USA → Africa & beyond"), transit-time table, customs note, CTA.
- `src/app/(marketing)/about/page.tsx` — company story/mission/values, leadership-style values grid, stats, CTA. LCM Logistics positioning as a trusted global logistics & international shipping company.
- `src/app/(marketing)/contact/page.tsx` — `"use client"` contact form (name, email, phone, service interest, message; client-side validate; on submit show a success state — no backend needed, or build a `mailto:` fallback), plus contact details, offices (USA + Ghana), hours, and a `TrackingBar inline`.

Build complete, polished, production-quality pages with real marketing copy (no lorem ipsum, no TODOs). Make it look genuinely impressive — this is the public face of the company.
