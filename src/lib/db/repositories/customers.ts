"use client";

import { orderBy, where, increment } from "firebase/firestore";
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

/**
 * Atomically adjust denormalised counters when a shipment is created/cancelled
 * or a payment is recorded. Uses Firestore `increment` so concurrent writes
 * can't lose updates (the previous read-then-write drifted under contention).
 */
export async function bumpCustomerStats(
  id: string,
  deltaShipments: number,
  deltaSpend: number,
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (deltaShipments) patch.shipmentCount = increment(deltaShipments);
  if (deltaSpend) patch.totalSpend = increment(deltaSpend);
  if (Object.keys(patch).length === 0) return;
  await update<Customer>(COLLECTIONS.customers, id, patch as Partial<Customer>);
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
