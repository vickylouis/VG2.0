import { Settings2 } from "lucide-react";
import SettingsSections from "@/components/admin/settings/SettingsSections";
import { getBranding } from "@/lib/branding";
import { getAppSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [{ data, error }, branding] = await Promise.all([
    getAppSettings(),
    getBranding(),
  ]);

  return (
    <div className="relative mx-auto max-w-6xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-[#D4AF37]/6 blur-[120px]"
      />

      <header className="relative z-10 mb-8">
        <p className="text-xs font-medium tracking-[0.3em] text-[#D4AF37] uppercase">
          System
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#F5F5F5] sm:text-4xl">
          Settings
        </h1>
        <p className="mt-2 max-w-xl text-[#A3A3A3]">
          Configure {branding.brandName} system behavior
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="relative z-10 mb-6 rounded-2xl border border-[#EF4444]/30 bg-[#171717] px-6 py-5"
        >
          <p className="font-medium text-[#EF4444]">Failed to load settings</p>
          <p className="mt-1 text-sm text-[#A3A3A3]">{error}</p>
        </div>
      )}

      {!error && !data && (
        <div className="relative z-10 rounded-2xl border border-[#D4AF37]/20 bg-[#171717]/80 px-6 py-12 text-center backdrop-blur-xl">
          <Settings2 className="mx-auto size-10 text-[#D4AF37]/60" aria-hidden />
          <p className="mt-4 text-lg font-medium text-[#F5F5F5]">
            No settings configured
          </p>
          <p className="mt-2 text-sm text-[#A3A3A3]">
            Add a row to the app_settings table to configure {branding.brandName}.
          </p>
        </div>
      )}

      {!error && data && (
        <SettingsSections settings={data} brandName={branding.brandName} />
      )}
    </div>
  );
}
