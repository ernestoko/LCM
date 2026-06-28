/**
 * Canonical business identity used on customer-facing documents (invoices,
 * statements, waybills). Single source of truth for the company name, contact
 * details and registered addresses that appear on printed paperwork.
 */
export const BUSINESS = {
  name: "Liberty & Liberty Logistics",
  tagline: "Global Logistics & International Shipping",
  email: "hello@libertylogistics.com",
  phone: "+1 (800) 526-5555",
  website: "libertylogistics.com",
  addresses: {
    usa: "1200 Logistics Way, Houston, TX 77001, USA",
    ghana: "24 Harbour Road, Tema, Accra, Ghana",
  },
} as const;
