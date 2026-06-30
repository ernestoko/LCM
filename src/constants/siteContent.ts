import { BUSINESS } from "@/constants/business";

/**
 * Editable marketing-site content ("the website CMS").
 *
 * The whole public site reads from a single Firestore document
 * (settings/siteContent). This file is the TYPE + the DEFAULTS that mirror the
 * current site, so an empty/missing document renders exactly as the code does
 * today (nothing breaks). A Super Admin edits the document from
 * /settings/site-content; the server loader deep-merges the stored values over
 * these defaults. Icons are stored as string names (Firestore can't hold React
 * components) and mapped to components at render time — see MARKETING_ICONS.
 */

export interface CtaLink {
  label: string;
  href: string;
}

export interface SiteCard {
  /** Lucide icon name — see MARKETING_ICONS. */
  iconName: string;
  title: string;
  description: string;
}

export interface SiteStat {
  value: number;
  suffix: string;
  label: string;
}

export interface SiteTestimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
}

export interface SiteContent {
  /** Optional dismissible banner across the top of every public page. */
  announcement: { enabled: boolean; text: string; link?: CtaLink };
  hero: {
    eyebrow: string;
    title: string;
    /** Words within `title` to highlight in gold. */
    highlights: string[];
    subtitle: string;
    primaryCta: CtaLink;
    secondaryCta: CtaLink;
  };
  services: SiteCard[];
  features: SiteCard[];
  processSteps: SiteCard[];
  stats: SiteStat[];
  testimonials: SiteTestimonial[];
  contact: { phone: string; email: string; addresses: { usa: string; ghana: string; china: string } };
}

/** A content tree where every field is optional/partial — what's stored in Firestore. */
export type PartialSiteContent = {
  [K in keyof SiteContent]?: Partial<SiteContent[K]>;
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  announcement: {
    enabled: false,
    text: "Now shipping from China to the USA, Ghana, Nigeria and across Africa.",
    link: { label: "See coverage", href: "/coverage" },
  },
  hero: {
    eyebrow: "Global Logistics & International Shipping",
    title: "Move cargo to and from the USA, Ghana, China and worldwide",
    highlights: ["USA", "Ghana", "China", "worldwide"],
    subtitle:
      "Liberty & Liberty Logistics delivers air & ocean freight, express parcels and door-to-door shipping with real-time tracking and transparent pricing. Whether you ship one box or a thousand pallets, we get it there with confidence.",
    primaryCta: { label: "Get a quote", href: "/contact" },
    secondaryCta: { label: "Our services", href: "/services" },
  },
  services: [
    { iconName: "Plane", title: "Air Freight", description: "Fast, reliable air cargo on priority lanes between the USA, Ghana, China and destinations worldwide." },
    { iconName: "Ship", title: "Ocean Freight", description: "Cost-effective FCL and LCL sea freight for bulk, pallets and oversized shipments across continents." },
    { iconName: "Package", title: "Express Parcel", description: "Time-critical small parcels and documents delivered swiftly with end-to-end visibility." },
    { iconName: "Truck", title: "Door-to-Door", description: "We collect at origin and deliver to the recipient's door — no terminals, no guesswork." },
    { iconName: "FileCheck2", title: "Customs Clearance", description: "Expert brokerage and documentation to clear your goods quickly and keep them moving." },
    { iconName: "Warehouse", title: "Warehousing", description: "Secure storage, consolidation and fulfilment from our hubs in the USA, Ghana and China." },
    { iconName: "ShoppingCart", title: "E-commerce Shipping", description: "Online-seller logistics with consolidation, labelling and fast last-mile to your buyers." },
    { iconName: "Layers", title: "Consolidation", description: "Combine multiple purchases into one shipment to cut cost per kilo and simplify delivery." },
  ],
  features: [
    { iconName: "Radar", title: "Real-time tracking", description: "Follow every shipment from pickup to delivery with live status updates and milestone alerts." },
    { iconName: "BadgeDollarSign", title: "Transparent pricing", description: "Clear, upfront quotes with no hidden fees — know exactly what you pay before you ship." },
    { iconName: "ShieldCheck", title: "Secure handling", description: "Careful packing, sealed consolidation and insured transit keep your cargo safe end to end." },
    { iconName: "Headset", title: "Dedicated 24/7 support", description: "A real team on both sides of the ocean, ready to help whenever you need answers." },
    { iconName: "Gauge", title: "Fast transit times", description: "Optimised routes and trusted carriers get your goods where they belong, on schedule." },
    { iconName: "Globe2", title: "Global reach", description: "One partner connecting the USA, Ghana, China, Africa and the wider world — wherever business takes you." },
  ],
  processSteps: [
    { iconName: "CalendarCheck", title: "Book", description: "Request a quote online and schedule a pickup or drop-off in minutes — for any origin or destination." },
    { iconName: "PackageCheck", title: "Collect", description: "We collect, inspect and consolidate your shipment, then handle packing and export paperwork." },
    { iconName: "Route", title: "In Transit", description: "Your cargo moves by air or ocean on the fastest viable lane while you track it in real time." },
    { iconName: "CheckCircle2", title: "Delivered", description: "We clear customs and deliver door-to-door, confirming receipt the moment it arrives." },
  ],
  stats: [
    { value: 14, suffix: "+", label: "Countries served" },
    { value: 50000, suffix: "+", label: "Shipments delivered" },
    { value: 99, suffix: "%", label: "On-time delivery" },
    { value: 24, suffix: "/7", label: "Customer support" },
  ],
  testimonials: [
    { quote: "Liberty has become the backbone of my import business. My electronics leave the USA and reach my shop in Accra faster than anyone else I've used — and I can watch every step.", name: "Kwame Boateng", role: "Wholesale Trader", company: "Accra, Ghana" },
    { quote: "As an online seller I ship dozens of parcels a week to buyers across Africa. Their e-commerce consolidation cut my costs dramatically and the tracking keeps my customers happy.", name: "Sarah Mensah", role: "Online Seller", company: "Houston, USA" },
    { quote: "Sending barrels and gifts home to family in Ghana used to be stressful. With Liberty it's door-to-door, clearly priced, and it always arrives. They truly handle it with care.", name: "Abena Owusu", role: "Family Shipper", company: "New York, USA" },
  ],
  contact: {
    phone: BUSINESS.phone,
    email: BUSINESS.email,
    addresses: { usa: BUSINESS.addresses.usa, ghana: BUSINESS.addresses.ghana, china: "88 Baiyun Logistics Park, Guangzhou, Guangdong 510000, China" },
  },
};

/** Deep-merge a stored (partial) content tree over the defaults. Arrays are
 *  replaced wholesale when present (so edits to a list are authoritative),
 *  objects merged key-by-key. Never throws. */
export function mergeSiteContent(stored: unknown): SiteContent {
  const d = DEFAULT_SITE_CONTENT;
  if (!stored || typeof stored !== "object") return d;
  const s = stored as PartialSiteContent;
  const pick = <T>(val: T | undefined, fallback: T): T => (val === undefined || val === null ? fallback : val);
  return {
    announcement: { ...d.announcement, ...(s.announcement ?? {}) },
    hero: { ...d.hero, ...(s.hero ?? {}) },
    services: pick(s.services as SiteCard[] | undefined, d.services),
    features: pick(s.features as SiteCard[] | undefined, d.features),
    processSteps: pick(s.processSteps as SiteCard[] | undefined, d.processSteps),
    stats: pick(s.stats as SiteStat[] | undefined, d.stats),
    testimonials: pick(s.testimonials as SiteTestimonial[] | undefined, d.testimonials),
    contact: {
      ...d.contact,
      ...(s.contact ?? {}),
      addresses: { ...d.contact.addresses, ...((s.contact as SiteContent["contact"] | undefined)?.addresses ?? {}) },
    },
  };
}
