"use client";

import type { NotificationEvent, NotificationChannel } from "@/types";
import { renderTemplate, type TemplateContext } from "./templates";
import { logNotification } from "@/lib/db/repositories/notifications";
import { getFirebaseAuth } from "@/lib/firebase/client";

/** Build an Authorization header from the current user's ID token, if signed in. */
async function authHeaders(): Promise<Record<string, string>> {
  try {
    const token = await getFirebaseAuth().currentUser?.getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export interface NotifyTarget {
  userId?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface NotifyOptions {
  channels?: NotificationChannel[]; // default: ["in_app", "email", "sms"]
  shipmentId?: string;
}

/**
 * Send a lifecycle notification across the configured channels.
 *  - in_app: written directly to Firestore (visible in the bell).
 *  - email/sms: dispatched via /api/notifications/send (server-side providers).
 *
 * Failures are swallowed so notifications never block the primary action.
 */
export async function notify(
  event: NotificationEvent,
  target: NotifyTarget,
  ctx: TemplateContext,
  opts: NotifyOptions = {},
): Promise<void> {
  const channels = opts.channels ?? ["in_app", "email", "sms"];
  const rendered = renderTemplate(event, { customerName: target.name, ...ctx });

  // 1. In-app record (also the audit trail of what was sent).
  if (channels.includes("in_app") && target.userId) {
    await logNotification({
      event,
      channel: "in_app",
      recipientUserId: target.userId,
      recipientName: target.name,
      recipientAddress: target.email ?? target.phone ?? "",
      subject: rendered.subject,
      body: rendered.sms,
      shipmentId: opts.shipmentId,
      status: "sent",
      sentAt: new Date().toISOString(),
    }).catch(() => {});
  }

  const context = { customerName: target.name, ...ctx };

  // 2. Email + SMS via the API.
  const wantEmail = channels.includes("email") && target.email;
  const wantSms = channels.includes("sms") && target.phone;
  const wantWhatsApp = channels.includes("whatsapp") && target.phone;

  if (wantEmail || wantSms || wantWhatsApp) {
    const headers = { "Content-Type": "application/json", ...(await authHeaders()) };

    if (wantEmail || wantSms) {
      try {
        await fetch("/api/notifications/send", {
          method: "POST",
          headers,
          body: JSON.stringify({
            event,
            context,
            email: wantEmail ? target.email : undefined,
            phone: wantSms ? target.phone : undefined,
          }),
        });
      } catch {
        // Non-blocking.
      }
    }

    // WhatsApp via the Cloud API (opt-in channel).
    if (wantWhatsApp) {
      try {
        await fetch("/api/notifications/whatsapp", {
          method: "POST",
          headers,
          body: JSON.stringify({ to: target.phone, event, context }),
        });
      } catch {
        // Non-blocking.
      }
    }
  }
}
