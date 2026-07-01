import PageShell from "@/components/layout/PageShell";
import ChartSkeleton from "@/components/skeleton/ChartSkeleton";
import PageHeaderSkeleton from "@/components/skeleton/PageHeaderSkeleton";
import StatCardSkeleton from "@/components/skeleton/StatCardSkeleton";
import { SkeletonBone } from "@/components/skeleton/SkeletonBone";
import { skeletonCardClassName } from "@/components/skeleton/skeletonTheme";
import { cn } from "@/lib/utils";

export default function AnalyticsLoading() {
  return (
    <PageShell maxWidth="7xl">
      <PageHeaderSkeleton />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <ChartSkeleton key={index} />
        ))}
      </div>

      <article
        className={cn(skeletonCardClassName, "mt-8 p-6 sm:p-8")}
        aria-hidden
      >
        <div className="mb-6 flex items-center gap-3">
          <SkeletonBone className="size-11 rounded-2xl" />
          <div className="space-y-2">
            <SkeletonBone className="h-6 w-32" />
            <SkeletonBone className="h-4 w-56 max-w-full" />
          </div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBone key={index} className="h-4 w-full" />
          ))}
          <SkeletonBone className="h-4 w-4/5" />
        </div>
      </article>
    </PageShell>
  );
}
