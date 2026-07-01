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
  requests: "requests",
  notifications: "notifications",
  auditLogs: "auditLogs",
  settings: "settings",
  pilotTracker: "pilotTracker",
  counters: "counters",
  /** Server-only: assistant identity-verification OTP challenges. */
  otpChallenges: "otpChallenges",
  /** Server-only: fixed-window rate-limit counters. */
  rateLimits: "rateLimits",
  /** Privacy-safe daily site-visit counters (no PII). */
  siteTraffic: "siteTraffic",
  /** Public "Get a quote" / contact-form leads (server-written). */
  contactSubmissions: "contactSubmissions",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/** Singleton document ids. */
export const SETTINGS_DOC_ID = "platform";
export const PILOT_DOC_ID = "pilot";
