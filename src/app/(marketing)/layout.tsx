import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: {
    default: "LCM Logistics — Global Logistics & International Shipping",
    template: "%s · LCM Logistics",
  },
  description:
    "LCM Logistics moves cargo to and from the USA, to and from Ghana, and across Africa and the world. Air freight, ocean freight, express parcel, door-to-door delivery, customs clearance, warehousing and e-commerce shipping — with real-time tracking.",
  openGraph: {
    title: "LCM Logistics — Global Logistics & International Shipping",
    description:
      "Air & ocean freight, express parcel, door-to-door, customs clearance and warehousing — shipping to and from the USA, Ghana, and worldwide.",
    siteName: "LCM Logistics",
    type: "website",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
