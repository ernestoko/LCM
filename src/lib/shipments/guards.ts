import type { Shipment, PlatformSettings } from "@/types";

export interface DispatchCheck {
  ok: boolean;
  /** Hard blockers that require an admin override with reason. */
  blockers: string[];
}

/**
 * Enforces the platform's dispatch rules:
 *  - package photo exists
 *  - weight entered
 *  - customer record exists
 *  - invoice exists
 *  - payment confirmed (unless admin override)
 *  - assigned to a manifest
 *
 * Each guard can be toggled in platform settings. An existing
 * `shipment.dispatchOverride` clears the payment-confirmation blocker.
 */
export function checkDispatchReadiness(
  shipment: Shipment,
  settings: PlatformSettings,
): DispatchCheck {
  const g = settings.dispatchGuards;
  const blockers: string[] = [];

  if (g.requirePhoto && (!shipment.photoUrls || shipment.photoUrls.length === 0)) {
    blockers.push("No package photo has been uploaded.");
  }
  if (g.requireWeight) {
    if (shipment.cargoType === "sea") {
      const cbm = shipment.totalCbm ?? 0;
      const units = shipment.seaCargo?.units?.length ?? 0;
      if (cbm <= 0 && units === 0) {
        blockers.push("Sea cargo (CBM or standard units) has not been entered.");
      }
    } else if (!shipment.weightLb) {
      blockers.push("Package weight has not been entered.");
    }
  }
  if (!shipment.customerId) {
    blockers.push("No customer record is linked to this shipment.");
  }
  if (g.requireInvoice && !shipment.invoiceId) {
    blockers.push("No invoice has been generated.");
  }
  if (g.requirePaymentConfirmed) {
    const paid =
      shipment.paymentStatus === "confirmed" || shipment.paymentStatus === "paid";
    if (!paid && !shipment.dispatchOverride) {
      blockers.push("Payment is not confirmed (admin override required).");
    }
  }
  if (g.requireManifest && !shipment.manifestId) {
    blockers.push("Package has not been added to a manifest.");
  }

  return { ok: blockers.length === 0, blockers };
}

/** Whether a status transition is allowed for the given shipment. */
export function canMoveToStatus(
  shipment: Shipment,
  next: Shipment["status"],
  settings: PlatformSettings,
): { ok: boolean; reason?: string } {
  if (shipment.locked) {
    return { ok: false, reason: "Record is locked by a Super Admin." };
  }
  // Movement out of the warehouse requires passing the dispatch guards —
  // for air at ready/dispatched, for sea at container loading / vessel departure.
  const dispatchPoint: Shipment["status"][] = [
    "ready_for_dispatch",
    "dispatched",
    "loaded_into_container",
    "vessel_departed",
  ];
  if (dispatchPoint.includes(next)) {
    const check = checkDispatchReadiness(shipment, settings);
    if (!check.ok) {
      return { ok: false, reason: check.blockers.join(" ") };
    }
  }
  return { ok: true };
}
