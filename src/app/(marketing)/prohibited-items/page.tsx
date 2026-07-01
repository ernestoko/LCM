import type { Metadata } from "next";
import { PolicyPage } from "@/components/marketing";
import { BUSINESS } from "@/constants/business";

export const metadata: Metadata = {
  title: "Prohibited & Restricted Items",
  description:
    "Goods that cannot be shipped, or can only be shipped under conditions, with Liberty & Liberty Logistics. Check before you book.",
};

export default function ProhibitedItemsPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Prohibited & Restricted Items"
      intro="To keep cargo, people and our network safe — and to comply with customs and carrier rules — some goods cannot be shipped, and others can only be shipped under specific conditions. Always check with us before booking if you are unsure."
      updated="30 June 2026"
      sections={[
        {
          heading: "Prohibited items (never accepted)",
          paragraphs: [
            "We cannot carry the following on any lane. This list is not exhaustive — local laws on the route may prohibit additional items:",
          ],
          bullets: [
            "Illegal drugs, narcotics and controlled substances.",
            "Firearms, ammunition, explosives, fireworks and weapons.",
            "Counterfeit goods and items that infringe intellectual property rights.",
            "Currency, bullion, negotiable instruments and other cash equivalents.",
            "Live animals and human or animal remains.",
            "Hazardous, toxic, radioactive or environmentally harmful materials not declared and handled under the proper dangerous-goods process.",
            "Pornographic or obscene material, and any item whose shipment is illegal at the origin, transit or destination country.",
          ],
        },
        {
          heading: "Restricted items (accepted under conditions)",
          paragraphs: [
            "The following can usually be shipped, but only with the right documentation, packaging, declarations or licences. Tell us in advance so we can confirm what is required on your specific lane:",
          ],
          bullets: [
            "Lithium batteries and devices containing them — subject to dangerous-goods rules and packing requirements.",
            "Perishable food and temperature-sensitive goods — subject to proper packaging and lane suitability.",
            "Alcohol and tobacco — subject to licences, duties and destination restrictions.",
            "Pharmaceuticals, cosmetics and supplements — subject to regulatory approval and labelling.",
            "Aerosols, paints, perfumes and other flammable consumer goods — subject to quantity limits and declarations.",
            "High-value items, electronics and jewellery — we recommend declaring the full value and adding cargo insurance.",
            "Plants, seeds and agricultural products — subject to phytosanitary certificates and import permits.",
          ],
        },
        {
          heading: "Your responsibility",
          paragraphs: [
            "You are responsible for accurately declaring the contents and value of your shipment and for ensuring the goods are permitted on the chosen route. We may inspect, refuse, hold, return or lawfully dispose of any shipment that is prohibited, restricted without the required documentation, undeclared, or that breaches applicable law — and you remain responsible for any resulting charges.",
          ],
        },
        {
          heading: "Not sure? Ask first",
          paragraphs: [
            "Rules vary by country and change over time. If you have any doubt about whether your goods can be shipped, contact us before you book and we will confirm exactly what is allowed on your lane and what documentation you need.",
          ],
        },
      ]}
      closing={
        <>
          Check an item before you ship: email{" "}
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
