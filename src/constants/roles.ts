import type { Role, Organization } from "@/types";

export const ROLES: Role[] = [
  "liberty_super_admin",
  "liberty_admin",
  "seal_admin",
  "seal_supervisor",
  "seal_intake",
  "seal_staff",
  "finance_user",
  "customer",
];

export const ROLE_LABELS: Record<Role, string> = {
  liberty_super_admin: "Liberty Super Admin",
  liberty_admin: "Liberty Admin / Operations",
  seal_admin: "SEAL Admin",
  seal_supervisor: "SEAL Supervisor",
  seal_intake: "SEAL Intake Officer",
  seal_staff: "SEAL Warehouse Staff",
  finance_user: "Finance User",
  customer: "Customer",
};

export const ROLE_ORG: Record<Role, Organization> = {
  liberty_super_admin: "liberty",
  liberty_admin: "liberty",
  seal_admin: "seal",
  seal_supervisor: "seal",
  seal_intake: "seal",
  seal_staff: "seal",
  finance_user: "liberty",
  customer: "customer",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  liberty_super_admin:
    "Full control — users, role/module management, operations access, rate & route approvals, all records, exports, commission settings.",
  liberty_admin:
    "Operations — register customers, create shipments, update status, invoices, documents, Ghana delivery prep.",
  seal_admin:
    "SEAL lead — intake, photos, weights, manifests/containers, delivery proof, operational updates and rate proposals.",
  seal_supervisor:
    "SEAL supervisor — runs intake and manifests, confirms dispatch and triages the requests queue.",
  seal_intake:
    "SEAL intake officer — receive packages, capture photos, weight/CBM and intake status on assigned batches.",
  seal_staff:
    "SEAL warehouse — assist with receiving, photos and basic intake status on assigned batches.",
  finance_user:
    "Finance — invoices, mark payments, record operations invoices & Liberty commission, reconciliation.",
  customer:
    "Customer portal — view shipment status, invoices, receipts and tracking updates.",
};

/** Roles a Super Admin may assign when creating staff users (customers self-register). */
export const ASSIGNABLE_STAFF_ROLES: Role[] = [
  "liberty_admin",
  "seal_admin",
  "seal_supervisor",
  "seal_intake",
  "seal_staff",
  "finance_user",
];

/** Staff roles whose module access the Super Admin can manage (excludes the all-powerful super admin and external customers). */
export const MANAGEABLE_ROLES: Role[] = [
  "liberty_admin",
  "seal_admin",
  "seal_supervisor",
  "seal_intake",
  "seal_staff",
  "finance_user",
];
