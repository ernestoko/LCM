import { describe, it, expect } from "vitest";
import { renderTemplate, TEMPLATES, type TemplateContext } from "@/lib/notifications/templates";
import type { NotificationEvent } from "@/types";

const EVENTS = Object.keys(TEMPLATES) as NotificationEvent[];

function fullCtx(): TemplateContext {
  return {
    customerName: "Kwame Adjei",
    trackingNumber: "LCM-2606-AB12CD",
    invoiceNumber: "LCM-INV-000123",
    amount: "USD 285.00",
    route: "USA-GHANA",
    manifestNumber: "LCM-MF-000045",
    status: "in review",
    eta: "12 Jul 2026",
    ticketNumber: "LCM-TKT-000123",
    supportPhone: "024 123 4567",
    supportEmail: "support@libertycargo.test",
  };
}

describe("renderTemplate — every NotificationEvent", () => {
  it("covers all 12 declared events", () => {
    expect(EVENTS).toHaveLength(12);
  });

  for (const event of EVENTS) {
    it(`returns non-empty subject/sms/email/whatsapp for "${event}"`, () => {
      const r = renderTemplate(event, fullCtx());
      expect(typeof r.subject).toBe("string");
      expect(r.subject.length).toBeGreaterThan(0);
      expect(r.sms.length).toBeGreaterThan(0);
      expect(r.email.length).toBeGreaterThan(0);
      expect(r.whatsapp.length).toBeGreaterThan(0);
    });
  }
});

describe("renderTemplate — channel content", () => {
  it("invoice_generated SMS contains the invoice number and amount from ctx", () => {
    const ctx = fullCtx();
    const r = renderTemplate("invoice_generated", ctx);
    expect(r.sms).toContain("LCM-INV-000123");
    expect(r.sms).toContain("USD 285.00");
    expect(r.subject).toContain("LCM-INV-000123");
  });

  it("delivered body contains the tracking number from ctx", () => {
    const ctx = fullCtx();
    const r = renderTemplate("delivered", ctx);
    expect(r.sms).toContain("LCM-2606-AB12CD");
    expect(r.email).toContain("LCM-2606-AB12CD");
    expect(r.whatsapp).toContain("LCM-2606-AB12CD");
  });

  it("whatsapp uses a *-bold marker and differs from the plain SMS body", () => {
    const r = renderTemplate("package_received", fullCtx());
    expect(r.whatsapp).toContain("*");
    expect(r.sms).not.toContain("*");
    expect(r.whatsapp).not.toBe(r.sms);
  });

  it("email is richer/longer than the SMS for invoice_generated", () => {
    const r = renderTemplate("invoice_generated", fullCtx());
    expect(r.email.length).toBeGreaterThan(r.sms.length);
    expect(r.email).not.toBe(r.sms);
  });

  it("falls back to a friendly greeting when customerName is missing", () => {
    const ctx = fullCtx();
    delete ctx.customerName;
    const r = renderTemplate("package_received", ctx);
    expect(r.sms).toContain("Hi there");
  });
});
