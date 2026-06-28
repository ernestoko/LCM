"use client";

import { useMemo, useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  ChevronDown,
  Building2,
  PackageSearch,
} from "lucide-react";
import {
  Container,
  Section,
  SectionHeading,
  TrackingBar,
} from "@/components/marketing";
import { cn } from "@/lib/utils/cn";

const SERVICE_OPTIONS = [
  "Air Freight",
  "Ocean Freight",
  "Express Parcel",
  "Door-to-Door",
  "Customs Clearance",
  "Warehousing",
  "E-commerce Shipping",
] as const;

type FormState = {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  service: "",
  message: "",
};

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = "Please enter your full name.";
  if (!values.email.trim()) {
    errors.email = "Please enter your email address.";
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (!values.phone.trim()) {
    errors.phone = "Please enter a phone number.";
  } else if (values.phone.replace(/[^0-9]/g, "").length < 7) {
    errors.phone = "Please enter a valid phone number.";
  }
  if (!values.service) errors.service = "Please select a service.";
  if (!values.message.trim()) {
    errors.message = "Please tell us a little about your shipment.";
  } else if (values.message.trim().length < 10) {
    errors.message = "Please add a few more details (at least 10 characters).";
  }
  return errors;
}

const offices = [
  {
    country: "United States Office",
    flag: "USA",
    lines: ["1200 Logistics Way, Suite 410", "Houston, TX 77032, USA"],
    phone: "+1 (713) 555-0192",
  },
  {
    country: "Ghana Office",
    flag: "Ghana",
    lines: ["18 Ring Road Industrial Area", "Accra, Greater Accra, Ghana"],
    phone: "+233 30 255 0148",
  },
];

const faqs = [
  {
    q: "How do I track my shipment?",
    a: "Every shipment gets a unique tracking number when it's booked. Enter it in the tracking bar above (or on the Track page) to see live status and milestones from pickup to delivery. We also send proactive updates if anything changes.",
  },
  {
    q: "How long does delivery take?",
    a: "It depends on the lane and mode. Express parcels move in a few days, air freight typically 3–8 days, and ocean freight 18–38 days depending on origin and destination. Your quote will confirm an exact estimate for your shipment.",
  },
  {
    q: "Are there items I can't ship?",
    a: "Yes — certain goods are restricted or prohibited depending on the destination's customs rules (for example hazardous materials, perishables without proper handling, and some regulated products). Ask us before you book and we'll confirm what's allowed on your specific lane.",
  },
  {
    q: "How do I get a quote?",
    a: "Fill in the form on this page with your origin, destination and what you're shipping, and our team will respond with a transparent, all-in price. There are no hidden fees — you'll know exactly what you pay before you ship.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-navy-100 bg-white shadow-card">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-2xl"
        >
          <span className="text-base font-bold text-navy-900">{q}</span>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-brand-600 transition-transform duration-200",
              open ? "rotate-180" : "rotate-0",
            )}
            aria-hidden="true"
          />
        </button>
      </h3>
      {open ? (
        <p className="px-6 pb-5 text-sm leading-relaxed text-navy-600">{a}</p>
      ) : null}
    </div>
  );
}

export default function ContactPage() {
  const [values, setValues] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(
      `Quote request${values.service ? ` — ${values.service}` : ""}`,
    );
    const body = encodeURIComponent(
      [
        `Name: ${values.name}`,
        `Email: ${values.email}`,
        `Phone: ${values.phone}`,
        `Service of interest: ${values.service}`,
        "",
        values.message,
      ].join("\n"),
    );
    return `mailto:hello@lcmlogistics.com?subject=${subject}&body=${body}`;
  }, [values]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    // No backend — show an inline success state.
    setSubmitted(true);
  }

  function resetForm() {
    setValues(initialForm);
    setErrors({});
    setSubmitted(false);
  }

  const inputBase =
    "w-full rounded-xl border bg-white px-4 py-3 text-sm text-navy-900 placeholder:text-navy-400 transition-colors focus:outline-none focus:ring-4 focus:ring-brand-500/15";

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-navy-900 via-navy-900 to-brand-800">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-32 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl"
        />
        <Container className="relative py-16 sm:py-24">
          <SectionHeading
            eyebrow="Get in touch"
            title="Let's move your shipment"
            subtitle="Request a transparent quote, ask a question, or track an existing shipment. Our team in the USA and Ghana is ready to help — wherever you're shipping to or from."
            align="center"
            light
          />
        </Container>
      </section>

      {/* Form + details */}
      <Section className="bg-white">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
            {/* LEFT: contact form */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
                Request a quote
              </h2>
              <p className="mt-2 text-base leading-relaxed text-navy-600">
                Tell us what you're shipping and where it's headed. We'll get back
                to you with a clear, all-in price.
              </p>

              {submitted ? (
                <div className="mt-8 flex flex-col items-start rounded-2xl border border-emerald-200 bg-emerald-50 p-8 shadow-card">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-navy-900">
                    Thank you, {values.name.split(" ")[0] || "there"}!
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-700">
                    Your request has been received. A member of the LCM Logistics
                    team will reach out to{" "}
                    <span className="font-semibold">{values.email}</span> shortly
                    with your quote and next steps.
                  </p>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-800 transition-colors hover:border-brand-400 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                  >
                    Send another request
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="mt-8 space-y-5"
                  aria-label="Quote request form"
                >
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-1.5 block text-sm font-semibold text-navy-800"
                    >
                      Full name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={values.name}
                      onChange={(e) => update("name", e.target.value)}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "name-error" : undefined}
                      placeholder="Ama Mensah"
                      className={cn(
                        inputBase,
                        errors.name
                          ? "border-red-300 focus:border-red-400 focus:ring-red-500/15"
                          : "border-navy-200 focus:border-brand-400",
                      )}
                    />
                    {errors.name ? (
                      <p id="name-error" className="mt-1.5 text-xs text-red-600">
                        {errors.name}
                      </p>
                    ) : null}
                  </div>

                  {/* Email + phone */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-1.5 block text-sm font-semibold text-navy-800"
                      >
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={values.email}
                        onChange={(e) => update("email", e.target.value)}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? "email-error" : undefined}
                        placeholder="you@example.com"
                        className={cn(
                          inputBase,
                          errors.email
                            ? "border-red-300 focus:border-red-400 focus:ring-red-500/15"
                            : "border-navy-200 focus:border-brand-400",
                        )}
                      />
                      {errors.email ? (
                        <p id="email-error" className="mt-1.5 text-xs text-red-600">
                          {errors.email}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-1.5 block text-sm font-semibold text-navy-800"
                      >
                        Phone
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={values.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        aria-invalid={Boolean(errors.phone)}
                        aria-describedby={errors.phone ? "phone-error" : undefined}
                        placeholder="+1 (713) 555-0100"
                        className={cn(
                          inputBase,
                          errors.phone
                            ? "border-red-300 focus:border-red-400 focus:ring-red-500/15"
                            : "border-navy-200 focus:border-brand-400",
                        )}
                      />
                      {errors.phone ? (
                        <p id="phone-error" className="mt-1.5 text-xs text-red-600">
                          {errors.phone}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Service */}
                  <div>
                    <label
                      htmlFor="service"
                      className="mb-1.5 block text-sm font-semibold text-navy-800"
                    >
                      Service of interest
                    </label>
                    <select
                      id="service"
                      name="service"
                      value={values.service}
                      onChange={(e) => update("service", e.target.value)}
                      aria-invalid={Boolean(errors.service)}
                      aria-describedby={errors.service ? "service-error" : undefined}
                      className={cn(
                        inputBase,
                        values.service ? "text-navy-900" : "text-navy-400",
                        errors.service
                          ? "border-red-300 focus:border-red-400 focus:ring-red-500/15"
                          : "border-navy-200 focus:border-brand-400",
                      )}
                    >
                      <option value="" disabled>
                        Select a service
                      </option>
                      {SERVICE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.service ? (
                      <p id="service-error" className="mt-1.5 text-xs text-red-600">
                        {errors.service}
                      </p>
                    ) : null}
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="message"
                      className="mb-1.5 block text-sm font-semibold text-navy-800"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={values.message}
                      onChange={(e) => update("message", e.target.value)}
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={errors.message ? "message-error" : undefined}
                      placeholder="What are you shipping, and where to and from? Include approximate weight or dimensions if you have them."
                      className={cn(
                        inputBase,
                        "resize-y",
                        errors.message
                          ? "border-red-300 focus:border-red-400 focus:ring-red-500/15"
                          : "border-navy-200 focus:border-brand-400",
                      )}
                    />
                    {errors.message ? (
                      <p id="message-error" className="mt-1.5 text-xs text-red-600">
                        {errors.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 text-base font-semibold text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                    >
                      Send request
                      <Send className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <a
                      href={mailtoHref}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-navy-200 bg-white px-5 py-3.5 text-sm font-semibold text-navy-800 transition-colors hover:border-brand-400 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                    >
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      Email us instead
                    </a>
                  </div>
                  <p className="text-xs text-navy-500">
                    We typically respond within one business day.
                  </p>
                </form>
              )}
            </div>

            {/* RIGHT: contact details */}
            <div className="space-y-8">
              {/* Quick contact */}
              <div className="rounded-2xl border border-navy-100 bg-navy-50 p-7 shadow-card">
                <h2 className="text-lg font-bold text-navy-900">
                  Contact details
                </h2>
                <dl className="mt-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                      <Phone className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-navy-500">
                        Phone
                      </dt>
                      <dd>
                        <a
                          href="tel:+17135550192"
                          className="text-sm font-semibold text-navy-900 hover:text-brand-700"
                        >
                          +1 (713) 555-0192
                        </a>
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                      <Mail className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-navy-500">
                        Email
                      </dt>
                      <dd>
                        <a
                          href="mailto:hello@lcmlogistics.com"
                          className="text-sm font-semibold text-navy-900 hover:text-brand-700"
                        >
                          hello@lcmlogistics.com
                        </a>
                      </dd>
                    </div>
                  </div>
                </dl>
              </div>

              {/* Offices */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {offices.map((office) => (
                  <div
                    key={office.country}
                    className="rounded-2xl border border-navy-100 bg-white p-6 shadow-card"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-white">
                        <Building2 className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <h3 className="text-sm font-bold text-navy-900">
                        {office.country}
                      </h3>
                    </div>
                    <address className="mt-4 space-y-1 text-sm not-italic leading-relaxed text-navy-600">
                      {office.lines.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </address>
                    <a
                      href={`tel:${office.phone.replace(/[^0-9+]/g, "")}`}
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
                    >
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      {office.phone}
                    </a>
                  </div>
                ))}
              </div>

              {/* Business hours */}
              <div className="rounded-2xl border border-navy-100 bg-white p-7 shadow-card">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-50 text-gold-600 ring-1 ring-inset ring-gold-100">
                    <Clock className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-bold text-navy-900">
                    Business hours
                  </h3>
                </div>
                <ul className="mt-5 space-y-2 text-sm text-navy-600">
                  <li className="flex items-center justify-between gap-4">
                    <span>Monday – Friday</span>
                    <span className="font-semibold text-navy-900">
                      8:00 AM – 6:00 PM
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    <span>Saturday</span>
                    <span className="font-semibold text-navy-900">
                      9:00 AM – 2:00 PM
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    <span>Sunday</span>
                    <span className="font-semibold text-navy-900">Closed</span>
                  </li>
                </ul>
                <p className="mt-4 flex items-center gap-2 rounded-xl bg-navy-50 px-3 py-2 text-xs text-navy-600 ring-1 ring-inset ring-navy-100">
                  <Clock className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                  Online tracking and quote requests are available 24/7.
                </p>
              </div>

              {/* Inline tracking */}
              <div className="rounded-2xl border border-navy-100 bg-navy-50 p-7 shadow-card">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                    <PackageSearch className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-bold text-navy-900">
                    Track a shipment
                  </h3>
                </div>
                <p className="mt-2 text-sm text-navy-600">
                  Already shipping with us? Check the live status of your cargo.
                </p>
                <div className="mt-4">
                  <TrackingBar variant="inline" />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section className="bg-navy-50">
        <Container>
          <SectionHeading
            eyebrow="Questions, answered"
            title="Frequently asked questions"
            subtitle="A few of the things customers ask us most. Don't see your question? Reach out and we'll be glad to help."
            align="center"
          />
          <div className="mx-auto mt-12 max-w-3xl space-y-4">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
          <p className="mt-10 flex items-center justify-center gap-2 text-sm font-medium text-navy-600">
            <MapPin className="h-4 w-4 text-gold-500" aria-hidden="true" />
            Hubs in the USA &amp; Ghana, serving customers across Africa and the
            wider world.
          </p>
        </Container>
      </Section>
    </>
  );
}
