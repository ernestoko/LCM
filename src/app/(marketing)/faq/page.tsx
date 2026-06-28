"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, MessageCircle, Phone, Mail, HelpCircle } from "lucide-react";
import { Container } from "@/components/marketing/Container";
import { FAQ_CATEGORIES, ALL_FAQS } from "@/constants/faq";
import { BUSINESS } from "@/constants/business";
import { cn } from "@/lib/utils/cn";

const telHref = `tel:${BUSINESS.phone.replace(/[^\d+]/g, "")}`;
const mailHref = `mailto:${BUSINESS.email}`;

// FAQPage structured data — helps the page surface rich results in search.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ALL_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FaqPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return null;
    return ALL_FAQS.filter((f) => {
      const hay = `${f.q} ${f.a} ${(f.keywords ?? []).join(" ")} ${f.category}`.toLowerCase();
      return q.split(/\s+/).every((w) => hay.includes(w));
    });
  }, [q]);

  const toggle = (id: string) => setOpen((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-900 to-brand-900 py-20 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl" />
        <Container className="relative">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-300">
              <HelpCircle className="h-3.5 w-3.5" /> Help Center
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-4 text-lg text-navy-200">
              Everything you need to know about shipping by air and sea — pricing, tracking,
              payment, customs and delivery.
            </p>

            {/* Search */}
            <div className="relative mx-auto mt-8 max-w-lg">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions…"
                aria-label="Search FAQs"
                className="w-full rounded-xl border border-white/15 bg-white/95 py-3.5 pl-12 pr-4 text-navy-900 shadow-lift outline-none placeholder:text-navy-400 focus:ring-2 focus:ring-gold-400"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Content */}
      <section className="py-16">
        <Container>
          {results ? (
            <div className="mx-auto max-w-3xl">
              <p className="mb-6 text-sm text-navy-500">
                {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
              </p>
              {results.length === 0 ? (
                <div className="rounded-2xl border border-navy-100 bg-navy-50/50 p-8 text-center">
                  <p className="font-semibold text-navy-900">No matching answers</p>
                  <p className="mt-1 text-sm text-navy-500">
                    Try different words, or reach our team directly below.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {results.map((f, i) => {
                    const id = `r-${i}`;
                    return (
                      <FaqRow key={id} id={id} q={f.q} a={f.a} tag={f.category} open={!!open[id]} onToggle={toggle} />
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <div className="mx-auto max-w-5xl space-y-14">
              {FAQ_CATEGORIES.map((cat) => (
                <div key={cat.key} className="grid gap-8 lg:grid-cols-[260px_1fr]">
                  <div className="lg:sticky lg:top-24 lg:self-start">
                    <h2 className="text-xl font-bold text-navy-900">{cat.title}</h2>
                    {cat.description && (
                      <p className="mt-2 text-sm text-navy-500">{cat.description}</p>
                    )}
                  </div>
                  <ul className="space-y-3">
                    {cat.items.map((item, i) => {
                      const id = `${cat.key}-${i}`;
                      return (
                        <FaqRow
                          key={id}
                          id={id}
                          q={item.q}
                          a={item.a}
                          open={!!open[id]}
                          onToggle={toggle}
                        />
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* Contact CTA */}
      <section className="border-t border-navy-100 bg-navy-50/60 py-16">
        <Container>
          <div className="mx-auto max-w-3xl rounded-3xl bg-gradient-to-br from-navy-900 to-brand-900 p-10 text-center text-white shadow-lift">
            <h2 className="text-2xl font-bold">Still have questions?</h2>
            <p className="mt-2 text-navy-200">
              Our team is here to help. Reach us any way that suits you.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-5 py-3 text-sm font-semibold text-navy-950 transition-transform hover:-translate-y-0.5"
              >
                <MessageCircle className="h-4 w-4" /> Contact us
              </Link>
              <a
                href={telHref}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Phone className="h-4 w-4" /> {BUSINESS.phone}
              </a>
              <a
                href={mailHref}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Mail className="h-4 w-4" /> Email
              </a>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

function FaqRow({
  id,
  q,
  a,
  tag,
  open,
  onToggle,
}: {
  id: string;
  q: string;
  a: string;
  tag?: string;
  open: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <li className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card transition-shadow hover:shadow-card-hover">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="flex items-center gap-3">
          <span className="font-semibold text-navy-900">{q}</span>
          {tag && (
            <span className="hidden rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-medium text-navy-500 sm:inline">
              {tag}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-brand-600 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-[15px] leading-relaxed text-navy-600">{a}</p>
        </div>
      </div>
    </li>
  );
}
