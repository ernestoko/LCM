import { describe, it, expect } from "vitest";
import { deDash } from "@/lib/assistant/voice";

describe("deDash — Jesselyn never sends an em-dash", () => {
  it("turns a clause-break dash into a comma", () => {
    expect(deDash("Air — fastest, priced by weight")).toBe("Air, fastest, priced by weight");
  });

  it("handles a parenthetical pair of dashes", () => {
    expect(deDash("Shipping to Ghana — or anywhere — today?")).toBe(
      "Shipping to Ghana, or anywhere, today?",
    );
  });

  it("drops a sign-off dash after sentence punctuation", () => {
    expect(deDash("I'm right here. — Jesselyn")).toBe("I'm right here. Jesselyn");
  });

  it("handles en-dashes too", () => {
    expect(deDash("Mon–Fri delivery")).toBe("Mon, Fri delivery");
  });

  it("leaves ordinary hyphens untouched", () => {
    const s = "We offer door-to-door delivery with a 6-digit code for half-drum cargo.";
    expect(deDash(s)).toBe(s);
  });

  it("never spans a line break, and never starts a line with a comma", () => {
    expect(deDash("Air freight\n— priced by weight")).toBe("Air freight\npriced by weight");
  });

  it("leaves clean text exactly as-is", () => {
    const s = "Hi, I'm Jesselyn. How can I help?";
    expect(deDash(s)).toBe(s);
  });

  it("contains no em or en dash in the result", () => {
    const out = deDash("One — two – three — four");
    expect(out).not.toMatch(/[—–]/);
  });
});
