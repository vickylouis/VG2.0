import { Suspense } from "react";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { getBranding } from "@/lib/branding";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const branding = await getBranding();

  return {
    title: `${branding.brandName} Admin Login`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminLoginPage() {
  const branding = await getBranding();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0B0B0B] text-[#A3A3A3]">
          Loading…
        </div>
      }
    >
      <AdminLoginForm brandName={branding.brandName} />
    </Suspense>
  );
}
