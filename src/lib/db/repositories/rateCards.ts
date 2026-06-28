"use client";

import { orderBy } from "firebase/firestore";
import { create, update, getOne, getMany, type WithId } from "../firestore";
import { useCollection } from "../hooks";
import { COLLECTIONS } from "../collections";
import { logAudit, type AuditActor } from "../audit";
import type { RateCard, RateChangeLogEntry } from "@/types";

export type NewRateCard = Omit<
  RateCard,
  | "id"
  | "status"
  | "version"
  | "changeLog"
  | "approvedBy"
  | "approvalDate"
  | "createdAt"
  | "createdBy"
> & { status?: RateCard["status"] };

function logEntry(actor: AuditActor, action: string, extra: Partial<RateChangeLogEntry> = {}): RateChangeLogEntry {
  return { at: new Date().toISOString(), by: actor.uid, byName: actor.name, action, ...extra };
}

export async function createRateCard(
  data: NewRateCard,
  actor: AuditActor,
): Promise<string> {
  // New cards always start as draft — never directly active.
  const status = data.status === "pending_approval" ? "pending_approval" : "draft";
  const id = await create<Partial<RateCard>>(
    COLLECTIONS.rateCards,
    {
      ...data,
      status,
      version: 1,
      uploadedBy: actor.uid,
      uploadedByName: actor.name,
      changeLog: [logEntry(actor, "created")],
    },
    actor,
  );
  await logAudit(actor, { action: "rate_change", entity: COLLECTIONS.rateCards, entityId: id, newValue: data.name });
  return id;
}

/** Move a draft to pending approval. */
export async function submitRateCard(id: string, actor: AuditActor): Promise<void> {
  const card = await getOne<RateCard>(COLLECTIONS.rateCards, id);
  if (!card) return;
  await update<RateCard>(COLLECTIONS.rateCards, id, {
    status: "pending_approval",
    changeLog: [...card.changeLog, logEntry(actor, "submitted")],
  }, actor);
  await logAudit(actor, { action: "rate_change", entity: COLLECTIONS.rateCards, entityId: id, newValue: "pending_approval" });
}

/**
 * Super-Admin approval. Activates the card and expires any other active card
 * of the same pricing type + route so only one is ever effective.
 */
export async function approveRateCard(id: string, actor: AuditActor): Promise<void> {
  const card = await getOne<RateCard>(COLLECTIONS.rateCards, id);
  if (!card) return;

  // Expire conflicting active cards.
  const actives = (await getMany<RateCard>(COLLECTIONS.rateCards)).filter(
    (c) => c.status === "active" && c.pricingType === card.pricingType && (c.route ?? "") === (card.route ?? "") && c.id !== id,
  );
  for (const c of actives) {
    await update<RateCard>(COLLECTIONS.rateCards, c.id, {
      status: "expired",
      changeLog: [...c.changeLog, logEntry(actor, "superseded", { reason: `Replaced by ${card.name}` })],
    });
  }

  await update<RateCard>(COLLECTIONS.rateCards, id, {
    status: "active",
    approvedBy: actor.uid,
    approvedByName: actor.name,
    approvalDate: new Date().toISOString(),
    changeLog: [...card.changeLog, logEntry(actor, "approved")],
  }, actor);
  await logAudit(actor, { action: "rate_approved", entity: COLLECTIONS.rateCards, entityId: id, newValue: card.name });
}

export async function rejectRateCard(id: string, reason: string, actor: AuditActor): Promise<void> {
  const card = await getOne<RateCard>(COLLECTIONS.rateCards, id);
  if (!card) return;
  await update<RateCard>(COLLECTIONS.rateCards, id, {
    status: "rejected",
    rejectionReason: reason,
    changeLog: [...card.changeLog, logEntry(actor, "rejected", { reason })],
  }, actor);
  await logAudit(actor, { action: "rate_rejected", entity: COLLECTIONS.rateCards, entityId: id, reason });
}

/** Edit prices on a draft/pending card (active cards are immutable). */
export async function updateRateCard(
  id: string,
  data: Partial<RateCard>,
  actor: AuditActor,
  changeNote?: string,
): Promise<void> {
  const card = await getOne<RateCard>(COLLECTIONS.rateCards, id);
  if (!card) return;
  if (card.status === "active" || card.status === "expired") {
    throw new Error("Active rate cards cannot be edited. Create a new version for approval.");
  }
  await update<RateCard>(COLLECTIONS.rateCards, id, {
    ...data,
    version: (card.version ?? 1) + 1,
    changeLog: [...card.changeLog, logEntry(actor, "edited", { reason: changeNote })],
  }, actor);
  await logAudit(actor, { action: "rate_change", entity: COLLECTIONS.rateCards, entityId: id, reason: changeNote });
}

export function getActiveRateCards(): Promise<WithId<RateCard>[]> {
  return getMany<RateCard>(COLLECTIONS.rateCards).then((cards) =>
    cards.filter((c) => c.status === "active"),
  );
}

export function useRateCards() {
  return useCollection<RateCard>(COLLECTIONS.rateCards, [orderBy("createdAt", "desc")]);
}
