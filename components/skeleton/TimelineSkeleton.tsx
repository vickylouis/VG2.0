import { cn } from "@/lib/utils";
import { SkeletonBone } from "@/components/skeleton/SkeletonBone";
import { skeletonTimelineCardClassName } from "@/components/skeleton/skeletonTheme";

type TimelineCardSkeletonProps = {
  className?: string;
};

function TimelineCardSkeleton({ className }: TimelineCardSkeletonProps) {
  return (
    <article
      className={cn(skeletonTimelineCardClassName, className)}
      aria-hidden
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D4AF37]/10 pb-5">
        <div className="flex flex-wrap items-center gap-3">
          <SkeletonBone className="h-8 w-20 rounded-full" />
          <SkeletonBone className="h-4 w-36" />
        </div>
        <div className="space-y-2 text-right">
          <SkeletonBone className="ml-auto h-3 w-16" />
          <SkeletonBone className="ml-auto h-8 w-20" />
        </div>
      </header>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-[#D4AF37]/10 bg-[#0B0B0B]/50 px-4 py-3"
          >
            <SkeletonBone className="h-3 w-16" />
            <SkeletonBone className="mt-2 h-6 w-24" />
          </div>
        ))}
      </div>

      <footer className="mt-5 space-y-4 border-t border-[#D4AF37]/10 pt-5">
        <SkeletonBone className="h-3 w-14" />
        <SkeletonBone className="h-4 w-full" />
        <SkeletonBone className="h-4 w-5/6" />
        <div className="flex flex-wrap gap-2">
          <SkeletonBone className="h-7 w-28 rounded-full" />
          <SkeletonBone className="h-7 w-32 rounded-full" />
        </div>
      </footer>
    </article>
  );
}

type TimelineSkeletonProps = {
  count?: number;
  className?: string;
};

export default function TimelineSkeleton({
  count = 3,
  className,
}: TimelineSkeletonProps) {
  return (
    <div
      className={cn("space-y-6", className)}
      aria-busy="true"
      aria-label="Loading journey timeline"
    >
      {Array.from({ length: count }).map((_, index) => (
        <TimelineCardSkeleton key={index} />
      ))}
    </div>
  );
}
