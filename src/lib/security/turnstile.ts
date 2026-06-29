import "server-only";

/**
 * Optional Cloudflare Turnstile ("are you a robot?") verification.
 *
 * When TURNSTILE_SECRET_KEY is configured, the assistant-verification endpoints
 * require a valid client token before issuing a code — blocking automated
 * scrapers outright. When it is NOT configured (dev / not yet provisioned), the
 * check is skipped and the endpoints fall back to rate-limiting + the honeypot,
 * so the platform runs without it. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY on the
 * client to render the widget.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** True when a Turnstile secret is configured and the bot gate is enforced. */
export const isTurnstileEnabled = Boolean(process.env.TURNSTILE_SECRET_KEY);

export interface BotCheckResult {
  ok: boolean;
  /** "skipped" when Turnstile isn't configured. */
  reason: "ok" | "skipped" | "missing_token" | "failed" | "error";
}

export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp?: string,
): Promise<BotCheckResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, reason: "skipped" };
  if (!token) return { ok: false, reason: "missing_token" };

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean };
    return data.success ? { ok: true, reason: "ok" } : { ok: false, reason: "failed" };
  } catch {
    // Network failure verifying the token — fail closed only when enforced.
    return { ok: false, reason: "error" };
  }
}
