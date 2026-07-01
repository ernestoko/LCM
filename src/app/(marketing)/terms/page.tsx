import type { Metadata } from "next";
import { PolicyPage } from "@/components/marketing";
import { BUSINESS } from "@/constants/business";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms governing your use of Liberty & Liberty Logistics shipping, freight, warehousing and tracking services.",
};

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="These terms govern your use of our website and the shipping, freight, warehousing and related services we provide. Please read them carefully before booking a shipment."
      updated="30 June 2026"
      sections={[
        {
          heading: "1. Acceptance of these terms",
          paragraphs: [
            `By accessing our website, requesting a quote, or shipping with ${BUSINESS.name} ("we", "us", "our"), you agree to these Terms of Service and our Privacy Policy. If you are using our services on behalf of a business, you confirm you are authorised to bind that business to these terms.`,
          ],
        },
        {
          heading: "2. Our services",
          paragraphs: [
            "We provide international and domestic logistics, including air and ocean freight, express parcel delivery, door-to-door collection and delivery, customs clearance support, warehousing, consolidation and e-commerce fulfilment, together with online tracking of your shipments.",
            "Quoted transit times and rates are estimates based on the information you provide. Final charges, routing and delivery dates may vary with actual weight, dimensions, customs processing, carrier schedules and conditions outside our control.",
          ],
        },
        {
          heading: "3. Booking and your responsibilities",
          paragraphs: ["When you book a shipment with us, you agree to:"],
          bullets: [
            "Provide accurate, complete sender and recipient details and an honest description, weight and value of the goods.",
            "Ensure the goods are not prohibited or restricted on the chosen lane (see our Prohibited Items policy) and are properly packed for transit.",
            "Obtain any licences, permits or documentation required to export or import the goods, and pay any duties, taxes and customs charges that apply.",
            "Pay all charges shown on your invoice by the due date.",
          ],
        },
        {
          heading: "4. Pricing, invoicing and payment",
          paragraphs: [
            "Prices are confirmed on your quote or invoice. We aim for transparent, all-in pricing with no hidden fees, but additional charges may apply for re-weighing, re-measurement, storage beyond free time, failed delivery attempts, customs inspections, or special handling.",
            "Invoices are payable by the due date stated. We may hold or delay release of a shipment until outstanding charges are paid.",
          ],
        },
        {
          heading: "5. Customs, duties and prohibited goods",
          paragraphs: [
            "You are responsible for ensuring your goods comply with the export and import rules of every country on the route. We may refuse, hold, return or lawfully dispose of any shipment that is prohibited, restricted, undeclared or that breaches applicable law. Duties, taxes and clearance fees are your responsibility unless your quote states otherwise.",
          ],
        },
        {
          heading: "6. Liability and claims",
          paragraphs: [
            "We handle every shipment with care, but to the maximum extent permitted by law our liability for loss of or damage to goods is limited to the lesser of the declared value or the limits set by the applicable carrier convention or our published tariff. We are not liable for indirect or consequential losses, or for delays, loss or damage caused by events beyond our reasonable control.",
            "Claims for loss or damage must be reported in writing as soon as reasonably possible and within the time limits set out in your shipping documents. Optional cargo insurance is available — ask us before you ship for goods of significant value.",
          ],
        },
        {
          heading: "7. Accounts and acceptable use",
          paragraphs: [
            "If you create an account, you are responsible for keeping your login credentials secure and for activity under your account. You agree not to misuse the website, attempt to gain unauthorised access, or use our services for any unlawful purpose.",
          ],
        },
        {
          heading: "8. Changes to these terms",
          paragraphs: [
            "We may update these terms from time to time. The version published on this page at the time you book applies to that shipment. Continued use of our services after an update means you accept the revised terms.",
          ],
        },
      ]}
      closing={
        <>
          Questions about these terms? Contact us at{" "}
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
