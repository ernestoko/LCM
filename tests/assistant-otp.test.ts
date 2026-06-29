import { describe, it, expect } from "vitest";
import {
  generateOtp,
  hashOtp,
  safeEqualHex,
  signVerifyToken,
  verifyVerifyToken,
} from "@/lib/security/otp";
import { maskEmail, maskPhone, buildChannels } from "@/lib/assistant/verification";
import type { Shipment, Customer } from "@/types";

describe("OTP code generation + hashing", () => {
  it("generates a 6-digit numeric code", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateOtp();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it("hashOtp is deterministic for the same (challenge, code)", () => {
    expect(hashOtp("c1", "123456")).toBe(hashOtp("c1", "123456"));
  });

  it("hashOtp is bound to the challenge id (same code, different challenge → different hash)", () => {
    expect(hashOtp("c1", "123456")).not.toBe(hashOtp("c2", "123456"));
  });

  it("hashOtp differs for different codes", () => {
    expect(hashOtp("c1", "123456")).not.toBe(hashOtp("c1", "654321"));
  });

  it("safeEqualHex compares equal/unequal hex digests", () => {
    const a = hashOtp("c1", "111111");
    expect(safeEqualHex(a, a)).toBe(true);
    expect(safeEqualHex(a, hashOtp("c1", "222222"))).toBe(false);
    expect(safeEqualHex(a, "abc")).toBe(false); // length mismatch
  });
});

describe("verification token signing", () => {
  const NOW = 1_700_000_000_000;

  it("round-trips a valid token within its lifetime", () => {
    const exp = NOW + 60_000;
    const token = signVerifyToken("LCM-2606-AB12CD", exp);
    const claims = verifyVerifyToken(token, NOW);
    expect(claims).toEqual({ trackingNumber: "LCM-2606-AB12CD", expiresAtMs: exp });
  });

  it("rejects an expired token", () => {
    const token = signVerifyToken("LCM-1", NOW - 1);
    expect(verifyVerifyToken(token, NOW)).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const token = signVerifyToken("LCM-1", NOW + 60_000);
    const [, sig] = token.split(".");
    const forged = `${Buffer.from(JSON.stringify({ tn: "LCM-EVIL", exp: NOW + 60_000 }))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")}.${sig}`;
    expect(verifyVerifyToken(forged, NOW)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyVerifyToken("", NOW)).toBeNull();
    expect(verifyVerifyToken("nodot", NOW)).toBeNull();
    expect(verifyVerifyToken(null, NOW)).toBeNull();
  });
});

describe("contact masking + channel resolution", () => {
  it("masks emails keeping a short prefix + domain", () => {
    expect(maskEmail("jesselyn@gmail.com")).toBe(`je${"•".repeat(6)}@gmail.com`);
    expect(maskEmail("a@b.com")).toBe("a••@b.com");
    expect(maskEmail("a@b.com")).toMatch(/@b\.com$/);
  });

  it("masks phones to the last two digits", () => {
    expect(maskPhone("+233241234589")).toBe("•••• ••89");
    expect(maskPhone("024 000 0012")).toBe("•••• ••12");
  });

  it("collapses to one email + one phone, preferring the customer", () => {
    const shipment = {
      receiver: { name: "R", email: "recv@x.com", phone: "0240000001" },
      sender: { name: "S", email: "send@x.com", phone: "0240000002" },
    } as unknown as Shipment;
    const customer = { email: "cust@x.com", phone: "0240000003" } as unknown as Customer;
    const channels = buildChannels(shipment, customer);
    expect(channels.map((c) => c.kind).sort()).toEqual(["email", "sms"]);
    expect(channels.find((c) => c.kind === "email")!.value).toBe("cust@x.com");
    expect(channels.find((c) => c.kind === "sms")!.value).toBe("0240000003");
  });

  it("returns no channels when nothing is on file", () => {
    const shipment = { receiver: { name: "R" }, sender: { name: "S" } } as unknown as Shipment;
    expect(buildChannels(shipment, null)).toEqual([]);
  });
});
