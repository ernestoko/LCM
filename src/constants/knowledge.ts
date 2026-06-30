/**
 * Jesselyn's extended knowledge base.
 *
 * This is a deeper, more granular companion to the public FAQ (`faq.ts`). The
 * on-site assistant searches BOTH sources, so these entries let her answer a far
 * wider range of questions — specific items, packaging, customs, sea units,
 * claims, warehouse forwarding and general logistics knowledge — without ever
 * inventing facts. Keep answers accurate, friendly and self-contained; use
 * placeholders for anything rate-specific (prices change and live on the rate
 * card). `keywords` are the primary match signal, so list real synonyms.
 *
 * These entries are also flattened into the grounding context handed to the
 * optional Claude-backed layer (see lib/assistant/knowledgeContext), so good
 * coverage here makes BOTH brains smarter.
 */

export interface KnowledgeEntry {
  id: string;
  topic: string;
  q: string;
  a: string;
  keywords: string[];
}

export const KNOWLEDGE: KnowledgeEntry[] = [
  // ---- Company & services -------------------------------------------------
  {
    id: "company-overview",
    topic: "Company",
    q: "Who is Liberty & Liberty Logistics?",
    a: "Liberty & Liberty Logistics is an international shipping and logistics company moving cargo to and from the USA, to and from Ghana, sourcing from China, and across Africa and the wider world. We handle air freight, ocean freight, door-to-door delivery, customs clearance, warehousing and e-commerce fulfilment — all tracked end to end.",
    keywords: ["who is liberty", "about liberty", "about the company", "what is liberty", "company background", "tell me about you"],
  },
  {
    id: "services-list",
    topic: "Services",
    q: "What services do you offer?",
    a: "We offer: ✈️ Air Cargo (fast, priced by weight), 🚢 Sea Cargo (economical, priced by CBM or by drums/boxes), 🚚 door-to-door delivery, 🛃 customs clearance, 🏬 warehousing & package forwarding (your own suite address), 📦 consolidation, and 🛒 e-commerce fulfilment for online sellers. Tell me what you need and I'll point you the right way.",
    keywords: ["services", "offer", "what do you do", "solutions", "capabilities", "freight"],
  },
  {
    id: "express-option",
    topic: "Services",
    q: "Do you offer express or urgent shipping?",
    a: "Yes — for time-sensitive goods, Air Cargo is the fastest option and usually clears within days. If you have a hard deadline, tell us the route and the date you need it by and we'll recommend the quickest service for your shipment.",
    keywords: ["express", "urgent", "fast", "rush", "priority", "overnight", "quick", "asap", "deadline"],
  },
  {
    id: "ecommerce-sellers",
    topic: "Services",
    q: "Do you help online sellers / e-commerce?",
    a: "Absolutely. Online sellers use us to receive stock at our warehouses, store it, and fulfil orders to customers — plus consolidate inbound purchases from US/UK/China stores. If you sell on social media, a marketplace or your own store, we can be your fulfilment and shipping arm.",
    keywords: ["ecommerce", "e-commerce", "online seller", "marketplace", "fulfilment", "fulfillment", "dropship", "store", "business shipping"],
  },
  {
    id: "china-sourcing",
    topic: "Coverage",
    q: "Do you ship from China? (China to USA, Ghana, Nigeria…)",
    a: "Yes — China is one of our key sourcing hubs. We move cargo from China to the USA, to Ghana, to Nigeria and to other African destinations (and back the other way), by air for speed or by sea for the best price on bulky goods. You can buy from Chinese suppliers or marketplaces (1688, Alibaba, Taobao), ship to our China hub, and we'll consolidate, clear customs and deliver. Tell me your route and what you're importing and I'll point you the right way.",
    keywords: ["china", "from china", "china to usa", "china to ghana", "china to nigeria", "guangzhou", "shenzhen", "yiwu", "alibaba", "1688", "taobao", "import from china", "china to africa", "ghana to china"],
  },

  // ---- Air vs Sea ---------------------------------------------------------
  {
    id: "air-vs-sea",
    topic: "Air vs Sea",
    q: "Should I ship by air or by sea?",
    a: "Choose ✈️ Air when speed matters or the goods are light/valuable (documents, electronics, urgent items) — it's priced by weight. Choose 🚢 Sea when the goods are bulky or heavy and you want the lowest cost — it's priced by volume (CBM) or by standard drums/boxes. Tell me what you're sending and its rough size/weight and I'll suggest the best fit.",
    keywords: ["air or sea", "which is better", "compare", "difference", "vs", "choose", "recommend mode"],
  },
  {
    id: "fcl-lcl",
    topic: "Sea Cargo",
    q: "What's the difference between FCL and LCL?",
    a: "FCL (Full Container Load) means you book a whole container — best for large volumes. LCL (Less than Container Load) means your cargo shares a container with others and you only pay for the space you use (by CBM or by units) — ideal for smaller sea shipments. Most personal and small-business sea cargo goes LCL.",
    keywords: ["fcl", "lcl", "container", "full container", "shared container", "groupage"],
  },

  // ---- Sea units & CBM ----------------------------------------------------
  {
    id: "what-is-cbm",
    topic: "Sea Cargo",
    q: "What is CBM and how is it measured?",
    a: "CBM means cubic metre — the volume your cargo takes up. We calculate it as length × width × height in metres (or in centimetres ÷ 1,000,000) for each piece, then add them up. For example a 100 × 50 × 50 cm box is 0.25 CBM. Send us loose cargo and we'll measure the CBM for you at intake.",
    keywords: ["cbm", "cubic", "volume", "measure", "calculate cbm", "how to measure", "dimensions"],
  },
  {
    id: "sea-units",
    topic: "Sea Cargo",
    q: "What standard units can I ship by sea (drums, boxes)?",
    a: "For sea cargo you can ship by standard units instead of measuring CBM: a 200-litre drum, a 100-litre half-drum/barrel, and small / medium / large boxes — each charged at a flat per-unit rate. You can also mix loose CBM-measured cargo and standard units on the same shipment and one invoice.",
    keywords: ["drum", "barrel", "box", "boxes", "200l", "100l", "units", "per box", "per drum"],
  },
  {
    id: "drum-sizes",
    topic: "Sea Cargo",
    q: "What size are the drums and boxes?",
    a: "The common units are a 200-litre drum (the large standard barrel), a 100-litre half-drum/barrel, and small, medium and large boxes. If your goods don't fit a standard unit, no problem — we just measure the CBM. Ask our team for the exact box dimensions for your route.",
    keywords: ["drum size", "box size", "barrel size", "dimensions of drum", "how big"],
  },

  // ---- Pricing & payment --------------------------------------------------
  {
    id: "pricing-model",
    topic: "Pricing",
    q: "How is pricing worked out?",
    a: "Air Cargo is priced by weight (per pound) and Sea Cargo by volume (per CBM) or by standard drums/boxes, always against our approved rate card for your route. Larger, lighter air shipments may be charged on volumetric (dimensional) weight. You always get an itemised invoice before anything ships — no surprises.",
    keywords: ["price", "pricing", "cost", "rate", "charge", "how much", "fees", "tariff"],
  },
  {
    id: "volumetric-weight",
    topic: "Pricing",
    q: "What is volumetric (dimensional) weight?",
    a: "For air cargo, very light but bulky items can be charged on volumetric weight — a figure based on the package's size rather than its actual weight — and we bill whichever is greater. It stops a big, light box from shipping for almost nothing. We'll always show you which weight was used on your invoice.",
    keywords: ["volumetric", "dimensional", "dim weight", "chargeable weight", "bulky light"],
  },
  {
    id: "get-quote",
    topic: "Pricing",
    q: "Can I get a price quote?",
    a: "Yes. For an accurate quote tell me: the route (from/to), whether it's air or sea, and either the weight (air) or the dimensions/units (sea), plus what's inside. I can guide you, or you can tap “Get a quote” to send the details to our team and we'll come back with a price.",
    keywords: ["quote", "estimate", "how much will it cost", "pricing for", "ballpark", "price for"],
  },
  {
    id: "payment-methods",
    topic: "Payment",
    q: "How can I pay?",
    a: "You can pay your invoice securely online with Paystack or PayPal (card and mobile money are supported through Paystack). Use your tracking number as the payment reference so it reconciles automatically — your shipment then moves forward the moment payment is confirmed.",
    keywords: ["pay", "payment", "paystack", "paypal", "card", "mobile money", "momo", "bank transfer", "how to pay"],
  },
  {
    id: "when-pay",
    topic: "Payment",
    q: "When do I pay?",
    a: "After we receive and assess your package we send you an invoice. Payment is due before the shipment is loaded onto a dispatch manifest — so paying promptly keeps your cargo on the next departure. You'll be notified the moment your invoice is ready.",
    keywords: ["when pay", "before ship", "deposit", "upfront", "pay first", "timing"],
  },
  {
    id: "refunds",
    topic: "Payment",
    q: "Can I get a refund?",
    a: "If you've paid for a shipment that hasn't been dispatched and your plans change, contact our team with your tracking number — we'll review it case by case. Once cargo is in transit, refunds depend on the situation. Open a support ticket and we'll help.",
    keywords: ["refund", "money back", "cancel payment", "reverse", "overcharged"],
  },
  {
    id: "currency",
    topic: "Payment",
    q: "What currency are invoices in?",
    a: "Invoices are issued in the currency set for your route (typically USD for US-origin cargo, or GHS where applicable). The currency and the full breakdown are shown on every invoice.",
    keywords: ["currency", "usd", "dollars", "cedis", "ghs", "what currency"],
  },

  // ---- Timelines ----------------------------------------------------------
  {
    id: "transit-time",
    topic: "Delivery",
    q: "How long does shipping take?",
    a: "Air Cargo is the fastest and usually clears within days (door-to-port), while Sea Cargo is more economical but takes several weeks. Customs clearance and final delivery add a little more depending on the route. Each route shows its estimated transit time and your tracking timeline updates at every milestone.",
    keywords: ["how long", "transit", "delivery time", "duration", "how many days", "eta", "when arrive", "timeframe"],
  },
  {
    id: "processing-time",
    topic: "Delivery",
    q: "How long before my package is processed after it arrives at your warehouse?",
    a: "We aim to receive, weigh/measure, photograph and invoice incoming packages within a short window of arrival, then notify you. From there it's ready to move as soon as your invoice is paid and the next manifest departs.",
    keywords: ["processing", "how long at warehouse", "received how long", "intake time", "after arrival"],
  },

  // ---- Customs & duties ---------------------------------------------------
  {
    id: "customs-clearance",
    topic: "Customs",
    q: "Do you handle customs clearance?",
    a: "Yes — on supported routes we clear your shipment through customs at destination. Some goods need extra paperwork (like an invoice, ID or a permit); each route lists what's required and we'll flag anything we need from you so your cargo clears quickly.",
    keywords: ["customs", "clearance", "clearing", "clear", "broker", "border", "import"],
  },
  {
    id: "duties-taxes",
    topic: "Customs",
    q: "Will I pay import duties or taxes?",
    a: "Duties and taxes depend on the destination country and what you're shipping — they're set by customs, not by us. For supported routes we'll let you know what to expect and can advise on the documents needed. Some low-value or personal-effects shipments attract little or no duty.",
    keywords: ["duty", "duties", "tax", "taxes", "import tax", "vat", "tariff customs", "levy"],
  },
  {
    id: "customs-documents",
    topic: "Customs",
    q: "What documents do I need for customs?",
    a: "Commonly a commercial/proforma invoice or receipt for the goods, the recipient's ID, and for certain goods a permit or certificate (for example food, cosmetics, pharmaceuticals or electronics in some countries). We'll tell you exactly what your route and goods require before you ship.",
    keywords: ["documents", "paperwork", "invoice for customs", "permit", "certificate", "id required", "declaration"],
  },

  // ---- Prohibited / restricted -------------------------------------------
  {
    id: "prohibited-general",
    topic: "Prohibited",
    q: "What items can't I ship?",
    a: "Generally prohibited: hazardous or flammable materials, explosives, weapons and ammunition, illegal drugs, counterfeit goods, and large amounts of cash. Restricted (case-by-case, may need permits): lithium batteries, aerosols, alcohol, medication, perishable foods, chemicals and some electronics. Tell me the exact item and I'll check it for you.",
    keywords: ["prohibited", "restricted", "banned", "not allowed", "can i ship", "can i send", "illegal", "forbidden", "allowed"],
  },
  {
    id: "ship-batteries",
    topic: "Prohibited",
    q: "Can I ship phones, laptops or lithium batteries?",
    a: "Electronics like phones and laptops ship fine, but items with lithium batteries are regulated — especially by air. Devices with the battery installed are usually fine; loose/spare batteries and power banks are restricted by air and may need to go by sea. Tell us the item and we'll advise the right mode.",
    keywords: ["battery", "batteries", "lithium", "power bank", "phone", "laptop", "electronics", "powerbank"],
  },
  {
    id: "ship-food",
    topic: "Prohibited",
    q: "Can I ship food or foodstuffs?",
    a: "Many dry, packaged and non-perishable foods can ship (often by sea), but perishables and some agricultural items are restricted and may need permits or be barred by destination customs. Tell me the specific food item and route and I'll guide you.",
    keywords: ["food", "foodstuff", "groceries", "perishable", "snacks", "dry food", "agricultural"],
  },
  {
    id: "ship-vehicle",
    topic: "Prohibited",
    q: "Can you ship a car or vehicle?",
    a: "Vehicles and large machinery typically ship by sea and need extra documentation (title, bill of sale) and destination-specific clearance. Contact our team with the vehicle details and route and we'll arrange a tailored quote and the paperwork.",
    keywords: ["car", "vehicle", "automobile", "motorbike", "machinery", "engine", "truck", "ship a car"],
  },

  // ---- Packaging ----------------------------------------------------------
  {
    id: "packaging-tips",
    topic: "Packaging",
    q: "How should I pack my items?",
    a: "Use a sturdy box, cushion fragile items with bubble wrap or padding, fill empty space so nothing shifts, and seal it well with strong tape. Label it with your name and suite number. For sea cargo, robust packaging matters more because of handling — drums and crates protect heavy goods best.",
    keywords: ["pack", "packaging", "packing", "wrap", "box my items", "how to pack", "protect"],
  },
  {
    id: "fragile-items",
    topic: "Packaging",
    q: "Can I ship fragile or valuable items?",
    a: "Yes — pack fragile items well (padding on all sides, “fragile” marked) and tell us at intake so we handle them with extra care. For high-value goods, ask us about cover before you ship and declare the correct value so it's properly recorded.",
    keywords: ["fragile", "breakable", "valuable", "delicate", "glass", "high value", "expensive item"],
  },
  {
    id: "weight-limits",
    topic: "Packaging",
    q: "Is there a weight or size limit per package?",
    a: "There's no strict limit, but very heavy or oversized single pieces may need special handling (and usually go by sea). If a box is extremely heavy, split it or use a drum/crate. Tell us the weight and dimensions and we'll advise the best way to send it.",
    keywords: ["weight limit", "maximum weight", "size limit", "too heavy", "oversized", "max"],
  },

  // ---- Warehouse forwarding ----------------------------------------------
  {
    id: "suite-address",
    topic: "Warehouse",
    q: "How does the warehouse / suite address work?",
    a: "When you open an account you get a personal suite number at our hubs. Shop from any US/UK store and ship to that hub address with your name + suite number on it. Pre-alert us with the carrier and tracking number, and we match the parcel to your account the moment it lands, then forward it to you.",
    keywords: ["suite", "warehouse address", "forwarding", "us address", "uk address", "shop and ship", "package forwarding", "mailbox", "ship to your warehouse"],
  },
  {
    id: "shop-us-stores",
    topic: "Warehouse",
    q: "Can I shop from Amazon / US stores and ship through you?",
    a: "Yes — that's exactly what the warehouse suite is for. Buy from Amazon, eBay, Shein, any US or UK retailer, and have it delivered to your suite address. We receive it, consolidate if you like, and ship it on to you. Just pre-alert us so we know it's coming.",
    keywords: ["amazon", "ebay", "shein", "us store", "uk store", "online shopping", "buy", "shop", "retailer"],
  },
  {
    id: "prealert",
    topic: "Warehouse",
    q: "What is a pre-alert and why do it?",
    a: "A pre-alert is a quick heads-up you give us — the carrier (e.g. USPS/UPS), the tracking number and what's inside — for a package on its way to your suite. It lets us match the parcel to your account instantly when it arrives, so nothing sits unidentified.",
    keywords: ["pre-alert", "prealert", "pre alert", "notify incoming", "expecting package"],
  },

  // ---- Consolidation ------------------------------------------------------
  {
    id: "consolidation",
    topic: "Consolidation",
    q: "Can you combine my packages to save money?",
    a: "Yes — it's called consolidation. We hold your incoming packages and combine them into one shipment with a single invoice. Because pricing favours volume (especially by sea), consolidating several parcels usually lowers your total cost versus shipping each one separately.",
    keywords: ["consolidate", "consolidation", "combine", "merge", "group packages", "save money", "bundle"],
  },

  // ---- Tracking -----------------------------------------------------------
  {
    id: "how-track",
    topic: "Tracking",
    q: "How do I track my package?",
    a: "Tap “Track” at the top of the site and enter your tracking number — no login needed, and it works in any case (upper or lower). You'll see the live status and the full timeline from intake to delivery. If you paste your tracking number to me here, I'll take you straight to it.",
    keywords: ["track", "tracking", "where is my package", "status", "trace", "follow", "locate"],
  },
  {
    id: "tracking-format",
    topic: "Tracking",
    q: "What does a tracking number look like?",
    a: "Your tracking number looks like LCM-2606-AB12CD — a short prefix, some digits and a few letters. You'll find it on your intake confirmation, your invoice and your notifications. Paste it to me and I'll pull up the status.",
    keywords: ["tracking number format", "what does tracking look like", "find tracking", "reference number"],
  },
  {
    id: "recipient-tracking",
    topic: "Tracking",
    q: "Will the person receiving the package get tracking too?",
    a: "Yes. When a shipment is dispatched, your recipient gets their own standby alert and tracking link (by email/SMS) so they can follow it and be ready to receive — without needing an account.",
    keywords: ["recipient track", "receiver", "consignee", "they track", "standby"],
  },

  // ---- Account / identity / security -------------------------------------
  {
    id: "create-account",
    topic: "Account",
    q: "How do I open an account and why do I need one?",
    a: "Tap “Create a customer account” on the sign-in page (it takes a minute). Every shipment is tied to an account, which gives you a personal warehouse suite and one place for all your shipments, invoices and tracking. You can also ask our team to set you up.",
    keywords: ["account", "register", "sign up", "create account", "open account", "why account", "join"],
  },
  {
    id: "verify-identity",
    topic: "Security",
    q: "Why do you ask me to verify before showing my details?",
    a: "To protect your privacy 🔒. Anyone can track public status, but to reveal personal details — recipient address, contents or your invoice balance — I first send a one-time code to the email or phone on your shipment and you enter it here. That way only you (not a bot or a stranger) can see your information.",
    keywords: ["verify", "verification", "identity", "code", "otp", "security", "privacy", "why code", "confirm it's me"],
  },
  {
    id: "data-privacy",
    topic: "Security",
    q: "Is my information safe with you?",
    a: "Yes. Public tracking only ever shows masked, non-personal status. Personal details are protected behind an identity check (a one-time code to your contact on file), access is role-controlled internally, and we never expose your contact details on the public tracker.",
    keywords: ["privacy", "data", "safe", "secure", "gdpr", "information protected", "confidential"],
  },

  // ---- Claims / problems --------------------------------------------------
  {
    id: "lost-damaged",
    topic: "Claims",
    q: "My package is lost or damaged — what do I do?",
    a: "I'm sorry to hear that. We photograph packages at intake, so open a support ticket from your dashboard with your tracking number and a short description (and photos if you have them). Our team investigates and keeps you updated until it's resolved. For high-value goods, ask us about cover before shipping next time.",
    keywords: ["lost", "damaged", "broken", "missing", "claim", "complaint", "problem", "damage", "didn't arrive"],
  },
  {
    id: "insurance",
    topic: "Claims",
    q: "Do you offer insurance / cover?",
    a: "For valuable shipments you can ask us about cover before you ship — declare the correct value so it's recorded. We handle every package with care and document its condition at intake. Mention high-value items up front and we'll advise your options.",
    keywords: ["insurance", "insured", "cover", "coverage", "protect", "protection", "liability"],
  },

  // ---- Delivery / collection ---------------------------------------------
  {
    id: "delivery-collection",
    topic: "Delivery",
    q: "Do you deliver to my door or do I collect?",
    a: "Both are available depending on the route — door-to-door delivery, or collection from our destination hub. If you're collecting, we'll notify you when it's ready for pickup; please bring a valid ID (and authorisation if collecting on someone's behalf).",
    keywords: ["door to door", "delivery", "collect", "pickup point", "collection", "deliver to me", "hub pickup"],
  },
  {
    id: "change-address",
    topic: "Delivery",
    q: "Can I change the delivery address or recipient?",
    a: "If the shipment hasn't been dispatched yet we can usually update the delivery details — contact our team or open a ticket with your tracking number as soon as possible. Once it's in transit, changes may not be possible, so let us know early.",
    keywords: ["change address", "wrong address", "update recipient", "redirect", "change delivery"],
  },

  // ---- Pickups ------------------------------------------------------------
  {
    id: "book-pickup",
    topic: "Pickup",
    q: "Can you collect the package from me?",
    a: "Yes — sign in and choose “Request pickup”, give us the address and a preferred date/time window, and we'll confirm the slot and collect from your door. Pickup availability depends on your location; we'll let you know when we confirm.",
    keywords: ["pickup", "pick up", "collect from me", "collection from home", "come get", "door pickup"],
  },

  // ---- Contact / hours ----------------------------------------------------
  {
    id: "contact-hours",
    topic: "Contact",
    q: "How do I reach a human, and what are your hours?",
    a: "You can call us, email, or message us on WhatsApp using the contact options here — or open a support ticket from your dashboard for anything account-specific. Our team responds during business hours and as quickly as we can outside them.",
    keywords: ["contact", "human", "agent", "phone", "email", "whatsapp", "hours", "open", "support", "speak to someone", "talk to a person"],
  },

  // ---- General logistics knowledge ---------------------------------------
  {
    id: "what-is-manifest",
    topic: "Logistics",
    q: "What is a manifest?",
    a: "A manifest is the list of all the packages loaded onto a single departure (a flight or a container/vessel). When your package is “added to a manifest” it means it's been grouped for the next dispatch — you'll get a notification, and dispatch follows once the manifest departs.",
    keywords: ["manifest", "what is manifest", "added to manifest", "loading list"],
  },
  {
    id: "what-is-waybill",
    topic: "Logistics",
    q: "What is a waybill?",
    a: "A waybill is the shipping document that travels with your cargo — it records the sender, receiver, contents and route. We generate one for your shipment; you don't need to create it yourself.",
    keywords: ["waybill", "bill of lading", "shipping document", "consignment note"],
  },
  {
    id: "what-is-hs-code",
    topic: "Logistics",
    q: "What is an HS code?",
    a: "An HS (Harmonised System) code is an international number that classifies a product for customs, which helps determine duties. For most personal shipments you don't need to know it — customs and our clearing team handle classification. For commercial cargo we can help identify the right codes.",
    keywords: ["hs code", "harmonised", "harmonized", "tariff code", "classification", "commodity code"],
  },

  // ---- Sector jargon & acronyms (explained simply for clients) ------------
  {
    id: "jargon-bol-awb",
    topic: "Jargon",
    q: "What is a Bill of Lading (B/L) or Air Waybill (AWB)?",
    a: "Both are the official transport contract + receipt for your cargo. A Bill of Lading (B/L or BOL) is used for sea freight; an Air Waybill (AWB) is its equivalent for air freight. They record the shipper, consignee, goods and route. We generate the right one for your shipment — you don't create it yourself.",
    keywords: ["bill of lading", "bol", "b/l", "air waybill", "awb", "transport document", "shipping contract"],
  },
  {
    id: "jargon-consignee",
    topic: "Jargon",
    q: "What do consignee, consignor and shipper mean?",
    a: "The shipper / consignor is the person sending the goods (usually you). The consignee is the person receiving them at destination. So on your shipment, you're the shipper and your recipient is the consignee — both get tracking once it's dispatched.",
    keywords: ["consignee", "consignor", "shipper", "sender vs receiver", "who is consignee"],
  },
  {
    id: "jargon-incoterms",
    topic: "Jargon",
    q: "What are Incoterms (EXW, FOB, CIF, DDP)?",
    a: "Incoterms are standard international trade terms that say who pays for and is responsible for the goods at each stage. Common ones: EXW (you handle everything from the seller's door), FOB (seller delivers to the port of origin), CIF (cost, insurance & freight to destination port), and DDP (delivered duty paid — all the way to the door, duties included). For personal shipping you rarely need these; for commercial cargo we'll advise the right term.",
    keywords: ["incoterms", "exw", "fob", "cif", "ddp", "ddu", "trade terms", "delivery terms"],
  },
  {
    id: "jargon-demurrage",
    topic: "Jargon",
    q: "What are demurrage and detention charges?",
    a: "These are fees that arise when a container or its contents sit too long. Demurrage is charged when cargo stays at the port/terminal beyond the free days; detention is charged when a container is held outside the terminal too long before being returned. We manage clearance promptly to avoid them, and we'll flag anything that could trigger a charge.",
    keywords: ["demurrage", "detention", "storage charge", "port charges", "free days", "container fees"],
  },
  {
    id: "jargon-eta-etd",
    topic: "Jargon",
    q: "What do ETA and ETD mean?",
    a: "ETD is the Estimated Time of Departure (when your shipment is expected to leave origin) and ETA is the Estimated Time of Arrival (when it's expected to reach destination). Your tracking timeline shows the latest estimates and updates them at each milestone.",
    keywords: ["eta", "etd", "estimated arrival", "estimated departure", "estimated time"],
  },
  {
    id: "jargon-pod",
    topic: "Jargon",
    q: "What is POD (Proof of Delivery)?",
    a: "POD means Proof of Delivery — the confirmation we capture when your shipment is handed over, which can include the recipient's name, a signature and a photo. It's recorded on your shipment so there's a clear record that it arrived.",
    keywords: ["pod", "proof of delivery", "delivery confirmation", "signature", "delivered proof"],
  },
  {
    id: "jargon-weights",
    topic: "Jargon",
    q: "What's the difference between gross, net and tare weight?",
    a: "Net weight is the goods alone; tare weight is the packaging/container; gross weight is the two together (net + tare). Air cargo is charged on the greater of gross weight or volumetric weight. We weigh everything at intake and show it on your invoice.",
    keywords: ["gross weight", "net weight", "tare weight", "weight difference", "chargeable weight"],
  },
  {
    id: "jargon-freight-forwarder",
    topic: "Jargon",
    q: "What is a freight forwarder?",
    a: "A freight forwarder organises the movement of goods on your behalf — booking air/sea space, handling documents, customs and the legs in between — so you deal with one partner instead of many. That's a big part of what we do for you, end to end.",
    keywords: ["freight forwarder", "forwarder", "what do you do", "logistics provider", "3pl"],
  },
  {
    id: "jargon-customs-broker",
    topic: "Jargon",
    q: "What is a customs broker / clearing agent?",
    a: "A customs broker (clearing agent) is licensed to clear goods through customs — preparing the declaration, classifying goods and paying duties on your behalf so your shipment is released. On supported routes we handle clearing for you.",
    keywords: ["customs broker", "clearing agent", "customs agent", "broker", "clearing house"],
  },
  {
    id: "jargon-container-sizes",
    topic: "Jargon",
    q: "What are 20ft and 40ft containers / TEU?",
    a: "Sea cargo moves in standard steel containers — a 20-foot (about 33 CBM usable) or a 40-foot (about 67 CBM usable). TEU means Twenty-foot Equivalent Unit, the industry's way of counting container capacity (a 40ft = 2 TEU). For LCL you don't book a whole container — you just pay for the space your cargo uses.",
    keywords: ["20ft", "40ft", "container size", "teu", "twenty foot", "forty foot", "container capacity"],
  },
  {
    id: "jargon-door-port",
    topic: "Jargon",
    q: "What do door-to-door, door-to-port and port-to-port mean?",
    a: "They describe how far we carry your cargo. Port-to-port goes between the two ports/airports (you arrange the ends). Door-to-port collects from your door and delivers to the destination port for you to clear/collect. Door-to-door is the full service — from your sender's door all the way to the recipient's door. We'll tell you what's available on your route.",
    keywords: ["door to door", "door to port", "port to port", "service level", "how far do you deliver"],
  },
  {
    id: "jargon-groupage",
    topic: "Jargon",
    q: "What is groupage / co-loading?",
    a: "Groupage (also called co-loading or consolidation) means combining several customers' cargo into one container so everyone shares the cost and only pays for the space they use. It's how LCL sea freight works and it's what makes smaller sea shipments affordable.",
    keywords: ["groupage", "co-load", "coloading", "shared container", "consolidation sea", "lcl groupage"],
  },
  {
    id: "jargon-documents",
    topic: "Jargon",
    q: "What is a commercial invoice, proforma invoice or packing list?",
    a: "A commercial invoice states what's being shipped and its value (used by customs to assess duty); a proforma invoice is a preliminary version before final sale; a packing list details how the goods are packed (boxes, weights, contents). For most personal shipments a simple receipt is enough — we'll tell you if your route needs more.",
    keywords: ["commercial invoice", "proforma", "pro forma", "packing list", "shipping documents", "invoice for goods"],
  },
  {
    id: "jargon-last-mile",
    topic: "Jargon",
    q: "What is last-mile delivery?",
    a: "Last-mile delivery is the final leg — getting your shipment from our destination hub to the recipient's door. It's the part customers feel most, so on door-to-door routes we manage it for you and notify the recipient ahead of arrival.",
    keywords: ["last mile", "last-mile", "final delivery", "final leg", "to the door"],
  },
  {
    id: "jargon-transhipment",
    topic: "Jargon",
    q: "What is transhipment?",
    a: "Transhipment is when your cargo is transferred from one vessel/aircraft to another at an intermediate hub on the way to its destination, rather than going direct. It's normal on many routes and your tracking still follows the shipment through each leg.",
    keywords: ["transhipment", "transshipment", "transfer", "connecting", "intermediate port", "indirect"],
  },
];

/** Flattened, common-shaped view for the matcher (FAQ + extended knowledge). */
export const KNOWLEDGE_TOPICS = Array.from(new Set(KNOWLEDGE.map((k) => k.topic)));
