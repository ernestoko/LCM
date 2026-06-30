import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a Customer Account — Liberty & Liberty Logistics",
  description:
    "Open a free Liberty & Liberty Logistics account to ship, track and manage invoices — with your own warehouse suite for forwarding from the USA, UK and China.",
  alternates: { canonical: "/register" },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
