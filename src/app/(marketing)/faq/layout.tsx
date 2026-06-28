import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — Liberty & Liberty Logistics",
  description:
    "Answers to common questions about shipping by air and sea, pricing, tracking, payment, customs and delivery with Liberty & Liberty Logistics.",
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
