import "server-only";

/**
 * Provider-agnostic email sender. Defaults to `console` (logs the email) so the
 * platform runs without an email provider. Set EMAIL_PROVIDER=resend and
 * RESEND_API_KEY to send real email, or wire SMTP in the `smtp` branch.
 */

export interface EmailResult {
  ok: boolean;
  status: string;
  error?: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

function textToHtml(text: string): string {
  return `<div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#0f1b3d;line-height:1.6">${text
    .split("\n")
    .map((l) => (l.trim() ? `<p style="margin:0 0 10px">${l}</p>` : "<br/>"))
    .join("")}</div>`;
}

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  const provider = process.env.EMAIL_PROVIDER ?? "console";
  const from = process.env.EMAIL_FROM ?? "Liberty Cargo Movers <no-reply@example.com>";

  if (provider === "resend") {
    const key = process.env.RESEND_API_KEY;
    if (!key) return { ok: false, status: "not_configured", error: "RESEND_API_KEY missing." };
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [msg.to],
          subject: msg.subject,
          text: msg.text,
          html: msg.html ?? textToHtml(msg.text),
        }),
      });
      return res.ok
        ? { ok: true, status: "sent" }
        : { ok: false, status: String(res.status), error: await res.text() };
    } catch (err) {
      return { ok: false, status: "error", error: err instanceof Error ? err.message : "Unknown" };
    }
  }

  // Default: log to server console so development works without a provider.
  // eslint-disable-next-line no-console
  console.info(`[email:${provider}] → ${msg.to} | ${msg.subject}\n${msg.text}`);
  return { ok: true, status: "logged" };
}
