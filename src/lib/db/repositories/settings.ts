"use client";

import { getOne, upsert } from "../firestore";
import { useDocument } from "../hooks";
import { COLLECTIONS, SETTINGS_DOC_ID, PILOT_DOC_ID } from "../collections";
import type { PlatformSettings, PilotTracker } from "@/types";
import { defaultCommissionRules } from "@/lib/pricing/commission";
import { logAudit, type AuditActor } from "../audit";

/** Factory for the default platform settings document. */
export function defaultPlatformSettings(): PlatformSettings {
  return {
    id: SETTINGS_DOC_ID,
    companyName: "Liberty Cargo Movers",
    defaultCurrency: "USD",
    defaultCommissionPercent: 10,
    defaultPlatformFeePerShipment: 0,
    monthlySupportFee: 0,
    commissionRules: defaultCommissionRules(),
    serviceFeeByRoute: { "USA-NIGERIA": false },
    serviceFeeAmount: 30,
    paymentInstructions:
      "Pay via Mobile Money / Bank transfer. Use your tracking number as the payment reference. Contact support for assistance.",
    dispatchGuards: {
      requirePhoto: true,
      requireWeight: true,
      requireInvoice: true,
      requirePaymentConfirmed: true,
      requireManifest: true,
    },
    createdAt: new Date().toISOString(),
    createdBy: "system",
  };
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const existing = await getOne<PlatformSettings>(COLLECTIONS.settings, SETTINGS_DOC_ID);
  return existing ?? defaultPlatformSettings();
}

export async function savePlatformSettings(
  settings: Partial<PlatformSettings>,
  actor: AuditActor,
): Promise<void> {
  await upsert(COLLECTIONS.settings, SETTINGS_DOC_ID, settings);
  await logAudit(actor, {
    action: "settings_change",
    entity: COLLECTIONS.settings,
    entityId: SETTINGS_DOC_ID,
  });
}

/** Live hook returning settings (falls back to defaults until the doc loads). */
export function usePlatformSettings() {
  const { data, loading, error } = useDocument<PlatformSettings>(
    COLLECTIONS.settings,
    SETTINGS_DOC_ID,
  );
  return { settings: data ?? defaultPlatformSettings(), loading, error };
}

// --- Pilot tracker ---------------------------------------------------------

export function defaultPilotTracker(): PilotTracker {
  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + 6);
  return {
    id: PILOT_DOC_ID,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    activeRoutes: ["USA-GHANA"],
    countriesOnboarded: ["Ghana"],
    recommendation: "undecided",
    createdAt: start.toISOString(),
    createdBy: "system",
  };
}

export async function getPilotTracker(): Promise<PilotTracker> {
  const existing = await getOne<PilotTracker>(COLLECTIONS.pilotTracker, PILOT_DOC_ID);
  return existing ?? defaultPilotTracker();
}

export async function savePilotTracker(
  tracker: Partial<PilotTracker>,
  actor: AuditActor,
): Promise<void> {
  await upsert(COLLECTIONS.pilotTracker, PILOT_DOC_ID, tracker);
  await logAudit(actor, {
    action: "settings_change",
    entity: COLLECTIONS.pilotTracker,
    entityId: PILOT_DOC_ID,
  });
}

export function usePilotTracker() {
  const { data, loading, error } = useDocument<PilotTracker>(
    COLLECTIONS.pilotTracker,
    PILOT_DOC_ID,
  );
  return { pilot: data ?? defaultPilotTracker(), loading, error };
}
