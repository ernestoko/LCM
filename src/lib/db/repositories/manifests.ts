"use client";

import { orderBy, writeBatch, doc, collection, arrayUnion } from "firebase/firestore";
import { update, getOne, nextSequence } from "../firestore";
import { useCollection } from "../hooks";
import { COLLECTIONS } from "../collections";
import { getDb } from "@/lib/firebase/client";
import { cleanForWrite } from "@/lib/utils/clean";
import { logAudit, type AuditActor } from "../audit";
import { formatManifestNumber } from "@/lib/utils/ids";
import { checkDispatchReadiness } from "@/lib/shipments/guards";
import { getPlatformSettings } from "./settings";
import type { Manifest, ManifestPackage, Shipment } from "@/types";
import { round2 } from "@/lib/utils/format";

/** A status-history event with undefined fields already stripped (arrayUnion-safe). */
function statusEvent(status: Shipment["status"], actor: AuditActor, note: string) {
  return cleanForWrite({
    status,
    at: new Date().toISOString(),
    by: actor.uid,
    byName: actor.name,
    note,
  });
}

export type NewManifest = Omit<
  Manifest,
  | "id"
  | "manifestNumber"
  | "totalPackages"
  | "totalWeightLb"
  | "totalDeclaredValue"
  | "preparedBy"
  | "status"
  | "createdAt"
  | "createdBy"
> & { status?: Manifest["status"] };

function totals(packages: ManifestPackage[]) {
  return {
    totalPackages: packages.length,
    totalWeightLb: round2(packages.reduce((s, p) => s + (p.weightLb || 0), 0)),
    totalDeclaredValue: round2(packages.reduce((s, p) => s + (p.declaredValue || 0), 0)),
  };
}

export function shipmentToManifestPackage(s: Shipment): ManifestPackage {
  return {
    shipmentId: s.id,
    trackingNumber: s.trackingNumber,
    customerName: s.customerName,
    description: s.packageDescription || s.items.map((i) => i.itemType).join(", ") || "—",
    weightLb: s.weightLb || 0,
    declaredValue: s.declaredValue || 0,
    paymentStatus: s.paymentStatus,
  };
}

export async function createManifest(data: NewManifest, actor: AuditActor): Promise<string> {
  const seq = await nextSequence("manifest");
  const t = totals(data.packages);
  const db = getDb();
  const nowISO = new Date().toISOString();

  // Write the manifest and tag every shipment ATOMICALLY — a partial failure
  // must never leave the manifest and its shipments out of sync.
  const batch = writeBatch(db);
  const ref = doc(collection(db, COLLECTIONS.manifests));
  batch.set(
    ref,
    cleanForWrite({
      ...data,
      ...t,
      manifestNumber: formatManifestNumber(seq),
      preparedBy: actor.uid,
      preparedByName: actor.name,
      status: data.status ?? "draft",
      createdAt: nowISO,
      createdBy: actor.uid,
      createdByName: actor.name,
    }),
  );
  for (const pkg of data.packages) {
    batch.update(
      doc(db, COLLECTIONS.shipments, pkg.shipmentId),
      cleanForWrite({
        manifestId: ref.id,
        sealHandlingStatus: "manifested",
        status: "added_to_manifest",
        statusHistory: arrayUnion(
          statusEvent("added_to_manifest", actor, `Added to manifest ${formatManifestNumber(seq)}`),
        ),
        updatedAt: nowISO,
        updatedBy: actor.uid,
      }),
    );
  }
  await batch.commit();

  await logAudit(actor, { action: "manifest_create", entity: COLLECTIONS.manifests, entityId: ref.id });
  return ref.id;
}

export async function setManifestPackages(
  id: string,
  packages: ManifestPackage[],
  actor: AuditActor,
): Promise<void> {
  await update<Manifest>(COLLECTIONS.manifests, id, { packages, ...totals(packages) }, actor);
}

export async function libertyApproveManifest(id: string, actor: AuditActor): Promise<void> {
  await update<Manifest>(COLLECTIONS.manifests, id, {
    status: "approved",
    libertyApprovedBy: actor.uid,
    libertyApprovedByName: actor.name,
    libertyApprovedAt: new Date().toISOString(),
  }, actor);
  await logAudit(actor, { action: "manifest_approval", entity: COLLECTIONS.manifests, entityId: id, newValue: "approved" });
}

export async function sealConfirmManifest(id: string, actor: AuditActor): Promise<void> {
  await update<Manifest>(COLLECTIONS.manifests, id, {
    status: "confirmed_by_seal",
    sealConfirmedBy: actor.uid,
    sealConfirmedByName: actor.name,
    sealConfirmedAt: new Date().toISOString(),
  }, actor);
  await logAudit(actor, { action: "manifest_approval", entity: COLLECTIONS.manifests, entityId: id, newValue: "confirmed_by_seal" });
}

export async function dispatchManifest(id: string, actor: AuditActor): Promise<void> {
  const manifest = await getOne<Manifest>(COLLECTIONS.manifests, id);
  if (!manifest) return;
  const db = getDb();
  const nowISO = new Date().toISOString();

  // Enforce the dispatch guards on EVERY package before anything moves — the
  // manifest path writes shipment status directly, so it must re-check the
  // photo/weight/invoice/payment guards that changeShipmentStatus would apply.
  const settings = await getPlatformSettings();
  const shipments = await Promise.all(
    manifest.packages.map((p) => getOne<Shipment>(COLLECTIONS.shipments, p.shipmentId)),
  );
  const blocked: string[] = [];
  for (const s of shipments) {
    if (!s) continue;
    const check = checkDispatchReadiness(s, settings);
    if (!check.ok) blocked.push(`${s.trackingNumber}: ${check.blockers.join(" ")}`);
  }
  if (blocked.length > 0) {
    throw new Error(
      `Cannot dispatch — ${blocked.length} package(s) not ready:\n${blocked.join("\n")}`,
    );
  }

  // Dispatch the manifest and all its shipments atomically.
  const batch = writeBatch(db);
  batch.update(
    doc(db, COLLECTIONS.manifests, id),
    cleanForWrite({ status: "dispatched", dispatchDate: nowISO, updatedAt: nowISO, updatedBy: actor.uid }),
  );
  for (const pkg of manifest.packages) {
    batch.update(
      doc(db, COLLECTIONS.shipments, pkg.shipmentId),
      cleanForWrite({
        status: "dispatched",
        sealHandlingStatus: "dispatched",
        statusHistory: arrayUnion(
          statusEvent("dispatched", actor, `Dispatched on manifest ${manifest.manifestNumber}`),
        ),
        updatedAt: nowISO,
        updatedBy: actor.uid,
      }),
    );
  }
  await batch.commit();

  await logAudit(actor, { action: "manifest_approval", entity: COLLECTIONS.manifests, entityId: id, newValue: "dispatched" });
}

export function getManifest(id: string) {
  return getOne<Manifest>(COLLECTIONS.manifests, id);
}

export function useManifests() {
  return useCollection<Manifest>(COLLECTIONS.manifests, [orderBy("createdAt", "desc")]);
}
