import {
  ArrowLeftRight,
  ChartColumn,
  LayoutDashboard,
  Package,
  Settings,
  Tags,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "Inventory health at a glance",
      },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        label: "Products",
        href: "/products",
        icon: Package,
        description: "Items, pricing, and stock levels",
      },
      {
        label: "Categories",
        href: "/categories",
        icon: Tags,
        description: "Group products into categories",
      },
      {
        label: "Suppliers",
        href: "/suppliers",
        icon: Truck,
        description: "Vendors and contact details",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Stock movements",
        href: "/stock-movements",
        icon: ArrowLeftRight,
        description: "The auditable stock ledger",
      },
      {
        label: "Reports",
        href: "/reports",
        icon: ChartColumn,
        description: "Valuation and stock reports",
      },
    ],
  },
];

export const settingsNavItem: NavItem = {
  label: "Settings",
  href: "/settings",
  icon: Settings,
  description: "Account and workspace preferences",
};

export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
