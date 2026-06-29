import {
  LayoutDashboard,
  Users,
  Inbox,
  Package,
  ScanLine,
  ClipboardList,
  Warehouse,
  FileText,
  Wallet,
  Tag,
  Globe,
  BarChart3,
  PieChart,
  Scale,
  Gauge,
  MessageSquareWarning,
  Settings,
  ShieldCheck,
  KeyRound,
  ScrollText,
  Truck,
  Search,
  Circle,
  type LucideIcon,
} from "lucide-react";

/**
 * Curated icon set for the data-driven sidebar nav. Importing only the icons the
 * nav uses (rather than `import * as Icons`) keeps the whole lucide-react library
 * out of the app bundle. Unknown names fall back to a neutral Circle.
 */
const NAV_ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Inbox,
  Package,
  ScanLine,
  ClipboardList,
  Warehouse,
  FileText,
  Wallet,
  Tag,
  Globe,
  BarChart3,
  PieChart,
  Scale,
  Gauge,
  MessageSquareWarning,
  Settings,
  ShieldCheck,
  KeyRound,
  ScrollText,
  Truck,
  Search,
};

/** Render a lucide icon by its string name (used by the data-driven nav). */
export function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = NAV_ICONS[name] ?? Circle;
  return <Cmp className={className} />;
}
