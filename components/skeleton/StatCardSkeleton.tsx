import { cn } from "@/lib/utils";
import { SkeletonBone } from "@/components/skeleton/SkeletonBone";
import { skeletonCardClassName } from "@/components/skeleton/skeletonTheme";

type StatCardSkeletonProps = {
  className?: string;
};

export default function StatCardSkeleton({ className }: StatCardSkeletonProps) {
  return (
    <article
      className={cn(skeletonCardClassName, "p-6", className)}
      aria-hidden
    >
      <div className="flex items-start justify-between gap-4">
        <SkeletonBone className="size-12 shrink-0 rounded-2xl" />
        <SkeletonBone className="h-4 w-20 rounded-full" />
      </div>

      <div className="mt-6 space-y-3">
        <SkeletonBone className="h-4 w-24" />
        <SkeletonBone className="h-10 w-32" />
        <SkeletonBone className="h-4 w-40" />
      </div>
    </article>
  );
}
