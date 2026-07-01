import PageShell from "@/components/layout/PageShell";
import { cn } from "@/lib/utils";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[24px] border border-[#D4AF37]/10 bg-[#171717]/60",
        className
      )}
    />
  );
}

export default function AnalyticsLoading() {
  return (
    <PageShell maxWidth="7xl">
      <div className="mb-10 space-y-3">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="h-10 w-72" />
        <SkeletonBlock className="h-5 w-96 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-44" />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-[380px]" />
        ))}
      </div>
    </PageShell>
  );
}
