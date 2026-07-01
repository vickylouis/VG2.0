import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ClipboardCheck,
  History,
  Image as ImageIcon,
  Rocket,
  Settings,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export type AdminNavSection = {
  label: string;
  items: AdminNavItem[];
};

export const adminNavSections: AdminNavSection[] = [
  {
    label: "Daily Operations",
    items: [
      {
        label: "Check-In",
        href: "/admin/checkin",
        icon: ClipboardCheck,
        badge: "DAILY",
      },
      { label: "Mission", href: "/mission", icon: Rocket },
      { label: "Gallery", href: "/admin/gallery", icon: ImageIcon },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { label: "History", href: "/admin/history", icon: History },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
