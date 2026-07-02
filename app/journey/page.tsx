import { MapPin } from "lucide-react";
import JourneyCard from "@/components/journey/JourneyCard";
import EmptyStateCard from "@/components/layout/EmptyStateCard";
import PageHeader from "@/components/layout/PageHeader";
import PageShell from "@/components/layout/PageShell";
import { getBranding } from "@/lib/branding";
import { fetchJourneyData } from "@/lib/journey";
import { getResolvedAppSettings } from "@/lib/appSettings";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const branding = await getBranding();

  return {
    title: "Journey Timeline",
    description: `Every day of the ${branding.brandName} transformation, logged and tracked.`,
  };
}

export default async function JourneyPage() {
  const [{ entries, error }, settings, branding] = await Promise.all([
    fetchJourneyData(),
    getResolvedAppSettings(),
    getBranding(),
  ]);
  const gradeBands = settings.scoring.vg_grade_bands;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Transformation Log"
        title={`${branding.brandName} Journey`}
        description={`Every logged day of the ${branding.brandName} mission — metrics, discipline, and progress in one place.`}
        meta={
          entries.length > 0 ? (
            <p className="mt-4 text-sm text-[#A3A3A3]">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}{" "}
              recorded
            </p>
          ) : undefined
        }
      />

      {error && (
        <p
          role="alert"
          className="mb-6 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#EF4444]"
        >
          {error}
        </p>
      )}

      {entries.length === 0 && !error ? (
        <EmptyStateCard
          icon={MapPin}
          title="No journey records yet"
          message="Log your first day to start building your transformation timeline."
          action={{ label: "Log your first day", href: "/admin" }}
        />
      ) : (
        <div className="space-y-6">
          {entries.map((entry, index) => (
            <JourneyCard
              key={entry.id}
              entry={entry}
              index={index}
              gradeBands={gradeBands}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
