/**
 * Human-friendly identifier generators.
 *
 * Sequence-based numbers (invoice, manifest, payment, ticket, customer code)
 * are produced by the repository layer using a transactional counter document
 * (`counters/{name}`) so they are gap-free and race-safe. The `formatSequence`
 * helpers here turn a counter value into the final display string.
 *
 * Tracking numbers are randomised (date prefix + base32 suffix) so they are
 * non-guessable and can be generated client-side without a round trip.
 */

const BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford-ish, no I/L/O/U

function randomBase32(len: number): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += BASE32[Math.floor(Math.random() * BASE32.length)];
  }
  return out;
}

/** e.g. LCM-2606-7K3QH9 — prefix, YYMM, random. */
export function generateTrackingNumber(date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `LCM-${yy}${mm}-${randomBase32(6)}`;
}

function pad(n: number, width = 6): string {
  return String(n).padStart(width, "0");
}

export const formatInvoiceNumber = (seq: number) => `LCM-INV-${pad(seq)}`;
export const formatManifestNumber = (seq: number) => `LCM-MF-${pad(seq)}`;
export const formatPaymentNumber = (seq: number) => `LCM-PAY-${pad(seq)}`;
export const formatTicketNumber = (seq: number) => `LCM-TKT-${pad(seq)}`;
export const formatCustomerCode = (seq: number) => `LCM-C-${pad(seq, 5)}`;

/** Stable route code from origin + destination, e.g. ("United States","Ghana") -> "USA-GHANA". */
export function routeCode(origin: string, destination: string): string {
  const norm = (s: string) =>
    s.trim().toUpperCase().replace(/UNITED STATES( OF AMERICA)?/, "USA").replace(/[^A-Z]/g, "");
  return `${norm(origin)}-${norm(destination)}`;
}
