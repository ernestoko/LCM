import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { ToastProvider } from "@/components/ui";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://libertylogistics.com"),
  title: {
    default: "Liberty & Liberty Logistics — Global Logistics & International Shipping",
    template: "%s · Liberty & Liberty Logistics",
  },
  description:
    "Liberty & Liberty Logistics moves cargo to and from the USA, to and from Ghana, and across Africa and the world — air & ocean freight, express parcel, door-to-door delivery, customs clearance and warehousing, with real-time tracking and transparent pricing.",
  manifest: "/manifest.webmanifest",
  applicationName: "Liberty & Liberty Logistics",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Liberty" },
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
