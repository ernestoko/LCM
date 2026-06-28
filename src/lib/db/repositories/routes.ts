"use client";

import { orderBy } from "firebase/firestore";
import { create, update, getMany } from "../firestore";
import { useCollection } from "../hooks";
import { COLLECTIONS } from "../collections";
import { logAudit, type AuditActor } from "../audit";
import type { CountryRoute } from "@/types";

export type NewRoute = Omit<
  CountryRoute,
  | "id"
  | "sealConfirmed"
  | "libertyApproved"
  | "status"
  | "createdAt"
  | "createdBy"
> & { status?: CountryRoute["status"] };

export async function createRoute(data: NewRoute, actor: AuditActor): Promise<string> {
  const id = await create<Partial<CountryRoute>>(
    COLLECTIONS.countryRoutes,
    {
      ...data,
      sealConfirmed: false,
      libertyApproved: false,
      status: data.status ?? "draft",
    },
    actor,
  );
  await logAudit(actor, { action: "settings_change", entity: COLLECTIONS.countryRoutes, entityId: id, newValue: data.countryName });
  return id;
}

export async function updateRoute(id: string, data: Partial<CountryRoute>, actor: AuditActor): Promise<void> {
  await update<CountryRoute>(COLLECTIONS.countryRoutes, id, data, actor);
}

export async function sealConfirmRoute(id: string, actor: AuditActor): Promise<void> {
  await update<CountryRoute>(COLLECTIONS.countryRoutes, id, {
    sealConfirmed: true,
    sealConfirmedBy: actor.uid,
    sealConfirmedAt: new Date().toISOString(),
  }, actor);
}

/** Liberty approval — only after approval may a route become active. */
export async function libertyApproveRoute(id: string, actor: AuditActor): Promise<void> {
  await update<CountryRoute>(COLLECTIONS.countryRoutes, id, {
    libertyApproved: true,
    libertyApprovedBy: actor.uid,
    libertyApprovedAt: new Date().toISOString(),
    status: "active",
  }, actor);
  await logAudit(actor, { action: "settings_change", entity: COLLECTIONS.countryRoutes, entityId: id, field: "status", newValue: "active" });
}

export async function setRouteStatus(id: string, status: CountryRoute["status"], actor: AuditActor): Promise<void> {
  await update<CountryRoute>(COLLECTIONS.countryRoutes, id, { status }, actor);
  await logAudit(actor, { action: "settings_change", entity: COLLECTIONS.countryRoutes, entityId: id, field: "status", newValue: status });
}

export function getRoutes() {
  return getMany<CountryRoute>(COLLECTIONS.countryRoutes);
}

export function useRoutes() {
  return useCollection<CountryRoute>(COLLECTIONS.countryRoutes, [orderBy("countryName")]);
}
