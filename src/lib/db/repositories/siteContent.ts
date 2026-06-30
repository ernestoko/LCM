"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/db/collections";
import { mergeSiteContent, type SiteContent } from "@/constants/siteContent";

/**
 * Client repository for the marketing-site content document
 * (settings/siteContent). Used by the Super Admin "Website Content" editor.
 * Reads are merged over the code defaults; saves replace the document and then
 * ask the server to revalidate the static marketing pages so edits show live.
 */

const SITE_CONTENT_DOC_ID = "siteContent";

/** One-shot read of the current content, merged over defaults. */
export async function getSiteContentClient(): Promise<SiteContent> {
  const snap = await getDoc(doc(getDb(), COLLECTIONS.settings, SITE_CONTENT_DOC_ID));
  return mergeSiteContent(snap.exists() ? snap.data() : undefined);
}

/** Persist the full content tree, then trigger marketing-page revalidation. */
export async function saveSiteContent(
  content: SiteContent,
  actor: { uid: string; name?: string },
): Promise<void> {
  await setDoc(doc(getDb(), COLLECTIONS.settings, SITE_CONTENT_DOC_ID), {
    ...content,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.uid,
    updatedByName: actor.name ?? null,
  });

  // Best-effort: ask the server to refresh the statically-generated pages now.
  try {
    const token = await getFirebaseAuth().currentUser?.getIdToken();
    if (token) {
      await fetch("/api/site-content/revalidate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch {
    /* revalidation is best-effort; ISR will catch up on its schedule */
  }
}
