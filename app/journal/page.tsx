import { BookOpen } from "lucide-react";
import JournalCard from "@/components/journal/JournalCard";
import EmptyStateCard from "@/components/layout/EmptyStateCard";
import PageHeader from "@/components/layout/PageHeader";
import PageShell from "@/components/layout/PageShell";
import { getJournalEntries } from "@/lib/journal";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mindset Journal",
  description:
    "Daily reflections on mood, energy, discipline, and mental growth during the VG 2.0 transformation.",
};

export default async function JournalPage() {
  const { data: entries, error } = await getJournalEntries();

  return (
    <PageShell maxWidth="3xl">
      <PageHeader
        eyebrow="Mental Growth Log"
        title="Mindset Journal"
        description="Honest daily reflections on mood, energy, discipline, wins, and failures."
        meta={
          entries && entries.length > 0 ? (
            <p className="mt-4 text-sm text-[#A3A3A3]">
              {entries.length}{" "}
              {entries.length === 1 ? "entry" : "entries"} recorded
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

      {!entries?.length && !error ? (
        <EmptyStateCard
          icon={BookOpen}
          title="No journal entries yet"
          message="Capture mood, wins, and reflections as you progress through the mission."
          action={{ label: "Open admin journal", href: "/admin/journal" }}
        />
      ) : (
        <div className="space-y-6">
          {entries?.map((entry, index) => (
            <JournalCard key={entry.id} entry={entry} index={index} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
