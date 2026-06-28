import type { Role } from "@/types";
import { ROLE_PERMISSIONS, type Permission } from "@/lib/auth/permissions";

/**
 * Modules are the coarse "responsibilities" a Super Admin can grant to a role.
 * Each bundles a set of fine-grained permissions. The Roles & Access page lets
 * the Super Admin toggle these per role; the auth layer expands a role's granted
 * modules into its effective permissions (see lib/auth/permissions effective*).
 */
export interface AppModule {
  key: string;
  label: string;
  description: string;
  permissions: Permission[];
}

export const MODULES: AppModule[] = [
  {
    key: "customers",
    label: "Customers",
    description: "View, create and edit customer accounts.",
    permissions: ["customers.view", "customers.create", "customers.edit"],
  },
  {
    key: "shipments",
    label: "Shipments",
    description: "Create and manage shipments and their status.",
    permissions: [
      "shipments.view",
      "shipments.create",
      "shipments.edit",
      "shipments.status.update",
      "shipments.override_dispatch",
    ],
  },
  {
    key: "intake",
    label: "Intake & Operations",
    description: "Package intake (photos, weight/CBM) and the operations workspace.",
    permissions: ["intake.manage", "seal.operate", "shipments.view.assigned", "shipments.status.update"],
  },
  {
    key: "manifests",
    label: "Manifests & Containers",
    description: "Build, approve, confirm and dispatch manifests/containers.",
    permissions: ["manifests.view", "manifests.create", "manifests.approve", "manifests.confirm"],
  },
  {
    key: "invoices",
    label: "Invoices",
    description: "Generate and view invoices.",
    permissions: ["invoices.view", "invoices.generate"],
  },
  {
    key: "payments",
    label: "Payments",
    description: "Record and reconcile payments.",
    permissions: ["payments.view", "payments.record", "payments.reconcile"],
  },
  {
    key: "rates",
    label: "Rate Cards",
    description: "View, propose and approve rate cards.",
    permissions: ["rates.view", "rates.create", "rates.approve"],
  },
  {
    key: "routes",
    label: "Country Routes",
    description: "View, propose and approve shipping routes.",
    permissions: ["routes.view", "routes.create", "routes.approve"],
  },
  {
    key: "reports",
    label: "Reports & Commission",
    description: "Reports, analytics, settlement and commission.",
    permissions: ["reports.view", "reports.export", "commission.view", "commission.manage"],
  },
  {
    key: "complaints",
    label: "Support & Complaints",
    description: "Manage customer support tickets.",
    permissions: ["complaints.view", "complaints.create", "complaints.manage"],
  },
  {
    key: "requests",
    label: "Requests Queue",
    description: "Triage and convert customer pickup / forwarding requests.",
    permissions: ["requests.view", "requests.manage"],
  },
  {
    key: "notifications",
    label: "Notifications",
    description: "Send customer notifications (email / SMS / WhatsApp).",
    permissions: ["notifications.send"],
  },
  {
    key: "admin",
    label: "Platform Admin",
    description: "Users, settings, audit logs, data export and record locking.",
    permissions: [
      "users.manage",
      "settings.manage",
      "audit.view",
      "data.export",
      "shipments.lock",
      "shipments.delete",
      "customers.delete",
    ],
  },
];

export const MODULE_BY_KEY = new Map(MODULES.map((m) => [m.key, m] as const));

/** The union of permissions granted by a set of module keys. */
export function permissionsForModules(keys: string[]): Permission[] {
  const set = new Set<Permission>();
  for (const k of keys) {
    for (const p of MODULE_BY_KEY.get(k)?.permissions ?? []) set.add(p);
  }
  return [...set];
}

/**
 * The modules a role holds by default — derived from its static permission set
 * (a module is "on" when the role holds any of the module's permissions). Used
 * to pre-fill the Roles & Access matrix before any custom config is saved.
 */
export function defaultModulesForRole(role: Role): string[] {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  return MODULES.filter((m) => m.permissions.some((p) => perms.includes(p))).map((m) => m.key);
}

/**
 * A role's EFFECTIVE permissions: when a Super Admin has saved a custom module
 * set for the role, expand those modules; otherwise fall back to the role's
 * static defaults (so untouched roles behave exactly as before).
 */
export function effectivePermissions(
  role: Role | null | undefined,
  roleModules: Partial<Record<Role, string[]>>,
): Permission[] {
  if (!role) return [];
  const granted = roleModules[role];
  return granted ? permissionsForModules(granted) : ROLE_PERMISSIONS[role] ?? [];
}
