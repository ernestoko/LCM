"use client";

import { orderBy, where } from "firebase/firestore";
import { create, update, nextSequence } from "../firestore";
import { useCollection } from "../hooks";
import { COLLECTIONS } from "../collections";
import { logAudit, type AuditActor } from "../audit";
import { formatTicketNumber } from "@/lib/utils/ids";
import type { Complaint } from "@/types";

export type NewComplaint = Omit<
  Complaint,
  "id" | "ticketNumber" | "status" | "attachmentUrls" | "createdAt" | "createdBy"
> & { status?: Complaint["status"]; attachmentUrls?: string[] };

export async function createComplaint(data: NewComplaint, actor: AuditActor): Promise<string> {
  const seq = await nextSequence("ticket");
  const id = await create<Partial<Complaint>>(
    COLLECTIONS.complaints,
    {
      ...data,
      ticketNumber: formatTicketNumber(seq),
      status: data.status ?? "open",
      attachmentUrls: data.attachmentUrls ?? [],
      priority: data.priority ?? "medium",
    },
    actor,
  );
  await logAudit(actor, { action: "settings_change", entity: COLLECTIONS.complaints, entityId: id, newValue: data.type });
  return id;
}

export async function updateComplaint(id: string, data: Partial<Complaint>, actor: AuditActor): Promise<void> {
  await update<Complaint>(COLLECTIONS.complaints, id, data, actor);
}

export async function resolveComplaint(id: string, resolutionNotes: string, actor: AuditActor): Promise<void> {
  await update<Complaint>(COLLECTIONS.complaints, id, {
    status: "resolved",
    resolutionNotes,
    closedAt: new Date().toISOString(),
  }, actor);
  await logAudit(actor, { action: "settings_change", entity: COLLECTIONS.complaints, entityId: id, field: "status", newValue: "resolved" });
}

export function useComplaints() {
  return useCollection<Complaint>(COLLECTIONS.complaints, [orderBy("createdAt", "desc")]);
}

export function useCustomerComplaints(customerId: string | null | undefined) {
  return useCollection<Complaint>(
    COLLECTIONS.complaints,
    customerId ? [where("customerId", "==", customerId), orderBy("createdAt", "desc")] : [],
    { enabled: Boolean(customerId) },
  );
}
