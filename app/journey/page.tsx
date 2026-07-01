import { MapPin } from "lucide-react";
import JourneyCard from "@/components/journey/JourneyCard";
import EmptyStateCard from "@/components/layout/EmptyStateCard";
import PageHeader from "@/components/layout/PageHeader";
import PageShell from "@/components/layout/PageShell";
import { fetchJourneyData } from "@/lib/journey";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Journey Timeline",
  description: "Every day of the VG 2.0 transformation, logged and tracked.",
};

export default async function JourneyPage() {
  const { entries, error } = await fetchJourneyData();

  return (
    <PageShell>
      <PageHeader
        eyebrow="Transformation Log"
        title="Journey Timeline"
        description="Every logged day of the VG 2.0 mission — metrics, discipline, and progress in one place."
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
            <JourneyCard key={entry.id} entry={entry} index={index} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
