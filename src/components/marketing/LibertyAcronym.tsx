import { cn } from "@/lib/utils/cn";

/**
 * The brand story behind the name — LIBERTY as a compact acrostic strip. The
 * seven gold initials sit in a single row, each captioned with its word, and
 * read together as one promise: "Logistics Innovation, Bringing Exceptional
 * Reliability & Timeliness — for You."
 */
const LETTERS: { letter: string; word: string }[] = [
  { letter: "L", word: "Logistics" },
  { letter: "I", word: "Innovation" },
  { letter: "B", word: "Bringing" },
  { letter: "E", word: "Exceptional" },
  { letter: "R", word: "Reliability" },
  { letter: "T", word: "& Timeliness" },
  { letter: "Y", word: "for You" },
];

export function LibertyAcronym({
  className,
  tone = "light",
}: {
  className?: string;
  /** "light" = on light/navy-50 surfaces, "dark" = on navy surfaces. */
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div
      className={cn(
        "mx-auto max-w-3xl rounded-2xl border px-4 py-7 text-center sm:px-8",
        dark ? "border-white/10 bg-white/[0.03]" : "border-navy-100 bg-white shadow-card",
        className,
      )}
    >
      {/* Compact horizontal strip of the seven initials — one line on desktop */}
      <div className="flex flex-wrap items-start justify-center gap-x-1.5 gap-y-4 sm:gap-x-3.5">
        {LETTERS.map(({ letter, word }) => (
          <div key={letter} className="flex w-[3.9rem] flex-col items-center sm:w-[4.6rem]">
            <span
              className={cn(
                "text-4xl font-black leading-none sm:text-5xl",
                dark ? "text-gold-300" : "text-gold-500",
              )}
              aria-hidden="true"
            >
              {letter}
            </span>
            <span
              className={cn(
                "mt-2 text-[11px] font-semibold leading-tight sm:text-xs",
                dark ? "text-navy-200" : "text-navy-600",
              )}
            >
              {word}
            </span>
          </div>
        ))}
      </div>

      <p
        className={cn(
          "mt-7 border-t pt-5 text-sm italic leading-relaxed",
          dark ? "border-white/10 text-navy-200" : "border-navy-100 text-navy-600",
        )}
      >
        Logistics Innovation, Bringing Exceptional Reliability &amp; Timeliness — for&nbsp;You.
      </p>
    </div>
  );
}
