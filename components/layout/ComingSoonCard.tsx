import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ComingSoonCardProps = {
  icon: LucideIcon;
  title?: string;
  message: string;
  action?: {
    label: string;
    href: string;
  };
};

export default function ComingSoonCard({
  icon: Icon,
  title = "Coming Soon",
  message,
  action,
}: ComingSoonCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#D4AF37]/25",
        "bg-gradient-to-br from-[#171717]/80 via-[#0B0B0B]/90 to-[#171717]/70",
        "px-8 py-20 text-center shadow-[0_0_40px_rgba(212,175,55,0.06)] backdrop-blur-xl"
      )}
    >
      <div
        className={cn(
          "mb-5 flex size-14 items-center justify-center rounded-2xl",
          "border border-[#D4AF37]/25 bg-[#D4AF37]/10",
          "shadow-[0_0_24px_rgba(212,175,55,0.12)]"
        )}
      >
        <Icon className="size-6 text-[#D4AF37]" aria-hidden />
      </div>

      <p className="text-xs font-semibold tracking-[0.25em] text-[#D4AF37] uppercase">
        {title}
      </p>
      <p className="mt-3 max-w-md text-lg font-medium text-[#F5F5F5]">
        {message}
      </p>

      {action && (
        <Link
          href={action.href}
          className={cn(
            "mt-6 inline-flex items-center rounded-full border border-[#D4AF37]/40 px-6 py-2.5",
            "text-sm font-semibold text-[#D4AF37] transition-colors duration-300",
            "hover:bg-[#D4AF37]/10"
          )}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
