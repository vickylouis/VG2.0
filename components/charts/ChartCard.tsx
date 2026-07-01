"use client";

import { cn } from "@/lib/utils";
import { chartCardClassName } from "@/components/charts/chartTheme";

type ChartCardProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
};

export default function ChartCard({
  title,
  subtitle,
  children,
  className,
  isEmpty = false,
  emptyTitle = "No data yet",
  emptyMessage = "Log more metrics to populate this chart.",
}: ChartCardProps) {
  return (
    <article className={chartCardClassName(className)}>
      <header className="mb-6">
        <h3 className="text-xl font-bold text-[#F5F5F5]">{title}</h3>
        <p className="mt-1 text-sm text-[#A3A3A3]">{subtitle}</p>
      </header>

      {isEmpty ? (
        <div className="flex h-[280px] flex-col items-center justify-center rounded-2xl border border-[#D4AF37]/10 bg-[#0B0B0B]/40 px-6 text-center sm:h-[320px]">
          <p className="font-medium text-[#F5F5F5]">{emptyTitle}</p>
          <p className="mt-1 text-sm text-[#A3A3A3]">{emptyMessage}</p>
        </div>
      ) : (
        <div className={cn("h-[280px] w-full sm:h-[320px]")}>{children}</div>
      )}
    </article>
  );
}

type LuxuryTooltipProps = {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: { formattedDate?: string } }>;
  valueSuffix?: string;
  valueLabel?: string;
};

export function LuxuryTooltip({
  active,
  payload,
  valueSuffix = "",
  valueLabel,
}: LuxuryTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  const value = payload[0]?.value;

  if (value === undefined) return null;

  return (
    <div className="rounded-xl border border-[#D4AF37]/30 bg-[#171717]/95 px-4 py-3 shadow-[0_0_24px_rgba(212,175,55,0.15)] backdrop-blur-md">
      {point?.formattedDate && (
        <p className="text-xs font-medium tracking-wide text-[#A3A3A3] uppercase">
          {point.formattedDate}
        </p>
      )}
      <p className="mt-1 text-lg font-bold text-[#D4AF37]">
        {valueLabel ?? `${value}${valueSuffix}`}
      </p>
    </div>
  );
}
