import { cn } from "@/lib/utils";

export const skeletonCardClassName = cn(
  "overflow-hidden rounded-[24px] border border-[#D4AF37]/20",
  "bg-gradient-to-br from-[#171717]/90 via-[#0B0B0B]/95 to-[#171717]/80",
  "shadow-[0_0_32px_rgba(212,175,55,0.08)] backdrop-blur-xl"
);

export const skeletonTimelineCardClassName = cn(
  "overflow-hidden rounded-2xl border border-[#D4AF37]/20 p-6 sm:p-7",
  "bg-gradient-to-br from-[#171717]/95 via-[#0B0B0B]/98 to-[#171717]/85",
  "shadow-[0_0_32px_rgba(212,175,55,0.08)] backdrop-blur-xl"
);

export const skeletonGalleryCardClassName = cn(
  "overflow-hidden rounded-2xl border border-[#D4AF37]/20",
  "bg-gradient-to-br from-[#171717]/95 via-[#0B0B0B]/98 to-[#171717]/85",
  "shadow-[0_0_32px_rgba(212,175,55,0.08)] backdrop-blur-xl"
);
