import Image from "next/image";
import { Camera } from "lucide-react";
import type { GalleryEntry } from "@/lib/gallery";
import { cn } from "@/lib/utils";

type GalleryCardProps = {
  entry: GalleryEntry;
};

function resolvePoseType(entry: GalleryEntry): string {
  return entry.pose_type?.trim() || "Progress Photo";
}

export default function GalleryCard({ entry }: GalleryCardProps) {
  const poseType = resolvePoseType(entry);
  const hasValidImage =
    typeof entry.image_url === "string" &&
    entry.image_url.trim().length > 0;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[#D4AF37]/20",
        "bg-gradient-to-br from-[#171717]/95 via-[#0B0B0B]/98 to-[#171717]/85",
        "shadow-[0_0_32px_rgba(212,175,55,0.08)] backdrop-blur-xl",
        "transition-all duration-300",
        "hover:-translate-y-1 hover:border-[#D4AF37]/40 hover:shadow-[0_12px_48px_rgba(212,175,55,0.18)]"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-[#D4AF37]/6 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      <div className="relative aspect-[4/5] overflow-hidden bg-[#0B0B0B]">
        {hasValidImage ? (
          <Image
            src={entry.image_url}
            alt={
              entry.caption?.trim() || `Day ${entry.day_number} — ${poseType}`
            }
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <Camera className="mb-3 size-8 text-[#D4AF37]/50" aria-hidden />
            <p className="text-sm font-medium text-[#F5F5F5]">
              Image unavailable
            </p>
            <p className="mt-1 text-xs text-[#A3A3A3]">
              Missing or invalid image URL
            </p>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B]/80 via-transparent to-transparent" />

        <span
          className={cn(
            "absolute top-4 left-4 inline-flex items-center rounded-full",
            "border border-[#D4AF37]/40 bg-[#0B0B0B]/70 px-3 py-1",
            "text-xs font-bold tracking-wide text-[#D4AF37] backdrop-blur-md",
            "shadow-[0_0_16px_rgba(212,175,55,0.15)]"
          )}
        >
          Day {entry.day_number}
        </span>
      </div>

      <div className="relative space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Camera className="size-3.5 text-[#D4AF37]" aria-hidden />
          <p className="text-sm font-semibold text-[#F5F5F5]">{poseType}</p>
        </div>

        {entry.caption?.trim() ? (
          <p className="text-sm leading-relaxed text-[#A3A3A3]">
            {entry.caption}
          </p>
        ) : (
          <p className="text-sm italic text-[#A3A3A3]/60">
            No caption provided.
          </p>
        )}
      </div>
    </article>
  );
}
