import { NextResponse } from "next/server";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/db/collections";
import { generateOtp, hashOtp } from "@/lib/security/otp";
import { consumeRateLimit, clientIp } from "@/lib/security/rateLimit";
import { verifyTurnstile, isTurnstileEnabled } from "@/lib/security/turnstile";
import {
  findShipmentByTracking,
  loadCustomer,
  buildChannels,
  type ChannelKind,
} from "@/lib/assistant/verification";
import { sendEmail } from "@/lib/notifications/email";
import { sendSms } from "@/lib/notifications/mnotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const COMPANY = "Liberty & Liberty Logistics";

interface StartBody {
  trackingNumber?: string;
  channel?: ChannelKind;
  /** Honeypot — must stay empty; bots fill hidden fields. */
  website?: string;
  turnstileToken?: string;
}

/**
 * Step 1 of assistant identity verification.
 *
 *  - No `channel`  → returns the masked channels the user can choose from
 *                    (nothing is sent yet).
 *  - With `channel`→ generates a 6-digit code, stores only its salted digest,
 *                    and delivers it to the chosen contact on file.
 *
 * Protected by: optional Turnstile bot-gate, a honeypot field, and per-IP +
 * per-tracking-number rate limits.
 */
export async function POST(req: Request) {
  if (!isAdminConfigured) {
    return NextResponse.json({ ok: false, error: "Verification is not configured." }, { status: 503 });
  }

  let body: StartBody;
  try {
    body = (await req.json()) as StartBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: a real human never fills this hidden field.
  if (body.website) {
    return NextResponse.json({ ok: false, error: "Unable to verify." }, { status: 400 });
  }

  const ip = clientIp(req);
  const tn = body.trackingNumber?.trim().toUpperCase() ?? "";
  if (!tn) {
    return NextResponse.json({ ok: false, error: "Enter a tracking number." }, { status: 400 });
  }

  // Bot gate (only enforced when configured).
  if (isTurnstileEnabled) {
    const bot = await verifyTurnstile(body.turnstileToken, ip);
    if (!bot.ok) {
      return NextResponse.json(
        { ok: false, error: "Please complete the 'I'm not a robot' check." },
        { status: 400 },
      );
    }
  }

  // Rate limits: cap by IP (broad) and by tracking number (focused).
  const ipLimit = await consumeRateLimit(`vstart:ip:${ip}`, 12, 10 * 60 * 1000);
  const tnLimit = await consumeRateLimit(`vstart:tn:${tn}`, 5, 10 * 60 * 1000);
  if (!ipLimit.allowed || !tnLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  const record = await findShipmentByTracking(tn);
  if (!record) {
    return NextResponse.json(
      { ok: false, error: "We couldn't find a shipment with that tracking number." },
      { status: 404 },
    );
  }

  const customer = await loadCustomer(record.data.customerId);
  const channels = buildChannels(record.data, customer);
  if (channels.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No contact is on file for this shipment, so I can't verify it here. Please reach our team." },
      { status: 422 },
    );
  }

  // Stage 1: let the user choose where to receive the code.
  if (!body.channel) {
    return NextResponse.json({
      ok: true,
      stage: "choose",
      channels: channels.map((c) => ({ kind: c.kind, hint: c.hint })),
    });
  }

  const chosen = channels.find((c) => c.kind === body.channel);
  if (!chosen) {
    return NextResponse.json({ ok: false, error: "That contact method isn't available." }, { status: 400 });
  }

  // Stage 2: generate + store (hashed) + deliver the code.
  const code = generateOtp();
  const now = Date.now();
  const ref = getAdminDb().collection(COLLECTIONS.otpChallenges).doc();
  await ref.set({
    trackingNumber: tn,
    kind: chosen.kind,
    codeHash: hashOtp(ref.id, code),
    expiresAtMs: now + OTP_TTL_MS,
    attempts: 0,
    maxAttempts: OTP_MAX_ATTEMPTS,
    consumed: false,
    createdAtMs: now,
    ip,
  });

  const message = `${COMPANY}: your verification code is ${code}. It expires in 10 minutes. Never share this code.`;
  const delivery =
    chosen.kind === "email"
      ? await sendEmail({
          to: chosen.value,
          subject: `Your ${COMPANY} verification code`,
          text: `Hi,\n\nYour verification code is ${code}.\nIt expires in 10 minutes.\n\nIf you didn't request this, you can safely ignore this email.\n\n— ${COMPANY}`,
        })
      : await sendSms([chosen.value], message);

  const echo = process.env.ASSISTANT_OTP_ECHO === "true";

  // If the provider couldn't actually deliver the code (e.g. SMS/email isn't
  // configured) don't pretend it was sent — that would dead-end the user at the
  // code-entry step waiting for a code that never arrives. Remove the dangling
  // challenge and report the failure so they can pick another channel. In
  // dev-echo mode we proceed regardless (the code is returned for testing).
  if (!delivery.ok && !echo) {
    try {
      await ref.delete();
    } catch {
      /* best effort */
    }
    return NextResponse.json(
      {
        ok: false,
        error:
          "We couldn't send your code right now. Please try another contact method or reach our team.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    stage: "sent",
    challengeId: ref.id,
    kind: chosen.kind,
    hint: chosen.hint,
    expiresInSec: Math.round(OTP_TTL_MS / 1000),
    // Dev-only convenience for emulator testing (never enabled in production).
    ...(echo ? { devCode: code } : {}),
  });
}
