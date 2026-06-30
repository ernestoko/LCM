"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, Globe, Upload, Image as ImageIcon } from "lucide-react";
import { RequirePermission } from "@/components/auth/Guard";
import { uploadFile } from "@/lib/firebase/storage";
import { useActor } from "@/lib/auth/AuthProvider";
import {
  PageHeader,
  Card,
  CardBody,
  Button,
  Field,
  Input,
  Textarea,
  Select,
  Checkbox,
  InfoBanner,
  LoadingState,
  useToast,
} from "@/components/ui";
import { getSiteContentClient, saveSiteContent } from "@/lib/db/repositories/siteContent";
import {
  DEFAULT_SITE_CONTENT,
  type SiteContent,
  type SiteCard,
  type SiteStat,
  type SiteTestimonial,
} from "@/constants/siteContent";
import { MARKETING_ICON_NAMES } from "@/components/marketing/marketingIcons";

export default function SiteContentPage() {
  return (
    <RequirePermission permission="settings.manage">
      <Editor />
    </RequirePermission>
  );
}

function SectionCard({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-navy-900">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-navy-500">{hint}</p>}
        </div>
        {children}
      </CardBody>
    </Card>
  );
}

/** Image picker: live preview + upload to Storage + raw URL field. */
function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const { error: toastError } = useToast();
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile("site", file);
      onChange(url);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover ring-1 ring-navy-100" />
        ) : (
          <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-300">
            <ImageIcon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/images/… or an uploaded URL" />
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 transition-colors hover:bg-navy-50">
            <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading…" : "Upload image"}
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
        </div>
      </div>
    </Field>
  );
}

function Editor() {
  const actor = useActor();
  const { success, error: toastError } = useToast();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSiteContentClient()
      .then(setContent)
      .catch(() => setContent(DEFAULT_SITE_CONTENT));
  }, []);

  if (!content) return <LoadingState label="Loading website content…" />;

  /** Patch a top-level section immutably. */
  function patch<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setContent((c) => (c ? { ...c, [key]: value } : c));
  }

  type CardKey = "services" | "features" | "processSteps";
  function updateCard(key: CardKey, i: number, field: keyof SiteCard, value: string) {
    const list = content![key].map((item, idx) => (idx === i ? { ...item, [field]: value } : item));
    patch(key, list);
  }
  function addCard(key: CardKey) {
    patch(key, [...content![key], { iconName: MARKETING_ICON_NAMES[0], title: "New item", description: "" }]);
  }
  function removeCard(key: CardKey, i: number) {
    patch(key, content![key].filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveSiteContent(content!, { uid: actor.uid, name: actor.name });
      success("Website content saved & published.");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to save website content.");
    } finally {
      setSaving(false);
    }
  }

  const a = content.announcement;
  const h = content.hero;

  return (
    <div className="space-y-6 pb-28">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to settings
      </Link>

      <PageHeader
        title="Website Content"
        description="Edit the public website — no code changes needed. Saved changes publish to the live site within moments."
        actions={
          <Button onClick={handleSave} loading={saving} disabled={saving}>
            <Save className="h-4 w-4" /> Save &amp; publish
          </Button>
        }
      />

      <InfoBanner tone="info">
        Changes apply to the marketing site (home page hero, services, features, process, stats and
        testimonials, plus the announcement bar). Pages are cached for speed and refresh on save.
      </InfoBanner>

      {/* Announcement bar */}
      <SectionCard title="Announcement bar" hint="A dismissible banner across the top of every public page.">
        <Checkbox
          label="Show the announcement bar"
          checked={a.enabled}
          onChange={(e) => patch("announcement", { ...a, enabled: e.target.checked })}
        />
        <Field label="Text">
          <Input
            value={a.text}
            onChange={(e) => patch("announcement", { ...a, text: e.target.value })}
            placeholder="Now shipping from China to Africa…"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Link label (optional)">
            <Input
              value={a.link?.label ?? ""}
              onChange={(e) => patch("announcement", { ...a, link: { label: e.target.value, href: a.link?.href ?? "" } })}
              placeholder="See coverage"
            />
          </Field>
          <Field label="Link URL (optional)">
            <Input
              value={a.link?.href ?? ""}
              onChange={(e) => patch("announcement", { ...a, link: { label: a.link?.label ?? "", href: e.target.value } })}
              placeholder="/coverage"
            />
          </Field>
        </div>
      </SectionCard>

      {/* Hero */}
      <SectionCard title="Hero" hint="The first thing visitors see on the home page.">
        <Field label="Eyebrow">
          <Input value={h.eyebrow} onChange={(e) => patch("hero", { ...h, eyebrow: e.target.value })} />
        </Field>
        <Field label="Headline">
          <Input value={h.title} onChange={(e) => patch("hero", { ...h, title: e.target.value })} />
        </Field>
        <Field label="Highlighted words" hint="Comma-separated words within the headline to colour gold.">
          <Input
            value={h.highlights.join(", ")}
            onChange={(e) =>
              patch("hero", { ...h, highlights: e.target.value.split(",").map((w) => w.trim()).filter(Boolean) })
            }
            placeholder="USA, Ghana, China, worldwide"
          />
        </Field>
        <Field label="Subtitle">
          <Textarea value={h.subtitle} onChange={(e) => patch("hero", { ...h, subtitle: e.target.value })} rows={3} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary button label">
            <Input value={h.primaryCta.label} onChange={(e) => patch("hero", { ...h, primaryCta: { ...h.primaryCta, label: e.target.value } })} />
          </Field>
          <Field label="Primary button URL">
            <Input value={h.primaryCta.href} onChange={(e) => patch("hero", { ...h, primaryCta: { ...h.primaryCta, href: e.target.value } })} />
          </Field>
          <Field label="Secondary button label">
            <Input value={h.secondaryCta.label} onChange={(e) => patch("hero", { ...h, secondaryCta: { ...h.secondaryCta, label: e.target.value } })} />
          </Field>
          <Field label="Secondary button URL">
            <Input value={h.secondaryCta.href} onChange={(e) => patch("hero", { ...h, secondaryCta: { ...h.secondaryCta, href: e.target.value } })} />
          </Field>
        </div>
      </SectionCard>

      {/* Stats */}
      <SectionCard title="Stats band" hint="The four headline numbers.">
        <div className="space-y-3">
          {content.stats.map((stat, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-[1fr,1fr,2fr]">
              <Field label={i === 0 ? "Value" : undefined}>
                <Input
                  type="number"
                  value={stat.value}
                  onChange={(e) => patch("stats", content.stats.map((s, idx) => (idx === i ? { ...s, value: Number(e.target.value) } : s)) as SiteStat[])}
                />
              </Field>
              <Field label={i === 0 ? "Suffix" : undefined}>
                <Input
                  value={stat.suffix}
                  onChange={(e) => patch("stats", content.stats.map((s, idx) => (idx === i ? { ...s, suffix: e.target.value } : s)) as SiteStat[])}
                />
              </Field>
              <Field label={i === 0 ? "Label" : undefined}>
                <Input
                  value={stat.label}
                  onChange={(e) => patch("stats", content.stats.map((s, idx) => (idx === i ? { ...s, label: e.target.value } : s)) as SiteStat[])}
                />
              </Field>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Section images */}
      <SectionCard title="Section images" hint="Home page imagery — upload a new image or paste a URL.">
        <ImageField
          label="Air & Ocean showcase"
          value={content.media.showcaseAir}
          onChange={(url) => patch("media", { ...content.media, showcaseAir: url })}
        />
        <ImageField
          label="Warehousing & E-commerce showcase"
          value={content.media.showcaseFulfilment}
          onChange={(url) => patch("media", { ...content.media, showcaseFulfilment: url })}
        />
        <ImageField
          label="Final call-to-action background"
          value={content.media.ctaImage}
          onChange={(url) => patch("media", { ...content.media, ctaImage: url })}
        />
      </SectionCard>

      {/* Contact details (shown in the footer + structured data site-wide) */}
      <SectionCard title="Contact details" hint="Shown in the footer on every public page and in search structured data.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <Input
              value={content.contact.phone}
              onChange={(e) => patch("contact", { ...content.contact, phone: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              value={content.contact.email}
              onChange={(e) => patch("contact", { ...content.contact, email: e.target.value })}
            />
          </Field>
        </div>
        <Field label="USA address">
          <Input
            value={content.contact.addresses.usa}
            onChange={(e) => patch("contact", { ...content.contact, addresses: { ...content.contact.addresses, usa: e.target.value } })}
          />
        </Field>
        <Field label="Ghana address">
          <Input
            value={content.contact.addresses.ghana}
            onChange={(e) => patch("contact", { ...content.contact, addresses: { ...content.contact.addresses, ghana: e.target.value } })}
          />
        </Field>
        <Field label="China address">
          <Input
            value={content.contact.addresses.china}
            onChange={(e) => patch("contact", { ...content.contact, addresses: { ...content.contact.addresses, china: e.target.value } })}
          />
        </Field>
      </SectionCard>

      {/* Coverage */}
      <SectionCard title="Coverage / global network" hint="The 'Global Network' band on the home and coverage pages.">
        <Field label="Headline">
          <Input
            value={content.coverage.headline}
            onChange={(e) => patch("coverage", { ...content.coverage, headline: e.target.value })}
          />
        </Field>
        <Field label="Blurb">
          <Textarea
            value={content.coverage.blurb}
            onChange={(e) => patch("coverage", { ...content.coverage, blurb: e.target.value })}
            rows={3}
          />
        </Field>
        <Field label="Countries" hint="Comma-separated list shown in the coverage grid.">
          <Textarea
            value={content.coverage.countries.join(", ")}
            onChange={(e) =>
              patch("coverage", {
                ...content.coverage,
                countries: e.target.value.split(",").map((w) => w.trim()).filter(Boolean),
              })
            }
            rows={2}
          />
        </Field>
      </SectionCard>

      {/* Card sections: services, features, process */}
      {(
        [
          { key: "services", title: "Services", hint: "The 'What we do' grid." },
          { key: "features", title: "Why Liberty", hint: "The benefit cards." },
          { key: "processSteps", title: "How it works", hint: "The step-by-step row." },
        ] as { key: CardKey; title: string; hint: string }[]
      ).map(({ key, title, hint }) => (
        <SectionCard key={key} title={title} hint={hint}>
          <div className="space-y-4">
            {content[key].map((item, i) => (
              <div key={i} className="rounded-xl border border-navy-100 p-4">
                <div className="grid gap-3 sm:grid-cols-[10rem,1fr]">
                  <Field label="Icon">
                    <Select value={item.iconName} onChange={(e) => updateCard(key, i, "iconName", e.target.value)}>
                      {MARKETING_ICON_NAMES.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Title">
                    <Input value={item.title} onChange={(e) => updateCard(key, i, "title", e.target.value)} />
                  </Field>
                </div>
                <Field label="Description" className="mt-3">
                  <Textarea value={item.description} onChange={(e) => updateCard(key, i, "description", e.target.value)} rows={2} />
                </Field>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeCard(key, i)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addCard(key)}>
              <Plus className="h-4 w-4" /> Add {title.toLowerCase()} item
            </Button>
          </div>
        </SectionCard>
      ))}

      {/* Testimonials */}
      <SectionCard title="Testimonials" hint="Customer quotes on the home page.">
        <div className="space-y-4">
          {content.testimonials.map((t, i) => (
            <div key={i} className="rounded-xl border border-navy-100 p-4">
              <Field label="Quote">
                <Textarea
                  value={t.quote}
                  onChange={(e) =>
                    patch("testimonials", content.testimonials.map((x, idx) => (idx === i ? { ...x, quote: e.target.value } : x)) as SiteTestimonial[])
                  }
                  rows={2}
                />
              </Field>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="Name">
                  <Input value={t.name} onChange={(e) => patch("testimonials", content.testimonials.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)) as SiteTestimonial[])} />
                </Field>
                <Field label="Role">
                  <Input value={t.role} onChange={(e) => patch("testimonials", content.testimonials.map((x, idx) => (idx === i ? { ...x, role: e.target.value } : x)) as SiteTestimonial[])} />
                </Field>
                <Field label="Location / company">
                  <Input value={t.company} onChange={(e) => patch("testimonials", content.testimonials.map((x, idx) => (idx === i ? { ...x, company: e.target.value } : x)) as SiteTestimonial[])} />
                </Field>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => patch("testimonials", content.testimonials.filter((_, idx) => idx !== i))}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => patch("testimonials", [...content.testimonials, { quote: "", name: "", role: "", company: "" }])}
          >
            <Plus className="h-4 w-4" /> Add testimonial
          </Button>
        </div>
      </SectionCard>

      <div className="flex items-center justify-between rounded-xl border border-navy-100 bg-navy-50/60 px-4 py-3">
        <p className="flex items-center gap-2 text-sm text-navy-500">
          <Globe className="h-4 w-4 text-brand-500" /> Changes publish to the live website on save.
        </p>
        <Button onClick={handleSave} loading={saving} disabled={saving}>
          <Save className="h-4 w-4" /> Save &amp; publish
        </Button>
      </div>
    </div>
  );
}
