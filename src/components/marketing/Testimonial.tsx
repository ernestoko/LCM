import { Quote } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type TestimonialItem = {
  quote: string;
  name: string;
  role: string;
  company?: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Testimonial({
  quote,
  name,
  role,
  company,
  className,
}: TestimonialItem & { className?: string }) {
  return (
    <figure
      className={cn(
        "flex h-full flex-col rounded-2xl border border-navy-100 bg-white p-7 shadow-card transition-shadow duration-300 hover:shadow-card-hover",
        className,
      )}
    >
      <Quote className="h-8 w-8 text-gold-400" aria-hidden="true" />
      <blockquote className="mt-4 flex-1 text-base leading-relaxed text-navy-700">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-navy-100 pt-5">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white"
          aria-hidden="true"
        >
          {initials(name)}
        </span>
        <span className="flex flex-col">
          <span className="text-sm font-bold text-navy-900">{name}</span>
          <span className="text-xs text-navy-500">
            {role}
            {company ? `, ${company}` : ""}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
