import Link from "next/link";
import { Images } from "lucide-react";
import GalleryCard from "@/components/gallery/GalleryCard";
import PageHeader from "@/components/layout/PageHeader";
import PageShell from "@/components/layout/PageShell";
import { getGalleryEntries, getGalleryPageContent } from "@/lib/gallery";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Transformation Gallery — VG 2.0",
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
            <Images className="size-6 text-[#D4AF37]" aria-hidden />
          </div>
          <p className="text-lg font-medium text-[#F5F5F5]">
            No gallery photos yet. Check back as the journey unfolds.
          </p>
          <Link
            href="/journey"
            className={cn(
              "mt-6 inline-flex items-center rounded-full border border-[#D4AF37]/40 px-6 py-2.5",
              "text-sm font-semibold text-[#D4AF37] transition-colors duration-300",
              "hover:bg-[#D4AF37]/10"
            )}
          >
            View Journey Timeline
          </Link>
        </div>
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
