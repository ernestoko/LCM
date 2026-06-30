/**
 * Minimal, dependency-free error reporting hook. Called from the App Router
 * error boundaries. It always logs to the console, and additionally:
 *
 *  - forwards to Sentry if a Sentry SDK has been loaded onto `window`, and
 *  - POSTs a tiny JSON beacon to NEXT_PUBLIC_ERROR_REPORT_URL when configured.
 *
 * This keeps the app observable in production without committing to a specific
 * vendor or shipping a heavy SDK in the bundle — wire either integration by
 * setting an env var or loading Sentry, with no code changes here.
 */

interface ErrorContext {
  /** Where it happened, e.g. "app-boundary" | "global-boundary" | "route". */
  scope?: string;
  digest?: string;
  [key: string]: unknown;
}

type SentryLike = { captureException?: (e: unknown, hint?: unknown) => void };

export function logError(error: unknown, context: ErrorContext = {}): void {
  // 1. Always log locally.
  // eslint-disable-next-line no-console
  console.error("[error]", context.scope ?? "app", error);

  if (typeof window === "undefined") return;

  // 2. Sentry, if present (loaded by a script tag / instrumentation).
  const sentry = (window as unknown as { Sentry?: SentryLike }).Sentry;
  if (sentry?.captureException) {
    try {
      sentry.captureException(error, { extra: context });
    } catch {
      /* never let reporting throw */
    }
  }

  // 3. Optional beacon to a collection endpoint.
  const url = process.env.NEXT_PUBLIC_ERROR_REPORT_URL;
  if (url) {
    try {
      const payload = JSON.stringify({
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ...context,
        at: new Date().toISOString(),
        url: window.location.href,
        ua: navigator.userAgent,
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
      } else {
        void fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      /* best effort */
    }
  }
}
