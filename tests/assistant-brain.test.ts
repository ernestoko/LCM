import { describe, it, expect } from "vitest";
import { normalize, searchKnowledge, relatedQuestions, CORPUS } from "@/lib/assistant/brain";

describe("normalize", () => {
  it("lowercases, removes punctuation and collapses whitespace", () => {
    expect(normalize("  How  MUCH?? ")).toBe("how much");
  });
  it("folds curly quotes to straight", () => {
    expect(normalize("what’s the price")).toBe("what's the price");
  });
});

describe("searchKnowledge — in-domain questions", () => {
  const cases: { q: string; topic: string }[] = [
    { q: "how much does it cost to ship a box", topic: "Pricing" },
    { q: "where is my package", topic: "Tracking" },
    { q: "how do I pay my invoice", topic: "Payment" },
    { q: "can I ship a phone with a battery", topic: "Prohibited" },
    { q: "do you ship cars", topic: "Prohibited" },
    { q: "how long does sea cargo take", topic: "Delivery" },
    { q: "what is CBM", topic: "Sea Cargo" },
    { q: "can you collect from my house", topic: "Pickup" },
    { q: "my parcel is lost", topic: "Claims" },
    { q: "how do I open an account", topic: "Account" },
  ];
  for (const { q, topic } of cases) {
    it(`"${q}" → ${topic}`, () => {
      const r = searchKnowledge(q);
      expect(r).not.toBeNull();
      expect(r!.score).toBeGreaterThanOrEqual(3);
      expect(r!.topic).toBe(topic);
    });
  }

  it("matches via synonyms not present verbatim (barrel → sea units)", () => {
    const r = searchKnowledge("how many barrels fit");
    expect(r).not.toBeNull();
    expect(r!.topic).toBe("Sea Cargo");
  });

  it("understands a reworded pricing question (no exact keyword)", () => {
    const r = searchKnowledge("what are your rates like");
    expect(r).not.toBeNull();
    expect(r!.topic).toBe("Pricing");
  });
});

describe("searchKnowledge — off-topic returns null (never invents)", () => {
  for (const q of [
    "what's the weather today",
    "tell me a joke",
    "who won the football match",
    "write me a poem about the sea",
    "what is the capital of France",
  ]) {
    it(`"${q}" → null`, () => {
      expect(searchKnowledge(q)).toBeNull();
    });
  }

  it("returns null for empty input", () => {
    expect(searchKnowledge("   ")).toBeNull();
  });
});

describe("relatedQuestions", () => {
  it("suggests related questions for a topic", () => {
    const qs = relatedQuestions("customs and duties", 3);
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.length).toBeLessThanOrEqual(3);
  });
  it("returns nothing meaningful for gibberish", () => {
    expect(relatedQuestions("zzzz qqqq")).toEqual([]);
  });
});

describe("corpus integrity", () => {
  it("has a sizeable, deduplicated knowledge base", () => {
    expect(CORPUS.length).toBeGreaterThanOrEqual(50);
    const ids = CORPUS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
