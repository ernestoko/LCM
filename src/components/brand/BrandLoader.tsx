import { Eagle } from "./Eagle";

const NAVY = "#05070f"; // near-black backdrop tint behind the eye cut-out
const GOLD = "#c8901f"; // gold / brown logo fill

/**
 * Full-screen branded loading screen. The eagle mark sits in the middle and
 * "fills" with gold from the bottom up, on a loop, to depict loading progress —
 * paired with a sweeping progress bar. Used for the sign-in / auth-resolution
 * transition into the platform (the "backend"). Pass `fullscreen={false}` to
 * embed it inside a page region instead of covering the viewport.
 */
export function BrandLoader({
  label = "Loading…",
  fullscreen = true,
}: {
  label?: string;
  fullscreen?: boolean;
}) {
  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#05070f]"
          : "relative flex min-h-[60vh] flex-col items-center justify-center"
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Soft gold glow behind the mark */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Solid gold/brown eagle logo with a soft pulsing ring */}
      <div className="relative h-28 w-28">
        <span
          className="absolute inset-0 rounded-full bg-gold-500/20 animate-pulse-ring"
          aria-hidden="true"
        />
        <Eagle className="relative h-28 w-28 drop-shadow-[0_4px_18px_rgba(200,144,31,0.35)]" fill={GOLD} eyeFill={NAVY} />
      </div>

      {/* Wordmark */}
      <p className="relative mt-6 text-sm font-semibold tracking-wide text-white">
        Liberty <span className="text-gold-400">&amp;</span> Liberty Logistics
      </p>

      {/* Indeterminate progress bar with a sweeping gold highlight */}
      <div className="relative mt-4 h-1 w-44 overflow-hidden rounded-full bg-white/10">
        <span
          className="absolute inset-y-0 w-1/3 rounded-full bg-gold-400 animate-loader-sweep"
          aria-hidden="true"
        />
      </div>

      <p className="relative mt-3 text-xs text-navy-300">{label}</p>
    </div>
  );
}
