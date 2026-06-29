import { NextResponse } from "next/server";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/db/collections";
import { hashOtp, safeEqualHex, signVerifyToken } from "@/lib/security/otp";
import { consumeRateLimit, clientIp } from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERIFY_TOKEN_TTL_MS = 15 * 60 * 1000;

interface ConfirmBody {
  challengeId?: string;
  code?: string;
}

/**
 * Step 2 of assistant identity verification. Checks the submitted code against
 * the stored digest (constant-time), enforcing expiry and a max-attempts lock.
 * On success it consumes the challenge and returns a signed bearer token that
 * authorises sensitive reads of that single tracking number for 15 minutes.
 */
export async function POST(req: Request) {
  if (!isAdminConfigured) {
    return NextResponse.json({ ok: false, error: "Verification is not configured." }, { status: 503 });
  }

  let body: ConfirmBody;
  try {
    body = (await req.json()) as ConfirmBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const challengeId = body.challengeId?.trim();
  const code = body.code?.replace(/\D/g, "").trim();
  if (!challengeId || !code || code.length !== 6) {
    return NextResponse.json({ ok: false, error: "Enter the 6-digit code." }, { status: 400 });
  }

  // Throttle guessing across challenges from the same source.
  const ip = clientIp(req);
  const ipLimit = await consumeRateLimit(`vconfirm:ip:${ip}`, 20, 10 * 60 * 1000);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please try again shortly." },
      { status: 429 },
    );
  }

  const ref = getAdminDb().collection(COLLECTIONS.otpChallenges).doc(challengeId);

  try {
    const result = await getAdminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return { kind: "invalid" as const };
      const c = snap.data() as {
        codeHash: string;
        expiresAtMs: number;
        attempts: number;
        maxAttempts: number;
        consumed: boolean;
        trackingNumber: string;
      };

      if (c.consumed) return { kind: "invalid" as const };
      if (Date.now() > c.expiresAtMs) return { kind: "expired" as const };
      if (c.attempts >= c.maxAttempts) return { kind: "locked" as const };

      const matches = safeEqualHex(c.codeHash, hashOtp(challengeId, code));
      if (!matches) {
        const attempts = c.attempts + 1;
        tx.update(ref, { attempts });
        return {
          kind: "mismatch" as const,
          attemptsLeft: Math.max(0, c.maxAttempts - attempts),
        };
      }

      tx.update(ref, { consumed: true, verifiedAtMs: Date.now() });
      return { kind: "ok" as const, trackingNumber: c.trackingNumber };
    });

    switch (result.kind) {
      case "ok": {
        const expiresAtMs = Date.now() + VERIFY_TOKEN_TTL_MS;
        const token = signVerifyToken(result.trackingNumber, expiresAtMs);
        return NextResponse.json({
          ok: true,
          token,
          trackingNumber: result.trackingNumber,
          expiresInSec: Math.round(VERIFY_TOKEN_TTL_MS / 1000),
        });
      }
      case "expired":
        return NextResponse.json(
          { ok: false, error: "That code has expired. Request a new one." },
          { status: 410 },
        );
      case "locked":
        return NextResponse.json(
          { ok: false, error: "Too many incorrect attempts. Request a new code." },
          { status: 429 },
        );
      case "mismatch":
        return NextResponse.json(
          {
            ok: false,
            error:
              result.attemptsLeft > 0
                ? `That code isn't right. ${result.attemptsLeft} attempt${result.attemptsLeft === 1 ? "" : "s"} left.`
                : "That code isn't right, and you're out of attempts. Request a new code.",
            attemptsLeft: result.attemptsLeft,
          },
          { status: 401 },
        );
      default:
        return NextResponse.json(
          { ok: false, error: "That verification has expired. Please start again." },
          { status: 400 },
        );
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "Verification is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
