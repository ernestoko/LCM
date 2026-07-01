"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Marketing "motion islands" — small client wrappers the (server) marketing
 * pages compose to add tasteful entrance animation. Brand intent is calm/trust +
 * modern: a gentle fade + rise, revealed once as content enters the viewport.
 *
 * These are built as *progressive enhancement*, not a hard dependency:
 *
 *  • The children are always rendered and **visible by default**. The hidden
 *    starting state lives in CSS, gated on `html.js` (added by an inline guard
 *    in the root layout). So if JavaScript is disabled, fails, or is still
 *    loading, the page shows its text immediately instead of a blank screen.
 *  • When JS is active we add `.is-visible` (on mount for heroes, or when the
 *    element scrolls into view) and CSS animates opacity + transform only —
 *    GPU-friendly, no layout thrash.
 *  • `prefers-reduced-motion` is honored by the CSS, which skips the hidden
 *    state entirely, so reduced-motion users just see static content.
 *
 * The reveal styling itself is in `globals.css` (`[data-reveal]`).
 */

/* A single shared IntersectionObserver for every scroll-reveal on the page,
   rather than one observer per element. Reveals fire once, ~80px before the
   element fully enters the viewport, then unobserve. */
type RevealCallback = () => void;
let sharedObserver: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, RevealCallback>();

function getObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === "undefined") return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const cb = callbacks.get(entry.target);
          sharedObserver?.unobserve(entry.target);
          callbacks.delete(entry.target);
          cb?.();
        }
      },
      { rootMargin: "0px 0px -80px 0px" },
    );
  }
  return sharedObserver;
}

/** Reveal `el` once it scrolls into view (or immediately if IO is unavailable). */
function observeOnce(el: Element, cb: RevealCallback): () => void {
  const observer = getObserver();
  if (!observer) {
    cb();
    return () => {};
  }
  callbacks.set(el, cb);
  observer.observe(el);
  return () => {
    observer.unobserve(el);
    callbacks.delete(el);
  };
}

/** Play the reveal on the next paint (used for "load" mode — heroes, etc.). */
function revealOnMount(reveal: RevealCallback): () => void {
  // Two rAFs so the hidden start state paints before the transition begins.
  let inner = 0;
  const outer = requestAnimationFrame(() => {
    inner = requestAnimationFrame(reveal);
  });
  return () => {
    cancelAnimationFrame(outer);
    cancelAnimationFrame(inner);
  };
}

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Entrance delay in seconds. */
  delay?: number;
  /** Rise distance in px (0 = fade only). */
  y?: number;
  /** "scroll" reveals as it enters the viewport; "load" plays on mount (heroes). */
  mode?: "scroll" | "load";
}

/** Fade + rise, on scroll (default) or on mount. */
export function Reveal({ children, className, delay = 0, y = 24, mode = "scroll" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reveal = () => el.classList.add("is-visible");
    return mode === "load" ? revealOnMount(reveal) : observeOnce(el, reveal);
  }, [mode]);

  const style = {
    "--reveal-y": `${y}px`,
    "--reveal-delay": `${delay}s`,
  } as CSSProperties;

  return (
    <div ref={ref} data-reveal className={className} style={style}>
      {children}
    </div>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  /** Seconds between each child. */
  stagger?: number;
  /** Delay (seconds) before the first child reveals. */
  delayChildren?: number;
  /** "scroll" (default) orchestrates as the group enters view; "load" on mount. */
  mode?: "scroll" | "load";
}

/**
 * Orchestrates a group of <RevealItem> children with a staggered entrance.
 * Use for card grids, feature lists, logo strips, step rows. The container
 * itself stays visible; only its items animate, one after another.
 */
export function RevealStagger({
  children,
  className,
  stagger = 0.08,
  delayChildren = 0.05,
  mode = "scroll",
}: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>(":scope > [data-reveal]"));
    const reveal = () => {
      items.forEach((item, i) => {
        item.style.transitionDelay = `${delayChildren + i * stagger}s`;
        item.classList.add("is-visible");
      });
    };
    return mode === "load" ? revealOnMount(reveal) : observeOnce(el, reveal);
  }, [mode, stagger, delayChildren]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** A single staggered item — must be a direct child of <RevealStagger>. */
export function RevealItem({
  children,
  className,
  y = 20,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  const style = { "--reveal-y": `${y}px` } as CSSProperties;
  return (
    <div data-reveal className={className} style={style}>
      {children}
    </div>
  );
}
