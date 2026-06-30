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
  Layers,
} from "lucide-react";
import {
  Container,
  Section,
  SectionHeading,
  MButton,
  TrackingBar,
  Photo,
  ImageFeature,
  ServiceCard,
  FeatureCard,
  StatsBand,
  ProcessSteps,
  TestimonialGrid,
  CTASection,
  CoverageStrip,
  LogoCloud,
  LibertyAcronym,
} from "@/components/marketing";
import { Reveal, RevealStagger, RevealItem } from "@/components/marketing/motion";

export const metadata: Metadata = {
  title: {
    absolute:
      "Liberty & Liberty Logistics — Global Logistics & International Shipping",
  },
  description:
    "Ship to and from the USA, Ghana and China, and worldwide with Liberty & Liberty Logistics. Import from China to the USA, Ghana, Nigeria and across Africa. Air & ocean freight, express parcel, door-to-door delivery, customs clearance, warehousing and e-commerce shipping — with real-time tracking and transparent pricing.",
};

const services = [
  {
    icon: Plane,
    title: "Air Freight",
    description:
      "Fast, reliable air cargo on priority lanes between the USA, Ghana, China and destinations worldwide.",
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
      "Secure storage, consolidation and fulfilment from our hubs in the USA, Ghana and China.",
  },
  {
    icon: ShoppingCart,
    title: "E-commerce Shipping",
    description:
      "Online-seller logistics with consolidation, labelling and fast last-mile to your buyers.",
  },
  {
    icon: Layers,
    title: "Consolidation",
    description:
      "Combine multiple purchases into one shipment to cut cost per kilo and simplify delivery.",
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
      "One partner connecting the USA, Ghana, China, Africa and the wider world — wherever business takes you.",
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
  { value: 14, suffix: "+", label: "Countries served" },
  { value: 50000, suffix: "+", label: "Shipments delivered" },
  { value: 99, suffix: "%", label: "On-time delivery" },
  { value: 24, suffix: "/7", label: "Customer support" },
];

const testimonials = [
  {
    quote:
      "Liberty has become the backbone of my import business. My electronics leave the USA and reach my shop in Accra faster than anyone else I've used — and I can watch every step.",
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
      "Sending barrels and gifts home to family in Ghana used to be stressful. With Liberty it's door-to-door, clearly priced, and it always arrives. They truly handle it with care.",
    name: "Abena Owusu",
    role: "Family Shipper",
    company: "New York, USA",
  },
];

export default function HomePage() {
  return (
    <>
      {/* 1. Hero */}
      <section className="relative isolate overflow-hidden bg-navy-950">
        {/* Real container-port backdrop under a deep navy wash for legibility */}
        <Photo
          src="/images/hero-port.jpg"
          alt="Aerial view of a global container port at work"
          overlay="hero"
          priority
          sizes="100vw"
          position="center"
          className="absolute inset-0"
        />
        {/* subtle pattern + glow overlays on top of the photo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
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
            <Reveal mode="load" delay={0}>
              <div className="mx-auto flex max-w-xl items-center justify-center gap-3 sm:gap-4">
                <span
                  className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-400/40 to-gold-400/70"
                  aria-hidden="true"
                />
                <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.32em] text-gold-300 sm:text-xs">
                  Global Logistics &amp; International Shipping
                </span>
                <span
                  className="h-px flex-1 bg-gradient-to-l from-transparent via-gold-400/40 to-gold-400/70"
                  aria-hidden="true"
                />
              </div>
            </Reveal>

            <Reveal mode="load" delay={0.1}>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Move cargo to and from the{" "}
                <span className="text-gold-300">USA</span>,{" "}
                <span className="text-gold-300">Ghana</span>,{" "}
                <span className="text-gold-300">China</span> and{" "}
                <span className="text-gold-300">worldwide</span>
              </h1>
            </Reveal>

            <Reveal mode="load" delay={0.2}>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-navy-100 sm:text-xl">
                Liberty &amp; Liberty Logistics delivers air &amp; ocean freight,
                express parcels and door-to-door shipping with real-time tracking
                and transparent pricing. Whether you ship one box or a thousand
                pallets, we get it there with confidence.
              </p>
            </Reveal>

            <Reveal mode="load" delay={0.3}>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <MButton href="/contact" variant="primary" size="lg">
                  Get a quote
                </MButton>
                <MButton href="/services" variant="light" size="lg">
                  Our services
                </MButton>
              </div>
            </Reveal>

            {/* trust signals */}
            <Reveal mode="load" delay={0.4}>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-navy-100">
                <span className="inline-flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gold-300" aria-hidden="true" />
                  Door-to-door delivery
                </span>
                <span className="inline-flex items-center gap-2">
                  <Radar className="h-4 w-4 text-gold-300" aria-hidden="true" />
                  Real-time tracking
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-gold-300" aria-hidden="true" />
                  Insured &amp; secure
                </span>
              </div>
            </Reveal>
          </div>

          {/* prominent tracking bar */}
          <Reveal mode="load" delay={0.5}>
            <div className="mx-auto mt-12 max-w-3xl">
              <TrackingBar variant="hero" />
              <p className="mt-3 text-center text-sm text-navy-100">
                Already shipping with us? Enter your tracking number above for a
                live status.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* 2. Logo cloud / trusted by */}
      <Section className="bg-white !py-12 sm:!py-14">
        <Container>
          <Reveal>
            <LogoCloud />
          </Reveal>
        </Container>
      </Section>

      {/* 3. Services */}
      <Section id="services" className="bg-navy-50 !pt-4">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="What we do"
              title="Complete logistics for every shipment"
              subtitle="From a single express parcel to full ocean containers, Liberty & Liberty Logistics moves your goods across the USA, Ghana, Africa and beyond."
              align="center"
            />
          </Reveal>
          <RevealStagger className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {services.map((service) => (
              <RevealItem key={service.title}>
                <ServiceCard
                  icon={service.icon}
                  title={service.title}
                  description={service.description}
                  href="/services"
                />
              </RevealItem>
            ))}
          </RevealStagger>
        </Container>
      </Section>

      {/* 4. Air & ocean showcase */}
      <Section className="bg-white">
        <Container className="space-y-20 lg:space-y-28">
          <Reveal>
            <ImageFeature
              eyebrow="Air & Ocean Freight"
              icon={Plane}
              title="The right lane for every shipment — by air or by sea"
              description="Need it fast? Our priority air cargo moves time-critical goods in days. Shipping in volume? Cost-effective ocean freight carries pallets, barrels and full containers at the best rate per kilo. Either way, you get one accountable partner end to end."
              image="/images/air-freight.jpg"
              imageAlt="Cargo aircraft on the tarmac at golden hour"
              bullets={[
                "Priority & economy air lanes",
                "FCL & LCL ocean freight",
                "Consolidation to cut cost per kilo",
                "Live milestones from origin to door",
              ]}
              cta={{ label: "Explore freight services", href: "/services" }}
            />
          </Reveal>
          <Reveal>
            <ImageFeature
              reverse
              eyebrow="Warehousing & E-commerce"
              icon={Warehouse}
              title="Storage, fulfilment and last-mile built for sellers"
              description="Store inventory in our secure hubs, consolidate purchases from multiple suppliers, and let us pick, pack and ship to your buyers across Africa and the world. Perfect for online sellers, importers and growing brands."
              image="/images/fulfillment.jpg"
              imageAlt="Fulfilment floor stacked with labelled parcels ready to ship"
              bullets={[
                "Secure warehousing in the USA & Ghana",
                "Pick, pack & label for sellers",
                "Multi-supplier consolidation",
                "Fast, tracked last-mile delivery",
              ]}
              cta={{ label: "See how it works", href: "/services" }}
            />
          </Reveal>
        </Container>
      </Section>

      {/* 5. Coverage / global network */}
      <Section className="bg-navy-50 !py-12 sm:!py-16">
        <Container>
          <Reveal>
            <CoverageStrip />
          </Reveal>
        </Container>
      </Section>

      {/* 6. Why choose Liberty */}
      <Section className="bg-white">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Why Liberty"
              title="Shipping made simple, secure and dependable"
              subtitle="We built Liberty & Liberty Logistics around the things that matter most to traders, online sellers and families moving goods across the world."
              align="center"
            />
          </Reveal>
          <div className="mt-12 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="relative">
              <Photo
                src="/images/team.jpg"
                alt="Liberty & Liberty Logistics operations team coordinating shipments"
                overlay="feature"
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="aspect-[4/3] w-full rounded-3xl shadow-lift ring-1 ring-navy-900/5"
              />
              <span
                className="pointer-events-none absolute -bottom-3 -right-3 h-16 w-16 rounded-2xl border-2 border-gold-400/60"
                aria-hidden="true"
              />
            </div>
            <RevealStagger className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {features.map((feature) => (
                <RevealItem key={feature.title}>
                  <FeatureCard
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                  />
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </Container>
      </Section>

      {/* 7. What LIBERTY stands for */}
      <section className="relative overflow-hidden bg-navy-950 py-20 sm:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-brand-600/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-0 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl"
        />
        <Container className="relative">
          <Reveal>
            <SectionHeading
              light
              eyebrow="The name we earn every day"
              title={
                <>
                  What <span className="text-gold-300">LIBERTY</span> stands for
                </>
              }
              subtitle="More than a name — it's our promise on every shipment."
              align="center"
            />
          </Reveal>
          <Reveal className="mt-12">
            <LibertyAcronym tone="dark" />
          </Reveal>
        </Container>
      </section>

      {/* 8. Process steps */}
      <Section className="bg-white">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="How it works"
              title="From booking to your door in four steps"
              subtitle="A clear, guided process keeps you informed at every milestone — no surprises, just delivery."
              align="center"
            />
          </Reveal>
          <Reveal className="mt-12">
            <ProcessSteps steps={processSteps} />
          </Reveal>
        </Container>
      </Section>

      {/* 9. Stats band */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-900 to-brand-800 py-16 sm:py-20">
        <Container className="relative">
          <Reveal>
            <StatsBand stats={stats} dark />
          </Reveal>
        </Container>
      </section>

      {/* 10. Testimonials */}
      <Section className="bg-navy-50">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Trusted worldwide"
              title="Loved by traders, sellers and families"
              subtitle="Thousands of customers rely on Liberty & Liberty Logistics to connect them with the people and markets that matter."
              align="center"
            />
          </Reveal>
          <Reveal className="mt-12">
            <TestimonialGrid items={testimonials} />
          </Reveal>
          <Reveal>
            <p className="mt-10 flex items-center justify-center gap-2 text-sm font-medium text-navy-600">
              <MapPin className="h-4 w-4 text-gold-500" aria-hidden="true" />
              Hubs in the USA &amp; Ghana, serving customers across Africa and the
              wider world.
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* 11. Final CTA */}
      <Reveal>
        <CTASection
          title="Ready to ship with confidence?"
          subtitle="Get a fast, transparent quote today — or track an existing shipment in seconds. Liberty & Liberty Logistics is ready when you are."
          primary={{ label: "Get a quote", href: "/contact" }}
          secondary={{ label: "Track a shipment", href: "/track" }}
          image="/images/ocean-freight.jpg"
          imageAlt="Container ship carrying cargo across the ocean"
        />
      </Reveal>
    </>
  );
}
