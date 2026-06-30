import type { Metadata } from "next";
import {
  Plane,
  Ship,
  Package,
  Truck,
  FileCheck2,
  Warehouse,
  ShoppingCart,
  Layers,
  ArrowRight,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import {
  Container,
  Section,
  SectionHeading,
  MButton,
  ImageFeature,
  ServiceCard,
  CTASection,
  CargoUnits,
  DeliveryBand,
} from "@/components/marketing";
import { Reveal, RevealStagger, RevealItem } from "@/components/marketing/motion";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Air freight, ocean freight, express parcel, door-to-door delivery, customs clearance, warehousing and e-commerce shipping with Liberty & Liberty Logistics — to and from the USA, to and from Ghana, and worldwide.",
};

/** Headline services shown as alternating image/text feature bands. */
type FeatureService = {
  id: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  bullets: string[];
};

const featureServices: FeatureService[] = [
  {
    id: "air-freight",
    icon: Plane,
    eyebrow: "Speed when it counts",
    title: "Air Freight",
    description:
      "When time is the priority, our air freight moves your cargo on the fastest viable lanes between the USA, Ghana and destinations worldwide. From perishables and electronics to urgent commercial shipments, we book the space, handle the paperwork and keep you updated from departure to arrival.",
    image: "/images/air-freight.jpg",
    imageAlt: "Cargo aircraft on the tarmac at golden hour, ready for loading",
    bullets: [
      "Priority & economy air lanes worldwide",
      "Consolidated & direct options",
      "High-value & temperature-aware handling",
      "Live milestones from pickup to collection",
    ],
  },
  {
    id: "ocean-freight",
    icon: Ship,
    eyebrow: "Scale without the premium",
    title: "Ocean Freight",
    description:
      "For bulk, pallets and oversized cargo, ocean freight gives you the lowest cost per kilo on the routes that matter most. We arrange full-container (FCL) and shared-container (LCL) shipments between US ports and Ghana, with onward connections across Africa and the wider world.",
    image: "/images/ocean-freight.jpg",
    imageAlt: "Container ship loaded with cargo crossing the open ocean",
    bullets: [
      "FCL & LCL on USA ⇄ Ghana lanes",
      "Consolidation to cut cost per unit",
      "Port-to-port or full door-to-door",
      "Docs, insurance & clearance handled",
    ],
  },
  {
    id: "warehousing",
    icon: Warehouse,
    eyebrow: "Store, consolidate, fulfil",
    title: "Warehousing",
    description:
      "Secure storage and fulfilment from our hubs in the USA and Ghana. Receive goods from multiple suppliers, consolidate them into a single economical shipment, and release stock on your schedule with full inventory visibility.",
    image: "/images/warehouse.jpg",
    imageAlt: "Organised warehouse racking aisle stacked with palletised goods",
    bullets: [
      "Receiving, inspection & secure storage",
      "Multi-supplier consolidation",
      "Pick, pack & dispatch on demand",
      "Inventory visibility on every item",
    ],
  },
  {
    id: "ecommerce",
    icon: ShoppingCart,
    eyebrow: "Built for online sellers",
    title: "E-commerce Shipping",
    description:
      "Sell anywhere, ship from one partner. We give online sellers the logistics backbone they need — consolidating inventory, labelling parcels and delivering fast last-mile to buyers across the USA, Ghana, Africa and the wider world.",
    image: "/images/fulfillment.jpg",
    imageAlt: "Fulfilment floor stacked with labelled parcels ready to ship",
    bullets: [
      "Order-to-doorstep fulfilment",
      "Bulk import, then split-ship to buyers",
      "Branded labelling & packing",
      "Transparent rates that protect margins",
    ],
  },
  {
    id: "door-to-door",
    icon: Truck,
    eyebrow: "We handle every leg",
    title: "Door-to-Door",
    description:
      "Skip the terminals and the guesswork. We collect at your origin, manage every handover, clear customs and deliver right to the recipient's door — whether that's a shop in Accra, a warehouse in Houston or a home anywhere in between.",
    image: "/images/trucking.jpg",
    imageAlt: "Line-haul delivery truck on the road for last-mile transport",
    bullets: [
      "Pickup at origin, delivery to the door",
      "One contact across air, ocean & last-mile",
      "Customs & duties handled end to end",
      "Ideal for traders, families & business",
    ],
  },
];

/** Smaller services shown as photo-topped cards. */
type CardService = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

const cardServices: CardService[] = [
  {
    id: "express-parcel",
    icon: Package,
    title: "Express Parcel",
    description:
      "Documents, samples and small packages that simply cannot wait. Time-definite collection and delivery with full visibility, so a contract, spare part or gift reaches its destination in days, not weeks.",
    image: "/images/air-wing.jpg",
    imageAlt: "Aircraft wing above the clouds on an express air route",
  },
  {
    id: "customs",
    icon: FileCheck2,
    title: "Customs Clearance",
    description:
      "Borders should not slow your business down. Our brokerage team prepares accurate documentation, classifies your goods correctly and works directly with US and Ghanaian authorities to clear shipments quickly.",
    image: "/images/global-window.jpg",
    imageAlt: "View of the world from altitude, representing global trade flows",
  },
  {
    id: "consolidation",
    icon: Layers,
    title: "Consolidation",
    description:
      "Combine multiple purchases from different suppliers into one sealed shipment. You cut the cost per kilo, simplify delivery and track a single consignment from our hub to your door.",
    image: "/images/seller-pos.jpg",
    imageAlt: "Seller preparing multiple orders for a consolidated shipment",
  },
];

export default function ServicesPage() {
  const jumpLinks = [
    ...featureServices.map((s) => ({ id: s.id, title: s.title, icon: s.icon })),
    ...cardServices.map((s) => ({ id: s.id, title: s.title, icon: s.icon })),
  ];

  return (
    <>
      {/* Hero — compact navy band with a jump nav */}
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl"
        />
        <Container className="relative py-16 sm:py-24">
          <Reveal mode="load">
            <SectionHeading
              eyebrow="Our services"
              title="Logistics for every shipment, every lane"
              subtitle="Air and ocean freight, express parcels, door-to-door delivery, customs clearance, warehousing and e-commerce shipping — moving your goods to and from the USA, to and from Ghana, and worldwide."
              align="center"
              light
            />
          </Reveal>
          <Reveal mode="load" delay={0.12}>
            <nav
              aria-label="Jump to a service"
              className="mt-10 flex flex-wrap items-center justify-center gap-2"
            >
              {jumpLinks.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-navy-100 backdrop-blur transition-colors hover:border-gold-400/50 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                >
                  <link.icon className="h-4 w-4 text-gold-400" aria-hidden="true" />
                  {link.title}
                </a>
              ))}
            </nav>
          </Reveal>
        </Container>
      </section>

      {/* Headline services — alternating image/text feature bands */}
      <Section className="bg-white">
        <Container>
          <div className="space-y-20 sm:space-y-28">
            {featureServices.map((service, index) => (
              <Reveal
                key={service.id}
                className="scroll-mt-24"
              >
                <div id={service.id}>
                  <ImageFeature
                    eyebrow={service.eyebrow}
                    icon={service.icon}
                    title={service.title}
                    description={service.description}
                    image={service.image}
                    imageAlt={service.imageAlt}
                    bullets={service.bullets}
                    reverse={index % 2 === 1}
                    cta={{ label: "Get a quote", href: "/contact" }}
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Sea cargo unit samples — drums, boxes & CBM */}
      <CargoUnits />

      {/* Door-to-door delivery band */}
      <DeliveryBand />

      {/* Smaller services — photo-topped cards */}
      <Section className="bg-navy-50">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="More ways we help"
              title="Specialist services to round out your shipment"
              subtitle="Time-critical parcels, hassle-free border clearance and smart consolidation — the finishing touches that keep your cargo moving and your costs down."
              align="center"
            />
          </Reveal>
          <RevealStagger className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cardServices.map((service) => (
              <RevealItem key={service.id} className="scroll-mt-24">
                <div id={service.id}>
                  <ServiceCard
                    icon={service.icon}
                    title={service.title}
                    description={service.description}
                    image={service.image}
                    imageAlt={service.imageAlt}
                  />
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
          <Reveal>
            <div className="mt-12 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center">
              <MButton href="/contact" variant="primary" size="lg">
                Get a quote
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </MButton>
              <MButton href="/coverage" variant="outline" size="lg">
                View coverage
              </MButton>
            </div>
            <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-navy-600">
              <CheckCircle2 className="h-4 w-4 text-brand-600" aria-hidden="true" />
              One accountable partner across air, ocean, road and last-mile.
            </p>
          </Reveal>
        </Container>
      </Section>

      <CTASection
        title="Tell us what you're shipping"
        subtitle="Get a fast, transparent quote tailored to your cargo, lane and timeline — to or from the USA, Ghana, or anywhere in the world."
        primary={{ label: "Get a quote", href: "/contact" }}
        secondary={{ label: "View coverage", href: "/coverage" }}
        image="/images/air-freight.jpg"
        imageAlt="Cargo aircraft being loaded for an international shipment"
      />
    </>
  );
}
