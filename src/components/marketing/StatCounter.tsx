"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

export function StatCounter({
  value,
  suffix,
  prefix,
  label,
  dark = false,
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  dark?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Start at the REAL value so the server, no-JS, crawlers, social previews and
  // reduced-motion users always see the true number — never "0 shipments". The
  // count-up is a pure enhancement layered on top (and only when the stat is
  // still below the fold, so resetting to 0 is never visible).
  const [display, setDisplay] = useState(value);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || started) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || typeof IntersectionObserver === "undefined") return; // keep the real value

    // If the stat is already on screen at mount, don't reset it (would flash);
    // keep the true value. Only animate stats the user hasn't reached yet.
    const rect = node.getBoundingClientRect();
    const alreadyInView = rect.top < window.innerHeight && rect.bottom > 0;
    if (alreadyInView) return;

    setDisplay(0); // safe: node is below the fold, so this reset is unseen

    let raf = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        setStarted(true);
        observer.disconnect();

        const duration = 1600;
        const start = performance.now();

        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          // easeOutCubic for a confident, decelerating count.
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(eased * value));
          if (progress < 1) {
            raf = requestAnimationFrame(tick);
          }
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [value, started]);

  return (
    <div ref={ref} className={cn("flex flex-col items-center text-center", className)}>
      <div
        className={cn(
          "text-4xl font-extrabold tracking-tight sm:text-5xl",
          dark ? "text-white" : "text-navy-900",
        )}
      >
        {prefix}
        {display.toLocaleString("en-US")}
        {suffix}
      </div>
      <div
        className={cn(
          "mt-2 text-sm font-medium",
          dark ? "text-navy-200" : "text-navy-600",
        )}
      >
        {label}
      </div>
    </div>
  );
}
