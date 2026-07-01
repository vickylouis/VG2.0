import { cn } from "@/lib/utils";
import { SkeletonBone } from "@/components/skeleton/SkeletonBone";

type PageHeaderSkeletonProps = {
  className?: string;
};

export default function PageHeaderSkeleton({
  className,
}: PageHeaderSkeletonProps) {
  return (
    <header
      className={cn("mb-10 space-y-3 text-center sm:text-left", className)}
      aria-hidden
    >
      <SkeletonBone className="mx-auto h-3 w-36 sm:mx-0" />
      <SkeletonBone className="mx-auto h-10 w-64 max-w-full sm:mx-0" />
      <SkeletonBone className="mx-auto h-5 w-full max-w-xl sm:mx-0" />
      <SkeletonBone className="mx-auto mt-4 h-4 w-32 sm:mx-0" />
    </header>
  );
}
