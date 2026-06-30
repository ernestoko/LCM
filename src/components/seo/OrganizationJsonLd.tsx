import { BUSINESS } from "@/constants/business";
import { WAREHOUSES } from "@/constants/warehouses";
import type { SiteContent } from "@/constants/siteContent";

/**
 * Organization structured data (schema.org) for rich results. Server-rendered
 * once on the public marketing surface. Phone/email come from editable site
 * content (falling back to the business constant); hubs come from the warehouse
 * constants — so it stays correct as those change. Safe: no user input.
 */
export function OrganizationJsonLd({ contact }: { contact?: SiteContent["contact"] }) {
  const url = `https://${BUSINESS.website}`;
  const phone = contact?.phone ?? BUSINESS.phone;
  const email = contact?.email ?? BUSINESS.email;
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BUSINESS.name,
    legalName: BUSINESS.name,
    url,
    logo: `${url}/favicon.svg`,
    description: `${BUSINESS.tagline}. Air & ocean freight, door-to-door delivery, customs clearance and warehousing to and from the USA, Ghana, China and across Africa and the world.`,
    email,
    telephone: phone,
    areaServed: ["United States", "Ghana", "China", "Nigeria", "Africa", "Worldwide"],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: phone,
        email,
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
