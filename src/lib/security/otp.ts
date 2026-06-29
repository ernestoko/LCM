import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

/**
 * One-time-passcode + short-lived verification-token primitives used by the
 * assistant ("Jesselyn") identity-verification flow.
 *
 * Nothing sensitive is ever stored in plaintext:
 *  - the 6-digit code is kept only as a salted SHA-256/HMAC digest;
 *  - a successful verification yields a signed, expiring bearer token that
 *    authorises read access to exactly ONE tracking number.
 *
 * The signing secret comes from ASSISTANT_VERIFY_SECRET. In emulator/dev we
 * fall back to a fixed development secret so the flow is testable without
 * configuration; in production a real secret must be set.
 */

const DEV_FALLBACK_SECRET = "dev-assistant-verify-secret-not-for-production";

/** Resolve the HMAC signing secret (env first, dev fallback otherwise). */
function secret(): string {
  const fromEnv = process.env.ASSISTANT_VERIFY_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  return DEV_FALLBACK_SECRET;
}

/** True when a real, production-grade verification secret is configured. */
export const hasStrongVerifySecret = Boolean(
  process.env.ASSISTANT_VERIFY_SECRET &&
    process.env.ASSISTANT_VERIFY_SECRET.length >= 16,
);

/** Generate a cryptographically-random 6-digit numeric passcode. */
export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Salted digest of a passcode, bound to a specific challenge id so the same
 * code under a different challenge produces a different digest.
 */
export function hashOtp(challengeId: string, code: string): string {
  return createHmac("sha256", secret())
    .update(`${challengeId}:${code}`)
    .digest("hex");
}

/** Constant-time comparison of two hex digests of equal length. */
export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Issue a signed bearer token authorising sensitive reads of one tracking
 * number until `expiresAt` (epoch ms). Format: `<payloadB64url>.<sigB64url>`.
 */
export function signVerifyToken(trackingNumber: string, expiresAtMs: number): string {
  const payload = b64url(JSON.stringify({ tn: trackingNumber, exp: expiresAtMs }));
  const sig = b64url(createHmac("sha256", secret()).update(payload).digest());
  return `${payload}.${sig}`;
}

export interface VerifyTokenClaims {
  trackingNumber: string;
  expiresAtMs: number;
}

/**
 * Verify a bearer token's signature and expiry. Returns the claims when valid,
 * or null when malformed, tampered, or expired. `nowMs` is injectable for tests.
 */
export function verifyVerifyToken(
  token: string | undefined | null,
  nowMs: number = Date.now(),
): VerifyTokenClaims | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expectedSig = b64url(createHmac("sha256", secret()).update(payload).digest());
  if (!safeEqualHexLoose(sig, expectedSig)) return null;

  try {
    const json = JSON.parse(Buffer.from(payload, "base64").toString("utf8")) as {
      tn?: unknown;
      exp?: unknown;
    };
    if (typeof json.tn !== "string" || typeof json.exp !== "number") return null;
    if (json.exp <= nowMs) return null;
    return { trackingNumber: json.tn, expiresAtMs: json.exp };
  } catch {
    return null;
  }
}

/** Constant-time compare for base64url strings (any length). */
function safeEqualHexLoose(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
