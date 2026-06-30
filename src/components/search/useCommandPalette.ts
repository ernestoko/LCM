"use client";

import { useCallback } from "react";

/**
 * Lightweight opener for the command palette, split out from the (heavy)
 * CommandPalette component so trigger buttons can import it without pulling the
 * palette's Firestore-subscribing body into the initial app-shell bundle. The
 * palette itself is lazy-loaded (see CommandPaletteLazy) and listens for this
 * window event.
 */
export const OPEN_EVENT = "lcm:open-search";

/** Returns `{ open }` — call `open()` to launch the command palette. */
export function useCommandPalette() {
  const open = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(OPEN_EVENT));
    }
  }, []);
  return { open };
}
