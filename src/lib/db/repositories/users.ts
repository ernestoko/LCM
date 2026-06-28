"use client";

import { orderBy } from "firebase/firestore";
import { useCollection } from "../hooks";
import { update } from "../firestore";
import { COLLECTIONS } from "../collections";
import { logAudit, type AuditActor } from "../audit";
import type { AppUser } from "@/types";

/**
 * User CREATION happens server-side via /api/users (Admin SDK) so that the
 * Firebase Auth account and custom claims (role/org/customerId) are created
 * atomically. The client repo only reads and toggles profile fields.
 */

export function useUsers() {
  return useCollection<AppUser>(COLLECTIONS.users, [orderBy("displayName")]);
}

export async function setUserActive(id: string, active: boolean, actor: AuditActor): Promise<void> {
  await update<AppUser>(COLLECTIONS.users, id, { active }, actor);
  await logAudit(actor, {
    action: "user_create",
    entity: COLLECTIONS.users,
    entityId: id,
    field: "active",
    newValue: String(active),
  });
}
