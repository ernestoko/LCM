import "server-only";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/db/collections";
import { mergeSiteContent, DEFAULT_SITE_CONTENT, type SiteContent } from "@/constants/siteContent";

/** The Firestore document id holding the editable marketing-site content. */
export const SITE_CONTENT_DOC_ID = "siteContent";

/**
 * Server-side loader for the editable marketing-site content. Reads the
 * settings/siteContent document with the Admin SDK and deep-merges it over the
 * code DEFAULTS, so:
 *  - an empty/missing document → the site renders exactly as the defaults;
 *  - the Admin SDK being unconfigured (e.g. static build with no creds) → also
 *    falls back to defaults — the site can never break because content failed
 *    to load.
 *
 * Marketing pages call this and use ISR (`export const revalidate = ...`), so
 * the site stays static/fast; saving content triggers an on-demand revalidate.
 */
export async function getSiteContent(): Promise<SiteContent> {
  if (!isAdminConfigured) return DEFAULT_SITE_CONTENT;
  try {
    const snap = await getAdminDb()
      .collection(COLLECTIONS.settings)
      .doc(SITE_CONTENT_DOC_ID)
      .get();
    return snap.exists ? mergeSiteContent(snap.data()) : DEFAULT_SITE_CONTENT;
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}
