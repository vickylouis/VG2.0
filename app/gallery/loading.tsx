import PageShell from "@/components/layout/PageShell";
import GallerySkeleton from "@/components/skeleton/GallerySkeleton";
import PageHeaderSkeleton from "@/components/skeleton/PageHeaderSkeleton";

export default function GalleryLoading() {
  return (
    <PageShell maxWidth="7xl">
      <PageHeaderSkeleton />
      <GallerySkeleton />
    </PageShell>
  );
}
