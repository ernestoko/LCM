import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/db/collections";

/**
 * First-party, privacy-respecting site-visit tracking.
 *
 * We store ONLY aggregate daily counters — NO IP addresses, cookies, user
 * agents or any personal data. Each day is one document
 * (siteTraffic/{YYYY-MM-DD}) holding a total, a per-page breakdown and a
 * unique-visitor count (uniqueness is determined client-side via a per-day
 * localStorage flag, so it's an estimate, not a fingerprint). Counts are
 * written with the Admin SDK from the server, never from the browser.
 */

/** Public marketing paths we track by name; anything else rolls up to "other". */
const KNOWN_PATHS: Record<string, string> = {
  "/": "home",
  "/about": "about",
  "/services": "services",
  "/coverage": "coverage",
  "/faq": "faq",
  "/contact": "contact",
  "/track": "track",
  "/register": "register",
  "/login": "login",
};

/** Normalise an incoming pathname to a safe, bounded counter key. */
export function pageKey(rawPath: string): { key: string; label: string } {
  const path = (rawPath || "/").split("?")[0].split("#")[0];
  if (KNOWN_PATHS[path]) return { key: KNOWN_PATHS[path], label: path };
  // Track first-segment buckets for everything else (e.g. /track/LCM-… → track).
  const seg = path.replace(/^\//, "").split("/")[0] || "home";
  const safe = seg.replace(/[^a-z0-9]/gi, "_").slice(0, 24).toLowerCase() || "other";
  return { key: safe, label: `/${seg}` };
}

/** UTC day stamp YYYY-MM-DD. */
function dayStamp(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Record a single page view into the day's aggregate counters. Never throws —
 * analytics must never break a page.
 */
export async function recordPageView(rawPath: string, unique: boolean): Promise<void> {
  try {
    const now = new Date();
    const day = dayStamp(now);
    const { key, label } = pageKey(rawPath);
    const ref = getAdminDb().collection(COLLECTIONS.siteTraffic).doc(day);
    await ref.set(
      {
        day,
        total: FieldValue.increment(1),
        uniques: FieldValue.increment(unique ? 1 : 0),
        paths: { [key]: FieldValue.increment(1) },
        pathLabels: { [key]: label },
        updatedAt: now.toISOString(),
      },
      { merge: true },
    );
  } catch {
    /* swallow — analytics is best-effort */
  }
}
