import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Container } from "./Container";
import { MButton } from "./MButton";
import { Photo } from "./Photo";

export function CTASection({
  title,
  subtitle,
  primary,
  secondary,
  image,
  imageAlt,
  className,
}: {
  title: string;
  subtitle?: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  /** Optional background photo (rendered under a heavy navy/brand wash). */
  image?: string;
  imageAlt?: string;
  className?: string;
}) {
  return (
    <section className={cn("py-16 sm:py-20", className)}>
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-900 to-brand-800 px-6 py-14 shadow-lift sm:px-12 sm:py-16 lg:px-16">
          {/* Optional photo background */}
          {image ? (
            <Photo
              src={image}
              alt={imageAlt ?? ""}
              overlay="hero"
              sizes="100vw"
              className="absolute inset-0"
            />
          ) : null}

          {/* Decorative glow + gold accent line */}
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute left-0 top-0 h-1.5 w-32 rounded-br-full bg-gold-400"
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy-200 sm:text-lg">
                {subtitle}
              </p>
            ) : null}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <MButton href={primary.href} variant="light" size="lg">
                {primary.label}
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </MButton>
              {secondary ? (
                <MButton
                  href={secondary.href}
                  variant="outline"
                  size="lg"
                  className="border-white/30 bg-white/5 text-white hover:border-white/60 hover:bg-white/10 hover:text-white"
                >
                  {secondary.label}
                </MButton>
              ) : null}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
