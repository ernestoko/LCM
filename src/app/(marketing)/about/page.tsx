import type { Metadata } from "next";
import {
  ShieldCheck,
  BadgeCheck,
  Eye,
  HeartHandshake,
  Globe2,
  Lightbulb,
  Target,
  Compass,
  MapPin,
  Building2,
} from "lucide-react";
import {
  Container,
  Section,
  SectionHeading,
  FeatureCard,
  StatsBand,
  CTASection,
  Photo,
  ImageFeature,
  LibertyAcronym,
  type Stat,
} from "@/components/marketing";

export const metadata: Metadata = {
  title: "About — Liberty & Liberty Logistics",
  description:
    "Liberty & Liberty Logistics is a global logistics and international shipping company connecting the USA, Ghana, Africa and the world. Discover our story, mission and the LIBERTY promise behind every shipment.",
};

const values = [
  {
    icon: BadgeCheck,
    title: "Integrity",
    description:
      "We do what we say. Honest advice, accurate paperwork and shipments handled the way we'd want our own goods treated.",
  },
  {
    icon: ShieldCheck,
    title: "Reliability",
    description:
      "Schedules you can plan around. We optimise routes and stay on top of every milestone so your cargo arrives as promised.",
  },
  {
    icon: Eye,
    title: "Transparency",
    description:
      "Clear, upfront pricing and real-time tracking. You always know where your shipment is and exactly what you're paying.",
  },
  {
    icon: HeartHandshake,
    title: "Customer-first",
    description:
      "Real people on both sides of the ocean, ready to help. Your goals shape how we route, price and care for every order.",
  },
  {
    icon: Globe2,
    title: "Global reach",
    description:
      "One partner connecting the USA, Ghana, Africa and the wider world — so distance never limits your business.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description:
      "We keep improving — smarter consolidation, faster lanes and better tracking — to move your cargo more efficiently.",
  },
];

const hubs = [
  {
    country: "United States Hub",
    city: "Houston, Texas",
    description:
      "Our North American gateway for collection, consolidation and export — connecting sellers and shippers across the USA to the world.",
  },
  {
    country: "Ghana Hub",
    city: "Tema / Accra",
    description:
      "Our West African base for import clearance, warehousing and door-to-door delivery across Ghana and the wider region.",
  },
];

const stats: Stat[] = [
  { value: 14, suffix: "+", label: "Countries served" },
  { value: 50000, suffix: "+", label: "Shipments delivered" },
  { value: 99, suffix: "%", label: "On-time delivery" },
  { value: 24, suffix: "/7", label: "Customer support" },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
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
          className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl"
        />
        <Container className="relative py-16 sm:py-24">
          <SectionHeading
            eyebrow="About Liberty & Liberty Logistics"
            title="Connecting people, businesses and markets"
            subtitle="We're a global logistics and international shipping company built to move cargo confidently to and from the USA, to and from Ghana, and across Africa and the world."
            align="center"
            light
          />
        </Container>
      </section>

      {/* Story + mission */}
      <Section className="bg-white">
        <Container>
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-600">
                <span className="h-px w-6 bg-gold-400" aria-hidden="true" />
                Our story
              </span>
              <h2 className="text-balance text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
                Built to make international shipping simple
              </h2>
              <div className="mt-5 space-y-4 text-base leading-relaxed text-navy-600">
                <p>
                  Liberty &amp; Liberty Logistics began with a simple frustration
                  shared by traders, online sellers and families alike: moving
                  goods across borders was slow, opaque and stressful. Quotes were
                  unclear, parcels disappeared into the system, and nobody picked
                  up the phone when something went wrong.
                </p>
                <p>
                  We set out to fix that. By combining trusted air and ocean
                  networks with hands-on customer care and modern tracking, we
                  created a single partner that handles every leg of the journey —
                  from collection and consolidation to customs clearance and
                  door-to-door delivery.
                </p>
                <p>
                  Today, with hubs in the USA and Ghana, Liberty &amp; Liberty
                  Logistics moves everything from urgent documents and e-commerce
                  parcels to full ocean containers — connecting customers across
                  Africa and the wider world with the markets and loved ones that
                  matter to them.
                </p>
              </div>
            </div>

            <div className="relative">
              <Photo
                src="/images/team.jpg"
                alt="Liberty & Liberty Logistics operations team coordinating shipments"
                overlay="feature"
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="aspect-[4/3] w-full rounded-3xl shadow-lift ring-1 ring-navy-900/5"
              />
              <span
                className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-2xl border-2 border-gold-400/60"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Mission + vision */}
          <div className="mt-12 grid grid-cols-1 gap-6 lg:mt-16 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl border border-navy-100 bg-navy-50 p-8 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                  <Target className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-navy-900">Our mission</h3>
              </div>
              <p className="mt-4 text-base leading-relaxed text-navy-600">
                To make global shipping effortless and dependable — giving every
                customer, from a one-parcel sender to a growing business, the
                reach, visibility and confidence of a world-class logistics
                network.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-navy-100 bg-navy-50 p-8 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500 text-white">
                  <Compass className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-navy-900">Our vision</h3>
              </div>
              <p className="mt-4 text-base leading-relaxed text-navy-600">
                A world where distance is never a barrier to trade or family —
                where sending something across an ocean is as simple and
                trustworthy as sending it across town.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* What LIBERTY stands for */}
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
          <SectionHeading
            light
            eyebrow="The name we earn every day"
            title={
              <>
                What <span className="text-gold-300">LIBERTY</span> stands for
              </>
            }
            subtitle="More than a name — it's the promise we keep on every shipment, for every customer."
            align="center"
          />
          <div className="mt-12">
            <LibertyAcronym tone="dark" />
          </div>
        </Container>
      </section>

      {/* Trust / partnership feature */}
      <Section className="bg-white">
        <Container>
          <ImageFeature
            eyebrow="A partner you can trust"
            icon={HeartHandshake}
            title="Relationships built to last, shipment after shipment"
            description="We measure success by the customers who come back. From first quote to final delivery, we stay accountable, communicate clearly and treat your cargo as if it were our own — earning trust the only way that counts."
            image="/images/handshake.jpg"
            imageAlt="Partnership handshake sealing a logistics agreement"
            bullets={[
              "One accountable partner end to end",
              "Honest, all-in pricing — no surprises",
              "Proactive updates at every milestone",
              "Real people on both sides of the ocean",
            ]}
            cta={{ label: "Talk to our team", href: "/contact" }}
          />
        </Container>
      </Section>

      {/* Values grid */}
      <Section className="bg-navy-50">
        <Container>
          <SectionHeading
            eyebrow="What we stand for"
            title="The values behind every shipment"
            subtitle="These principles guide how we route, price, pack and deliver — for every customer, on every lane."
            align="center"
          />
          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value) => (
              <FeatureCard
                key={value.title}
                icon={value.icon}
                title={value.title}
                description={value.description}
              />
            ))}
          </div>
        </Container>
      </Section>

      {/* Global hubs (USA & Ghana) */}
      <Section className="bg-white">
        <Container>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="relative lg:order-2">
              <Photo
                src="/images/warehouse.jpg"
                alt="Secure warehouse racking at a Liberty & Liberty Logistics hub"
                overlay="feature"
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="aspect-[4/3] w-full rounded-3xl shadow-lift ring-1 ring-navy-900/5"
              />
              <span
                className="pointer-events-none absolute -left-3 -top-3 h-16 w-16 rounded-2xl border-2 border-gold-400/60"
                aria-hidden="true"
              />
            </div>

            <div className="lg:order-1">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-600">
                <Globe2 className="h-4 w-4" aria-hidden="true" />
                Our hubs
              </span>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
                Two hubs, one seamless network
              </h2>
              <p className="mt-4 text-base leading-relaxed text-navy-600">
                Strategically placed in the USA and Ghana, our hubs give your
                cargo a clear, controlled path from origin to destination — with
                consolidation, secure storage and customs expertise on both ends.
              </p>
              <div className="mt-8 space-y-4">
                {hubs.map((hub) => (
                  <div
                    key={hub.country}
                    className="rounded-2xl border border-navy-100 bg-navy-50 p-6 shadow-card"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-white">
                        <Building2 className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <h3 className="text-sm font-bold text-navy-900">
                        {hub.country}
                      </h3>
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      {hub.city}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-navy-600">
                      {hub.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Stats band */}
      <StatsBand stats={stats} dark />

      {/* Why we exist narrative */}
      <Section className="bg-white">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-3 inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-600">
              <span className="h-px w-6 bg-gold-400" aria-hidden="true" />
              Why we exist
            </span>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
              Logistics built around the people who ship
            </h2>
            <p className="mt-5 text-base leading-relaxed text-navy-600 sm:text-lg">
              Behind every shipment is a person with a deadline. A trader importing
              stock to keep shelves full. An online seller who promised a buyer
              fast delivery. A business expanding into a new market. A family
              sending a barrel of love home for the holidays.
            </p>
            <p className="mt-4 text-base leading-relaxed text-navy-600 sm:text-lg">
              We exist for all of them. Liberty &amp; Liberty Logistics gives
              traders, online sellers, businesses and families the same
              dependable, transparent service — whether you're moving one box or a
              thousand pallets, to or from the USA, Ghana, or anywhere in the
              world. When your goods matter, we treat them like they're our own.
            </p>
          </div>
        </Container>
      </Section>

      <CTASection
        title="Ship with a partner who cares"
        subtitle="Get a transparent quote or track an existing shipment in seconds. Wherever you're sending, Liberty & Liberty Logistics is ready."
        primary={{ label: "Get a quote", href: "/contact" }}
        secondary={{ label: "Our services", href: "/services" }}
        image="/images/ocean-freight.jpg"
        imageAlt="Container ship carrying cargo across the ocean"
      />
    </>
  );
}
