import { cn } from "@/lib/utils/cn";
import { Testimonial, type TestimonialItem } from "./Testimonial";

export function TestimonialGrid({
  items,
  className,
}: {
  items: TestimonialItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {items.map((item) => (
        <Testimonial key={`${item.name}-${item.quote.slice(0, 24)}`} {...item} />
      ))}
    </div>
  );
}
