import type { Metadata } from "next";
import {
  ArrowLeftRight,
  ArrowRight,
  Globe2,
  MapPin,
  Plane,
  Ship,
  Package,
  FileCheck2,
  Info,
  type LucideIcon,
} from "lucide-react";
import {
  Container,
  Section,
  SectionHeading,
  CoverageStrip,
  CTASection,
  Photo,
} from "@/components/marketing";

export const metadata: Metadata = {
  title: "Coverage & Global Network",
  description:
    "Liberty & Liberty Logistics connects the USA, Ghana, Africa and the world. Explore our trade lanes, typical transit times by mode, and how we handle customs clearance on every shipment.",
};

type Lane = {
  icon: LucideIcon;
  title: string;
  description: string;
  highlights: string[];
};

const lanes: Lane[] = [
  {
    icon: ArrowLeftRight,
    title: "USA ⇄ Ghana",
    description:
      "Our core corridor. Frequent air and ocean departures in both directions for traders, online sellers, businesses and families moving goods between the United States and Ghana.",
    highlights: ["Weekly ocean sailings", "Daily air uplift", "Full door-to-door"],
  },
  {
    icon: ArrowRight,
    title: "Worldwide → USA",
    description:
      "Import from suppliers and marketplaces anywhere in the world into the United States. We consolidate at origin and clear US customs so your goods arrive ready to sell or use.",
    highlights: ["Asia, Europe & Gulf origins", "Consolidation hubs", "US customs handled"],
  },
  {
    icon: Globe2,
    title: "USA → Africa & beyond",
    description:
      "Ship from the USA to Ghana, across West Africa and onward to the wider continent and global markets — by the fastest viable air or the most economical ocean lane.",
    highlights: ["West Africa gateways", "Onward connections", "Worldwide reach"],
  },
  {
    icon: MapPin,
    title: "Intra-Africa",
    description:
      "Move cargo between countries across the continent. We bridge regional lanes so a shipment landing in Ghana can continue to neighbouring and distant African markets.",
    highlights: ["Cross-border trucking", "Regional clearance", "Last-mile delivery"],
  },
];

type Route = {
  origin: string;
  destination: string;
  mode: string;
  modeIcon: LucideIcon;
  transit: string;
};

const routes: Route[] = [
  {
    origin: "New York / New Jersey, USA",
    destination: "Accra, Ghana",
    mode: "Air freight",
    modeIcon: Plane,
    transit: "3 – 6 days",
  },
  {
    origin: "Houston, USA",
    destination: "Tema, Ghana",
    mode: "Ocean (LCL)",
    modeIcon: Ship,
    transit: "28 – 38 days",
  },
  {
    origin: "Accra, Ghana",
    destination: "New York, USA",
    mode: "Air freight",
    modeIcon: Plane,
    transit: "4 – 7 days",
  },
  {
    origin: "Tema, Ghana",
    destination: "Baltimore, USA",
    mode: "Ocean (FCL)",
    modeIcon: Ship,
    transit: "22 – 30 days",
  },
  {
    origin: "Guangzhou, China",
    destination: "Los Angeles, USA",
    mode: "Ocean (FCL)",
    modeIcon: Ship,
    transit: "18 – 26 days",
  },
  {
    origin: "London, United Kingdom",
    destination: "Accra, Ghana",
    mode: "Express parcel",
    modeIcon: Package,
    transit: "2 – 5 days",
  },
  {
    origin: "Dubai, UAE",
    destination: "New York, USA",
    mode: "Air freight",
    modeIcon: Plane,
    transit: "4 – 8 days",
  },
  {
    origin: "Accra, Ghana",
    destination: "Lagos, Nigeria",
    mode: "Road / air",
    modeIcon: Plane,
    transit: "2 – 6 days",
  },
];

export default function CoveragePage() {
  return (
    <>
      {/* Hero — navy band over a real container-port photo */}
      <section className="relative isolate overflow-hidden bg-navy-950">
        <Photo
          src="/images/hero-port.jpg"
          alt="Aerial view of a global container terminal at work"
          overlay="hero"
          priority
          sizes="100vw"
          position="center"
          className="absolute inset-0"
        />
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
          className="pointer-events-none absolute -left-24 -top-32 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl"
        />
        <Container className="relative py-16 sm:py-24">
          <SectionHeading
            eyebrow="Global network"
            title="One partner, connected to the world"
            subtitle="From our hubs in the USA and Ghana, Liberty & Liberty Logistics moves your cargo across Africa and around the globe. Explore the lanes we run, how long shipments take, and how we clear customs on both sides."
            align="center"
            light
          />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-navy-100">
            <span className="inline-flex items-center gap-2">
              <Plane className="h-4 w-4 text-gold-300" aria-hidden="true" />
              USA &#8644; Ghana
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold-300" aria-hidden="true" />
              Worldwide &#8594; USA
            </span>
            <span className="inline-flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-gold-300" aria-hidden="true" />
              USA &#8594; Africa &amp; beyond
            </span>
          </div>
        </Container>
      </section>

      {/* Coverage strip — the global trade-lane network */}
      <Section className="bg-white">
        <Container>
          <CoverageStrip />
        </Container>
      </Section>

      {/* Reach showcase — imagery paired with the network statement */}
      <Section className="bg-navy-50 !pt-0">
        <Container>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="relative order-2 lg:order-1">
              <Photo
                src="/images/global-window.jpg"
                alt="View of the earth from altitude, evoking worldwide reach"
                overlay="feature"
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="aspect-[4/3] w-full rounded-3xl shadow-lift ring-1 ring-navy-900/5"
              />
              <span
                className="pointer-events-none absolute -bottom-3 -right-3 h-16 w-16 rounded-2xl border-2 border-gold-400/60"
                aria-hidden="true"
              />
            </div>
            <div className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-600">
                <span className="h-px w-6 bg-gold-400" aria-hidden="true" />
                Truly worldwide
              </span>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
                Two hubs, one network reaching every market
              </h2>
              <p className="mt-4 text-base leading-relaxed text-navy-600 sm:text-lg">
                Our hubs in Houston, USA and Tema/Accra, Ghana anchor a network
                that connects buyers, sellers and families on both sides of the
                Atlantic. From there we link to ports, airports and last-mile
                partners across Africa, Asia, Europe and the Gulf — so almost
                anything can reach the USA, and from the USA we reach Ghana,
                Africa and beyond.
              </p>
              <dl className="mt-8 grid grid-cols-3 gap-4 text-center">
                {[
                  { value: "14+", label: "Countries served" },
                  { value: "2", label: "Continental hubs" },
                  { value: "99%", label: "On-time delivery" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-navy-100 bg-white p-4 shadow-card"
                  >
                    <dt className="text-2xl font-bold tracking-tight text-navy-900">
                      {item.value}
                    </dt>
                    <dd className="mt-1 text-xs font-medium text-navy-600">
                      {item.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Container>
      </Section>

      {/* Lanes we operate */}
      <Section className="bg-white">
        <Container>
          <SectionHeading
            eyebrow="Lanes we operate"
            title="Trusted routes in every direction"
            subtitle="Packages can originate almost anywhere and reach the USA, and from the USA we reach Ghana, Africa and the wider world. These are the corridors we run every week."
            align="center"
          />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {lanes.map((lane) => {
              const Icon = lane.icon;
              return (
                <div
                  key={lane.title}
                  className="group flex h-full flex-col rounded-2xl border border-navy-100 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover"
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-navy-900">{lane.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-navy-600">
                    {lane.description}
                  </p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {lane.highlights.map((h) => (
                      <li
                        key={h}
                        className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-600 ring-1 ring-inset ring-navy-100"
                      >
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Transit-time table */}
      <Section className="bg-navy-50">
        <Container>
          <SectionHeading
            eyebrow="Transit times"
            title="How long your shipment takes"
            subtitle="Typical door-to-port transit windows by mode. Actual timing depends on carrier schedules, customs and final-mile delivery — your quote will confirm exact estimates."
            align="center"
          />
          <div className="mt-12 overflow-hidden rounded-2xl border border-navy-100 shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <caption className="sr-only">
                  Typical transit times by origin, destination and mode of transport
                </caption>
                <thead>
                  <tr className="bg-navy-900 text-white">
                    <th scope="col" className="px-5 py-4 text-sm font-semibold">
                      Origin
                    </th>
                    <th scope="col" className="px-5 py-4 text-sm font-semibold">
                      Destination
                    </th>
                    <th scope="col" className="px-5 py-4 text-sm font-semibold">
                      Mode
                    </th>
                    <th scope="col" className="px-5 py-4 text-sm font-semibold">
                      Typical transit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100 bg-white">
                  {routes.map((route) => {
                    const ModeIcon = route.modeIcon;
                    return (
                      <tr
                        key={`${route.origin}-${route.destination}-${route.mode}`}
                        className="transition-colors hover:bg-navy-50"
                      >
                        <td className="px-5 py-4 text-sm font-medium text-navy-900">
                          {route.origin}
                        </td>
                        <td className="px-5 py-4 text-sm text-navy-700">
                          <span className="inline-flex items-center gap-2">
                            <ArrowRight
                              className="h-4 w-4 text-gold-500"
                              aria-hidden="true"
                            />
                            {route.destination}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-navy-700">
                          <span className="inline-flex items-center gap-2">
                            <ModeIcon
                              className="h-4 w-4 text-brand-600"
                              aria-hidden="true"
                            />
                            {route.mode}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-navy-900">
                          {route.transit}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-navy-500">
            Estimates shown are business-day ranges and exclude time held for
            inspection or duty payment.
          </p>
        </Container>
      </Section>

      {/* Customs / clearance note — anchor target for footer "Customs Guidance" */}
      <Section id="customs" className="scroll-mt-24 bg-white">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-navy-100 bg-white p-8 shadow-card sm:p-12">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 h-1.5 w-28 rounded-br-full bg-gold-400"
            />
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[auto,1fr]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                <FileCheck2 className="h-8 w-8" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
                  Customs cleared on both sides
                </h2>
                <p className="mt-3 text-base leading-relaxed text-navy-600">
                  Every cross-border shipment passes through customs — and that is
                  where many shippers get stuck. Our brokerage team prepares the
                  documentation, classifies your goods and works directly with US
                  and Ghanaian authorities to clear cargo without unnecessary
                  delays. We will flag restricted or prohibited items before you
                  ship and give you a clear estimate of any duties or taxes up
                  front, so there are no surprises at the border.
                </p>
                <p className="mt-4 inline-flex items-start gap-2 rounded-xl bg-navy-50 px-4 py-3 text-sm text-navy-600 ring-1 ring-inset ring-navy-100">
                  <Info
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand-600"
                    aria-hidden="true"
                  />
                  Need to check whether something can be shipped? Ask us before you
                  book — we will confirm requirements for your specific lane.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <CTASection
        title="Find the right lane for your cargo"
        subtitle="Tell us your origin, destination and timeline and we'll recommend the best mode and a transparent price — anywhere to or from the USA, Ghana and the world."
        primary={{ label: "Get a quote", href: "/contact" }}
        secondary={{ label: "Explore services", href: "/services" }}
        image="/images/ocean-freight.jpg"
        imageAlt="Container ship carrying cargo across the ocean"
      />
    </>
  );
}
