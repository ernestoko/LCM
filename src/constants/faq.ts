/**
 * Frequently-asked-questions knowledge base.
 *
 * This is the single source of truth for BOTH the public `/faq` page and the
 * on-site chat assistant (`ChatWidget`) — the assistant searches these entries
 * to answer questions, so keep answers accurate, self-contained and friendly.
 * `keywords` help the assistant match a question to the right entry.
 */

export interface FaqItem {
  q: string;
  a: string;
  /** Extra match terms for the chat assistant (besides words in q/a). */
  keywords?: string[];
}

export interface FaqCategory {
  key: string;
  title: string;
  description?: string;
  items: FaqItem[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    key: "getting-started",
    title: "Getting started",
    description: "Open an account and understand how shipping with us works.",
    items: [
      {
        q: "How do I create an account?",
        a: "Tap “Create a customer account” on the sign-in page, or ask our team to set you up. Every shipment must be tied to a customer account, so registering first lets us issue you a personal warehouse suite address and keep all your packages, invoices and tracking in one place.",
        keywords: ["register", "sign up", "onboard", "open account", "new account"],
      },
      {
        q: "How does shipping with Liberty & Liberty Logistics work?",
        a: "It’s four simple steps: (1) Send your package to one of our warehouses or book a pickup. (2) We receive, weigh, photograph and inspect it. (3) We issue an invoice — you pay online. (4) We load it onto the next manifest, dispatch it, and you and your recipient get tracking updates all the way to delivery.",
        keywords: ["how it works", "process", "steps", "overview"],
      },
      {
        q: "Do you ship by air or by sea?",
        a: "Both. Air Cargo is fastest and is priced by weight — ideal for documents, electronics and urgent or lighter goods. Sea Cargo is the economical choice for bulky or heavy shipments and is priced by volume (CBM) or by standard units such as boxes and drums. Tell us what you’re sending and we’ll recommend the best option.",
        keywords: ["air", "sea", "ocean", "freight options", "cbm", "drum", "box"],
      },
      {
        q: "Where are you located?",
        a: "We operate fulfilment hubs in the USA (Houston, Newark and Atlanta), Ghana (Tema and Kumasi) and the UK (London). When you create an account you’re assigned a personal suite at our hubs so you can shop and ship to us directly.",
        keywords: ["location", "address", "warehouse", "hub", "office", "where"],
      },
    ],
  },
  {
    key: "sending",
    title: "Sending packages",
    description: "Forward to our warehouse, book a pickup, or combine packages.",
    items: [
      {
        q: "How do I send a package to your warehouse?",
        a: "From your dashboard choose “Ship to warehouse”, pick the hub you’re shipping to and pre-alert us with the carrier, tracking number and what’s inside. Address the package to your name plus your suite number so we can match it to your account the moment it arrives.",
        keywords: ["forward", "warehouse", "pre-alert", "suite", "ship to you", "send to warehouse"],
      },
      {
        q: "Can you pick the package up from me instead?",
        a: "Yes. Choose “Request pickup”, give us the pickup address, your preferred date and time window, and the package details. Our team confirms the slot and collects it from your door.",
        keywords: ["pickup", "collect", "door", "schedule pickup"],
      },
      {
        q: "Can I combine several packages into one shipment?",
        a: "Absolutely — it’s called consolidation. We can hold your incoming packages and combine them into a single shipment with one consolidated invoice. For sea and bulky cargo especially, consolidating lowers your overall cost.",
        keywords: ["consolidate", "combine", "merge", "group", "consolidation"],
      },
      {
        q: "What can’t I ship?",
        a: "Prohibited items vary by route and customs rules — typically hazardous materials, flammables, weapons, illegal goods and certain restricted foods or chemicals. Each route lists its prohibited items and required documents; if you’re unsure, just ask us before you send it.",
        keywords: ["prohibited", "restricted", "banned", "not allowed", "illegal"],
      },
    ],
  },
  {
    key: "pricing-payment",
    title: "Pricing & payment",
    description: "How shipments are priced and how to pay.",
    items: [
      {
        q: "How is the price calculated?",
        a: "Air Cargo is charged by weight (per pound) against our approved rate card for your route. Sea Cargo is charged by volume — per cubic metre (CBM) — or by standard units such as boxes and drums when that’s how your goods are packed. You always receive an itemised invoice before anything ships.",
        keywords: ["price", "cost", "rate", "charge", "how much", "quote", "pricing", "per lb", "per cbm"],
      },
      {
        q: "What payment methods do you accept?",
        a: "You can pay your invoice securely online with Paystack or PayPal. Payments reconcile automatically against your invoice, and your shipment moves forward as soon as payment is confirmed.",
        keywords: ["pay", "payment", "paystack", "paypal", "card", "mobile money"],
      },
      {
        q: "When do I have to pay?",
        a: "After we receive and assess your package we generate an invoice. Payment is required before the shipment is added to a dispatch manifest. You’ll get a notification the moment your invoice is ready, with your tracking number as the payment reference.",
        keywords: ["when pay", "before ship", "invoice timing"],
      },
      {
        q: "Can I get a quote before sending?",
        a: "Yes — tap “Get a Quote” or contact us with the route, approximate weight (for air) or dimensions/units (for sea) and what you’re shipping, and we’ll estimate the cost for you.",
        keywords: ["quote", "estimate", "how much", "pre-quote"],
      },
    ],
  },
  {
    key: "tracking",
    title: "Tracking & notifications",
    description: "Follow your shipment and keep recipients informed.",
    items: [
      {
        q: "How do I track my shipment?",
        a: "Use the “Track” button at the top of the site and enter your tracking number — no login required. You’ll see the live status and a full timeline from intake to delivery.",
        keywords: ["track", "where is my package", "status", "trace", "tracking number"],
      },
      {
        q: "Will my recipient be notified too?",
        a: "Yes. When a shipment is dispatched, both you (the sender) and your recipient are notified. Your recipient receives a standby alert and their own tracking link so they can follow the package and be ready to receive it.",
        keywords: ["recipient", "consignee", "receiver", "notify", "standby"],
      },
      {
        q: "What updates will I receive?",
        a: "We notify you at every milestone — package received, invoice ready, payment confirmed, added to manifest, dispatched, in transit, arrived, ready for pickup, out for delivery and delivered — by email and SMS (and WhatsApp where enabled).",
        keywords: ["updates", "notifications", "sms", "email", "whatsapp", "milestones"],
      },
    ],
  },
  {
    key: "delivery",
    title: "Delivery & collection",
    description: "Receiving your shipment at destination.",
    items: [
      {
        q: "How long does delivery take?",
        a: "Air Cargo is the fastest option and typically clears in days; Sea Cargo is more economical but takes longer — usually several weeks door-to-port. Each route shows its estimated transit time, and your tracking timeline keeps you updated throughout.",
        keywords: ["how long", "transit time", "delivery time", "duration", "eta"],
      },
      {
        q: "Do you deliver to the door or do I collect it?",
        a: "Both are available depending on your route — door-to-door delivery or collection from our destination hub. If you’re collecting, we’ll notify you when it’s ready for pickup; please bring a valid ID.",
        keywords: ["door to door", "collect", "pickup point", "delivery"],
      },
      {
        q: "What happens at customs?",
        a: "We handle customs clearing at destination on supported routes. Some goods need extra documents — each route lists what’s required, and we’ll let you know if anything is needed from you to clear your shipment quickly.",
        keywords: ["customs", "clearing", "clearance", "duty", "documents"],
      },
    ],
  },
  {
    key: "support",
    title: "Support",
    description: "Reach a human when you need one.",
    items: [
      {
        q: "How do I talk to a person?",
        a: "We’re happy to help. Call us, send an email, or message us on WhatsApp using the contact options below — or open a support ticket from your dashboard and we’ll follow up.",
        keywords: ["human", "agent", "support", "help", "contact", "talk", "call", "speak"],
      },
      {
        q: "Something’s wrong with my shipment — what do I do?",
        a: "Open a support ticket from the “Support” section of your dashboard with your tracking number and a short description. Our team investigates and keeps you updated until it’s resolved.",
        keywords: ["complaint", "problem", "issue", "damaged", "lost", "wrong"],
      },
    ],
  },
];

/** Flattened view of every FAQ, tagged with its category — used by the chat assistant. */
export const ALL_FAQS: (FaqItem & { category: string })[] = FAQ_CATEGORIES.flatMap((c) =>
  c.items.map((i) => ({ ...i, category: c.title })),
);
