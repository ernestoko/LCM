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
      { label: "Requests", href: "/requests", icon: "Inbox", permission: "requests.view" },
      { label: "Shipments", href: "/shipments", icon: "Package", permission: "shipments.view" },
      { label: "Package Intake", href: "/intake", icon: "ScanLine", permission: "intake.manage" },
      { label: "Manifests", href: "/manifests", icon: "ClipboardList", permission: "manifests.view" },
      { label: "Operations", href: "/seal-operations", icon: "Warehouse", permission: "seal.operate" },
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
      { label: "Analytics", href: "/reports/analytics", icon: "PieChart", permission: "reports.view" },
      { label: "Settlement", href: "/reports/settlement", icon: "Scale", permission: "commission.view" },
      { label: "Pilot Tracker", href: "/reports/pilot", icon: "Gauge", permission: "reports.view" },
      { label: "Complaints", href: "/complaints", icon: "MessageSquareWarning", permission: "complaints.view" },
    ],
  },
  {
    heading: "Administration",
    items: [
      { label: "Settings", href: "/settings", icon: "Settings", permission: "settings.manage" },
      { label: "Users", href: "/settings/users", icon: "ShieldCheck", permission: "users.manage" },
      { label: "Roles & Access", href: "/settings/roles", icon: "KeyRound", permission: "users.manage" },
      { label: "Audit Logs", href: "/audit-logs", icon: "ScrollText", permission: "audit.view" },
    ],
  },
];

/** Customer portal — action-first, deliberately simple. */
export const CUSTOMER_NAV_SECTIONS: NavSection[] = [
  {
    items: [{ label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" }],
  },
  {
    heading: "Send a package",
    items: [
      { label: "Request a Pickup", href: "/request/pickup", icon: "Truck" },
      { label: "Ship to Warehouse", href: "/request/warehouse", icon: "Warehouse" },
    ],
  },
  {
    heading: "My account",
    items: [
      { label: "My Requests", href: "/requests", icon: "ClipboardList" },
      { label: "My Shipments", href: "/shipments", icon: "Package" },
      { label: "My Invoices", href: "/invoices", icon: "FileText" },
      { label: "Track a Shipment", href: "/track", icon: "Search" },
      { label: "Support", href: "/complaints", icon: "MessageSquareWarning" },
    ],
  },
];
