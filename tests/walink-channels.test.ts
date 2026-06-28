import { describe, it, expect } from "vitest";
import { waDigits, waLink } from "@/lib/notifications/walink";
import { channelsForCustomer, DEFAULT_CHANNELS } from "@/lib/notifications/channels";
import type { Customer } from "@/types";

describe("waDigits", () => {
  it("normalises a local Ghana 0-prefixed number to 233", () => {
    expect(waDigits("0241234567")).toBe("233241234567");
  });

  it("strips all non-digit characters from a +1 US number", () => {
    expect(waDigits("+1 (555) 000-1234")).toBe("15550001234");
  });

  it("strips a leading + without adding a country code", () => {
    expect(waDigits("+233241234567")).toBe("233241234567");
  });
});

describe("waLink", () => {
  it("builds a URL-encoded wa.me link with a prefilled message", () => {
    expect(waLink("0241234567", "hi there")).toBe(
      "https://wa.me/233241234567?text=hi%20there",
    );
  });

  it("omits the query string when no message is given", () => {
    expect(waLink("0241234567")).toBe("https://wa.me/233241234567");
  });
});

describe("channelsForCustomer", () => {
  it("returns the DEFAULT_CHANNELS for undefined customer", () => {
    expect(channelsForCustomer(undefined)).toEqual(DEFAULT_CHANNELS);
  });

  it("returns a copy, not the DEFAULT_CHANNELS reference", () => {
    const result = channelsForCustomer(undefined);
    expect(result).not.toBe(DEFAULT_CHANNELS);
  });

  it("always includes in_app for the default case", () => {
    expect(channelsForCustomer(null)).toContain("in_app");
  });

  it("includes only enabled channels plus the always-on in_app", () => {
    const customer = {
      notificationPreferences: { email: false, sms: true, whatsapp: true },
    } as Pick<Customer, "notificationPreferences">;
    expect(channelsForCustomer(customer)).toEqual(["in_app", "sms", "whatsapp"]);
  });

  it("returns in_app only when every preference is false", () => {
    const customer = {
      notificationPreferences: { email: false, sms: false, whatsapp: false },
    } as Pick<Customer, "notificationPreferences">;
    expect(channelsForCustomer(customer)).toEqual(["in_app"]);
  });

  it("produces no duplicate channels", () => {
    const customer = {
      notificationPreferences: { email: true, sms: true, whatsapp: true },
    } as Pick<Customer, "notificationPreferences">;
    const result = channelsForCustomer(customer);
    expect(new Set(result).size).toBe(result.length);
  });
});
