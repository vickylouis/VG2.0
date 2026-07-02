import AdminLayoutClient from "@/components/admin/AdminLayoutClient";
import { getBranding } from "@/lib/branding";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const branding = await getBranding();

  return (
    <AdminLayoutClient branding={branding}>{children}</AdminLayoutClient>
  );
}
