import { NextResponse } from "next/server";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { consumeRateLimit, clientIp } from "@/lib/security/rateLimit";
import { sendEmail } from "@/lib/notifications/email";
import { COLLECTIONS } from "@/lib/db/collections";
import { BUSINESS } from "@/constants/business";

export const runtime = "nodejs";

interface ContactBody {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  /** Honeypot — must stay empty. Bots fill it in. */
  company?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SERVICES = [
  "Air Freight",
  "Ocean Freight",
  "Express Parcel",
  "Door-to-Door",
  "Customs Clearance",
  "Warehousing",
  "E-commerce Shipping",
];

/** Trim and hard-cap a field so a malicious payload can't bloat a document/email. */
function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: Request) {
  // Throttle per IP so the public lead form can't be used to spam the inbox.
  const ip = clientIp(req);
  const limit = await consumeRateLimit(`contact:ip:${ip}`, 8, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  let body: ContactBody;
  try {
    body = (await req.json()) as ContactBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Silently accept and drop spam that trips the honeypot (don't tip off bots).
  if (clean(body.company, 100)) {
    return NextResponse.json({ ok: true });
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 160).toLowerCase();
  const phone = clean(body.phone, 40);
  const service = clean(body.service, 60);
  const message = clean(body.message, 4000);

  if (!name || !email || !phone || !service || !message) {
    return NextResponse.json({ ok: false, error: "Please complete all fields." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }
  if (phone.replace(/[^0-9]/g, "").length < 7) {
    return NextResponse.json({ ok: false, error: "Enter a valid phone number." }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json({ ok: false, error: "Please add a few more details." }, { status: 400 });
  }
  // Never trust the client's service value — must be one we offer (or empty-safe).
  const serviceLabel = SERVICES.includes(service) ? service : "General enquiry";

  // Durable capture requires the Admin SDK. Without it we can't store the lead,
  // so tell the client to use the email fallback instead of silently dropping it.
  if (!isAdminConfigured) {
    return NextResponse.json(
      { ok: false, error: "Submission isn't available right now. Please email us instead." },
      { status: 503 },
    );
  }

  const now = new Date().toISOString();
  try {
    // 1. Persist the lead (the durable record staff can follow up on).
    const ref = await getAdminDb()
      .collection(COLLECTIONS.contactSubmissions)
      .add({
        name,
        email,
        phone,
        service: serviceLabel,
        message,
        status: "new",
        source: "website_contact_form",
        ip,
        createdAt: now,
      });

    // 2. Best-effort: notify the team by email. Never blocks the submission —
    //    the lead is already saved above.
    try {
      await sendEmail({
        to: BUSINESS.email,
        subject: `New quote request — ${serviceLabel} (${name})`,
        text: [
          `A new quote request was submitted on the website.`,
          ``,
          `Name:    ${name}`,
          `Email:   ${email}`,
          `Phone:   ${phone}`,
          `Service: ${serviceLabel}`,
          ``,
          `Message:`,
          message,
          ``,
          `Reference: ${ref.id}`,
        ].join("\n"),
      });
    } catch {
      /* email is best-effort; the lead is safely stored */
    }

    return NextResponse.json({ ok: true, id: ref.id });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please email us instead." },
      { status: 500 },
    );
  }
}
