import { BUSINESS } from "@/constants/business";
import { WAREHOUSES } from "@/constants/warehouses";

/**
 * Organization structured data (schema.org) for rich results. Server-rendered
 * once on the public marketing surface. Built from the business + warehouse
 * constants so it stays correct as those change (e.g. new China hub) — no AI,
 * no hand-maintenance. Safe: all values come from our own constants.
 */
export function OrganizationJsonLd() {
  const url = `https://${BUSINESS.website}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BUSINESS.name,
    legalName: BUSINESS.name,
    url,
    logo: `${url}/favicon.svg`,
    description: `${BUSINESS.tagline}. Air & ocean freight, door-to-door delivery, customs clearance and warehousing to and from the USA, Ghana, China and across Africa and the world.`,
    email: BUSINESS.email,
    telephone: BUSINESS.phone,
    areaServed: ["United States", "Ghana", "China", "Nigeria", "Africa", "Worldwide"],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: BUSINESS.phone,
        email: BUSINESS.email,
        contactType: "customer support",
        availableLanguage: ["English"],
      },
    ],
    location: WAREHOUSES.map((w) => ({
      "@type": "Place",
      name: w.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: w.line1,
        addressLocality: w.city,
        addressRegion: w.region,
        postalCode: w.postal,
        addressCountry: w.country,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
