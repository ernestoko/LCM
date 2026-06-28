import "server-only";

/**
 * mNotify SMS client (https://readytogo.mnotify.com).
 * Uses the Quick Bulk SMS JSON endpoint. Configure MNOTIFY_API_KEY and
 * MNOTIFY_SENDER_ID (an approved sender id) in the environment.
 */

const MNOTIFY_QUICK_SMS = "https://api.mnotify.com/api/sms/quick";

export interface SmsResult {
  ok: boolean;
  status: string;
  messageId?: string;
  error?: string;
}

/** Normalise a Ghana/intl phone number to mNotify's expected format. */
export function normalisePhone(phone: string): string {
  let p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0")) p = `233${p.slice(1)}`; // local Ghana → intl
  return p;
}

export async function sendSms(
  recipients: string[],
  message: string,
  opts: { senderId?: string } = {},
): Promise<SmsResult> {
  const key = process.env.MNOTIFY_API_KEY;
  const sender = opts.senderId ?? process.env.MNOTIFY_SENDER_ID ?? "LibertyCM";

  if (!key) {
    return { ok: false, status: "not_configured", error: "MNOTIFY_API_KEY is not set." };
  }

  const recipient = recipients.map(normalisePhone).filter(Boolean);
  if (recipient.length === 0) {
    return { ok: false, status: "no_recipient", error: "No valid recipients." };
  }

  try {
    const res = await fetch(`${MNOTIFY_QUICK_SMS}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient,
        sender,
        message,
        is_schedule: "false",
        schedule_date: "",
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      status?: string;
      code?: string;
      message?: string;
      summary?: { _id?: string };
    };
    const ok = res.ok && (data.status === "success" || data.code === "2000");
    return {
      ok,
      status: data.status ?? String(res.status),
      messageId: data.summary?._id,
      error: ok ? undefined : data.message ?? `mNotify responded ${res.status}`,
    };
  } catch (err) {
    return { ok: false, status: "error", error: err instanceof Error ? err.message : "Unknown error" };
  }
}
