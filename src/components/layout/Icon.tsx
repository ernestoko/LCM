import * as Icons from "lucide-react";

/** Render a lucide icon by its string name (used by data-driven nav). */
export function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons[name as keyof typeof Icons] ?? Icons.Circle) as React.ComponentType<{
    className?: string;
  }>;
  return <Cmp className={className} />;
}
