import type { Role, Organization } from "@/types";

export const ROLES: Role[] = [
  "liberty_super_admin",
  "liberty_admin",
  "seal_admin",
  "seal_staff",
  "finance_user",
  "customer",
];

export const ROLE_LABELS: Record<Role, string> = {
  liberty_super_admin: "Liberty Super Admin",
  liberty_admin: "Liberty Admin / Operations",
  seal_admin: "SEAL Admin",
  seal_staff: "SEAL Staff",
  finance_user: "Finance User",
  customer: "Customer",
};

export const ROLE_ORG: Record<Role, Organization> = {
  liberty_super_admin: "liberty",
  liberty_admin: "liberty",
  seal_admin: "seal",
  seal_staff: "seal",
  finance_user: "liberty",
  customer: "customer",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  liberty_super_admin:
    "Full control — users, SEAL access, rate & route approvals, all records, exports, commission settings.",
  liberty_admin:
    "Operations — register customers, create shipments, update status, invoices, documents, Ghana delivery prep.",
  seal_admin:
    "SEAL operations lead — intake, photos, weights, manifests, delivery proof, operational updates.",
  seal_staff:
    "SEAL warehouse — receive packages, photos, weight & dimensions, intake status on assigned batches.",
  finance_user:
    "Finance — invoices, mark payments, record SEAL invoices & Liberty commission, reconciliation.",
  customer:
    "Customer portal — view shipment status, invoices, receipts and tracking updates.",
};

/** Roles that may be assigned by a Super Admin when creating staff users. */
export const ASSIGNABLE_STAFF_ROLES: Role[] = [
  "liberty_admin",
  "seal_admin",
  "seal_staff",
  "finance_user",
];
