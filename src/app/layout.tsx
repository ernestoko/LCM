import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { ToastProvider } from "@/components/ui";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Liberty Cargo Movers — Logistics Platform",
    template: "%s · Liberty Cargo Movers",
  },
  description:
    "Liberty Cargo Movers logistics platform — customer onboarding, SEAL-managed rate cards, shipment tracking, manifests, invoicing and reporting for the USA → Ghana cargo pilot.",
  manifest: "/manifest.webmanifest",
  applicationName: "Liberty Cargo Movers",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Liberty Cargo" },
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0f1b3d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
