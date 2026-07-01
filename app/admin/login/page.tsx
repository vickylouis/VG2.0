import { Suspense } from "react";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0B0B0B] text-[#A3A3A3]">
          Loading…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
