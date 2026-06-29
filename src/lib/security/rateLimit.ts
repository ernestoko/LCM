import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/db/collections";

/**
 * Firestore-backed fixed-window rate limiter. Survives the serverless model
 * (no in-process memory) by keeping a tiny counter document per key. Used to
 * throttle the public assistant-verification endpoints per IP and per tracking
 * number so codes can't be brute-forced or used to spam SMS/email.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Epoch ms when the current window resets. */
  resetAtMs: number;
}

/**
 * Atomically consume one unit against `key`. Allows up to `limit` hits per
 * `windowMs`. Fails OPEN (allowed) if the datastore is unreachable — these
 * limits are abuse mitigation, never the only line of defence.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  nowMs: number = Date.now(),
): Promise<RateLimitResult> {
  const ref = getAdminDb().collection(COLLECTIONS.rateLimits).doc(encodeKey(key));
  try {
    return await getAdminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? (snap.data() as { count?: number; windowStartMs?: number }) : null;

      const windowStartMs =
        data?.windowStartMs && nowMs - data.windowStartMs < windowMs ? data.windowStartMs : nowMs;
      const priorCount = windowStartMs === data?.windowStartMs ? data?.count ?? 0 : 0;
      const count = priorCount + 1;
      const resetAtMs = windowStartMs + windowMs;

      tx.set(ref, { count, windowStartMs, updatedAt: nowMs }, { merge: true });

      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetAtMs,
      };
    });
  } catch {
    // Datastore hiccup — don't lock legitimate users out.
    return { allowed: true, remaining: limit, resetAtMs: nowMs + windowMs };
  }
}

/** Best-effort client IP from the standard proxy headers. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Firestore document ids may not contain "/" — make the key safe. */
function encodeKey(key: string): string {
  return key.replace(/[/\\]/g, "_").slice(0, 1500);
}
