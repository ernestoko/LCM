# Deploying to Firebase App Hosting

This app is a **Next.js 16 SSR** application (it has server API routes), so it
runs on **Firebase App Hosting** — the GA product that builds your GitHub repo
on Cloud Build and serves SSR from an autoscaling Cloud Run backend.

- Repo connected for deploys: `ernestoko/LCM`, branch `main`
- Config file: [`apphosting.yaml`](../apphosting.yaml) (runtime + env + secrets)
- **Requires the Blaze (pay-as-you-go) billing plan** on your Firebase project.

---

## 0. Prerequisites (once)

1. Firebase project on the **Blaze** plan (console → ⚙ → Usage and billing).
2. In the console, enable the services the app uses:
   - **Authentication** → enable **Email/Password** (and **Google** if used).
   - **Firestore Database** → create (production mode).
   - **Storage** → get started.
3. Register a **Web app** (console → ⚙ → Project settings → *Your apps* → Web)
   and copy its config — you'll paste the values in step 2 below.

The Firebase CLI is already installed (`firebase --version` → 15.x). Log in:

```bash
firebase login
```

---

## 1. Point the repo at your project

Edit [`.firebaserc`](../.firebaserc) and replace the placeholder with your real
project ID (or run `firebase use --add` and pick it):

```json
{ "projects": { "default": "your-project-id" } }
```

## 2. Fill the public Firebase web config

In [`apphosting.yaml`](../apphosting.yaml), replace every `REPLACE_WITH_...`
value under the *Firebase Web SDK* and *Firebase Admin* `FIREBASE_ADMIN_PROJECT_ID`
entries with the values from your Web app config. These are **public** and are
meant to be committed.

## 3. Create the server secrets

The Admin SDK and assistant need server-only secrets from Cloud Secret Manager.
Create each (the CLI stores it and offers to grant the backend access):

```bash
# From console → ⚙ → Service accounts → "Generate new private key" (JSON).
firebase apphosting:secrets:set FIREBASE_ADMIN_CLIENT_EMAIL   # paste client_email
firebase apphosting:secrets:set FIREBASE_ADMIN_PRIVATE_KEY    # paste the full PEM
firebase apphosting:secrets:set ASSISTANT_VERIFY_SECRET       # openssl rand -hex 32
```

> Uncomment any optional-integration secrets in `apphosting.yaml` (Resend,
> mNotify, WhatsApp, Anthropic, Turnstile) **only after** creating the matching
> secret the same way — a referenced-but-missing secret fails the rollout.

## 4. Commit & push the config

```bash
git add apphosting.yaml firebase.json .firebaserc docs/DEPLOY-APP-HOSTING.md
git commit -m "Configure Firebase App Hosting"
git push origin main
```

## 5. Create the App Hosting backend

**Console (easiest):** Firebase console → **Build → App Hosting → Get started**
→ connect GitHub and authorize the `ernestoko/LCM` repo → branch `main`, root
directory `/` → create backend. It runs the first rollout automatically.

**CLI alternative:**

```bash
firebase apphosting:backends:create --project your-project-id
```

Every later push to `main` triggers a new rollout automatically. To roll out
manually: `firebase apphosting:rollouts:create <backend-id>`.

## 6. Deploy Firestore & Storage rules + indexes

App Hosting does **not** deploy your security rules — do that separately:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

## 7. Post-deploy

- Console → Authentication → Settings → **Authorized domains**: add the App
  Hosting URL (`<backend>--<project>.<region>.hosted.app`) and any custom domain.
- Seed initial data if needed: see `scripts/seed.ts` (`npm run seed`) pointed at
  the live project via a service-account key.
- Open the App Hosting URL and verify login, tracking, and the dashboard.

---

## Troubleshooting

- **Build fails on Cloud Build** — reproduce locally with `npm run build`.
- **API routes 500 with "Firebase Admin is not configured"** — the
  `FIREBASE_ADMIN_*` secrets aren't set or the backend lacks access; re-run
  `firebase apphosting:secrets:set` and grant access.
- **App tries to reach the emulator** — ensure `NEXT_PUBLIC_USE_FIREBASE_EMULATOR`
  is `"false"` in `apphosting.yaml` (it is by default here).
