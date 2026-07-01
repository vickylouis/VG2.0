import { cn } from "@/lib/utils";
import { SkeletonBone } from "@/components/skeleton/SkeletonBone";
import { skeletonGalleryCardClassName } from "@/components/skeleton/skeletonTheme";

type GalleryCardSkeletonProps = {
  className?: string;
};

function GalleryCardSkeleton({ className }: GalleryCardSkeletonProps) {
  return (
    <article className={cn(skeletonGalleryCardClassName, className)} aria-hidden>
      <div className="relative aspect-[4/5] overflow-hidden bg-[#0B0B0B]">
        <SkeletonBone className="absolute inset-0 rounded-none bg-[#171717]/80" />
        <SkeletonBone className="absolute top-4 left-4 h-6 w-16 rounded-full" />
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <SkeletonBone className="size-3.5 rounded-full" />
          <SkeletonBone className="h-4 w-28" />
        </div>
        <SkeletonBone className="h-4 w-full" />
        <SkeletonBone className="h-4 w-4/5" />
      </div>
    </article>
  );
}

type GallerySkeletonProps = {
  count?: number;
  className?: string;
};

export default function GallerySkeleton({
  count = 6,
  className,
}: GallerySkeletonProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
        className
      )}
      aria-busy="true"
      aria-label="Loading gallery"
    >
      {Array.from({ length: count }).map((_, index) => (
        <GalleryCardSkeleton key={index} />
      ))}
    </div>
  );
}
