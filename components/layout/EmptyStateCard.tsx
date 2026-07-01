import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type EmptyStateAction = {
  label: string;
  href: string;
};

type EmptyStateCardProps = {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: EmptyStateAction;
  className?: string;
};

export default function EmptyStateCard({
  icon: Icon,
  title,
  message,
  action,
  className,
}: EmptyStateCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-2xl",
        "border border-dashed border-[#D4AF37]/25 px-5 py-16 text-center sm:px-8 sm:py-20",
        "bg-gradient-to-br from-[#171717]/80 via-[#0B0B0B]/90 to-[#171717]/70",
        "shadow-[0_0_40px_rgba(212,175,55,0.06)] backdrop-blur-xl",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 size-56 -translate-x-1/2 rounded-full bg-[#D4AF37]/8 blur-3xl"
      />

      <div
        className={cn(
          "relative mb-6 flex size-16 items-center justify-center rounded-2xl",
          "border border-[#D4AF37]/30 bg-[#D4AF37]/10",
          "shadow-[0_0_32px_rgba(212,175,55,0.15)]"
        )}
      >
        <Icon className="size-7 text-[#D4AF37]" strokeWidth={1.75} aria-hidden />
      </div>

      <h2 className="relative text-lg font-bold break-words text-[#F5F5F5] sm:text-xl lg:text-2xl">
        {title}
      </h2>
      <p className="relative mt-3 max-w-md text-sm leading-relaxed text-[#A3A3A3] sm:text-base">
        {message}
      </p>

      {action && (
        <Link
          href={action.href}
          className={cn(
            "relative mt-8 inline-flex items-center rounded-full border border-[#D4AF37]/40 px-6 py-2.5",
            "text-sm font-semibold text-[#D4AF37] transition-all duration-300",
            "hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/10 hover:shadow-[0_0_24px_rgba(212,175,55,0.15)]"
          )}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
