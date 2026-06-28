"use client";

import { orderBy } from "firebase/firestore";
import { create, update, getOne } from "../firestore";
import { useCollection } from "../hooks";
import { COLLECTIONS } from "../collections";
import { logAudit, type AuditActor } from "../audit";
import { formatManifestNumber } from "@/lib/utils/ids";
import type { Manifest, ManifestPackage, Shipment } from "@/types";
import { round2 } from "@/lib/utils/format";

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
  const seq = await nextSequenceManifest();
  const t = totals(data.packages);
  const id = await create<Partial<Manifest>>(
    COLLECTIONS.manifests,
    {
      ...data,
      ...t,
      manifestNumber: formatManifestNumber(seq),
      preparedBy: actor.uid,
      preparedByName: actor.name,
      status: data.status ?? "draft",
    },
    actor,
  );

  // Tag each shipment with the manifest and advance handling status.
  for (const pkg of data.packages) {
    await update<Shipment>(COLLECTIONS.shipments, pkg.shipmentId, {
      manifestId: id,
      sealHandlingStatus: "manifested",
      status: "added_to_manifest",
    });
  }

  await logAudit(actor, { action: "manifest_create", entity: COLLECTIONS.manifests, entityId: id });
  return id;
}

async function nextSequenceManifest(): Promise<number> {
  const { nextSequence } = await import("../firestore");
  return nextSequence("manifest");
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
  await update<Manifest>(COLLECTIONS.manifests, id, {
    status: "dispatched",
    dispatchDate: new Date().toISOString(),
  }, actor);
  for (const pkg of manifest.packages) {
    await update<Shipment>(COLLECTIONS.shipments, pkg.shipmentId, {
      status: "dispatched",
      sealHandlingStatus: "dispatched",
    });
  }
  await logAudit(actor, { action: "manifest_approval", entity: COLLECTIONS.manifests, entityId: id, newValue: "dispatched" });
}

export function getManifest(id: string) {
  return getOne<Manifest>(COLLECTIONS.manifests, id);
}

export function useManifests() {
  return useCollection<Manifest>(COLLECTIONS.manifests, [orderBy("createdAt", "desc")]);
}
