/** Canonical Firestore collection names — referenced everywhere to avoid typos. */
export const COLLECTIONS = {
  users: "users",
  customers: "customers",
  shipments: "shipments",
  packages: "packages",
  rateCards: "rateCards",
  invoices: "invoices",
  payments: "payments",
  manifests: "manifests",
  countryRoutes: "countryRoutes",
  commissions: "commissions",
  complaints: "complaints",
  notifications: "notifications",
  auditLogs: "auditLogs",
  settings: "settings",
  pilotTracker: "pilotTracker",
  counters: "counters",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/** Singleton document ids. */
export const SETTINGS_DOC_ID = "platform";
export const PILOT_DOC_ID = "pilot";
