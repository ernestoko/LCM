"use client";

import dynamic from "next/dynamic";

/**
 * Lazy-loads the command palette as a separate client chunk after hydration, so
 * its 380-line body and Firestore search subscriptions never weigh down the
 * initial app-shell load. The palette self-mounts and listens for ⌘K / Ctrl+K
 * and the `lcm:open-search` window event, so it's ready by the time a user
 * reaches for it. Triggers use the tiny `useCommandPalette` hook instead.
 */
const CommandPalette = dynamic(
  () => import("./CommandPalette").then((m) => m.CommandPalette),
  { ssr: false },
);

export function CommandPaletteLazy() {
  return <CommandPalette />;
}
