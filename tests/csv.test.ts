import { describe, it, expect } from "vitest";
import { toCsv } from "@/components/payments/csv";

describe("toCsv (shared CSV export helper)", () => {
  it("returns an empty string for no rows", () => {
    expect(toCsv([])).toBe("");
  });

  it("derives the header from the union of keys across all rows", () => {
    const csv = toCsv([{ a: 1, b: 2 }, { a: 3, c: 4 }]);
    const [header] = csv.split("\r\n");
    expect(header).toBe("a,b,c");
  });

  it("renders rows with CRLF line endings and blanks for missing keys", () => {
    const csv = toCsv([
      { name: "Kwame", amount: 100 },
      { name: "Ama", amount: 50 },
    ]);
    expect(csv).toBe(["name,amount", "Kwame,100", "Ama,50"].join("\r\n"));
  });

  it("escapes commas, quotes and newlines per RFC-4180", () => {
    const csv = toCsv([{ v: "a,b" }, { v: 'say "hi"' }, { v: "l1\nl2" }]);
    expect(csv).toBe(['v', '"a,b"', '"say ""hi"""', '"l1\nl2"'].join("\r\n"));
  });

  it("renders null/undefined as empty cells", () => {
    expect(toCsv([{ a: null, b: undefined, c: 0 }])).toBe(["a,b,c", ",,0"].join("\r\n"));
  });
});
