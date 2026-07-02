"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { navItems } from "@/components/layout/navItems";
import { cn } from "@/lib/utils";

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  isActive,
  onClick,
  className,
}: {
  href: string;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative text-sm font-medium transition-colors duration-300",
        isActive ? "text-[#D4AF37]" : "text-[#F5F5F5] hover:text-[#D4AF37]",
        className
      )}
    >
      {label}
      <span
        className={cn(
          "absolute -bottom-1 left-0 h-0.5 bg-[#D4AF37] transition-all duration-300",
          isActive ? "w-full" : "w-0 group-hover:w-full"
        )}
      />
    </Link>
  );
}

function NavItemsList({
  pathname,
  onLinkClick,
  linkClassName,
}: {
  pathname: string;
  onLinkClick?: () => void;
  linkClassName?: string;
}) {
  return (
    <>
      {navItems.map((item) => (
        <li key={item.href}>
          <NavLink
            href={item.href}
            label={item.label}
            isActive={isNavItemActive(pathname, item.href)}
            onClick={onLinkClick}
            className={linkClassName}
          />
        </li>
      ))}
    </>
  );
}

export default function Navbar({ brandName }: { brandName: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    console.log("NAVBAR BRAND APPLIED", { brandName });
  }, [brandName]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#D4AF37]/10 bg-[#0B0B0B]">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-lg font-bold tracking-wide text-[#D4AF37] transition-opacity duration-300 hover:opacity-80 sm:text-xl"
        >
          {brandName}
        </Link>

        <ul className="hidden items-center gap-6 lg:flex xl:gap-8">
          <NavItemsList pathname={pathname} />
        </ul>

        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-[#F5F5F5] transition-colors duration-300 hover:text-[#D4AF37] lg:hidden"
        >
          {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      <div
        className={cn(
          "overflow-hidden border-t border-[#D4AF37]/10 bg-[#0B0B0B] transition-all duration-300 lg:hidden",
          mobileOpen ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <ul className="flex flex-col gap-1 px-4 py-4 sm:px-6">
          <NavItemsList
            pathname={pathname}
            onLinkClick={() => setMobileOpen(false)}
            linkClassName="block py-3"
          />
        </ul>
      </div>
    </header>
  );
}
