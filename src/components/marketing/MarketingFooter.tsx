import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
} from "lucide-react";
import { Container } from "./Container";
import { LcmWordmark } from "./Brand";
import { TrackingBar } from "./TrackingBar";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Services",
    links: [
      { label: "Air Freight", href: "/services#air-freight" },
      { label: "Ocean Freight", href: "/services#ocean-freight" },
      { label: "Express Parcel", href: "/services#express-parcel" },
      { label: "Door-to-Door", href: "/services#door-to-door" },
      { label: "Customs Clearance", href: "/services#customs" },
      { label: "Warehousing", href: "/services#warehousing" },
      { label: "E-commerce Shipping", href: "/services#ecommerce" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Coverage", href: "/coverage" },
      { label: "Contact", href: "/contact" },
      { label: "Get a Quote", href: "/contact" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Track a Shipment", href: "/track" },
      { label: "Sign in", href: "/login" },
      { label: "Help & FAQ", href: "/contact" },
      { label: "Customs Guidance", href: "/coverage#customs" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", href: "/contact" },
      { label: "Privacy Policy", href: "/contact" },
      { label: "Shipping Policy", href: "/services" },
      { label: "Prohibited Items", href: "/services" },
    ],
  },
];

const SOCIALS: { label: string; href: string; icon: typeof Linkedin }[] = [
  { label: "LinkedIn", href: "#", icon: Linkedin },
  { label: "Facebook", href: "#", icon: Facebook },
  { label: "Instagram", href: "#", icon: Instagram },
  { label: "X", href: "#", icon: Twitter },
  { label: "YouTube", href: "#", icon: Youtube },
];

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-950 text-navy-200">
      {/* Top: brand + tracking CTA */}
      <Container className="border-b border-white/10 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
          <div className="max-w-md">
            <LcmWordmark light />
            <p className="mt-4 text-sm leading-relaxed text-navy-300">
              LCM Logistics is your trusted partner for global logistics and
              international shipping — moving cargo to and from the USA, to and from
              Ghana, and across Africa and the world with speed, care and full
              visibility.
            </p>
          </div>
          <div className="lg:justify-self-end lg:w-full lg:max-w-md">
            <p className="mb-2 text-sm font-semibold text-white">
              Track your shipment
            </p>
            <TrackingBar variant="inline" />
          </div>
        </div>
      </Container>

      {/* Middle: link columns + contact */}
      <Container className="py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={`${col.heading}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-navy-300 transition-colors hover:text-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact block spans two columns on large screens */}
          <div className="col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Get in touch
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-navy-300">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden="true" />
                <a href="tel:+18005265555" className="transition-colors hover:text-white">
                  +1 (800) 526-5555
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden="true" />
                <a
                  href="mailto:hello@lcmlogistics.com"
                  className="transition-colors hover:text-white"
                >
                  hello@lcmlogistics.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden="true" />
                <span>
                  USA: 1200 Logistics Way, Houston, TX
                  <br />
                  Ghana: 24 Harbour Road, Tema, Accra
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Container>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-xs text-navy-400">
            &copy; {year} LCM Logistics. All rights reserved.
          </p>
          <ul className="flex items-center gap-2">
            {SOCIALS.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-navy-300 transition-all hover:border-gold-400/50 hover:bg-white/5 hover:text-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </footer>
  );
}
