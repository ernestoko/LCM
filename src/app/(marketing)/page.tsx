import type { Metadata } from "next";
import {
  Plane,
  Ship,
  Package,
  Truck,
  FileCheck2,
  Warehouse,
  ShoppingCart,
  Radar,
  BadgeDollarSign,
  ShieldCheck,
  Headset,
  Gauge,
  Globe2,
  CalendarCheck,
  PackageCheck,
  Route,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import {
  Container,
  Section,
  SectionHeading,
  MButton,
  TrackingBar,
  ServiceCard,
  FeatureCard,
  StatsBand,
  ProcessSteps,
  TestimonialGrid,
  CTASection,
  CoverageStrip,
  LogoCloud,
} from "@/components/marketing";

export const metadata: Metadata = {
  title: "LCM Logistics — Global Logistics & International Shipping",
  description:
    "Ship to and from the USA, to and from Ghana, and worldwide with LCM Logistics. Air & ocean freight, express parcel, door-to-door delivery, customs clearance, warehousing and e-commerce shipping — with real-time tracking and transparent pricing.",
};

const services = [
  {
    icon: Plane,
    title: "Air Freight",
    description:
      "Fast, reliable air cargo on priority lanes between the USA, Ghana and destinations worldwide.",
  },
  {
    icon: Ship,
    title: "Ocean Freight",
    description:
      "Cost-effective FCL and LCL sea freight for bulk, pallets and oversized shipments across continents.",
  },
  {
    icon: Package,
    title: "Express Parcel",
    description:
      "Time-critical small parcels and documents delivered swiftly with end-to-end visibility.",
  },
  {
    icon: Truck,
    title: "Door-to-Door",
    description:
      "We collect at origin and deliver to the recipient's door — no terminals, no guesswork.",
  },
  {
    icon: FileCheck2,
    title: "Customs Clearance",
    description:
      "Expert brokerage and documentation to clear your goods quickly and keep them moving.",
  },
  {
    icon: Warehouse,
    title: "Warehousing",
    description:
      "Secure storage, consolidation and fulfilment from our hubs in the USA and Ghana.",
  },
  {
    icon: ShoppingCart,
    title: "E-commerce Shipping",
    description:
      "Online-seller logistics with consolidation, labelling and fast last-mile to your buyers.",
  },
];

const features = [
  {
    icon: Radar,
    title: "Real-time tracking",
    description:
      "Follow every shipment from pickup to delivery with live status updates and milestone alerts.",
  },
  {
    icon: BadgeDollarSign,
    title: "Transparent pricing",
    description:
      "Clear, upfront quotes with no hidden fees — know exactly what you pay before you ship.",
  },
  {
    icon: ShieldCheck,
    title: "Secure handling",
    description:
      "Careful packing, sealed consolidation and insured transit keep your cargo safe end to end.",
  },
  {
    icon: Headset,
    title: "Dedicated 24/7 support",
    description:
      "A real team on both sides of the ocean, ready to help whenever you need answers.",
  },
  {
    icon: Gauge,
    title: "Fast transit times",
    description:
      "Optimised routes and trusted carriers get your goods where they belong, on schedule.",
  },
  {
    icon: Globe2,
    title: "Global reach",
    description:
      "One partner connecting the USA, Ghana, Africa and the wider world — wherever business takes you.",
  },
];

const processSteps = [
  {
    icon: CalendarCheck,
    title: "Book",
    description:
      "Request a quote online and schedule a pickup or drop-off in minutes — for any origin or destination.",
  },
  {
    icon: PackageCheck,
    title: "Collect",
    description:
      "We collect, inspect and consolidate your shipment, then handle packing and export paperwork.",
  },
  {
    icon: Route,
    title: "In Transit",
    description:
      "Your cargo moves by air or ocean on the fastest viable lane while you track it in real time.",
  },
  {
    icon: CheckCircle2,
    title: "Delivered",
    description:
      "We clear customs and deliver door-to-door, confirming receipt the moment it arrives.",
  },
];

const stats = [
  { value: 12, suffix: "+", label: "Countries served" },
  { value: 50000, suffix: "+", label: "Shipments delivered" },
  { value: 99, suffix: "%", label: "On-time delivery" },
  { value: 24, suffix: "/7", label: "Customer support" },
];

const testimonials = [
  {
    quote:
      "LCM has become the backbone of my import business. My electronics leave the USA and reach my shop in Accra faster than anyone else I've used — and I can watch every step.",
    name: "Kwame Boateng",
    role: "Wholesale Trader",
    company: "Accra, Ghana",
  },
  {
    quote:
      "As an online seller I ship dozens of parcels a week to buyers across Africa. Their e-commerce consolidation cut my costs dramatically and the tracking keeps my customers happy.",
    name: "Sarah Mensah",
    role: "Online Seller",
    company: "Houston, USA",
  },
  {
    quote:
      "Sending barrels and gifts home to family in Ghana used to be stressful. With LCM it's door-to-door, clearly priced, and it always arrives. They truly handle it with care.",
    name: "Abena Owusu",
    role: "Family Shipper",
    company: "New York, USA",
  },
];

export default function HomePage() {
  return (
    <>
      {/* 1. Hero */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-navy-900 via-navy-900 to-brand-800">
        {/* subtle pattern + glow overlays */}
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
          className="pointer-events-none absolute -top-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-brand-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-24 h-[26rem] w-[26rem] rounded-full bg-gold-500/10 blur-3xl"
        />

        <Container className="relative py-20 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-400 backdrop-blur">
              <Globe2 className="h-4 w-4" aria-hidden="true" />
              Global logistics &amp; international shipping
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Move cargo to and from the{" "}
              <span className="text-gold-400">USA</span>,{" "}
              <span className="text-gold-400">Ghana</span> and{" "}
              <span className="text-gold-400">worldwide</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-navy-200 sm:text-xl">
              LCM Logistics delivers air &amp; ocean freight, express parcels and
              door-to-door shipping with real-time tracking and transparent
              pricing. Whether you ship one box or a thousand pallets, we get it
              there with confidence.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <MButton href="/contact" variant="primary" size="lg">
                Get a quote
              </MButton>
              <MButton href="/services" variant="light" size="lg">
                Our services
              </MButton>
            </div>

            {/* trust signals */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-navy-200">
              <span className="inline-flex items-center gap-2">
                <Truck className="h-4 w-4 text-gold-400" aria-hidden="true" />
                Door-to-door delivery
              </span>
              <span className="inline-flex items-center gap-2">
                <Radar className="h-4 w-4 text-gold-400" aria-hidden="true" />
                Real-time tracking
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck
                  className="h-4 w-4 text-gold-400"
                  aria-hidden="true"
                />
                Insured &amp; secure
              </span>
            </div>
          </div>

          {/* prominent tracking bar */}
          <div className="mx-auto mt-12 max-w-3xl">
            <TrackingBar variant="hero" />
            <p className="mt-3 text-center text-sm text-navy-200">
              Already shipping with us? Enter your tracking number above for a
              live status.
            </p>
          </div>
        </Container>
      </section>

      {/* 2. Logo cloud / trusted by */}
      <LogoCloud />

      {/* 3. Services */}
      <Section id="services" className="bg-white">
        <Container>
          <SectionHeading
            eyebrow="What we do"
            title="Complete logistics for every shipment"
            subtitle="From a single express parcel to full ocean containers, LCM Logistics moves your goods across the USA, Ghana, Africa and beyond."
            align="center"
          />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {services.map((service) => (
              <ServiceCard
                key={service.title}
                icon={service.icon}
                title={service.title}
                description={service.description}
                href="/services"
              />
            ))}
          </div>
        </Container>
      </Section>

      {/* 4. Coverage / global network */}
      <CoverageStrip />

      {/* 5. Why choose LCM */}
      <Section className="bg-navy-50">
        <Container>
          <SectionHeading
            eyebrow="Why LCM"
            title="Shipping made simple, secure and dependable"
            subtitle="We built LCM Logistics around the things that matter most to traders, online sellers and families moving goods across the world."
            align="center"
          />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </Container>
      </Section>

      {/* 6. Process steps */}
      <Section className="bg-white">
        <Container>
          <SectionHeading
            eyebrow="How it works"
            title="From booking to your door in four steps"
            subtitle="A clear, guided process keeps you informed at every milestone — no surprises, just delivery."
            align="center"
          />
          <div className="mt-12">
            <ProcessSteps steps={processSteps} />
          </div>
        </Container>
      </Section>

      {/* 7. Stats band */}
      <StatsBand stats={stats} dark />

      {/* 8. Testimonials */}
      <Section className="bg-navy-50">
        <Container>
          <SectionHeading
            eyebrow="Trusted worldwide"
            title="Loved by traders, sellers and families"
            subtitle="Thousands of customers rely on LCM Logistics to connect them with the people and markets that matter."
            align="center"
          />
          <div className="mt-12">
            <TestimonialGrid items={testimonials} />
          </div>
          <p className="mt-10 flex items-center justify-center gap-2 text-sm font-medium text-navy-600">
            <MapPin className="h-4 w-4 text-gold-500" aria-hidden="true" />
            Hubs in the USA &amp; Ghana, serving customers across Africa and the
            wider world.
          </p>
        </Container>
      </Section>

      {/* 9. Final CTA */}
      <CTASection
        title="Ready to ship with confidence?"
        subtitle="Get a fast, transparent quote today — or track an existing shipment in seconds. LCM Logistics is ready when you are."
        primary={{ label: "Get a quote", href: "/contact" }}
        secondary={{ label: "Track a shipment", href: "/track" }}
      />
    </>
  );
}
