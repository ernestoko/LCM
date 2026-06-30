"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Loads only the Motion features the marketing pages actually use (animations,
 * variants, exit, hover/tap/focus and viewport `inView`) via LazyMotion, instead
 * of the full library. This roughly halves Motion's footprint on the marketing
 * first-load while keeping every entrance/scroll animation working. `strict`
 * enforces that islands use the lightweight `m.*` components (see Reveal).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
