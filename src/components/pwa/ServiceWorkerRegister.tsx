"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker (`/sw.js`) in production only. Renders
 * nothing — drop it once inside the root layout. Registration is best-effort:
 * failures are logged but never surfaced to the user.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker registration failed", err);
      });
    };

    // Defer until the page has loaded so registration never competes with the
    // initial render for bandwidth.
    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}

export default ServiceWorkerRegister;
