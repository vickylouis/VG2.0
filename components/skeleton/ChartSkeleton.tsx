import { cn } from "@/lib/utils";
import { chartCardClassName } from "@/components/charts/chartTheme";
import { SkeletonBone } from "@/components/skeleton/SkeletonBone";

const CHART_BAR_HEIGHTS = [42, 68, 54, 82, 61, 74, 48, 88, 58, 70] as const;

type ChartSkeletonProps = {
  className?: string;
  withHeader?: boolean;
  withCard?: boolean;
};

export default function ChartSkeleton({
  className,
  withHeader = true,
  withCard = true,
}: ChartSkeletonProps) {
  const chartBody = (
    <div
      className={cn(
        "flex h-[280px] items-end gap-2 rounded-2xl border border-[#D4AF37]/10 bg-[#0B0B0B]/40 px-4 py-5 sm:h-[320px]",
        !withCard && className
      )}
      aria-hidden
    >
      {CHART_BAR_HEIGHTS.map((height, index) => (
        <SkeletonBone
          key={index}
          className="flex-1 rounded-t-md"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );

  if (!withCard) {
    return chartBody;
  }

  return (
    <article className={chartCardClassName(className)} aria-hidden>
      {withHeader && (
        <header className="mb-6 space-y-2">
          <SkeletonBone className="h-7 w-48" />
          <SkeletonBone className="h-4 w-64 max-w-full" />
        </header>
      )}

      {chartBody}
    </article>
  );
}
