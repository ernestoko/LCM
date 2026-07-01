import type { Metadata } from "next";
import { PolicyPage } from "@/components/marketing";
import { BUSINESS } from "@/constants/business";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Liberty & Liberty Logistics collects, uses and protects your personal information when you use our website and shipping services.",
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="Your privacy matters to us. This policy explains what personal information we collect, how we use it, and the choices you have."
      updated="30 June 2026"
      sections={[
        {
          heading: "1. Who we are",
          paragraphs: [
            `${BUSINESS.name} is the controller of the personal information described in this policy. You can reach us about any privacy question using the contact details at the end of this page.`,
          ],
        },
        {
          heading: "2. Information we collect",
          paragraphs: ["We collect information you give us and information generated as you use our services, including:"],
          bullets: [
            "Contact and account details — your name, email, phone number, postal address and login credentials.",
            "Shipment details — sender and recipient information, package contents, weights, dimensions and tracking history.",
            "Billing information — invoices, payments and reconciliation records (we do not store full card numbers).",
            "Identity documents you upload for customs or verification, where required.",
            "Technical and usage data — privacy-first, aggregated site analytics such as pages viewed; we do not use third-party advertising trackers.",
          ],
        },
        {
          heading: "3. How we use your information",
          paragraphs: ["We use your information to:"],
          bullets: [
            "Provide quotes, book and operate your shipments, and deliver door-to-door.",
            "Process invoices and payments and keep accurate financial records.",
            "Send you tracking updates and service messages by email, SMS or WhatsApp where you have given us your details for that purpose.",
            "Comply with customs, export/import, tax and other legal obligations.",
            "Secure our platform, prevent fraud and improve our services.",
          ],
        },
        {
          heading: "4. Sharing your information",
          paragraphs: [
            "We share information only as needed to deliver your shipment and run our business — for example with carriers, customs authorities and brokers, payment processors, and the messaging providers that send your notifications. We require these partners to protect your data and use it only for the agreed purpose. We do not sell your personal information.",
          ],
        },
        {
          heading: "5. International transfers",
          paragraphs: [
            "Because we move cargo across borders, your information may be processed in countries other than your own, including the United States and Ghana. Where we transfer data internationally we take steps to ensure it remains protected in line with this policy and applicable law.",
          ],
        },
        {
          heading: "6. Data retention",
          paragraphs: [
            "We keep your information for as long as your account is active and as long as we need it to provide our services and meet legal, tax and customs record-keeping requirements. We then delete or anonymise it.",
          ],
        },
        {
          heading: "7. Your rights and choices",
          paragraphs: [
            "Subject to local law, you may request access to, correction of, or deletion of your personal information, and you can object to or restrict certain processing. You can update your account details at any time and opt out of non-essential messages. To exercise any of these rights, contact us using the details below.",
          ],
        },
        {
          heading: "8. Security",
          paragraphs: [
            "We use technical and organisational measures — including access controls, encryption in transit and strict security headers — to protect your information. No system is perfectly secure, but we work hard to keep your data safe and to respond quickly to any incident.",
          ],
        },
        {
          heading: "9. Changes to this policy",
          paragraphs: [
            "We may update this policy from time to time. The current version is always available on this page, with the date it was last updated shown above.",
          ],
        },
      ]}
      closing={
        <>
          To ask a question or exercise your privacy rights, email{" "}
          <a href={`mailto:${BUSINESS.email}`} className="font-semibold text-brand-700 hover:text-brand-800">
            {BUSINESS.email}
          </a>{" "}
          or call{" "}
          <a href={`tel:${BUSINESS.phone.replace(/[^\d+]/g, "")}`} className="font-semibold text-brand-700 hover:text-brand-800">
            {BUSINESS.phone}
          </a>
          .
        </>
      }
    />
  );
}
