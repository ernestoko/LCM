import { ALL_FAQS } from "@/constants/faq";
import { KNOWLEDGE } from "@/constants/knowledge";
import { buildDynamicKnowledge } from "@/lib/assistant/dynamicKnowledge";

/**
 * Jesselyn's local "brain": a pure, dependency-free retrieval matcher over the
 * combined FAQ + extended knowledge base. It normalises the question, expands a
 * few common synonyms, and scores every entry by keyword/phrase/token overlap,
 * returning the best answer above a confidence threshold (or null, so the caller
 * can fall back to the optional LLM layer or a friendly catch-all).
 *
 * Being pure and deterministic, it's fully unit-tested and never hallucinates —
 * it can only ever return an answer that a human wrote in the knowledge base.
 */

export interface KbItem {
  id: string;
  q: string;
  a: string;
  topic: string;
  keywords: string[];
}

export interface BrainAnswer extends KbItem {
  score: number;
  confidence: "high" | "medium";
}

/**
 * Single, deduped corpus the matcher searches: curated static knowledge +
 * self-updating data-derived knowledge + the public FAQ. The dynamic entries
 * keep facts (hubs, sea units, contacts, the status pipeline) current with zero
 * AI and zero hand-editing.
 */
export const CORPUS: KbItem[] = [
  ...KNOWLEDGE.map((k) => ({ id: k.id, q: k.q, a: k.a, topic: k.topic, keywords: k.keywords })),
  ...buildDynamicKnowledge().map((k) => ({ id: k.id, q: k.q, a: k.a, topic: k.topic, keywords: k.keywords })),
  ...ALL_FAQS.map((f, i) => ({
    id: `faq-${i}`,
    q: f.q,
    a: f.a,
    topic: f.category,
    keywords: f.keywords ?? [],
  })),
];

/**
 * Synonym groups — any word on the right is treated as also implying the token
 * on the left, so a question worded differently still matches the right entry.
 */
const SYNONYMS: Record<string, string[]> = {
  price: ["cost", "costs", "rate", "rates", "charge", "charges", "fee", "fees", "pricing", "expensive", "cheap", "cheaper", "afford"],
  quote: ["estimate", "ballpark", "howmuch"],
  package: ["parcel", "parcels", "box", "boxes", "carton", "goods", "item", "items", "cargo", "stuff", "shipment", "consignment"],
  send: ["ship", "shipping", "mail", "post", "dispatch", "deliver", "forwarding"],
  air: ["plane", "flight", "fly", "flying", "airfreight"],
  sea: ["ocean", "vessel", "boat", "container", "seafreight"],
  fast: ["quick", "quickest", "urgent", "express", "rush", "speedy", "soonest"],
  cheap: ["cheapest", "economical", "affordable", "lowest"],
  track: ["tracking", "trace", "locate", "status", "where", "follow", "whereabouts"],
  customs: ["clearance", "clearing", "clear", "duty", "duties", "tax", "taxes", "import"],
  pickup: ["collect", "collection"],
  warehouse: ["suite", "hub", "forwarding", "mailbox"],
  payment: ["pay", "paystack", "paypal", "momo", "card"],
  electronics: ["phone", "phones", "laptop", "laptops", "battery", "batteries", "gadget", "device", "powerbank"],
  food: ["foodstuff", "foodstuffs", "groceries", "perishable", "perishables"],
  vehicle: ["car", "cars", "automobile", "motorbike", "motorcycle", "truck"],
  lost: ["missing", "lost", "disappeared"],
  damaged: ["damage", "broken", "spoilt", "spoiled"],
  drum: ["drums", "barrel", "barrels"],
  cbm: ["volume", "cubic", "volumetric"],
  account: ["register", "signup", "onboard"],
  human: ["agent", "representative", "person", "someone", "staff", "rep"],
};

/** Words too common to carry meaning — ignored as tokens. */
const STOP = new Set([
  "the", "a", "an", "is", "are", "do", "does", "can", "could", "would", "will", "i", "you", "we",
  "my", "me", "to", "of", "and", "or", "for", "in", "on", "with", "how", "what", "when",
  "it", "this", "that", "your", "our", "be", "have", "has", "get", "got", "any", "much", "many",
  "please", "want", "need", "about", "from", "by", "at", "as", "if", "so", "but",
]);

/** Lowercase, de-accent fancy quotes, strip punctuation, collapse whitespace. */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[‘’“”]/g, "'")
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Meaningful tokens from the input, with synonym canonicals folded in. */
function tokenize(norm: string): Set<string> {
  const tokens = new Set<string>();
  for (const raw of norm.split(" ")) {
    const w = raw.replace(/'/g, "");
    if (w.length < 3 || STOP.has(w)) continue;
    tokens.add(w);
    for (const [canonical, group] of Object.entries(SYNONYMS)) {
      if (w === canonical || group.includes(w)) tokens.add(canonical);
    }
  }
  return tokens;
}

/** Pre-normalised haystacks, computed once. */
const HAYSTACKS = CORPUS.map((item) => ({
  item,
  q: normalize(item.q),
  text: normalize(`${item.q} ${item.a} ${item.keywords.join(" ")}`),
  keywords: item.keywords.map((k) => normalize(k)).filter(Boolean),
}));

/**
 * Document frequency of each keyword across the corpus. A single word that
 * appears as a keyword in only one or two entries (cbm, paystack, drum, vehicle)
 * is "specific" — confident on its own. A common word (sea, ship, package) is
 * not, so it needs corroboration before it can match. This is what stops an
 * off-topic sentence that happens to contain "sea" from matching a sea entry.
 */
const KEYWORD_DF = new Map<string, number>();
for (const h of HAYSTACKS) {
  for (const k of new Set(h.keywords)) KEYWORD_DF.set(k, (KEYWORD_DF.get(k) ?? 0) + 1);
}
/**
 * Everyday English words that are corpus-rare but still ambiguous (they show up
 * in off-topic sentences like "a poem about the sea"). They never count as a
 * specific signal on their own — they need a second hit to corroborate intent.
 */
const COMMON = new Set([
  "air", "sea", "box", "boxes", "ship", "send", "food", "car", "cars", "water",
  "money", "fast", "slow", "big", "small", "open", "close", "time", "help",
]);
function isSpecific(kw: string): boolean {
  if (kw.includes(" ")) return true; // a multi-word phrase is a specific intent
  if (COMMON.has(kw)) return false; // ambiguous everyday word — needs corroboration
  return (KEYWORD_DF.get(kw) ?? 0) <= 2; // a rare domain word is specific
}

const THRESHOLD = 3;

/**
 * Score and return the single best knowledge entry for a question, or null when
 * nothing clears the confidence bar. A match is only accepted when it has either
 * a specific signal (a phrase or a rare keyword) or breadth (≥2 distinct hits),
 * so a lone common word never produces a confident — and wrong — answer.
 */
export function searchKnowledge(input: string): BrainAnswer | null {
  const norm = normalize(input);
  if (!norm) return null;
  const tokens = tokenize(norm);

  let best: (BrainAnswer & { ok: boolean }) | null = null;

  for (const h of HAYSTACKS) {
    let score = 0;
    let signals = 0;
    let specific = false;
    const matched = new Set<string>();

    // 1. Keyword/phrase hits (the primary signal).
    for (const kw of h.keywords) {
      if (!kw || !norm.includes(kw)) continue;
      matched.add(kw);
      const sp = isSpecific(kw);
      score += kw.includes(" ") ? 5 : sp ? 3 : 2;
      signals += 1;
      if (sp) specific = true;
    }

    // 2. Token overlap (synonym-expanded), not double-counting keywords above.
    for (const t of tokens) {
      if (matched.has(t)) continue;
      if (h.keywords.includes(t)) {
        score += 2;
        signals += 1;
        if (isSpecific(t)) specific = true;
      } else {
        let hit = false;
        if (h.text.includes(t)) { score += 1; hit = true; }
        if (h.q.includes(t)) { score += 1; hit = true; }
        if (hit) signals += 1;
      }
    }

    const ok = score >= THRESHOLD && (specific || signals >= 2);
    if (ok && score > (best?.score ?? 0)) {
      best = { ...h.item, score, confidence: score >= 6 ? "high" : "medium", ok };
    }
  }

  if (!best) return null;
  const { ok: _ok, ...answer } = best;
  return answer;
}

/** Up to `n` distinct suggested questions related to the input (for chips). */
export function relatedQuestions(input: string, n = 3): string[] {
  const norm = normalize(input);
  const tokens = tokenize(norm);
  if (tokens.size === 0) return [];
  const scored = HAYSTACKS.map((h) => {
    let s = 0;
    for (const t of tokens) if (h.text.includes(t)) s += 1;
    return { q: h.item.q, s };
  })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  const out: string[] = [];
  for (const x of scored) {
    if (!out.includes(x.q)) out.push(x.q);
    if (out.length >= n) break;
  }
  return out;
}
