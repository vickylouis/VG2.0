import { cn } from "@/lib/utils";

type SkeletonBoneProps = React.ComponentProps<"div">;

export function SkeletonBone({ className, ...props }: SkeletonBoneProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[#D4AF37]/10",
        className
      )}
      aria-hidden
      {...props}
    />
  );
}
