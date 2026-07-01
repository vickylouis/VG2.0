import { Images } from "lucide-react";
import GalleryCard from "@/components/gallery/GalleryCard";
import EmptyStateCard from "@/components/layout/EmptyStateCard";
import PageHeader from "@/components/layout/PageHeader";
import PageShell from "@/components/layout/PageShell";
import { getGalleryEntries, getGalleryPageContent } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Transformation Gallery",
  description: "Visual proof of the VG 2.0 transformation journey.",
};

export default async function GalleryPage() {
  const content = getGalleryPageContent();
  const { entries, error } = await getGalleryEntries();

  return (
    <PageShell maxWidth="7xl">
      <PageHeader
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        meta={
          entries.length > 0 ? (
            <p className="mt-4 text-sm text-[#A3A3A3]">
              {entries.length} {entries.length === 1 ? "photo" : "photos"}
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
          icon={Images}
          title="No gallery photos yet"
          message="Progress photos will appear here as the transformation unfolds."
          action={{ label: "View Journey Timeline", href: "/journey" }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <GalleryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
