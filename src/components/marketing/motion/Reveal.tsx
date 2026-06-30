"use client";

import { m, useReducedMotion, type Transition } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Marketing "motion islands" — small client wrappers the (server) marketing
 * pages compose to add tasteful entrance animation. Brand intent is calm/trust +
 * modern: gentle/smooth springs, scroll-reveal (once), no bounce. They animate
 * only transform + opacity (GPU-friendly) and fully respect
 * prefers-reduced-motion — when set, content renders immediately, unanimated.
 */

const SMOOTH: Transition = { type: "spring", stiffness: 200, damping: 25 };
const GENTLE: Transition = { type: "spring", stiffness: 120, damping: 20 };

const VIEWPORT = { once: true, margin: "-80px" } as const;

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger/sequence delay in seconds. */
  delay?: number;
  /** Rise distance in px (0 = fade only). */
  y?: number;
  /** "scroll" reveals as it enters the viewport; "load" plays on mount (heroes). */
  mode?: "scroll" | "load";
}

/** Fade + rise, on scroll (default) or on mount. */
export function Reveal({ children, className, delay = 0, y = 24, mode = "scroll" }: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  const animate = { opacity: 1, y: 0, transition: { ...GENTLE, delay } };
  const initial = { opacity: 0, y };

  if (mode === "load") {
    return (
      <m.div className={className} initial={initial} animate={animate}>
        {children}
      </m.div>
    );
  }
  return (
    <m.div className={className} initial={initial} whileInView={animate} viewport={VIEWPORT}>
      {children}
    </m.div>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  /** Seconds between each child (keep ≤ 0.08 per the skill's perf rule). */
  stagger?: number;
  delayChildren?: number;
  /** "scroll" (default) orchestrates as the group enters view; "load" on mount. */
  mode?: "scroll" | "load";
}

/**
 * Orchestrates a group of <RevealItem> children with a staggered entrance.
 * Use for card grids, feature lists, logo strips, step rows.
 */
export function RevealStagger({
  children,
  className,
  stagger = 0.08,
  delayChildren = 0.05,
  mode = "scroll",
}: StaggerProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  const variants = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren } },
  };
  const orchestration =
    mode === "load"
      ? { initial: "hidden" as const, animate: "visible" as const }
      : { initial: "hidden" as const, whileInView: "visible" as const, viewport: VIEWPORT };

  return (
    <m.div className={className} variants={variants} {...orchestration}>
      {children}
    </m.div>
  );
}

/** A single staggered item — must be a child of <RevealStagger>. */
export function RevealItem({
  children,
  className,
  y = 20,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <m.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        visible: { opacity: 1, y: 0, transition: SMOOTH },
      }}
    >
      {children}
    </m.div>
  );
}
