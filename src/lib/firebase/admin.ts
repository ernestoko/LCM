import "server-only";
import {
  getApps,
  initializeApp,
  cert,
  getApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Server-side Firebase Admin SDK. Used by API routes and the seed script for
 * privileged operations (creating users, setting custom claims, sending
 * notifications, public tracking) that must never run in the browser.
 *
 * Emulator mode mirrors the client: when NEXT_PUBLIC_USE_FIREBASE_EMULATOR is
 * "true", the Admin SDK talks to the local Emulator Suite with NO real
 * credentials — we just point the well-known emulator host env vars (which the
 * Admin SDK reads) at the local emulator before any getFirestore()/getAuth().
 */

const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";
const EMU_HOST = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || "127.0.0.1";
const EMU_PROJECT_ID =
  process.env.FIREBASE_ADMIN_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "demo-lcm";

if (USE_EMULATOR) {
  // The Admin SDK auto-connects to the emulators when these are set.
  process.env.FIRESTORE_EMULATOR_HOST ||= `${EMU_HOST}:8080`;
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= `${EMU_HOST}:9099`;
}

let adminApp: App | undefined;

export function getAdminApp(): App {
  if (adminApp) return adminApp;

  if (getApps().length) {
    adminApp = getApp();
    return adminApp;
  }

  if (USE_EMULATOR) {
    // No credentials needed against the emulator — a projectId is enough.
    adminApp = initializeApp({ projectId: EMU_PROJECT_ID });
    return adminApp;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_ADMIN_* values in .env.local.",
    );
  }

  adminApp = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return adminApp;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

let adminDb: Firestore | undefined;

export function getAdminDb(): Firestore {
  if (!adminDb) {
    adminDb = getFirestore(getAdminApp());
    // Mirror the client behaviour: never let a nested `undefined` abort a write.
    try {
      adminDb.settings({ ignoreUndefinedProperties: true });
    } catch {
      // settings() can only run once; ignore if already initialised.
    }
  }
  return adminDb;
}

/** True when the Admin SDK can run — either against the emulator or with real creds. */
export const isAdminConfigured =
  USE_EMULATOR ||
  Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  );
