/**
 * Liberty Cargo Movers — Notification channel resolution
 * ----------------------------------------------------------------------------
 * ISOMORPHIC, pure module. Safe to import from both server and client code:
 * no React, no Firebase, no `"use client"`, no `server-only`. It only maps a
 * customer's stored notification preferences onto the concrete list of
 * channels `notify()` should fire on.
 */

import type { Customer, NotificationChannel } from "@/types";

/**
 * Channels used when a customer has no explicit preferences set.
 * In-app + email + SMS are on by default; WhatsApp is strictly opt-in.
 */
export const DEFAULT_CHANNELS: NotificationChannel[] = ["in_app", "email", "sms"];

/**
 * Resolve the notification channels for a customer.
 *
 *  - `"in_app"` is always included (the bell is never opt-out).
 *  - When `notificationPreferences` is undefined, the {@link DEFAULT_CHANNELS}
 *    apply (in-app + email + SMS, no WhatsApp).
 *  - Otherwise email / sms / whatsapp are included only where their
 *    corresponding boolean is `true`.
 *
 * The returned array is de-duplicated.
 */
export function channelsForCustomer(
  customer?: Pick<Customer, "notificationPreferences"> | null,
): NotificationChannel[] {
  const prefs = customer?.notificationPreferences;

  if (!prefs) {
    return [...DEFAULT_CHANNELS];
  }

  const channels: NotificationChannel[] = ["in_app"];
  if (prefs.email) channels.push("email");
  if (prefs.sms) channels.push("sms");
  if (prefs.whatsapp) channels.push("whatsapp");

  return Array.from(new Set(channels));
}
