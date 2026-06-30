import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { ChatWidgetLazy } from "@/components/marketing/ChatWidgetLazy";
import { MotionProvider } from "@/components/marketing/motion/MotionProvider";

export const metadata: Metadata = {
  title: {
    default: "Liberty & Liberty Logistics — Global Logistics & International Shipping",
    template: "%s · Liberty & Liberty Logistics",
  },
  description:
    "Liberty & Liberty Logistics moves cargo to and from the USA, to and from Ghana, and across Africa and the world. Air freight, ocean freight, express parcel, door-to-door delivery, customs clearance, warehousing and e-commerce shipping — with real-time tracking.",
  openGraph: {
    title: "Liberty & Liberty Logistics — Global Logistics & International Shipping",
    description:
      "Air & ocean freight, express parcel, door-to-door, customs clearance and warehousing — shipping to and from the USA, Ghana, and worldwide.",
    siteName: "Liberty & Liberty Logistics",
    type: "website",
    images: ["/images/hero-port.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Liberty & Liberty Logistics — Global Logistics & International Shipping",
    description:
      "Air & ocean freight, express parcel, door-to-door, customs clearance and warehousing — to and from the USA, Ghana, and worldwide.",
    images: ["/images/hero-port.jpg"],
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
      <main className="flex-1">
        <MotionProvider>{children}</MotionProvider>
      </main>
      <MarketingFooter />
      <ChatWidgetLazy />
    </div>
  );
}
