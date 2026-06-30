import Link from "next/link";
import { MapPin } from "lucide-react";
import JourneyCard from "@/components/journey/JourneyCard";
import PageHeader from "@/components/layout/PageHeader";
import PageShell from "@/components/layout/PageShell";
import { fetchJourneyData } from "@/lib/journey";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Journey Timeline — VG 2.0",
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
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#D4AF37]/25",
            "bg-gradient-to-br from-[#171717]/80 via-[#0B0B0B]/90 to-[#171717]/70",
            "px-8 py-20 text-center shadow-[0_0_40px_rgba(212,175,55,0.06)] backdrop-blur-xl"
          )}
        >
          <div
            className={cn(
              "mb-5 flex size-14 items-center justify-center rounded-2xl",
              "border border-[#D4AF37]/25 bg-[#D4AF37]/10",
              "shadow-[0_0_24px_rgba(212,175,55,0.12)]"
            )}
          >
            <MapPin className="size-6 text-[#D4AF37]" aria-hidden />
          </div>
          <p className="text-lg font-medium text-[#F5F5F5]">
            No journey records yet. Start Day 1 today.
          </p>
          <Link
            href="/admin"
            className={cn(
              "mt-6 inline-flex items-center rounded-full border border-[#D4AF37]/40 px-6 py-2.5",
              "text-sm font-semibold text-[#D4AF37] transition-colors duration-300",
              "hover:bg-[#D4AF37]/10"
            )}
          >
            Log your first day
          </Link>
        </div>
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
