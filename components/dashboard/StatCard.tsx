import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardTrend {
  text: string;
  direction?: "up" | "down" | "neutral";
}

export interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  subtitle?: string;
  trend?: StatCardTrend;
  className?: string;
}

const trendStyles = {
  up: "text-[#22C55E]",
  down: "text-[#EF4444]",
  neutral: "text-[#A3A3A3]",
} as const;

export default function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  className,
}: StatCardProps) {
  const trendDirection = trend?.direction ?? "neutral";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[24px] border border-[#D4AF37]/20 bg-[#171717] p-6",
        "shadow-[0_0_24px_rgba(212,175,55,0.06)]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:border-[#D4AF37]/45 hover:shadow-[0_8px_40px_rgba(212,175,55,0.18)]",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 size-32 rounded-full bg-[#D4AF37]/5 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-60"
      />

      <div className="relative flex items-start justify-between gap-4">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl",
            "border border-[#D4AF37]/25 bg-[#D4AF37]/10",
            "shadow-[0_0_20px_rgba(212,175,55,0.12)]",
            "transition-all duration-300 group-hover:border-[#D4AF37]/40 group-hover:bg-[#D4AF37]/15"
          )}
        >
          <Icon className="size-5 text-[#D4AF37]" strokeWidth={1.75} aria-hidden />
        </div>

        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trendStyles[trendDirection]
            )}
          >
            {trendDirection === "up" && (
              <TrendingUp className="size-3.5" aria-hidden />
            )}
            {trendDirection === "down" && (
              <TrendingDown className="size-3.5" aria-hidden />
            )}
            <span>{trend.text}</span>
          </div>
        )}
      </div>

      <div className="relative mt-6 space-y-2">
        <p className="text-sm font-medium tracking-wide text-[#A3A3A3]">
          {title}
        </p>
        <p className="text-3xl font-bold tracking-tight text-[#F5F5F5] sm:text-4xl">
          {value}
        </p>
        {subtitle && (
          <p className="pt-1 text-sm leading-relaxed text-[#A3A3A3]/80">
            {subtitle}
          </p>
        )}
      </div>
    </article>
  );
}
