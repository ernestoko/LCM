"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Field, Input, Select, InfoBanner } from "@/components/ui";
import { LogoWordmark } from "@/components/brand/Logo";
import { PILOT_COUNTRIES } from "@/constants/seed-data";
import { CUSTOMER_TYPE_LABELS } from "@/constants/statuses";
import type { CustomerType } from "@/types";
import { CheckCircle2, PackageCheck, BellRing, Wallet } from "lucide-react";

const CUSTOMER_TYPE_ENTRIES = Object.entries(CUSTOMER_TYPE_LABELS) as [
  CustomerType,
  string,
][];

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState(PILOT_COUNTRIES[0]);
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [customerType, setCustomerType] = useState<CustomerType>("individual");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
          country,
          city: city.trim() || undefined,
          address: address.trim() || undefined,
          customerType,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Unable to create your account. Please try again.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-navy-900 via-navy-900 to-brand-800 p-12 text-white lg:flex">
        <LogoWordmark className="[&_p]:text-white [&_p:last-child]:text-gold-300" />
        <div>
          <h1 className="max-w-md text-3xl font-bold leading-tight">
            Ship from the USA to Ghana and beyond — with full visibility.
          </h1>
          <p className="mt-4 max-w-md text-navy-200">
            Create your free Liberty Cargo Movers account to send packages, track every step,
            and manage invoices and receipts in one place.
          </p>
          <div className="mt-8 space-y-3 text-sm">
            <Feature
              icon={<PackageCheck className="h-5 w-5 text-gold-300" />}
              text="Track your packages from intake to delivery"
            />
            <Feature
              icon={<BellRing className="h-5 w-5 text-gold-300" />}
              text="Get status updates by email and SMS"
            />
            <Feature
              icon={<Wallet className="h-5 w-5 text-gold-300" />}
              text="View invoices, receipts and payment instructions"
            />
          </div>
        </div>
        <p className="text-xs text-navy-300">
          © {new Date().getFullYear()} Liberty Cargo Movers. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center px-6 py-10 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <LogoWordmark />
          </div>

          {success ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-navy-900">Account created</h2>
              <p className="mt-2 text-sm text-navy-500">
                Your account is ready — you can now sign in to start shipping with Liberty
                Cargo Movers.
              </p>
              <Link href="/login" className="mt-6 block">
                <Button className="w-full" size="lg">
                  Go to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-navy-900">Create your account</h2>
              <p className="mt-1 text-sm text-navy-500">
                Register as a customer to ship with Liberty Cargo Movers.
              </p>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                {error && <InfoBanner tone="warning">{error}</InfoBanner>}

                <Field label="Full name" required htmlFor="fullName">
                  <Input
                    id="fullName"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                  />
                </Field>

                <Field label="Phone" required htmlFor="phone">
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+233 20 000 0000"
                    required
                  />
                </Field>

                <Field label="Email" required htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Country" required htmlFor="country">
                    <Select
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                    >
                      {PILOT_COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="City" htmlFor="city">
                    <Input
                      id="city"
                      autoComplete="address-level2"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Accra"
                    />
                  </Field>
                </div>

                <Field label="Address" htmlFor="address">
                  <Input
                    id="address"
                    autoComplete="street-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, area or P.O. box"
                  />
                </Field>

                <Field label="Account type" required htmlFor="customerType">
                  <Select
                    id="customerType"
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value as CustomerType)}
                    required
                  >
                    {CUSTOMER_TYPE_ENTRIES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Password" required htmlFor="password" hint="At least 6 characters">
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </Field>

                  <Field label="Confirm password" required htmlFor="confirmPassword">
                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </Field>
                </div>

                <Button type="submit" className="w-full" loading={busy} size="lg">
                  Create account
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-navy-500">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-brand-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
        {icon}
      </span>
      <span className="text-navy-100">{text}</span>
    </div>
  );
}
