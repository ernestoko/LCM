import type { Role } from "@/types";
import type { Permission } from "@/lib/auth/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: string; // lucide-react icon name
  /** Visible only if the user holds this permission (omitted = always). */
  permission?: Permission;
  /** Restrict to specific roles regardless of permission. */
  roles?: Role[];
}

export interface NavSection {
  heading?: string;
  items: NavItem[];
}

/**
 * Master navigation. Items are filtered per-user by permission/role in the
 * sidebar component, so a SEAL user never sees Liberty-only modules.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" }],
  },
  {
    heading: "Operations",
    items: [
      { label: "Customers", href: "/customers", icon: "Users", permission: "customers.view" },
      { label: "Shipments", href: "/shipments", icon: "Package", permission: "shipments.view" },
      { label: "Package Intake", href: "/intake", icon: "ScanLine", permission: "intake.manage" },
      { label: "Manifests", href: "/manifests", icon: "ClipboardList", permission: "manifests.view" },
      { label: "SEAL Operations", href: "/seal-operations", icon: "Warehouse", permission: "seal.operate" },
    ],
  },
  {
    heading: "Finance",
    items: [
      { label: "Invoices", href: "/invoices", icon: "FileText", permission: "invoices.view" },
      { label: "Payments", href: "/payments", icon: "Wallet", permission: "payments.view" },
      { label: "Rate Cards", href: "/rate-cards", icon: "Tag", permission: "rates.view" },
    ],
  },
  {
    heading: "Business",
    items: [
      { label: "Country Routes", href: "/country-routes", icon: "Globe", permission: "routes.view" },
      { label: "Reports", href: "/reports", icon: "BarChart3", permission: "reports.view" },
      { label: "Pilot Tracker", href: "/reports/pilot", icon: "Gauge", permission: "reports.view" },
      { label: "Complaints", href: "/complaints", icon: "MessageSquareWarning", permission: "complaints.view" },
    ],
  },
  {
    heading: "Administration",
    items: [
      { label: "Settings", href: "/settings", icon: "Settings", permission: "settings.manage" },
      { label: "Users", href: "/settings/users", icon: "ShieldCheck", permission: "users.manage" },
      { label: "Audit Logs", href: "/audit-logs", icon: "ScrollText", permission: "audit.view" },
    ],
  },
];

/** Customer portal has its own slim navigation. */
export const CUSTOMER_NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
      { label: "My Shipments", href: "/shipments", icon: "Package" },
      { label: "My Invoices", href: "/invoices", icon: "FileText" },
      { label: "Support", href: "/complaints", icon: "MessageSquareWarning" },
    ],
  },
];
