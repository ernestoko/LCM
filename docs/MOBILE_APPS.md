# Liberty & Liberty Logistics — Mobile Apps (Android & iOS) Strategy

> Status: **planning / outline** (no app code yet). This document proposes how we
> build native Android + iOS apps on top of the existing platform, the
> technology choice, scope, architecture, and a phased roadmap. Decisions that
> need your sign-off are marked **[DECISION]**.

---

## 1. Goals

Give customers and staff a fast, native mobile experience backed by the **same
Firebase backend** the web platform already uses — no second backend to build or
maintain. Concretely:

- **Customers** can track shipments, get push notifications at every milestone,
  request pickups / ship-to-warehouse, view invoices, pay, chat with Jesselyn,
  and manage their account — from their phone.
- **Operations / warehouse staff** can do **barcode/QR scanning** for intake,
  update shipment status, build/dispatch manifests, and capture delivery proof
  (photo + signature) on the warehouse floor — the single biggest win mobile
  adds over the web app.

## 2. What already exists (and how mobile reuses it)

The mobile apps are **clients of the platform we already have** — we are not
rebuilding the backend:

| Existing piece | Mobile reuse |
| --- | --- |
| **Firebase Auth** + custom-claim RBAC (`role`, `org`, `customerId`) | Same login + the exact same role model on mobile |
| **Firestore** collections (shipments, invoices, manifests, customers, …) | Real-time data + offline cache via the Firestore mobile SDK |
| **firestore.rules / storage.rules** | Already enforce access server-side — they protect mobile too, unchanged |
| **Next.js API routes** (`/api/track`, `/api/assistant/*`, `/api/notifications/*`, `/api/analytics/*`) | Called over HTTPS from mobile exactly like the web does |
| **Notification service** (email/SMS templates + events) | Add **FCM push** as a new channel using the same lifecycle events |
| **TypeScript domain types** (`src/types`) + pure logic (`src/lib` — pricing, CBM, permissions, formatting) | Shared with mobile via a workspace package (see §5) |

**Implication:** most of the backend work is already done. Mobile is primarily a
new presentation layer + push notifications + scanning.

## 3. Technology choice — **[DECISION]**

**Recommendation: React Native + Expo (TypeScript).**

| Option | Verdict |
| --- | --- |
| **React Native + Expo** ✅ recommended | One codebase → Android + iOS. Same language (TS) and mental model as our Next.js app; **reuses our Firebase SDK, types, and pure business logic**; huge ecosystem; Expo handles builds (EAS), OTA updates, push, camera/barcode. Fastest path for us. |
| Flutter | Excellent apps, but Dart means **zero reuse** of our TS types/logic and a new language for the team. |
| Native (Kotlin + Swift) | Best raw performance/UX, but **2× the work** (two codebases) and two skill sets — not justified for a logistics app. |
| PWA only (no native) | Cheapest, and our site is already installable — but **no real push on iOS history, no reliable background, weaker store presence, no native camera/scanning UX**. Good stopgap, not the destination. |

**Why Expo specifically:** managed builds (EAS Build/Submit), Expo Notifications
(FCM/APNs), `expo-camera`/`expo-barcode-scanner`, secure storage, and
over-the-air JS updates for fast fixes without store review.

> Interim quick win: we can ship the existing site as an **installable PWA**
> (add icons + offline shell) in days while the native apps are built — covered
> in §11.

## 4. App structure — one role-aware app or two? **[DECISION]**

Recommended: **two apps from one monorepo**, sharing code:

1. **Liberty Customer** (public, on App Store / Play Store) — for customers.
2. **Liberty Operations** (internal / unlisted or MDM-distributed) — for SEAL +
   Liberty staff: scanning, intake, manifests, status updates.

Rationale: very different audiences, permissions, and store-review expectations;
keeping the customer app lean improves reviews and download size. They share
auth, types, theme, and API clients via the shared package, so it's not double
the work.

_(Alternative: a single app that shows customer vs staff UI by role. Simpler to
ship once, but mixes internal tooling into a public store listing — not ideal.)_

## 5. Architecture & code reuse

```
liberty-platform/                (monorepo — pnpm/npm workspaces or Turborepo)
├─ apps/
│  ├─ web/                        ← the current Next.js app (move here)
│  ├─ mobile-customer/            ← Expo app
│  └─ mobile-ops/                 ← Expo app
└─ packages/
   ├─ shared-types/              ← src/types (Shipment, Invoice, Role, …)
   ├─ shared-logic/              ← pure logic: pricing engine, cbm, permissions,
   │                               formatting, notification templates, assistant brain
   └─ firebase-client/           ← shared Firebase init + repositories (platform-agnostic)
```

- **Move our existing `src/types` and the pure modules in `src/lib`** (pricing,
  `cbm`, `permissions`, `format`, `dates`, notification `templates`, the
  assistant `brain`/`knowledge`) into `packages/`. They have **no DOM/Next
  dependencies**, so React Native imports them directly. This is the single
  biggest reuse lever and keeps web + mobile pricing/permissions identical.
- Firebase repositories (`src/lib/db/repositories/*`) are mostly Firestore calls
  — refactor them to take a `db` instance so both `firebase/firestore` (web) and
  `@react-native-firebase/firestore` (or the JS SDK) can share them.
- The **server stays as-is** (Next.js API routes + Firebase). Mobile calls the
  same HTTPS endpoints.

## 6. Authentication & security on mobile

- **Firebase Auth** (email/password now; add Google/Apple sign-in for the
  customer app — Apple sign-in is **required** by App Store if any social login
  is offered). Same custom claims drive RBAC.
- **Secure token storage** via `expo-secure-store` (Keychain / Keystone) — never
  AsyncStorage for tokens.
- **Biometric unlock** (Face ID / fingerprint) via `expo-local-authentication`
  for the ops app and optionally the customer app.
- Reuse our **identity-verification / OTP** flow (Jesselyn `verify` endpoints)
  for sensitive customer actions.
- **Certificate pinning** (optional, ops app) for high-assurance.
- All existing **firestore.rules / storage.rules** protect mobile automatically —
  no new server authz needed.
- App Store / Play **privacy disclosures**: declare data collected (account,
  shipment data, the privacy-first analytics) and link our privacy policy.

## 7. Push notifications (the big new capability)

- Add **FCM (Android) + APNs (iOS)** via Expo Notifications.
- On login, register the device token to the user's record (`users/{uid}/devices`).
- Extend the **existing notification service**: where we send email/SMS for
  lifecycle events (received, invoiced, paid, dispatched, in-transit, arrived,
  out-for-delivery, delivered, recipient-incoming), also **send a push** to the
  customer's (and recipient's) devices. The event/templates already exist — we
  add one more channel.
- Deep links: tapping a "Dispatched" push opens the shipment's tracking screen.

## 8. Feature scope

### Customer app — MVP
- Sign in / register / biometric unlock
- **Track** a shipment (live status + timeline + map of milestones)
- **My shipments / invoices / balances**, pay online (Paystack/PayPal in-app browser)
- **Request a pickup / ship-to-warehouse**; see my warehouse suite address
- **Push notifications** at every milestone
- **Jesselyn** chat (reuse the brain + assistant API)
- Profile & notification preferences

### Operations app — MVP
- Staff sign in (role-aware)
- **Scan to intake**: barcode/QR → open/create the shipment, capture
  weight/photos, set status — the core warehouse workflow
- **Status updates** along the pipeline
- **Manifests**: view, add packages, confirm, dispatch
- **Delivery proof**: photo + signature capture at delivery
- Offline queue for scans/updates with sync when back online

### Later (V2+)
- Customer: address book, consolidation requests, document upload, referrals
- Ops: route/manifest optimization, label printing via mobile Bluetooth printers,
  in-app rate lookups

## 9. Offline support

Firestore's mobile SDK gives **offline reads + write queueing** out of the box —
critical for warehouses with patchy Wi‑Fi. We'll enable persistence and design
the scan/intake flow to work offline and reconcile on reconnect (the
gap-free counters and status guards already in the codebase make this safe).

## 10. Tooling, build & release

- **EAS Build** (cloud builds for both platforms) + **EAS Submit** (store upload).
- **EAS Update** for OTA JS patches (skip store review for non-native fixes).
- **CI**: extend the existing GitHub Actions — typecheck/test the shared
  packages; trigger EAS builds on tagged releases.
- **Accounts needed [DECISION]**: Apple Developer Program ($99/yr) and Google
  Play Developer ($25 one-time), plus the legal entity for store listings.
- **Environments**: dev (emulator/staging Firebase) → prod, mirroring the web's
  env split.

## 11. Phased roadmap & rough effort

| Phase | What | Rough effort* |
| --- | --- | --- |
| **0. PWA quick win** | Make the current site installable (icons/manifest already exist) + offline shell + basic web push where supported | ~3–5 days |
| **1. Monorepo + shared packages** | Move web into a workspace; extract types + pure logic + firebase client into `packages/` (web keeps working) | ~1–2 weeks |
| **2. Customer app MVP** | Auth, tracking, shipments/invoices, pickup requests, push, Jesselyn | ~4–6 weeks |
| **3. Operations app MVP** | Auth, scan-to-intake, status, manifests, delivery proof, offline | ~4–6 weeks |
| **4. Store launch** | Polish, store assets, privacy review, beta (TestFlight / Play internal testing), submit | ~2–3 weeks |
| **5. V2** | Address book, payments polish, label printing, route tools | ongoing |

\* Indicative for a small team; parallelizable. Phases 0–1 de-risk everything else.

## 12. Key decisions needed from you

1. **[DECISION]** Tech: confirm **React Native + Expo** (recommended).
2. **[DECISION]** Apps: **two apps (Customer + Operations)** vs one role-aware app.
3. **[DECISION]** Do we want the **PWA quick win** shipped first (recommended)?
4. **[DECISION]** Store accounts / legal entity for Apple + Google.
5. **[DECISION]** Social sign-in for customers (Google/Apple) — yes/no.
6. **[DECISION]** Priority order: Customer app first, or Operations (scanning)
   first? (Scanning often delivers the fastest operational ROI.)

## 13. Risks & mitigations

- **iOS push/build friction** → Expo + EAS smooths most of it; budget time for
  Apple provisioning.
- **Code-reuse refactor** (Phase 1) touching the web app → done behind the same
  CI gate (typecheck/test/build) the web already passes; web stays shippable.
- **Store review** (esp. Apple) for the customer app → follow guidelines, ship a
  clean privacy policy, avoid putting internal tooling in the public listing
  (hence the two-app split).
- **Scope creep** → ship the two MVPs in §8 first; everything else is V2.

---

### Next step
Once you confirm the **[DECISION]** points (especially tech + app split +
priority), I'll produce a detailed implementation plan for Phase 1 (monorepo +
shared packages) — the foundation both apps build on — and then we start coding.
