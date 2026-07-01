import type { Metadata } from "next";
import { PolicyPage } from "@/components/marketing";
import { BUSINESS } from "@/constants/business";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "How Liberty & Liberty Logistics books, prices, transports and delivers your shipments — pickup, transit times, customs, delivery and claims.",
};

export default function ShippingPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Shipping Policy"
      intro="This policy explains how we book, price, move and deliver your shipments, and what to expect at each step from pickup to delivery."
      updated="30 June 2026"
      sections={[
        {
          heading: "1. Booking and pickup",
          paragraphs: [
            "You can request a quote online or through our team. Once your booking is confirmed, we arrange collection at your origin or you can drop off at one of our hubs. We inspect and, where helpful, consolidate your goods, then prepare the export documentation.",
          ],
        },
        {
          heading: "2. Rates and how we price",
          paragraphs: [
            "Air and express shipments are priced on the greater of actual or volumetric (dimensional) weight. Ocean freight is priced by volume (CBM) or container. Service fees, customs charges and special handling, where they apply, are shown clearly on your quote and invoice. We aim for transparent, all-in pricing with no hidden fees.",
          ],
        },
        {
          heading: "3. Transit times",
          paragraphs: [
            "Transit times depend on the lane and mode. As a general guide:",
          ],
          bullets: [
            "Express parcels: typically a few business days on major lanes.",
            "Air freight: typically 3–8 business days depending on origin, destination and clearance.",
            "Ocean freight: typically 18–38 days depending on ports, routing and customs.",
          ],
        },
        {
          heading: "4. Tracking and updates",
          paragraphs: [
            "Every shipment receives a unique tracking number at booking. You can follow its status and milestones at any time on our Track page, and we send proactive updates by email, SMS or WhatsApp where you have provided those details.",
          ],
        },
        {
          heading: "5. Customs clearance",
          paragraphs: [
            "We support customs clearance on both sides of the shipment, but accurate paperwork and an honest declaration of contents and value are essential. Duties, taxes and clearance fees are the responsibility of the importer unless your quote states otherwise. Delays caused by customs inspections or incomplete documentation are outside our control.",
          ],
        },
        {
          heading: "6. Delivery",
          paragraphs: [
            "We deliver door-to-door or to a nominated collection point. Someone should be available to receive and sign for the goods. If delivery cannot be completed, we will attempt to contact you to reschedule; additional attempts, storage or return may incur charges.",
          ],
        },
        {
          heading: "7. Storage and free time",
          paragraphs: [
            "Goods held at our warehouse benefit from a free storage period. Beyond that period, or where a consignment cannot be delivered or collected, storage charges may apply. We will let you know before charges begin where we reasonably can.",
          ],
        },
        {
          heading: "8. Insurance, loss and claims",
          paragraphs: [
            "Standard liability is limited as set out in our Terms of Service. We strongly recommend optional cargo insurance for goods of significant value — ask us before you ship. Any claim for loss or damage must be reported promptly and within the time limits in your shipping documents so we can investigate.",
          ],
        },
        {
          heading: "9. Prohibited and restricted goods",
          paragraphs: [
            "Some goods cannot be carried, or can only be carried under specific conditions. Please review our Prohibited Items policy and check with us before booking if you are unsure whether your goods are allowed on a particular lane.",
          ],
        },
      ]}
      closing={
        <>
          Need help with a shipment? Email{" "}
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
