"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (pathname === "/admin" || pathname === "/admin/login") {
    return <>{children}</>;
  }

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
        mobileOpen={mobileNavOpen}
        onNavigate={() => setMobileNavOpen(false)}
      />

      <div className="min-h-screen lg:pl-[280px]">
        <AdminTopbar onMenuClick={() => setMobileNavOpen(true)} />

        <main className="overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto min-w-0 w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
