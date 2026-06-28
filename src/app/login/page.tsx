"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button, Field, Input, InfoBanner } from "@/components/ui";
import { Logo, LogoWordmark } from "@/components/brand/Logo";
import { BrandLoader } from "@/components/brand/BrandLoader";
import { ShieldCheck, Truck, Globe2, FlaskConical, ArrowRight } from "lucide-react";

const AUTH_ERRORS: Record<string, string> = {
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/user-not-found": "No account found for that email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/invalid-email": "Enter a valid email address.",
};

/**
 * Demo sign-in shortcuts — shown ONLY when running against the Firebase emulator
 * (NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true), so real credentials are never exposed
 * in production. These are the accounts created by `SEED_DEMO=true npm run seed`.
 */
const DEMO_MODE = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";
const DEMO_PASSWORD = "Liberty@2026!";
const DEMO_ACCOUNTS: { label: string; email: string }[] = [
  { label: "Super Admin", email: "admin@libertycargomovers.com" },
  { label: "Liberty Admin", email: "ops@libertycargomovers.com" },
  { label: "Finance", email: "finance@libertycargomovers.com" },
  { label: "Operations", email: "operations@libertylogistics.com" },
  { label: "Warehouse", email: "warehouse@libertylogistics.com" },
];

export default function LoginPage() {
  const { signIn, resetPassword, firebaseUser, user, loading, configured } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (!configured) router.replace("/setup");
  }, [configured, router]);

  useEffect(() => {
    if (!loading && firebaseUser && user) router.replace("/dashboard");
  }, [loading, firebaseUser, user, router]);

  /** Shared sign-in flow used by the form and the demo shortcuts. */
  const runSignIn = async (emailArg: string, passwordArg: string) => {
    setBusy(true);
    setError(null);
    const startedAt = Date.now();
    try {
      await signIn(emailArg.trim(), passwordArg);
      // Hold the branded splash for a beat so it reads as a splash, not a flash.
      const MIN_SPLASH_MS = 2000;
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_SPLASH_MS) {
        await new Promise((r) => setTimeout(r, MIN_SPLASH_MS - elapsed));
      }
      router.replace("/dashboard");
      // Keep `busy` true through navigation so the splash stays until the
      // dashboard mounts (no flash back to the form).
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : "";
      setError(AUTH_ERRORS[code] ?? "Unable to sign in. Please try again.");
      setBusy(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSignIn(email, password);
  };

  /** One-click demo sign-in: fill the fields (for visibility) then authenticate. */
  const loginAs = (acc: { email: string }) => {
    setEmail(acc.email);
    setPassword(DEMO_PASSWORD);
    runSignIn(acc.email, DEMO_PASSWORD);
  };

  const onReset = async () => {
    if (!email.trim()) {
      setError("Enter your email above first, then click reset.");
      return;
    }
    try {
      await resetPassword(email.trim());
      setResetSent(true);
      setError(null);
    } catch {
      setError("Could not send reset email. Check the address and try again.");
    }
  };

  // Branded full-screen loader while the sign-in request is in flight and we
  // hand off to the dashboard — the eagle fills to depict loading progress.
  if (busy) return <BrandLoader label="Signing you in…" />;

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-navy-900 via-navy-900 to-brand-800 p-12 text-white lg:flex">
        {/* gold signature accent */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl" />
        <LogoWordmark light className="relative" />
        <div className="relative">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">
            Global Logistics &amp; Shipping
          </span>
          <h1 className="mt-3 max-w-md text-3xl font-bold leading-tight">
            Transparent, accountable logistics — USA to Ghana and beyond.
          </h1>
          <p className="mt-4 max-w-md text-navy-200">
            Liberty &amp; Liberty Logistics connects you to a global logistics network — moving cargo
            reliably from the USA to Ghana and beyond, all under controlled access.
          </p>
          <div className="mt-8 space-y-3 text-sm">
            <Feature icon={<ShieldCheck className="h-5 w-5 text-gold-300" />} text="Role-based access — Operations, Finance & Customers" />
            <Feature icon={<Truck className="h-5 w-5 text-gold-300" />} text="Track packages from intake to delivery" />
            <Feature icon={<Globe2 className="h-5 w-5 text-gold-300" />} text="Approved rate cards & gradual country onboarding" />
          </div>
        </div>
        <p className="relative text-xs text-navy-300">© {new Date().getFullYear()} Liberty &amp; Liberty Logistics. All rights reserved.</p>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Big Liberty logo */}
          <div className="mb-6 flex flex-col items-center text-center">
            <Logo size={176} className="drop-shadow-[0_6px_20px_rgba(184,134,11,0.25)]" />
            <p className="mt-3 text-xl font-bold tracking-tight text-navy-900">
              Liberty <span className="text-brand-600">&amp;</span> Liberty Logistics
            </p>
          </div>
          <h2 className="text-center text-2xl font-bold text-navy-900">Welcome back</h2>
          <p className="mt-1 text-center text-sm text-navy-500">Sign in to your account.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {error && <InfoBanner tone="warning">{error}</InfoBanner>}
            {resetSent && <InfoBanner tone="success">Password reset email sent. Check your inbox.</InfoBanner>}

            <Field label="Email" required htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </Field>
            <Field label="Password" required htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </Field>

            <div className="flex justify-end">
              <button type="button" onClick={onReset} className="text-xs font-medium text-brand-600 hover:underline">
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full" loading={busy} size="lg">
              Sign in
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs">
            <a href="/track" className="font-medium text-brand-600 hover:underline">
              Track a package
            </a>
            <span className="text-navy-300">·</span>
            <a href="/register" className="font-medium text-brand-600 hover:underline">
              Create a customer account
            </a>
          </div>
          {DEMO_MODE ? (
            <div className="mt-6 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
                <FlaskConical className="h-3.5 w-3.5" /> Demo accounts
              </p>
              <p className="mt-1 text-xs text-navy-500">Click a role to sign in instantly.</p>
              <div className="mt-3 space-y-1.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => loginAs(acc)}
                    className="flex w-full items-center justify-between rounded-lg border border-navy-100 bg-white px-3 py-2 text-left transition-colors hover:border-brand-300 hover:bg-brand-50"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-navy-800">{acc.label}</span>
                      <span className="block truncate text-xs text-navy-400">{acc.email}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-brand-500" />
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-navy-400">
                Shared password: <code className="font-mono text-navy-500">{DEMO_PASSWORD}</code>
              </p>
            </div>
          ) : (
            <p className="mt-3 text-center text-xs text-navy-400">
              Staff accounts are provisioned by a Liberty Super Admin.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">{icon}</span>
      <span className="text-navy-100">{text}</span>
    </div>
  );
}
