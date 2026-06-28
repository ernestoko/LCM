# Liberty Cargo Movers — Setup & Deployment Guide

This guide takes you from a fresh clone to a running, deployed platform.

---

## ⚠️ Important: Google Drive & `node_modules`

This project currently lives inside a **Google Drive** folder. Google Drive's
virtual filesystem (File Stream) **corrupts `node_modules`** during `npm install`
(files end up 0 bytes) and **does not support symlinks/junctions**.

**Do one of the following before installing:**

- **Recommended:** copy/clone the project to a local disk folder (e.g.
  `C:\dev\LCM`), run `npm install` and `npm run dev` there. Push code changes
  back to Git; let Drive sync the source, not `node_modules`.
- **Or:** pause Google Drive sync while you run `npm install`, and add
  `node_modules` to Drive's "ignore" list so it is never synced. (`.gitignore`
  already excludes it from Git.)

Everything else below assumes you are running from a **local disk** copy.

---

## 1. Prerequisites

- **Node.js ≥ 18.18** (Node 20+ recommended) and npm
- A **Firebase** project (Blaze plan recommended for Storage + Functions hosting)
- The **Firebase CLI**: `npm install -g firebase-tools`
- (Optional) An **mNotify** account for SMS and a **Resend**/SMTP account for email

## 2. Create the Firebase project

1. Go to <https://console.firebase.google.com> → **Add project**.
2. Enable these products:
   - **Authentication** → Sign-in method → enable **Email/Password**.
   - **Firestore Database** → create in production mode.
   - **Storage** → get started.
3. Project settings → **General** → "Your apps" → add a **Web app**; copy the
   config values (apiKey, authDomain, projectId, …).
4. Project settings → **Service accounts** → **Generate new private key**. This
   downloads a JSON file with `project_id`, `client_email`, and `private_key`.

## 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` | Web app config (step 2.3) |
| `FIREBASE_ADMIN_PROJECT_ID` | `project_id` from the service-account JSON |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | `client_email` from the JSON |
| `FIREBASE_ADMIN_PRIVATE_KEY` | `private_key` from the JSON — keep the `\n`s, wrap in quotes |
| `MNOTIFY_API_KEY` / `MNOTIFY_SENDER_ID` | mNotify dashboard (optional, for SMS) |
| `EMAIL_PROVIDER` / `RESEND_API_KEY` | `console` to log emails, or `resend` + key |

> The platform runs **without** mNotify/email configured — those channels simply
> degrade gracefully (email logs to the server console; SMS returns
> `not_configured`).

## 4. Install dependencies

```bash
npm install
```

## 5. Point the Firebase CLI at your project

```bash
firebase login
# edit .firebaserc and replace REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID
firebase use --add        # select your project
```

## 6. Deploy security rules & indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

This installs the role-based Firestore rules, the composite indexes, and the
Storage rules (no public access to customer data).

## 7. Seed the platform

```bash
npm run seed
```

This creates:

- A **Liberty Super Admin** account (prints the email & password at the end)
- **Platform settings** (commission defaults, service-fee rules, dispatch guards)
- **SEAL's approved rate cards** (item-based, per-route weight, $30 service fee)
- **Country routes** (Ghana active; Liberia/Nigeria/Cameroon/Kenya/South Africa
  as drafts awaiting Liberty approval)
- The **6-month pilot tracker**

Optional flags:

```bash
# also create demo staff (Liberty Ops, Finance, SEAL Admin, SEAL Staff)
SEED_DEMO=true npm run seed

# customise the admin credentials
SEED_ADMIN_EMAIL=you@company.com SEED_ADMIN_PASSWORD='StrongPass!1' npm run seed
```

> **Change the seeded passwords after first login.**

## 8. Run locally

```bash
npm run dev
# open http://localhost:3000 and sign in with the Super Admin credentials
```

## 9. Deploy to production

Firebase App Hosting (recommended for Next.js):

```bash
npm run build
firebase deploy
```

Or deploy to **Vercel** — add the same environment variables in the Vercel
dashboard and it builds automatically.

---

## Local emulator preview (no cloud project)

Want to see the full app immediately without creating a Firebase project? Run the
**Firebase Local Emulator Suite** (needs Java 17+ for the Firestore emulator).

```bash
# 1. .env.local — demo config + emulator flags (apiKey can be any non-empty string)
NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-lcm.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-lcm
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-lcm.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:demo
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
NEXT_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1

# 2. Start the emulators (separate terminal)
npx firebase-tools emulators:start --project demo-lcm --only auth,firestore,storage

# 3. Seed (point the Admin SDK at the emulators — no real credentials needed)
#    PowerShell:
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"; $env:FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099"; $env:GCLOUD_PROJECT="demo-lcm"; $env:SEED_DEMO="true"
npm run seed
npm run seed:demo
#    bash:  FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 GCLOUD_PROJECT=demo-lcm SEED_DEMO=true npm run seed

# 4. Run the app
npm run build && npm run start   # or: npm run dev
```

Sign in with `admin@libertycargomovers.com` / `Liberty@2026!`. Emulator data is
in-memory — re-run the seeds after restarting the emulators. Inspect data at the
Emulator UI (http://127.0.0.1:4000).

## Creating other users

User accounts are provisioned by a **Super Admin** in the app:
**Settings → Users → Add User**. This calls the secure `/api/users` endpoint
(Admin SDK) which creates the Auth account and sets the role/org custom claims
that drive the Firestore security rules. Roles available:

- `liberty_super_admin`, `liberty_admin`, `seal_admin`, `seal_staff`,
  `finance_user`, `customer`.

For **customer** logins, set the `customerId` to link the account to a customer
record so the customer portal shows only their shipments & invoices.

---

## How pricing works (SEAL controls it)

1. SEAL's approved prices live in **Rate Cards** (item-based, weight-based,
   service fee). New cards start as **draft** → **pending approval** → only a
   **Super Admin** can **activate** them. Active cards are immutable; every
   change is logged.
2. When an operator generates an invoice for a shipment, the pricing engine
   (`src/lib/pricing/engine.ts`) picks the currently-active rate card for the
   route, computes line items + the configurable service fee (waived for
   Nigeria by default), and stores a reproducible snapshot on the invoice.
3. **Liberty's earnings** (commission % + platform fee) are computed
   automatically per the rules in **Settings → Commission** and shown on the
   internal settlement section of each invoice (hidden from customers & SEAL).

## Dispatch guards

A package cannot move to *Ready for Dispatch / Dispatched* unless it has a
photo, a weight, a customer, an invoice, a confirmed payment, and a manifest —
each toggle-able in **Settings → Dispatch Guards**. A Super Admin / Liberty Admin
can override the payment requirement with a logged reason.

---

## Useful scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | Type-check without emitting |
| `npm test` | Run the Vitest unit suite (pricing, commission, guards, metrics) |
| `npm run seed` | Seed Firebase with admin, rates, routes, settings |
| `npm run seed:demo` | Populate demo customers, shipments, invoices, payments, manifests, complaints (run after `seed`) |
| `npm run firebase:rules` | Deploy Firestore + Storage rules |
| `npm run firebase:deploy` | Build + deploy everything |

## Troubleshooting

- **"Firebase is not configured" / redirected to `/setup`** — your
  `NEXT_PUBLIC_FIREBASE_*` values are missing or wrong in `.env.local`.
- **"Account not provisioned"** — you signed in with an Auth user that has no
  `users/{uid}` profile. Have a Super Admin create the user via Settings → Users.
- **`npm install` produces 0-byte files** — you're installing into a Google
  Drive folder. See the warning at the top of this file.
- **Missing index errors in the console** — deploy indexes
  (`firebase deploy --only firestore:indexes`) or click the link in the error.
