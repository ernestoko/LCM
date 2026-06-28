"use client";

import { useEffect, useRef, useState } from "react";
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

const GREETING_CHIPS = [
  "Track a package",
  "Shipping rates",
  "Where are you located?",
  "Ship to your warehouse",
  "Talk to a human",
];

const GREETING: BotReply = {
  text: "Hi! 👋 I'm the Liberty assistant. I can help you track a shipment, understand pricing for air or sea, find our locations, or connect you with a person. What do you need?",
  chips: GREETING_CHIPS,
};

/* ------------------------------------------------------------------ */
/* Intent router                                                       */
/* ------------------------------------------------------------------ */
const TRACK_RE = /\b[A-Za-z]{2,5}-\d{2,}-?[A-Za-z0-9-]{3,}\b/;

function has(text: string, ...words: string[]): boolean {
  return words.some((w) => text.includes(w));
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

function getReply(input: string): BotReply {
  const norm = input.toLowerCase().trim();

  // 1. A tracking number was pasted → take them straight to the tracker.
  const tn = input.match(TRACK_RE)?.[0];
  if (tn) {
    return {
      text: `Let's track ${tn}. Tap below to see its live status and timeline.`,
      actions: [{ label: `Track ${tn}`, href: `/track/${tn}`, icon: "track" }],
    };
  }

  // 2. Human handoff
  if (
    has(norm, "human", "agent", "representative", "real person", "talk to", "speak", "someone") ||
    has(norm, "whatsapp", "call you", "phone number", "contact")
  ) {
    return {
      text: "Of course — here's how to reach our team directly. We're happy to help.",
      actions: [...HANDOFF, { label: "Contact page", href: "/contact", icon: "external" }],
    };
  }

  // 3. Tracking (no number yet)
  if (has(norm, "track", "where is my", "status of my", "trace", "find my package")) {
    return {
      text: "Sure! Enter your tracking number here and I'll pull it up, or open the full tracker. No login needed.",
      actions: [{ label: "Open tracker", href: "/track", icon: "track" }],
      chips: ["My shipment updates", "Talk to a human"],
    };
  }

  // 4. Locations
  if (has(norm, "where are you", "located", "location", "your address", "office", "hub") &&
      !has(norm, "ship", "send", "forward")) {
    const cities = WAREHOUSES.map((w) => `${w.flag} ${w.city}`).join(" · ");
    return {
      text: `We operate hubs in: ${cities}. When you open an account you get a personal suite at our warehouses so you can ship to us directly.`,
      actions: [{ label: "See coverage", href: "/coverage", icon: "external" }],
      chips: ["Ship to your warehouse", "Shipping rates"],
    };
  }

  // 5. Ship-to-warehouse / forwarding
  if (has(norm, "ship to your", "send to your", "forward", "pre-alert", "prealert", "suite", "warehouse address", "package forwarding")) {
    return {
      text: "Great — to ship to us, sign in and choose “Ship to warehouse”. You'll get a hub address with your personal suite number; address your package to it and pre-alert us with the carrier and tracking number so we match it instantly.",
      actions: [{ label: "Ship to warehouse", href: "/login", icon: "external" }],
      chips: ["Request a pickup", "Shipping rates"],
    };
  }

  // 6. Pickup
  if (has(norm, "pickup", "pick up", "collect from", "schedule a collection")) {
    return {
      text: "We can collect from your door. Sign in and choose “Request pickup”, give us the address plus a preferred date and time window, and we'll confirm the slot.",
      actions: [{ label: "Request a pickup", href: "/login", icon: "external" }],
      chips: ["Ship to your warehouse", "Talk to a human"],
    };
  }

  // 7. Pricing / quotes
  if (has(norm, "price", "cost", "rate", "how much", "quote", "charge", "cbm", "per pound", "per lb", "expensive")) {
    return {
      text: "Air Cargo is charged by weight (per pound); Sea Cargo is charged by volume (per CBM) or by standard units like boxes and drums. You always get an itemised invoice before anything ships. For a tailored quote, tell us your route, weight or dimensions, and contents.",
      actions: [{ label: "Get a quote", href: "/contact", icon: "external" }],
      chips: ["Air or sea?", "Payment methods", "Talk to a human"],
    };
  }

  // 8. Payment
  if (has(norm, "pay", "paystack", "paypal", "payment", "card", "mobile money")) {
    return {
      text: "You can pay your invoice securely online with Paystack or PayPal. Payments reconcile automatically and your shipment moves forward as soon as payment is confirmed.",
      chips: ["Shipping rates", "When do I pay?"],
    };
  }

  // 9. Air vs sea
  if (has(norm, "air", "sea", "ocean", "vessel", "flight")) {
    return {
      text: "We ship both ways. ✈️ Air Cargo is fastest and priced by weight — best for urgent or lighter goods. 🚢 Sea Cargo is the economical choice for bulky/heavy cargo and is priced by volume (CBM) or by boxes and drums. Tell us what you're sending and we'll recommend the best fit.",
      chips: ["Shipping rates", "Get a quote", "Talk to a human"],
    };
  }

  // 10. Greeting / smalltalk
  if (norm.length <= 12 && has(norm, "hi", "hey", "hello", "yo", "good morning", "good afternoon", "good evening", "start")) {
    return GREETING;
  }

  // 11. Fall back to the FAQ knowledge base
  const faq = searchFaq(norm);
  if (faq) {
    return { text: faq.a, actions: [{ label: "Browse all FAQs", href: "/faq", icon: "external" }], chips: ["Talk to a human"] };
  }

  // 12. Nothing matched
  return {
    text: "I'm not totally sure on that one — but I can help with tracking, pricing, locations, or get you to a human. You can also browse our full FAQ.",
    actions: [...HANDOFF, { label: "Browse FAQ", href: "/faq", icon: "external" }],
    chips: GREETING_CHIPS,
  };
}

/* ------------------------------------------------------------------ */
/* Widget                                                              */
/* ------------------------------------------------------------------ */
export function ChatWidget({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, from: "bot", text: GREETING.text, chips: GREETING.chips },
  ]);
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Auto-scroll to the newest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  // Clean up pending timers on unmount.
  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  function send(raw: string) {
    const text = raw.trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: idRef.current++, from: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
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

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Chat with us"}
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
      {open && (
        <div
          role="dialog"
          aria-label="Liberty assistant chat"
          className="fixed bottom-24 right-4 z-[60] flex h-[min(70vh,560px)] w-[calc(100vw-2rem)] animate-fade-up flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-lift sm:right-6 sm:w-[384px]"
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-navy-900 to-brand-900 px-4 py-3.5 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
              <Eagle className="h-6 w-6" fill="#e6c44d" eyeFill="#0a1230" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">Liberty Assistant</p>
              <p className="flex items-center gap-1.5 text-xs text-navy-200">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Online · replies instantly
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
              <div key={m.id} className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] space-y-2")}>
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-card",
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
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-card">
                  <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
                </div>
              </div>
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
        </div>
      )}
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
