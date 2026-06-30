import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Your Shipment — Liberty & Liberty Logistics",
  description:
    "Enter your tracking number to follow your package live from intake to delivery — no login required. Air & ocean cargo to and from the USA, Ghana, China and worldwide.",
  alternates: { canonical: "/track" },
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
