import PageHeader from "@/components/layout/PageHeader";
import PageShell from "@/components/layout/PageShell";
import GalleryPlaceholder from "@/components/gallery/GalleryPlaceholder";
import { fetchGalleryData, getGalleryPageContent } from "@/lib/gallery";

export const metadata = {
  title: "Transformation Gallery — VG 2.0",
  description: "Visual progress and milestone snapshots from the VG 2.0 journey.",
};

export default async function GalleryPage() {
  const content = getGalleryPageContent();
  const { items } = await fetchGalleryData();

  return (
    <PageShell maxWidth="4xl">
      <PageHeader
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        meta={
          items.length > 0 ? (
            <p className="mt-4 text-sm text-[#A3A3A3]">
              {items.length} {items.length === 1 ? "photo" : "photos"}
            </p>
          ) : undefined
        }
      />

      <GalleryPlaceholder />
    </PageShell>
  );
}
