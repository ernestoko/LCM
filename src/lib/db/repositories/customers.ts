"use client";

import { orderBy, where } from "firebase/firestore";
import { create, update, getOne, nextSequence, type WithId } from "../firestore";
import { useCollection } from "../hooks";
import { COLLECTIONS } from "../collections";
import { logAudit, type AuditActor } from "../audit";
import { formatCustomerCode } from "@/lib/utils/ids";
import type { Customer } from "@/types";

export type NewCustomer = Omit<
  Customer,
  "id" | "customerCode" | "shipmentCount" | "totalSpend" | "ownedBy" | "createdAt" | "createdBy"
>;

export async function createCustomer(
  data: NewCustomer,
  actor: AuditActor,
): Promise<string> {
  const seq = await nextSequence("customer");
  const id = await create<Partial<Customer>>(
    COLLECTIONS.customers,
    {
      ...data,
      customerCode: formatCustomerCode(seq),
      shipmentCount: 0,
      totalSpend: 0,
      ownedBy: "liberty",
      active: data.active ?? true,
    },
    actor,
  );
  await logAudit(actor, {
    action: "customer_create",
    entity: COLLECTIONS.customers,
    entityId: id,
    newValue: data.fullName,
  });
  return id;
}

export async function updateCustomer(
  id: string,
  data: Partial<Customer>,
  actor: AuditActor,
): Promise<void> {
  // Ownership is immutable.
  const { ownedBy: _ignored, ...safe } = data;
  await update<Customer>(COLLECTIONS.customers, id, safe, actor);
}

export function getCustomer(id: string) {
  return getOne<Customer>(COLLECTIONS.customers, id);
}

/** Increment denormalised counters when a shipment is created / paid. */
export async function bumpCustomerStats(
  id: string,
  deltaShipments: number,
  deltaSpend: number,
): Promise<void> {
  const existing = await getOne<Customer>(COLLECTIONS.customers, id);
  if (!existing) return;
  await update<Customer>(COLLECTIONS.customers, id, {
    shipmentCount: Math.max(0, (existing.shipmentCount ?? 0) + deltaShipments),
    totalSpend: Math.max(0, (existing.totalSpend ?? 0) + deltaSpend),
  });
}

export function useCustomers(): { data: WithId<Customer>[]; loading: boolean; error: Error | null } {
  return useCollection<Customer>(COLLECTIONS.customers, [orderBy("createdAt", "desc")]);
}

export function useCustomer(id: string | null | undefined) {
  return useCollection<Customer>(
    COLLECTIONS.customers,
    id ? [where("__name__", "==", id)] : [],
    { enabled: Boolean(id), deps: [id] },
  );
}
