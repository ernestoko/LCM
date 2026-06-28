import type { Metadata } from "next";
import {
  Plane,
  Ship,
  Package,
  Truck,
  FileCheck2,
  Warehouse,
  ShoppingCart,
  ArrowRight,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import {
  Container,
  Section,
  SectionHeading,
  MButton,
  CTASection,
} from "@/components/marketing";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Air freight, ocean freight, express parcel, door-to-door delivery, customs clearance, warehousing and e-commerce shipping with LCM Logistics — to and from the USA, to and from Ghana, and worldwide.",
};

type ServiceDetail = {
  id: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  features: string[];
};

const services: ServiceDetail[] = [
  {
    id: "air-freight",
    icon: Plane,
    eyebrow: "Speed when it counts",
    title: "Air Freight",
    description:
      "When time is the priority, our air freight moves your cargo on the fastest viable lanes between the USA, Ghana and destinations worldwide. From perishables and electronics to urgent commercial shipments, we book the space, handle the paperwork and keep you updated from departure to arrival.",
    features: [
      "Priority and economy air lanes to & from the USA, to & from Ghana and worldwide",
      "Consolidated and direct options to balance speed against cost",
      "Temperature-aware and high-value handling for sensitive goods",
      "Live milestone tracking from pickup to airport collection",
    ],
  },
  {
    id: "ocean-freight",
    icon: Ship,
    eyebrow: "Scale without the premium",
    title: "Ocean Freight",
    description:
      "For bulk, pallets and oversized cargo, ocean freight gives you the lowest cost per kilo on the routes that matter most. We arrange full-container (FCL) and shared-container (LCL) shipments between US ports and Ghana, with onward connections across Africa and the wider world.",
    features: [
      "FCL and LCL sailings on USA ⇄ Ghana and worldwide trade lanes",
      "Cargo consolidation to fill space and cut your per-unit cost",
      "Port-to-port or full door-to-door with inland trucking included",
      "Documentation, insurance and clearance managed end to end",
    ],
  },
  {
    id: "express-parcel",
    icon: Package,
    eyebrow: "Small parcels, big urgency",
    title: "Express Parcel",
    description:
      "Documents, samples and small packages that simply cannot wait. Our express service collects, ships and delivers time-critical parcels with full visibility, so a contract, spare part or gift reaches its destination in days, not weeks.",
    features: [
      "Time-definite delivery for documents and small packages",
      "Door-to-door collection across the USA, Ghana and beyond",
      "End-to-end tracking with proactive delay alerts",
      "Simple flat-rate options for frequent senders",
    ],
  },
  {
    id: "door-to-door",
    icon: Truck,
    eyebrow: "We handle every leg",
    title: "Door-to-Door",
    description:
      "Skip the terminals and the guesswork. We collect at your origin, manage every handover, clear customs and deliver right to the recipient's door — whether that's a shop in Accra, a warehouse in Houston or a home anywhere in between.",
    features: [
      "Pickup at origin and delivery to the final address — both directions",
      "Single point of contact across air, ocean and last-mile",
      "Customs and duties handled so nothing stalls in transit",
      "Ideal for traders, families and businesses shipping internationally",
    ],
  },
  {
    id: "customs-clearance",
    icon: FileCheck2,
    eyebrow: "Cleared without the headache",
    title: "Customs Clearance",
    description:
      "Borders should not slow your business down. Our brokerage team prepares accurate documentation, classifies your goods correctly and works directly with authorities on both sides of the ocean to clear shipments quickly and keep them moving.",
    features: [
      "Import and export clearance for US and Ghanaian customs",
      "Correct tariff classification and duty estimates up front",
      "Compliance checks to avoid costly holds and penalties",
      "Guidance on restricted, prohibited and licensed goods",
    ],
  },
  {
    id: "warehousing",
    icon: Warehouse,
    eyebrow: "Store, consolidate, fulfil",
    title: "Warehousing",
    description:
      "Secure storage and fulfilment from our hubs in the USA and Ghana. Receive goods from multiple suppliers, consolidate them into a single economical shipment, and release stock on your schedule with full inventory visibility.",
    features: [
      "Receiving, inspection and secure short- or long-term storage",
      "Multi-supplier consolidation to lower your shipping cost",
      "Pick, pack and dispatch on demand from US & Ghana hubs",
      "Inventory visibility so you always know what's on hand",
    ],
  },
  {
    id: "ecommerce-shipping",
    icon: ShoppingCart,
    eyebrow: "Built for online sellers",
    title: "E-commerce Shipping",
    description:
      "Sell anywhere, ship from one partner. We give online sellers the logistics backbone they need — consolidating inventory, labelling parcels and delivering fast last-mile to buyers across the USA, Ghana, Africa and the wider world.",
    features: [
      "Order-to-doorstep fulfilment for online and social-commerce sellers",
      "Bulk import from suppliers, then split-ship to your customers",
      "Branded labelling and packing for a professional unboxing",
      "Transparent rates that protect your margins as you scale",
    ],
  },
];

function ServiceBlock({ service, index }: { service: ServiceDetail; index: number }) {
  const Icon = service.icon;
  const imageRight = index % 2 === 1;

  const panel = (
    <div className="relative">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-900 to-brand-800 p-10 shadow-card-hover sm:p-14">
        {/* decorative glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-gold-500/10 blur-3xl"
        />
        {/* dotted texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative flex aspect-[4/3] flex-col items-center justify-center text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-inset ring-white/20 backdrop-blur">
            <Icon className="h-12 w-12 text-gold-400" aria-hidden="true" />
          </div>
          <p className="mt-6 text-xl font-bold tracking-tight text-white">
            {service.title}
          </p>
          <p className="mt-1 text-sm font-medium uppercase tracking-[0.18em] text-gold-400">
            USA &#8644; Ghana &#8644; Worldwide
          </p>
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 h-1.5 w-28 rounded-br-full bg-gold-400"
        />
      </div>
    </div>
  );

  const text = (
    <div>
      <span className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-600">
        <span className="h-px w-6 bg-gold-400" aria-hidden="true" />
        {service.eyebrow}
      </span>
      <h2 className="text-balance text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
        {service.title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-navy-600 sm:text-lg">
        {service.description}
      </p>
      <ul className="mt-6 space-y-3">
        {service.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0 text-brand-600"
              aria-hidden="true"
            />
            <span className="text-sm leading-relaxed text-navy-700 sm:text-base">
              {feature}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <MButton href="/contact" variant="primary" size="lg">
          Get a quote
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </MButton>
      </div>
    </div>
  );

  return (
    <div
      id={service.id}
      className={cn(
        "grid scroll-mt-24 grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16",
      )}
    >
      {/* On mobile the panel always comes first; on desktop we alternate sides. */}
      <div className={cn(imageRight ? "lg:order-2" : "lg:order-1")}>{panel}</div>
      <div className={cn(imageRight ? "lg:order-1" : "lg:order-2")}>{text}</div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <>
      {/* Hero — compact navy band */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-navy-900 via-navy-900 to-brand-800">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl"
        />
        <Container className="relative py-16 sm:py-24">
          <SectionHeading
            eyebrow="Our services"
            title="Logistics for every shipment, every lane"
            subtitle="Air and ocean freight, express parcels, door-to-door delivery, customs clearance, warehousing and e-commerce shipping — moving your goods to and from the USA, to and from Ghana, and worldwide."
            align="center"
            light
          />
          <nav
            aria-label="Jump to a service"
            className="mt-10 flex flex-wrap items-center justify-center gap-2"
          >
            {services.map((service) => (
              <a
                key={service.id}
                href={`#${service.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-navy-100 backdrop-blur transition-colors hover:border-gold-400/50 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
              >
                <service.icon className="h-4 w-4 text-gold-400" aria-hidden="true" />
                {service.title}
              </a>
            ))}
          </nav>
        </Container>
      </section>

      {/* Detailed service sections, alternating layout */}
      <Section className="bg-white">
        <Container>
          <div className="space-y-20 sm:space-y-28">
            {services.map((service, index) => (
              <ServiceBlock key={service.id} service={service} index={index} />
            ))}
          </div>
        </Container>
      </Section>

      <CTASection
        title="Tell us what you're shipping"
        subtitle="Get a fast, transparent quote tailored to your cargo, lane and timeline — to or from the USA, Ghana, or anywhere in the world."
        primary={{ label: "Get a quote", href: "/contact" }}
        secondary={{ label: "View coverage", href: "/coverage" }}
      />
    </>
  );
}
