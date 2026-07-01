"use client";

import { useState, type ElementType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ClipboardCheck,
  History,
  Image as ImageIcon,
  LogOut,
  Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { signOut } from "@/lib/auth";
import { cn } from "@/lib/utils";

type AdminNavItem = {
  label: string;
  href: string;
  icon: ElementType;
  badge?: string;
};

type AdminNavSection = {
  label: string;
  items: AdminNavItem[];
};

const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
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
    items: [{ label: "History", href: "/admin/history", icon: History }],
  },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AdminSidebarProps = {
  className?: string;
  onNavigate?: () => void;
  mobileOpen?: boolean;
};

export default function AdminSidebar({
  className,
  onNavigate,
  mobileOpen = false,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);

    const { error } = await signOut();

    if (error) {
      toast.error(error || "Something went wrong");
      setIsSigningOut(false);
      return;
    }

    toast.success("Logged out");
    onNavigate?.();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-screen w-[280px] flex-col",
        "border-r border-[#D4AF37]/15 bg-[#0B0B0B]/90 backdrop-blur-xl",
        "shadow-[0_0_40px_rgba(212,175,55,0.08)]",
        "transition-transform duration-300 ease-in-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 size-48 rounded-full bg-[#D4AF37]/8 blur-3xl"
      />

      <div className="relative border-b border-[#D4AF37]/10 px-6 py-6">
        <Link
          href="/admin/checkin"
          onClick={onNavigate}
          className="block transition-opacity duration-300 hover:opacity-80"
        >
          <p className="text-xl font-bold tracking-wide text-[#F5F5F5]">
            VG 2.0
          </p>
          <p className="mt-1 text-xs font-semibold tracking-[0.25em] text-[#D4AF37] uppercase">
            Admin Panel
          </p>
        </Link>
      </div>

      <nav aria-label="Admin" className="relative flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-6">
          {ADMIN_NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="mb-2 px-3.5 text-[10px] font-semibold tracking-[0.2em] text-[#A3A3A3] uppercase">
                {section.label}
              </p>
              <ul className="space-y-1.5">
                {section.items.map((item) => {
                  const isActive = isNavActive(pathname, item.href);
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium",
                          "border transition-all duration-300",
                          isActive
                            ? "border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_24px_rgba(212,175,55,0.18)]"
                            : cn(
                                "border-transparent text-[#A3A3A3]",
                                "hover:border-[#D4AF37]/20 hover:bg-[#171717]/80 hover:text-[#F5F5F5]",
                                "hover:shadow-[0_0_20px_rgba(212,175,55,0.12)]"
                              )
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-[18px] shrink-0 transition-colors duration-300",
                            isActive
                              ? "text-[#D4AF37]"
                              : "text-[#A3A3A3] group-hover:text-[#D4AF37]"
                          )}
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="rounded-full bg-[#D4AF37] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#0B0B0B]">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="relative border-t border-[#D4AF37]/10 px-4 py-4">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isSigningOut}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/25 px-3.5 py-3",
            "text-sm font-medium text-[#A3A3A3] transition-all duration-300",
            "hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <LogOut className="size-4" aria-hidden />
          {isSigningOut ? "Signing out…" : "Log Out"}
        </button>
      </div>
    </aside>
  );
}
