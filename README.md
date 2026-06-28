# Liberty Cargo Movers — Logistics Platform

A production-ready logistics management platform for **Liberty Cargo Movers** to
run its **6-month outsourced cargo operation with SEAL Logistics** (USA → Ghana,
expanding to Liberia, Nigeria, Cameroon, Kenya & South Africa).

Liberty **owns the platform, customer records and business intelligence**; SEAL
**controls pricing** (via approved rate cards) and **performs cargo operations**
through controlled, role-scoped access.

> **New here? Read [`SETUP.md`](./SETUP.md) to install, configure Firebase, seed
> data, and deploy.** ⚠️ Do not run `npm install` inside a Google Drive folder —
> see the note at the top of `SETUP.md`.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 14** (App Router) + React 18 + TypeScript |
| Styling | **Tailwind CSS** (custom Liberty brand palette), mobile-first PWA |
| Database | **Cloud Firestore** (live `onSnapshot` listeners) |
| Auth | **Firebase Auth** (email/password) + custom-claim RBAC |
| Storage | **Firebase Storage** (package photos, ID docs, attachments) |
| Server | Next.js **route handlers** + **Firebase Admin SDK** |
| Notifications | **mNotify** SMS · email (Resend/SMTP/console) · in-app |
| Hosting | Firebase App Hosting or Vercel |

## Key capabilities

- **Role-based access control** for 6 roles — Liberty Super Admin, Liberty
  Admin/Ops, SEAL Admin, SEAL Staff, Finance, Customer — enforced in the UI
  **and** in Firestore security rules (defense-in-depth).
- **SEAL rate-card engine** — item-based + weight-based pricing, configurable
  per-route service fee (waived for Nigeria), draft → pending → **Super-Admin
  approval** → active workflow, immutable active cards, full change/audit log.
- **Automatic invoicing** from the active rate card, with a reproducible rate
  snapshot and an internal Liberty/SEAL commission settlement breakdown.
- **Commission / platform-fee engine** — most-specific-rule matching by customer
  source, route and item category; computed automatically on every invoice.
- **Shipment lifecycle** with an 18-state status flow, immutable status history,
  SEAL package intake (photos, weight, dimensions, condition) and **dispatch
  guards** (no photo/weight/invoice/payment/manifest → no dispatch, unless an
  admin overrides with a logged reason).
- **Manifests** — batch shipments, Liberty approval + SEAL confirmation before
  dispatch, printable cargo manifest.
- **Country-route onboarding** — gradual rollout; routes stay draft until Liberty
  approves them.
- **Payments & reconciliation**, **claims & complaints**, **reports**, a
  dedicated **6-month pilot tracker**, and an append-only **audit log**.
- **Role-specific dashboards** for Liberty, SEAL, Finance and Customers.
- **Public package tracking** (`/track`) — privacy-safe, no login, masked recipient.
- **Customer self-registration** (`/register`) — creates a customer record + portal login.
- **Offline-ready PWA** with branded 404 / error boundaries and loading states.
- **Unit-tested business logic** — 58 Vitest tests covering the pricing, commission,
  dispatch-guard and metrics engines (`npm test`).

## Project structure

```
src/
├─ app/
│  ├─ (app)/                 # authenticated, role-gated app shell
│  │  ├─ dashboard/          # role-aware dashboard router
│  │  ├─ customers/          # list · new · [id] detail
│  │  ├─ shipments/          # list · new (live pricing) · [id] detail + timeline
│  │  ├─ intake/             # SEAL package intake (photos, weight, dims)
│  │  ├─ invoices/           # list · [id] printable invoice
│  │  ├─ payments/           # record payments + weekly reconciliation
│  │  ├─ manifests/          # list · new · [id] printable manifest
│  │  ├─ rate-cards/         # SEAL pricing + approval workflow
│  │  ├─ country-routes/     # country onboarding + approval
│  │  ├─ seal-operations/    # SEAL workspace
│  │  ├─ reports/            # reports hub + /pilot tracker
│  │  ├─ complaints/         # claims & complaints
│  │  ├─ settings/           # platform settings + /users management
│  │  └─ audit-logs/         # immutable audit trail
│  ├─ api/                   # users (provisioning) · notifications/send
│  ├─ login/  setup/         # auth entry + first-run setup screen
│  └─ layout.tsx             # AuthProvider + ToastProvider + fonts/PWA
├─ components/               # ui/ (design system) · layout/ · dashboard/ · per-module
├─ constants/                # roles, statuses, nav, SEAL seed data
├─ lib/
│  ├─ auth/                  # AuthProvider + RBAC permission matrix
│  ├─ db/                    # firestore helpers, hooks, repositories/ per entity
│  ├─ pricing/               # rate-card engine + commission engine
│  ├─ shipments/             # dispatch guards & status transitions
│  ├─ analytics/             # dashboard/report metrics
│  ├─ notifications/         # mNotify + email + templates + service
│  └─ firebase/              # client + admin SDK + storage
├─ types/                    # the entire domain model (one source of truth)
scripts/seed.ts              # bootstrap admin, rates, routes, settings
firestore.rules · storage.rules · firestore.indexes.json
docs/AGENT_CONTEXT.md        # internal build conventions reference
```

## Firestore collections

`users · customers · shipments · packages · rateCards · invoices · payments ·
manifests · countryRoutes · commissions · complaints · notifications ·
auditLogs · settings · pilotTracker · counters`

## Roles at a glance

| Role | Can | Cannot |
| --- | --- | --- |
| **Liberty Super Admin** | everything — users, rate/route approval, locking, exports, settings | — |
| **Liberty Admin/Ops** | customers, shipments, invoices, manifests, status, Ghana delivery prep | activate rates, manage users/settings |
| **SEAL Admin** | intake, photos, weights, manifests, delivery proof, propose rates | delete shipments, change ownership, export customer data, activate rates |
| **SEAL Staff** | receive packages, photos, weight, dimensions on assigned batches | most management actions |
| **Finance** | invoices, payments, reconciliation, commission, reports | operational edits |
| **Customer** | view own shipments/invoices, receipts, tracking, raise tickets | anything else |

## Security model

- Custom claims (`role`, `org`, `customerId`, `sealOffice`) set by the Admin SDK
  drive both the UI permission matrix (`src/lib/auth/permissions.ts`) and the
  Firestore rules (`firestore.rules`).
- SEAL has **no read access** to the `customers` collection or platform
  settings. Customers see **only their own** shipments, invoices and tickets.
- Rate activation, route approval, record locking, deletes and data export are
  **Super-Admin gated**. Audit logs are **append-only and immutable**.
- Storage rules block public access; uploads are capped to 15 MB images/PDFs.

## Status

Type-checks clean (`tsc --noEmit`), **58/58 unit tests pass** (`npm test`), and the
production build succeeds (`next build`, **33 routes**) on Next.js 14.2.35.
Run `npm run seed` then `npm run seed:demo` to populate a full demo dataset.
See [`SETUP.md`](./SETUP.md) to get it running.
