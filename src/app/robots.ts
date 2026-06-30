import type { MetadataRoute } from "next";

/**
 * robots.txt — index the public marketing/tracking pages, keep crawlers out of
 * the authenticated app surface and the API. Served at /robots.txt.
 */
const BASE = "https://libertylogistics.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/intake",
          "/shipments",
          "/manifests",
          "/customers",
          "/invoices",
          "/payments",
          "/rate-cards",
          "/country-routes",
          "/complaints",
          "/requests",
          "/request",
          "/reports",
          "/audit-logs",
          "/seal-operations",
          "/profile",
          "/settings",
          "/setup",
          "/login",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
