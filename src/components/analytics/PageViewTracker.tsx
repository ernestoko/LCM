"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Fires a lightweight, privacy-respecting page-view beacon on every navigation.
 * Uniqueness is estimated with a per-day localStorage flag (no cookies, no
 * fingerprinting); the server stores only aggregate counts. Uses sendBeacon so
 * it never blocks navigation and silently no-ops if anything is unavailable.
 */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    let unique = false;
    try {
      const key = `lcm-visit-${new Date().toISOString().slice(0, 10)}`;
      if (!window.localStorage.getItem(key)) {
        unique = true;
        window.localStorage.setItem(key, "1");
      }
    } catch {
      /* private mode / storage unavailable — count as non-unique */
    }

    const payload = JSON.stringify({ path: pathname, unique });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics/pageview", new Blob([payload], { type: "application/json" }));
      } else {
        void fetch("/api/analytics/pageview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      /* ignore */
    }
  }, [pathname]);

  return null;
}
