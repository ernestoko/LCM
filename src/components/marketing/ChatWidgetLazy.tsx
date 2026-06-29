"use client";

import dynamic from "next/dynamic";

/**
 * Loads the chat assistant (and its framer-motion dependency) as a separate
 * client chunk AFTER hydration, so it never weighs down the marketing pages'
 * first load. Jesselyn's proactive greeting still fires a few seconds in.
 */
const ChatWidget = dynamic(
  () => import("./ChatWidget").then((m) => m.ChatWidget),
  { ssr: false },
);

export function ChatWidgetLazy() {
  return <ChatWidget />;
}
