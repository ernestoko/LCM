"use client";

import { create } from "./firestore";
import { COLLECTIONS } from "./collections";
import type { AuditAction, Role } from "@/types";

export interface AuditActor {
  uid: string;
  name?: string;
  role?: Role;
}

export interface LogAuditInput {
  action: AuditAction;
  entity: string;
  entityId?: string;
  field?: string;
  oldValue?: string | number | null;
  newValue?: string | number | null;
  reason?: string;
}

/**
 * Append an immutable audit-log entry. Fire-and-forget — logging must never
 * block the primary action, but failures are surfaced to the console.
 */
export async function logAudit(actor: AuditActor, input: LogAuditInput): Promise<void> {
  try {
    await create(COLLECTIONS.auditLogs, {
      ...input,
      userId: actor.uid,
      userName: actor.name,
      userRole: actor.role,
      at: new Date().toISOString(),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to write audit log", err);
  }
}
