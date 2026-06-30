import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Liberty & Liberty Logistics",
  description: "Sign in to your Liberty & Liberty Logistics account to manage shipments, invoices and operations.",
  // Staff/customer sign-in is not a content page — keep it out of search.
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
