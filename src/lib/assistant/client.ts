"use client";

/**
 * Browser-side client for the assistant identity-verification endpoints. Keeps
 * all the fetch/JSON plumbing out of the chat component. Sensitive shipment
 * detail is only ever fetched with a token minted after a successful OTP check.
 */

import type { SensitiveShipment } from "@/lib/assistant/verification";

export type ChannelKind = "email" | "sms";

export interface ChannelOption {
  kind: ChannelKind;
  hint: string;
}

export type StartResult =
  | { ok: true; stage: "choose"; channels: ChannelOption[] }
  | { ok: true; stage: "sent"; challengeId: string; kind: ChannelKind; hint: string; expiresInSec: number; devCode?: string }
  | { ok: false; error: string };

export type ConfirmResult =
  | { ok: true; token: string; trackingNumber: string; expiresInSec: number }
  | { ok: false; error: string; attemptsLeft?: number };

export type DetailResult = { ok: true; shipment: SensitiveShipment } | { ok: false; error: string };

async function postJson<T>(url: string, body: unknown): Promise<T> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as T;
  } catch {
    return { ok: false, error: "Network problem — please try again." } as T;
  }
}

/** Begin verification. Omit `channel` to list the masked options first. */
export function startVerification(input: {
  trackingNumber: string;
  channel?: ChannelKind;
  turnstileToken?: string;
}): Promise<StartResult> {
  return postJson<StartResult>("/api/assistant/verify/start", input);
}

/** Submit the 6-digit code for a challenge. */
export function confirmCode(input: { challengeId: string; code: string }): Promise<ConfirmResult> {
  return postJson<ConfirmResult>("/api/assistant/verify/confirm", input);
}

/** Fetch the authorised shipment detail using the verification token. */
export async function fetchSensitiveShipment(
  trackingNumber: string,
  token: string,
): Promise<DetailResult> {
  try {
    const res = await fetch(`/api/assistant/shipment/${encodeURIComponent(trackingNumber)}`, {
      headers: { "x-assistant-verify": token },
    });
    return (await res.json()) as DetailResult;
  } catch {
    return { ok: false, error: "Network problem — please try again." };
  }
}
