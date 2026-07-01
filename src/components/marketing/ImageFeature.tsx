import Link from "next/link";
import { ArrowRight, Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Photo } from "./Photo";

/**
 * Alternating image + text band — the workhorse for showcasing a service or
 * value prop with a real photo. Set `reverse` to flip the media to the right.
 */
export function ImageFeature({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  bullets,
  cta,
  reverse = false,
  icon: Icon,
  className,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  bullets?: string[];
  cta?: { label: string; href: string };
  reverse?: boolean;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14",
        className,
      )}
    >
      {/* Media */}
      <div className={cn("relative", reverse ? "lg:order-2" : "lg:order-1")}>
        <Photo
          src={image}
          alt={imageAlt}
          overlay="feature"
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="aspect-[4/3] w-full rounded-3xl shadow-lift ring-1 ring-navy-900/5"
        />
      </div>

      {/* Content */}
      <div className={cn(reverse ? "lg:order-1" : "lg:order-2")}>
        {eyebrow ? (
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-600">
            {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
            {eyebrow}
          </span>
        ) : null}
        <h3 className="mt-3 text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
          {title}
        </h3>
        <p className="mt-4 text-base leading-relaxed text-navy-600">{description}</p>

        {bullets && bullets.length > 0 ? (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-navy-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        ) : null}

        {cta ? (
          <Link
            href={cta.href}
            className="mt-8 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card-hover focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            {cta.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
