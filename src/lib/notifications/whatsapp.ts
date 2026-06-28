import "server-only";

/**
 * WhatsApp Cloud API client (https://graph.facebook.com).
 * Sends a plain text message via the Cloud API messages endpoint. Configure
 * WHATSAPP_TOKEN (a permanent/system-user access token) and
 * WHATSAPP_PHONE_NUMBER_ID (the registered sender's phone number id) in the
 * environment. Degrades gracefully to `not_configured` when unset.
 */

const GRAPH_VERSION = "v21.0";

export interface WhatsAppResult {
  ok: boolean;
  status: string;
  messageId?: string;
  error?: string;
}

/**
 * Normalise a Ghana/intl phone number to digits-only international format
 * (no leading `+`). Local Ghana numbers (leading `0`) become `233…`.
 * Re-implemented locally so this server-only module is never imported by
 * client code via a shared helper.
 */
function normalisePhone(phone: string): string {
  let p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0")) p = `233${p.slice(1)}`; // local Ghana → intl
  return p;
}

export async function sendWhatsApp(to: string, message: string): Promise<WhatsAppResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return { ok: false, status: "not_configured", error: "WhatsApp is not configured." };
  }

  const recipient = normalisePhone(to);
  if (!recipient) {
    return { ok: false, status: "no_recipient", error: "No valid recipient." };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(phoneNumberId)}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipient,
          type: "text",
          text: { body: message },
        }),
      },
    );

    const data = (await res.json().catch(() => ({}))) as {
      messages?: { id?: string }[];
      error?: { message?: string };
    };

    const ok = res.ok && Array.isArray(data.messages) && data.messages.length > 0;
    return {
      ok,
      status: ok ? "sent" : String(res.status),
      messageId: data.messages?.[0]?.id,
      error: ok ? undefined : data.error?.message ?? `WhatsApp responded ${res.status}`,
    };
  } catch (err) {
    return { ok: false, status: "error", error: err instanceof Error ? err.message : "Unknown error" };
  }
}
