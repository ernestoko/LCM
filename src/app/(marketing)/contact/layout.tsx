import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Get a Quote",
  description:
    "Get a fast, transparent shipping quote or reach the Liberty & Liberty Logistics team — air & ocean freight, parcels, door-to-door delivery and warehousing to and from the USA, Ghana and worldwide.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
