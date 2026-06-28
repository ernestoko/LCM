"use client";

import { LogoWordmark } from "@/components/brand/Logo";
import { Card, CardBody } from "@/components/ui";
import { Terminal, KeyRound, Database, Rocket } from "lucide-react";

/** Shown when Firebase env vars are missing so the app never hard-crashes. */
export default function SetupPage() {
  const steps = [
    {
      icon: KeyRound,
      title: "1 · Create a Firebase project",
      body: "Go to console.firebase.google.com, create a project, and enable Authentication (Email/Password), Firestore Database, and Storage.",
    },
    {
      icon: Terminal,
      title: "2 · Add environment variables",
      body: "Copy .env.local.example to .env.local and fill in your Firebase web config (NEXT_PUBLIC_*) and the Admin SDK service-account values.",
    },
    {
      icon: Database,
      title: "3 · Deploy rules & seed data",
      body: "Run `firebase deploy --only firestore:rules,storage:rules` then `npm run seed` to create the Super Admin, operations rate cards and the Ghana route.",
    },
    {
      icon: Rocket,
      title: "4 · Start the app",
      body: "Run `npm run dev` and sign in with the Super Admin credentials printed by the seed script.",
    },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-50 px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex justify-center">
          <LogoWordmark />
        </div>
        <Card>
          <CardBody>
            <h1 className="text-xl font-bold text-navy-900">Finish setting up your platform</h1>
            <p className="mt-1 text-sm text-navy-500">
              Firebase isn&apos;t configured yet. Complete these steps, then refresh this page.
            </p>

            <div className="mt-6 space-y-4">
              {steps.map((s) => (
                <div key={s.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-navy-900">{s.title}</h3>
                    <p className="mt-0.5 text-sm text-navy-600">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg bg-navy-900 p-4 font-mono text-xs text-navy-100">
              <p className="text-navy-400"># Quick start</p>
              <p>cp .env.local.example .env.local</p>
              <p># …fill in your Firebase keys…</p>
              <p>npm install</p>
              <p>npm run seed</p>
              <p>npm run dev</p>
            </div>
          </CardBody>
        </Card>
        <p className="mt-4 text-center text-xs text-navy-400">
          See <span className="font-medium">SETUP.md</span> for the full deployment guide.
        </p>
      </div>
    </div>
  );
}
