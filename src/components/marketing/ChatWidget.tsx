"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Phone,
  Mail,
  PackageSearch,
  ExternalLink,
} from "lucide-react";
import { Eagle } from "@/components/brand/Eagle";
import { ALL_FAQS } from "@/constants/faq";
import { BUSINESS } from "@/constants/business";
import { WAREHOUSES } from "@/constants/warehouses";
import { cn } from "@/lib/utils/cn";
import {
  startVerification,
  confirmCode,
  fetchSensitiveShipment,
  type ChannelKind,
  type ChannelOption,
} from "@/lib/assistant/client";
import type { SensitiveShipment } from "@/lib/assistant/verification";

/* ------------------------------------------------------------------ */
/* Handoff contacts                                                    */
/* ------------------------------------------------------------------ */
const DIGITS = BUSINESS.phone.replace(/[^\d]/g, "");
const TEL = `tel:${BUSINESS.phone.replace(/[^\d+]/g, "")}`;
const MAIL = `mailto:${BUSINESS.email}`;
const WHATSAPP = `https://wa.me/${DIGITS}`;

const HANDOFF: ChatAction[] = [
  { label: "Call us", href: TEL, icon: "phone" },
  { label: "WhatsApp", href: WHATSAPP, icon: "external", external: true },
  { label: "Email", href: MAIL, icon: "mail" },
];

/* ------------------------------------------------------------------ */
/* Message + reply model                                               */
/* ------------------------------------------------------------------ */
interface ChatAction {
  label: string;
  href: string;
  external?: boolean;
  icon?: "phone" | "mail" | "track" | "external";
}
interface BotReply {
  text: string;
  actions?: ChatAction[];
  chips?: string[];
}
interface ChatMessage {
  id: number;
  from: "bot" | "user";
  text: string;
  actions?: ChatAction[];
  chips?: string[];
}

/** The assistant's name — shown in the header and used when she introduces herself. */
const ASSISTANT_NAME = "Jesselyn";

const GREETING_CHIPS = [
  "Track a package",
  "Shipping rates",
  "Air or sea?",
  "Where are you located?",
  "Talk to a human",
];

const GREETING: BotReply = {
  text: "Hi, I'm Jesselyn 👋 — your Liberty & Liberty Logistics assistant. I can track a shipment, explain air & sea pricing, set up a pickup or warehouse forwarding, answer customs questions, or connect you with a person. How can I help?",
  chips: GREETING_CHIPS,
};

/**
 * Proactive outreach: a few seconds after a visitor lands, Jesselyn pops a warm
 * teaser bubble above the launcher (with a brief "typing" beat for a human feel),
 * once per browser session. One opener is picked at random for variety.
 */
const PROACTIVE_OPENERS = [
  "Hi there! 👋 I'm Jesselyn. Shipping to Ghana — or anywhere — today? I can grab you a quick quote or track a package.",
  "Hey! 😊 Jesselyn here. Need a hand sending a package or getting a rate? I'm right here whenever you're ready.",
  "Welcome! 👋 I'm Jesselyn, your shipping assistant. Want me to track a parcel, compare air vs sea, or set up a pickup?",
];
const NUDGE_CHIPS = ["Get a quote", "Track a package", "Air or sea?"];
const NUDGE_DELAY_MS = 3500; // wait after landing before reaching out
const NUDGE_TYPING_MS = 1400; // show "typing…" for this long, then the message
const NUDGE_SEEN_KEY = "jesselyn-greeted"; // once per session

/* ------------------------------------------------------------------ */
/* Intent router                                                       */
/* ------------------------------------------------------------------ */
const TRACK_RE = /\b[A-Za-z]{2,5}-\d{2,}-?[A-Za-z0-9-]{3,}\b/;

/**
 * Account-/shipment-specific intents that reveal personal data (recipient
 * details, contents, declared value, invoice balance). These require identity
 * verification before Jesselyn will answer — see the verification flow below.
 * Deliberately excludes generic pricing words (quote/cost/rate) which are public.
 */
const SENSITIVE_RE =
  /\b(balance|owe|owing|outstanding|amount\s+(due|left|owing)|how much.*(do i|i)\s+(owe|left|due)|invoice|bill|receipt|recipient|receiver|delivery address|deliver(y|ed)?\s+to|what'?s? (inside|in (it|my))|contents|declared value|full details|all (the )?details|account details|my (shipment )?details|who('?s| is)? receiving)\b/i;

function isSensitiveRequest(text: string): boolean {
  return SENSITIVE_RE.test(text);
}

function has(text: string, ...words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

/** Label shown on the channel-choice chip, e.g. "Email · je•••@gmail.com". */
function channelChipLabel(c: ChannelOption): string {
  return `${c.kind === "email" ? "Email" : "Text"} · ${c.hint}`;
}

function money(currency: string, amount: number): string {
  const sym = currency === "USD" ? "$" : currency === "GHS" ? "GH₵" : `${currency} `;
  return `${sym}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Render a verified shipment into a friendly, readable summary for the chat. */
function formatSensitive(s: SensitiveShipment): string {
  const lines: string[] = [`🔓 Verified — here are the details for ${s.trackingNumber}:`];
  lines.push(`• Status: ${s.status.replace(/_/g, " ")}`);
  lines.push(`• Route: ${s.routeCode} (${s.originCountry} → ${s.destinationCountry})`);

  const r = s.receiver;
  const addr = [r.address, r.city, r.country].filter(Boolean).join(", ");
  lines.push(`• Recipient: ${r.name}${addr ? ` — ${addr}` : ""}${r.phone ? ` (${r.phone})` : ""}`);

  if (s.contents.length) {
    const items = s.contents
      .slice(0, 6)
      .map((i) => (i.quantity && i.quantity > 1 ? `${i.quantity}× ${i.description}` : i.description))
      .join(", ");
    lines.push(`• Contents: ${items}${s.contents.length > 6 ? "…" : ""}`);
  } else if (s.packageDescription) {
    lines.push(`• Contents: ${s.packageDescription}`);
  }

  if (typeof s.declaredValue === "number") lines.push(`• Declared value: $${s.declaredValue.toLocaleString()}`);
  const measures = [
    typeof s.pieces === "number" ? `${s.pieces} pc` : null,
    typeof s.weightLb === "number" ? `${s.weightLb} lb` : null,
    typeof s.totalCbm === "number" ? `${s.totalCbm} CBM` : null,
  ].filter(Boolean);
  if (measures.length) lines.push(`• Measurements: ${measures.join(" · ")}`);

  if (s.invoice) {
    const inv = s.invoice;
    lines.push(
      `• Invoice ${inv.invoiceNumber}: total ${money(inv.currency, inv.total)}, paid ${money(inv.currency, inv.amountPaid)}, balance ${money(inv.currency, inv.balanceDue)} (${inv.paymentStatus.replace(/_/g, " ")})`,
    );
  } else {
    lines.push(`• Payment: ${s.paymentStatus.replace(/_/g, " ")}`);
  }

  if (s.expectedDeliveryDate) lines.push(`• Estimated delivery: ${s.expectedDeliveryDate}`);
  lines.push("\nNeed anything else? I'm right here. — Jesselyn");
  return lines.join("\n");
}

/** Best-effort keyword search across the FAQ knowledge base. */
function searchFaq(norm: string): { q: string; a: string } | null {
  const words = norm.split(/\s+/).filter((w) => w.length > 2);
  let best: { q: string; a: string } | null = null;
  let bestScore = 0;
  for (const f of ALL_FAQS) {
    const hay = `${f.q} ${f.a} ${(f.keywords ?? []).join(" ")}`.toLowerCase();
    let score = 0;
    for (const w of words) if (hay.includes(w)) score += 1;
    for (const k of f.keywords ?? []) if (norm.includes(k)) score += 2;
    if (score > bestScore) {
      bestScore = score;
      best = { q: f.q, a: f.a };
    }
  }
  return bestScore >= 2 ? best : null;
}

/**
 * Jesselyn's "brain": a prioritised intent router covering the whole shipping
 * journey. The most specific intents are checked first; anything unmatched falls
 * through to a search of the FAQ knowledge base, then to a friendly catch-all.
 */
function getReply(input: string): BotReply {
  const norm = input.toLowerCase().trim();

  // A tracking number was pasted → take them straight to the tracker.
  const tn = input.match(TRACK_RE)?.[0];
  if (tn) {
    return {
      text: `Let's track ${tn}. Tap below for its live status and full timeline.`,
      actions: [{ label: `Track ${tn}`, href: `/track/${tn}`, icon: "track" }],
      chips: ["Talk to a human"],
    };
  }

  // Identity — who is Jesselyn?
  if (has(norm, "who are you", "your name", "what are you", "are you a bot", "are you human", "are you real", "who is this", "introduce yourself", "what's your name", "whats your name")) {
    return {
      text: "I'm Jesselyn, your virtual assistant at Liberty & Liberty Logistics 🦅. I help with tracking, air & sea pricing, pickups, warehouse forwarding, customs and anything about shipping between the USA, Ghana and beyond. Ask me anything — or I'll connect you with a teammate.",
      chips: ["What can you do?", "Track a package", "Talk to a human"],
    };
  }

  // Capabilities
  if (has(norm, "what can you do", "what do you do", "how can you help", "what can you help", "menu", "options", "capabilities")) {
    return {
      text:
        "Plenty! Here's where I can help:\n• 📦 Track a shipment\n• 🔒 Look up your shipment's details, contents & invoice balance — after a quick identity check\n• 💵 Quote air (per lb) & sea (per CBM, drums/boxes) pricing\n• 🚚 Book a pickup or set up warehouse forwarding\n• 🛃 Customs, duties, prohibited items & delivery times\n• 👤 Open a customer account\n• 📞 Hand you to a human anytime\nWhat would you like to do?",
      chips: GREETING_CHIPS,
    };
  }

  // Thanks / sign-off
  if (has(norm, "thank", "thanks", "thx", "appreciate", "cheers", "great help")) {
    return {
      text: "You're very welcome! 🙌 I'm always here if you need anything else. — Jesselyn",
      chips: ["Track a package", "Shipping rates", "Talk to a human"],
    };
  }

  // Human handoff
  if (has(norm, "human", "agent", "representative", "real person", "talk to", "speak", "someone", "whatsapp", "call you", "phone number", "contact you", "customer service", "support team")) {
    return {
      text: "Of course — here's how to reach a real teammate. They're happy to help, and I'll be right here when you're back. 😊",
      actions: [...HANDOFF, { label: "Contact page", href: "/contact", icon: "external" }],
    };
  }

  // Tracking (no number yet)
  if (has(norm, "track", "where is my", "status of my", "trace", "find my package", "my shipment", "my parcel", "my order")) {
    return {
      text: "Sure! Pop your tracking number in here and I'll pull it up, or open the full tracker — no login needed. It works in any case (upper or lower).",
      actions: [{ label: "Open tracker", href: "/track", icon: "track" }],
      chips: ["Talk to a human"],
    };
  }

  // Locations
  if (
    has(norm, "where are you", "located", "location", "your address", "office", "hub", "drop off", "drop-off", "branch") &&
    !has(norm, "ship to", "send to", "forward", "my address", "recipient")
  ) {
    const cities = WAREHOUSES.map((w) => `${w.flag} ${w.city}`).join(" · ");
    return {
      text: `We run fulfilment hubs in: ${cities}. Open an account and you get a personal suite at our warehouses so you can shop and ship to us directly.`,
      actions: [{ label: "See coverage", href: "/coverage", icon: "external" }],
      chips: ["Ship to your warehouse", "Shipping rates"],
    };
  }

  // Ship-to-warehouse / forwarding
  if (has(norm, "ship to your", "send to your", "forward", "pre-alert", "prealert", "suite", "warehouse address", "package forwarding", "shop and ship", "us address", "uk address")) {
    return {
      text: "Great choice! Sign in and pick “Ship to warehouse”. You'll get a hub address with your personal suite number — address your online orders to it and pre-alert me with the carrier + tracking number so we match your parcel the moment it lands.",
      actions: [{ label: "Ship to warehouse", href: "/login", icon: "external" }],
      chips: ["Request a pickup", "Shipping rates"],
    };
  }

  // Pickup
  if (has(norm, "pickup", "pick up", "collect from", "collection", "come get", "from my house", "from my home")) {
    return {
      text: "We can collect from your door. Sign in, choose “Request pickup”, share the address and a preferred date/time window, and we'll confirm the slot.",
      actions: [{ label: "Request a pickup", href: "/login", icon: "external" }],
      chips: ["Ship to your warehouse", "Talk to a human"],
    };
  }

  // Sea units — CBM, drums, boxes
  if (has(norm, "cbm", "cubic", "drum", "barrel", "by the box", "per box", "volume")) {
    return {
      text: "For sea cargo we charge by volume (CBM = length × width × height in metres) or by standard units: 200L drum, 100L half-drum/barrel, and small/medium/large boxes. Send loose cargo and we'll measure the CBM for you — and you can mix CBM cargo and units on one invoice.",
      actions: [{ label: "Sea cargo units", href: "/services", icon: "external" }],
      chips: ["Shipping rates", "Air or sea?", "Get a quote"],
    };
  }

  // Pricing / quotes
  if (has(norm, "price", "cost", "rate", "how much", "quote", "charge", "per pound", "per lb", "per kilo", "expensive", "cheap", "fee")) {
    return {
      text: "Air Cargo is priced by weight (per lb); Sea Cargo by volume (per CBM) or by standard drums/boxes. You always get an itemised invoice before anything ships. For a tailored quote, tell me your route, the weight or dimensions, and what's inside.",
      actions: [{ label: "Get a quote", href: "/contact", icon: "external" }],
      chips: ["Air or sea?", "Payment methods", "Talk to a human"],
    };
  }

  // Payment
  if (has(norm, "pay", "paystack", "paypal", "card", "mobile money", "momo", "invoice", "bank transfer")) {
    return {
      text: "You can pay your invoice securely online with Paystack or PayPal. Payments reconcile automatically and your shipment moves forward the moment payment is confirmed — just use your tracking number as the reference.",
      chips: ["Shipping rates", "When do I pay?", "Talk to a human"],
    };
  }

  // Air vs sea
  if (has(norm, "air or sea", "air vs", "vs sea", "by air", "by sea", "ocean", "vessel", "flight", "air freight", "sea freight", "fastest", "which is faster")) {
    return {
      text: "We ship both ways:\n✈️ Air — fastest, priced by weight, best for urgent or lighter goods.\n🚢 Sea — most economical for bulky/heavy cargo, priced by CBM or by drums/boxes.\nTell me what you're sending and I'll recommend the best fit.",
      chips: ["Shipping rates", "Get a quote", "Delivery time"],
    };
  }

  // Delivery / transit time
  if (has(norm, "how long", "delivery time", "transit", "how many days", "when will it arrive", "eta", "arrive", "how soon")) {
    return {
      text: "Air Cargo usually clears in a matter of days; Sea Cargo is more economical but takes several weeks (door-to-port). Each route shows its estimated transit time, and your tracking timeline updates at every milestone.",
      actions: [{ label: "Track a shipment", href: "/track", icon: "track" }],
      chips: ["Air or sea?", "Shipping rates"],
    };
  }

  // Customs / duties
  if (has(norm, "customs", "duty", "duties", "clearance", "clearing", "import tax", "import")) {
    return {
      text: "We handle customs clearing at destination on supported routes. Some goods need extra documents — each route lists what's required, and I'll flag anything needed from you to clear quickly. Duties/taxes depend on the destination and the goods.",
      chips: ["Prohibited items", "Delivery time", "Talk to a human"],
    };
  }

  // Prohibited / can I ship
  if (has(norm, "prohibit", "restricted", "banned", "can i ship", "can i send", "allowed", "illegal", "not allowed", "forbidden", "hazard")) {
    return {
      text: "Most everyday goods are fine. Prohibited items vary by route — typically hazardous materials, flammables, weapons, illegal goods and certain restricted foods/chemicals. Tell me the specific item and I'll guide you.",
      chips: ["Customs & duties", "Talk to a human"],
    };
  }

  // Consolidation
  if (has(norm, "consolidat", "combine", "multiple package", "merge", "group", "several parcels", "one shipment")) {
    return {
      text: "Yes! It's called consolidation — we hold your incoming packages and combine them into a single shipment with one consolidated invoice. For sea and bulky cargo especially, consolidating lowers your overall cost.",
      chips: ["Ship to your warehouse", "Shipping rates"],
    };
  }

  // Account / register
  if (has(norm, "account", "register", "sign up", "signup", "create account", "onboard", "open an account", "new customer", "join")) {
    return {
      text: "Opening an account takes a minute and gives you a personal warehouse suite plus one place for all your shipments, invoices and tracking. Every shipment needs an account first.",
      actions: [{ label: "Create an account", href: "/register", icon: "external" }],
      chips: ["How it works", "Ship to your warehouse"],
    };
  }

  // How it works
  if (has(norm, "how it works", "how does it work", "process", "get started", "first time", "new here", "the steps")) {
    return {
      text: "Four simple steps:\n1️⃣ Send your package to our warehouse or book a pickup.\n2️⃣ We receive, weigh/measure, photograph and inspect it.\n3️⃣ We invoice you — pay online.\n4️⃣ We ship it, and you and your recipient both get tracking to the door.",
      actions: [{ label: "Get started", href: "/register", icon: "external" }],
      chips: ["Shipping rates", "Air or sea?"],
    };
  }

  // Coverage / countries
  if (has(norm, "countries", "coverage", "where do you ship", "do you ship to", "destination", "ghana", "nigeria", "africa", "which country")) {
    return {
      text: "We move cargo to and from the USA and Ghana, with growing lanes across Africa, the UK and beyond. Tell me your origin and destination and I'll confirm the route and how it's priced.",
      actions: [{ label: "View coverage", href: "/coverage", icon: "external" }],
      chips: ["Shipping rates", "Get a quote"],
    };
  }

  // Insurance / lost / damaged
  if (has(norm, "insur", "lost", "damage", "broken", "protect", "missing", "claim")) {
    return {
      text: "We handle every shipment with care and photograph packages at intake. If something's wrong, open a support ticket from your dashboard with your tracking number and our team will investigate and make it right. For cover on high-value items, ask us before you ship.",
      actions: [...HANDOFF],
      chips: ["Track a package", "Talk to a human"],
    };
  }

  // Notifications / updates
  if (has(norm, "notif", "updates", "sms", "email alert", "alert", "recipient", "standby", "keep me posted")) {
    return {
      text: "You'll be notified at every milestone — received, invoiced, paid, dispatched, in transit, arrived, ready and delivered — by email and SMS (and WhatsApp where enabled). When a shipment ships, your recipient also gets a standby alert and their own tracking link.",
      chips: ["Track a package", "How it works"],
    };
  }

  // Greeting / smalltalk
  if (norm.length <= 16 && has(norm, "hi", "hey", "hello", "yo", "good morning", "good afternoon", "good evening", "start", "hiya", "howdy")) {
    return GREETING;
  }

  // Fall back to the FAQ knowledge base.
  const faq = searchFaq(norm);
  if (faq) {
    return {
      text: faq.a,
      actions: [{ label: "Browse all FAQs", href: "/faq", icon: "external" }],
      chips: ["Talk to a human"],
    };
  }

  // Friendly catch-all — stay helpful and on-brand.
  return {
    text: "I want to get this right — I'm Jesselyn, and I can help with tracking, pricing, pickups, warehouse forwarding, customs, delivery times, or getting you to a human. Could you rephrase, or pick one below?",
    actions: [{ label: "Browse FAQ", href: "/faq", icon: "external" }, ...HANDOFF],
    chips: GREETING_CHIPS,
  };
}

/* ------------------------------------------------------------------ */
/* Widget                                                              */
/* ------------------------------------------------------------------ */
export function ChatWidget({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, from: "bot", text: GREETING.text, chips: GREETING.chips },
  ]);
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Identity-verification flow (gates sensitive, account-specific answers).
  const [verify, setVerify] = useState<{
    stage: "idle" | "choosing" | "awaiting_code";
    trackingNumber?: string;
    channels?: ChannelOption[];
    kind?: ChannelKind;
    challengeId?: string;
    hint?: string;
  }>({ stage: "idle" });
  // Tracking number Jesselyn is currently talking about (for follow-up asks).
  const lastTn = useRef<string | null>(null);
  // Sensitive details we've already unlocked this session, keyed by tracking #.
  const verified = useRef<Map<string, { expiresAtMs: number; shipment: SensitiveShipment }>>(new Map());

  // Proactive outreach teaser shown above the launcher.
  const [nudge, setNudge] = useState<"hidden" | "typing" | "shown">("hidden");
  const [opener, setOpener] = useState("");

  // Auto-scroll to the newest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  // Clean up pending timers on unmount.
  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  // Jesselyn reaches out shortly after the visitor lands — once per session.
  useEffect(() => {
    if (open || defaultOpen) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(NUDGE_SEEN_KEY) === "1";
    } catch {
      // sessionStorage may be unavailable (private mode) — just greet anyway.
    }
    if (seen) return;
    setOpener(PROACTIVE_OPENERS[Math.floor(Math.random() * PROACTIVE_OPENERS.length)]);
    const t1 = setTimeout(() => setNudge("typing"), NUDGE_DELAY_MS);
    const t2 = setTimeout(() => setNudge("shown"), NUDGE_DELAY_MS + NUDGE_TYPING_MS);
    timers.current.push(t1, t2);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open, defaultOpen]);

  function markGreeted() {
    try {
      sessionStorage.setItem(NUDGE_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  /** Append a bot message (used by the async verification handlers). */
  function pushBot(text: string, extra?: { actions?: ChatAction[]; chips?: string[] }) {
    setMessages((m) => [
      ...m,
      { id: idRef.current++, from: "bot", text, actions: extra?.actions, chips: extra?.chips },
    ]);
  }

  /** Start verification for a tracking number — or answer instantly if already unlocked. */
  async function beginSensitive(tn: string) {
    const num = tn.toUpperCase();
    lastTn.current = num;

    const cached = verified.current.get(num);
    if (cached && cached.expiresAtMs > Date.now()) {
      pushBot(formatSensitive(cached.shipment), {
        actions: [{ label: "Open live tracker", href: `/track/${num}`, icon: "track" }],
        chips: ["Talk to a human"],
      });
      return;
    }

    setTyping(true);
    const r = await startVerification({ trackingNumber: num });
    setTyping(false);
    if (!r.ok) {
      setVerify({ stage: "idle" });
      pushBot(r.error, { actions: HANDOFF });
      return;
    }
    if (r.stage === "choose") {
      setVerify({ stage: "choosing", trackingNumber: num, channels: r.channels });
      pushBot(
        "Before I share personal details I need to confirm it's really you 🔒 — your privacy matters. Where should I send a 6-digit verification code?",
        { chips: r.channels.map(channelChipLabel) },
      );
    }
  }

  /** Deliver the code to the chosen channel (also used by "Resend code"). */
  async function chooseChannel(kind: ChannelKind) {
    const num = verify.trackingNumber;
    if (!num) return;
    setTyping(true);
    const r = await startVerification({ trackingNumber: num, channel: kind });
    setTyping(false);
    if (!r.ok) {
      pushBot(r.error, { chips: ["Talk to a human"] });
      return;
    }
    if (r.stage === "sent") {
      setVerify({ stage: "awaiting_code", trackingNumber: num, kind, challengeId: r.challengeId, hint: r.hint });
      const mins = Math.max(1, Math.round(r.expiresInSec / 60));
      pushBot(
        `Done ✅ I've sent a 6-digit code to ${r.hint}. Type it here and I'll unlock your shipment details. It expires in ${mins} minute${mins === 1 ? "" : "s"}.`,
        { chips: ["Resend code", "Talk to a human"] },
      );
      if (r.devCode) {
        // eslint-disable-next-line no-console
        console.info(`[assistant] dev OTP for ${num}: ${r.devCode}`);
      }
    }
  }

  /** Confirm the entered code and reveal the verified shipment detail. */
  async function submitCode(code: string) {
    const challengeId = verify.challengeId;
    if (!challengeId) return;
    setTyping(true);
    const r = await confirmCode({ challengeId, code });
    if (!r.ok) {
      setTyping(false);
      const outOfAttempts = r.attemptsLeft === 0;
      if (outOfAttempts) setVerify({ stage: "idle" });
      pushBot(r.error, { chips: outOfAttempts ? ["Talk to a human"] : ["Resend code", "Talk to a human"] });
      return;
    }
    const num = r.trackingNumber;
    const d = await fetchSensitiveShipment(num, r.token);
    setTyping(false);
    setVerify({ stage: "idle" });
    if (!d.ok) {
      pushBot(d.error, { chips: ["Talk to a human"] });
      return;
    }
    verified.current.set(num, { expiresAtMs: Date.now() + r.expiresInSec * 1000, shipment: d.shipment });
    pushBot(formatSensitive(d.shipment), {
      actions: [{ label: "Open live tracker", href: `/track/${num}`, icon: "track" }],
      chips: ["Talk to a human"],
    });
  }

  function send(raw: string) {
    const text = raw.trim();
    if (!text) return;
    setMessages((m) => [...m, { id: idRef.current++, from: "user", text }]);
    setInput("");
    const lc = text.toLowerCase();

    // --- An active verification dialogue takes priority ----------------------
    if (verify.stage === "choosing") {
      if (lc.startsWith("email")) return void chooseChannel("email");
      if (lc.startsWith("text") || lc.startsWith("sms")) return void chooseChannel("sms");
      // otherwise fall through — they asked something else.
    }
    if (verify.stage === "awaiting_code") {
      if (lc.includes("resend") && verify.kind) return void chooseChannel(verify.kind);
      const code = text.replace(/\D/g, "");
      if (code.length === 6) return void submitCode(code);
      // not a code → let them ask other things, fall through.
    }
    if (lc.includes("resend") && verify.kind) return void chooseChannel(verify.kind);

    const tn = text.match(TRACK_RE)?.[0];

    // --- Sensitive (account-specific) request → verify identity first --------
    if (isSensitiveRequest(text)) {
      const target = tn?.toUpperCase() || lastTn.current;
      if (!target) {
        setTyping(true);
        const t = setTimeout(() => {
          setTyping(false);
          pushBot(
            "I can pull that up once I know which shipment you mean — what's the tracking number? (It looks like LCM-2606-AB12CD.)",
            { chips: ["Talk to a human"] },
          );
        }, 360);
        timers.current.push(t);
        return;
      }
      void beginSensitive(target);
      return;
    }

    // --- A bare tracking number → take them to the public live tracker -------
    if (tn) {
      const num = tn.toUpperCase();
      lastTn.current = num;
      setTyping(true);
      const t = setTimeout(() => {
        setTyping(false);
        pushBot(`Got it — opening live tracking for ${num} now… 📦`);
        const t2 = setTimeout(() => router.push(`/track/${encodeURIComponent(num)}`), 650);
        timers.current.push(t2);
      }, 380);
      timers.current.push(t);
      return;
    }

    // --- Everything else → the local intent router ---------------------------
    setTyping(true);
    const reply = getReply(text);
    const t = setTimeout(() => {
      setTyping(false);
      setMessages((m) => [
        ...m,
        { id: idRef.current++, from: "bot", text: reply.text, actions: reply.actions, chips: reply.chips },
      ]);
    }, 480);
    timers.current.push(t);
  }

  /** Toggle the panel (from the launcher) and dismiss any proactive teaser. */
  function toggleOpen() {
    setNudge("hidden");
    markGreeted();
    setOpen((v) => !v);
  }

  /** Open the chat from the teaser bubble. */
  function openFromNudge() {
    setNudge("hidden");
    markGreeted();
    setOpen(true);
  }

  /** Dismiss the teaser without opening the chat. */
  function dismissNudge() {
    setNudge("hidden");
    markGreeted();
  }

  /** Open the chat from a teaser quick-reply and ask that question. */
  function nudgeSend(q: string) {
    setNudge("hidden");
    markGreeted();
    setOpen(true);
    send(q);
  }

  return (
    <>
      {/* Proactive outreach teaser — Jesselyn reaches out first */}
      <AnimatePresence>
        {!open && nudge !== "hidden" && (
          <motion.div
            key="nudge"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="fixed bottom-24 right-4 z-[60] w-[min(20rem,calc(100vw-2rem))] sm:right-6"
          >
            <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-lift">
            <div className="flex items-center gap-2 bg-gradient-to-r from-navy-900 to-brand-900 px-3 py-2 text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                <Eagle className="h-4 w-4" fill="#e6c44d" eyeFill="#0a1230" />
              </span>
              <span className="flex-1 text-xs font-semibold">{ASSISTANT_NAME}</span>
              <span className="flex items-center gap-1 text-[10px] text-navy-200">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> online
              </span>
              <button
                type="button"
                onClick={dismissNudge}
                aria-label="Dismiss"
                className="ml-1 rounded p-0.5 text-navy-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={openFromNudge}
              className="block w-full px-3.5 py-3 text-left"
            >
              {nudge === "typing" ? (
                <span className="inline-flex items-center gap-1 py-1">
                  <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
                </span>
              ) : (
                <span className="text-sm leading-relaxed text-navy-700">{opener}</span>
              )}
            </button>
            {nudge === "shown" && (
              <div className="flex flex-wrap gap-1.5 px-3.5 pb-3">
                {NUDGE_CHIPS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => nudgeSend(c)}
                    className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={open ? "Close chat" : `Chat with ${ASSISTANT_NAME}`}
        aria-expanded={open}
        className={cn(
          "fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lift transition-all hover:-translate-y-0.5 hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 sm:bottom-6 sm:right-6",
          open && "rotate-0",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-gold-400" />
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            role="dialog"
            aria-label={`Chat with ${ASSISTANT_NAME}`}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            style={{ transformOrigin: "bottom right" }}
            className="fixed bottom-24 right-4 z-[60] flex h-[min(70vh,560px)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-lift sm:right-6 sm:w-[384px]"
          >
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-navy-900 to-brand-900 px-4 py-3.5 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
              <Eagle className="h-6 w-6" fill="#e6c44d" eyeFill="#0a1230" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">{ASSISTANT_NAME}</p>
              <p className="flex items-center gap-1.5 text-xs text-navy-200">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Liberty &amp; Liberty assistant · online
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-lg p-1.5 text-navy-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-navy-50/40 px-4 py-4">
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}
              >
                <div className={cn("max-w-[85%] space-y-2")}>
                  <div
                    className={cn(
                      "whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-card",
                      m.from === "user"
                        ? "rounded-br-md bg-brand-600 text-white"
                        : "rounded-bl-md bg-white text-navy-700",
                    )}
                  >
                    {m.text}
                  </div>

                  {/* Action buttons */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {m.actions.map((a) => (
                        <ActionButton key={a.label} action={a} />
                      ))}
                    </div>
                  )}

                  {/* Quick-reply chips */}
                  {m.chips && m.chips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {m.chips.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => send(c)}
                          className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-card">
                  <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
                </div>
              </motion.div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-navy-100 bg-white px-3 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              aria-label="Type your message"
              className="min-w-0 flex-1 rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 outline-none placeholder:text-navy-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ActionButton({ action }: { action: ChatAction }) {
  const Icon =
    action.icon === "phone"
      ? Phone
      : action.icon === "mail"
        ? Mail
        : action.icon === "track"
          ? PackageSearch
          : ExternalLink;
  return (
    <a
      href={action.href}
      target={action.external ? "_blank" : undefined}
      rel={action.external ? "noopener noreferrer" : undefined}
      className="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-navy-800"
    >
      <Icon className="h-3.5 w-3.5 text-gold-400" />
      {action.label}
    </a>
  );
}

function Dot({ delay = "0s" }: { delay?: string }) {
  return (
    <span
      className="h-2 w-2 animate-bounce rounded-full bg-navy-300"
      style={{ animationDelay: delay }}
    />
  );
}
