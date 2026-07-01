import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Photo } from "./Photo";

export function ServiceCard({
  icon: Icon,
  title,
  description,
  href,
  image,
  imageAlt,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  /** Optional photo header — turns the card into a richer image tile. */
  image?: string;
  imageAlt?: string;
  className?: string;
}) {
  const content = (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover",
        className,
      )}
    >
      {image ? (
        <div className="relative">
          <Photo
            src={image}
            alt={imageAlt ?? title}
            overlay="navy"
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="h-40 w-full transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <span className="absolute bottom-3 left-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 text-brand-600 shadow-card ring-1 ring-inset ring-brand-100">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        {!image ? (
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
        ) : null}
        <h3 className="text-lg font-bold text-navy-900">{title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-navy-600">{description}</p>
        {href ? (
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
            Learn more
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        ) : null}
      </div>

      {/* Gold accent edge on hover */}
      <span
        className="pointer-events-none absolute inset-x-6 bottom-0 h-0.5 origin-left scale-x-0 rounded-full bg-gold-400 transition-transform duration-300 group-hover:scale-x-100"
        aria-hidden="true"
      />
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-2xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        {content}
      </Link>
    );
  }

  return content;
}
