/**
 * Isomorphic WhatsApp deep-link helpers (safe in both server and client code —
 * no provider credentials, no `server-only`). Mirrors the same Ghana 0→233
 * normalisation used by the SMS/WhatsApp senders so links resolve to the same
 * international number.
 */

/** Convert a phone number to digits-only international form (no leading `+`). */
export function waDigits(phone: string): string {
  let p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0")) p = `233${p.slice(1)}`; // local Ghana → intl
  return p;
}

/**
 * Build a `https://wa.me/…` click-to-chat link for the given phone number,
 * optionally pre-filling a message.
 */
export function waLink(phone: string, message?: string): string {
  const digits = waDigits(phone);
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}
