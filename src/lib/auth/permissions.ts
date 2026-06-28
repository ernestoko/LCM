import type { Role } from "@/types";

/**
 * Permission catalogue. Every gated action in the platform maps to one of
 * these keys. The matrix below is the single source of truth that both the UI
 * (sidebar, buttons) and server-side guards consult. Firestore security rules
 * mirror these grants for defence-in-depth.
 */
export type Permission =
  // Users & platform admin
  | "users.manage"
  | "settings.manage"
  | "audit.view"
  | "data.export"
  // Customers
  | "customers.view"
  | "customers.create"
  | "customers.edit"
  | "customers.delete"
  // Shipments
  | "shipments.view"
  | "shipments.view.assigned" // SEAL: only assigned shipments
  | "shipments.view.own" // customer: only own shipments
  | "shipments.create"
  | "shipments.edit"
  | "shipments.status.update"
  | "shipments.lock"
  | "shipments.delete"
  | "shipments.override_dispatch"
  // Intake (SEAL)
  | "intake.manage"
  // Manifests
  | "manifests.view"
  | "manifests.create"
  | "manifests.approve" // Liberty approval
  | "manifests.confirm" // SEAL confirmation
  // SEAL operations workspace
  | "seal.operate"
  // Invoices
  | "invoices.view"
  | "invoices.view.own"
  | "invoices.generate"
  // Payments
  | "payments.view"
  | "payments.record"
  | "payments.reconcile"
  // Rate cards
  | "rates.view"
  | "rates.create"
  | "rates.approve"
  // Country routes
  | "routes.view"
  | "routes.create"
  | "routes.approve"
  // Commission
  | "commission.view"
  | "commission.manage"
  // Reports
  | "reports.view"
  | "reports.export"
  // Complaints
  | "complaints.view"
  | "complaints.create"
  | "complaints.manage"
  // Customer self-service requests (pickup / ship-to-warehouse)
  | "requests.view" // staff queue
  | "requests.view.own" // customer: only own requests
  | "requests.create" // customer creates a request
  | "requests.manage" // staff triage / schedule / convert
  // Notifications
  | "notifications.send";

const LIBERTY_SUPER_ADMIN: Permission[] = [
  "users.manage", "settings.manage", "audit.view", "data.export",
  "customers.view", "customers.create", "customers.edit", "customers.delete",
  "shipments.view", "shipments.create", "shipments.edit", "shipments.status.update",
  "shipments.lock", "shipments.delete", "shipments.override_dispatch",
  "intake.manage",
  "manifests.view", "manifests.create", "manifests.approve",
  "invoices.view", "invoices.generate",
  "payments.view", "payments.record", "payments.reconcile",
  "rates.view", "rates.create", "rates.approve",
  "routes.view", "routes.create", "routes.approve",
  "commission.view", "commission.manage",
  "reports.view", "reports.export",
  "complaints.view", "complaints.create", "complaints.manage",
  "requests.view", "requests.create", "requests.manage",
  "notifications.send",
];

const LIBERTY_ADMIN: Permission[] = [
  "customers.view", "customers.create", "customers.edit",
  "shipments.view", "shipments.create", "shipments.edit", "shipments.status.update",
  "shipments.override_dispatch",
  "intake.manage",
  "manifests.view", "manifests.create", "manifests.approve",
  "invoices.view", "invoices.generate",
  "payments.view", "payments.record",
  "rates.view", "rates.create",
  "routes.view", "routes.create",
  "commission.view",
  "reports.view",
  "complaints.view", "complaints.create", "complaints.manage",
  "requests.view", "requests.create", "requests.manage",
  "notifications.send",
];

const SEAL_ADMIN: Permission[] = [
  "shipments.view.assigned", "shipments.status.update",
  "intake.manage", "seal.operate",
  "manifests.view", "manifests.create", "manifests.confirm",
  "rates.view", "rates.create", // can propose rates (require Liberty approval)
  "routes.view",
  "invoices.view", // only assigned operational invoices (enforced by query scope)
  "complaints.view", "complaints.create",
  "requests.view", "requests.manage",
];

const SEAL_STAFF: Permission[] = [
  "shipments.view.assigned", "shipments.status.update",
  "intake.manage", "seal.operate",
  "manifests.view",
  "requests.view",
];

const FINANCE_USER: Permission[] = [
  "invoices.view",
  "payments.view", "payments.record", "payments.reconcile",
  "commission.view",
  "reports.view",
  "rates.view",
  "complaints.view",
  "customers.view",
  "shipments.view",
];

const CUSTOMER: Permission[] = [
  "shipments.view.own",
  "invoices.view.own",
  "complaints.view", "complaints.create",
  "requests.view.own", "requests.create",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  liberty_super_admin: LIBERTY_SUPER_ADMIN,
  liberty_admin: LIBERTY_ADMIN,
  seal_admin: SEAL_ADMIN,
  seal_staff: SEAL_STAFF,
  finance_user: FINANCE_USER,
  customer: CUSTOMER,
};

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAny(role: Role | undefined | null, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

export function canAll(role: Role | undefined | null, permissions: Permission[]): boolean {
  return permissions.every((p) => can(role, p));
}

/** Convenience helpers used throughout the app. */
export const isLiberty = (role?: Role | null) =>
  role === "liberty_super_admin" || role === "liberty_admin";
export const isSeal = (role?: Role | null) =>
  role === "seal_admin" || role === "seal_staff";
export const isSuperAdmin = (role?: Role | null) => role === "liberty_super_admin";
export const isFinance = (role?: Role | null) => role === "finance_user";
export const isCustomer = (role?: Role | null) => role === "customer";
