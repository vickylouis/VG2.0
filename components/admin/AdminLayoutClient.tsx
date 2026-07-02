"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import type { Branding } from "@/lib/branding";
import { buildAdminTitle } from "@/lib/branding";

type AdminLayoutClientProps = {
  children: React.ReactNode;
  branding: Branding;
};

export default function AdminLayoutClient({
  children,
  branding,
}: AdminLayoutClientProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (pathname === "/admin" || pathname === "/admin/login") {
    return <>{children}</>;
  }

  const adminTitle = buildAdminTitle(branding);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0B0B0B]">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close admin menu"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <AdminSidebar
        brandName={branding.brandName}
        mobileOpen={mobileNavOpen}
        onNavigate={() => setMobileNavOpen(false)}
      />

      <div className="min-h-screen lg:pl-[280px]">
        <AdminTopbar
          title={adminTitle}
          onMenuClick={() => setMobileNavOpen(true)}
        />

        <main className="overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto min-w-0 w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
