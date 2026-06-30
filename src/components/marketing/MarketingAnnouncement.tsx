import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SiteContent } from "@/constants/siteContent";

/**
 * Optional site-wide announcement bar, driven by editable content. Renders
 * nothing when disabled or empty, so it's invisible until a Super Admin turns
 * it on from the Website Content editor.
 */
export function MarketingAnnouncement({
  announcement,
}: {
  announcement: SiteContent["announcement"];
}) {
  if (!announcement?.enabled || !announcement.text?.trim()) return null;
  const link = announcement.link;
  return (
    <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-brand-900 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-sm">
        <span className="font-medium text-navy-100">{announcement.text}</span>
        {link?.href && link?.label ? (
          <Link
            href={link.href}
            className="inline-flex items-center gap-1 font-semibold text-gold-300 transition-colors hover:text-gold-200"
          >
            {link.label}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
