import type { ReactNode } from "react";
import { Container, Section, SectionHeading } from "@/components/marketing";
import { Reveal } from "@/components/marketing/motion";

/**
 * Shared renderer for the public legal / policy pages (Terms, Privacy, Shipping
 * Policy, Prohibited Items). Data-driven so each page is just a title + a list
 * of sections — keeping the four pages visually consistent and easy to edit.
 */

export interface PolicySection {
  heading: string;
  /** Plain paragraphs of body copy. */
  paragraphs?: string[];
  /** Optional bulleted list rendered after the paragraphs. */
  bullets?: string[];
}

export interface PolicyPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  /** Human-readable effective/updated date, e.g. "30 June 2026". */
  updated: string;
  sections: PolicySection[];
  /** Optional closing note (e.g. how to contact us about this policy). */
  closing?: ReactNode;
}

export function PolicyPage({
  eyebrow,
  title,
  intro,
  updated,
  sections,
  closing,
}: PolicyPageProps) {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-navy-950">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-32 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl"
        />
        <Container className="relative py-16 sm:py-20">
          <Reveal mode="load" delay={0.1}>
            <SectionHeading eyebrow={eyebrow} title={title} subtitle={intro} align="center" light />
          </Reveal>
          <Reveal mode="load" delay={0.2}>
            <p className="mt-6 text-center text-xs font-medium uppercase tracking-wider text-navy-300">
              Last updated: {updated}
            </p>
          </Reveal>
        </Container>
      </section>

      {/* Body */}
      <Section className="bg-white">
        <Container>
          <div className="mx-auto max-w-3xl">
            {sections.map((section, i) => (
              <Reveal key={section.heading} delay={i === 0 ? 0 : 0.02}>
                <div className={i === 0 ? "" : "mt-10"}>
                  <h2 className="text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">
                    {section.heading}
                  </h2>
                  {section.paragraphs?.map((p, j) => (
                    <p key={j} className="mt-3 text-base leading-relaxed text-navy-600">
                      {p}
                    </p>
                  ))}
                  {section.bullets && section.bullets.length > 0 ? (
                    <ul className="mt-4 space-y-2">
                      {section.bullets.map((b, j) => (
                        <li key={j} className="flex gap-3 text-base leading-relaxed text-navy-600">
                          <span
                            aria-hidden="true"
                            className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500"
                          />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </Reveal>
            ))}

            {closing ? (
              <Reveal delay={0.02}>
                <div className="mt-12 rounded-2xl border border-navy-100 bg-navy-50 p-6 text-sm leading-relaxed text-navy-600 shadow-card">
                  {closing}
                </div>
              </Reveal>
            ) : null}
          </div>
        </Container>
      </Section>
    </>
  );
}
