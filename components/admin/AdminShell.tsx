"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

type AdminShellProps = {
  children: React.ReactNode;
  brandName: string;
};

export default function AdminShell({ children, brandName }: AdminShellProps) {
  const pathname = usePathname();

  if (pathname === "/admin") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <AdminSidebar brandName={brandName} />
      <main className="min-h-screen lg:pl-[280px]">{children}</main>
    </div>
  );
}
