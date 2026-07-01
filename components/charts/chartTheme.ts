import { cn } from "@/lib/utils";

export const CHART_COLORS = {
  gold: "#D4AF37",
  goldLight: "#F5E6A3",
  muted: "#A3A3A3",
  grid: "#D4AF37",
} as const;

export const chartAxisProps = {
  tick: { fill: CHART_COLORS.muted, fontSize: 12 },
  axisLine: { stroke: CHART_COLORS.grid, strokeOpacity: 0.15 },
  tickLine: false,
} as const;

export const chartGridProps = {
  stroke: CHART_COLORS.grid,
  strokeOpacity: 0.08,
  vertical: false,
} as const;

export const chartCursorProps = {
  stroke: CHART_COLORS.gold,
  strokeOpacity: 0.3,
  strokeWidth: 1,
} as const;

export const lineDotProps = {
  fill: "#0B0B0B",
  stroke: CHART_COLORS.gold,
  strokeWidth: 2,
  r: 4,
} as const;

export const lineActiveDotProps = {
  fill: CHART_COLORS.gold,
  stroke: CHART_COLORS.goldLight,
  strokeWidth: 2,
  r: 6,
} as const;

export function chartCardClassName(className?: string) {
  return cn(
    "min-w-0 overflow-hidden rounded-[24px] border border-[#D4AF37]/20 p-4 sm:p-6",
    "bg-gradient-to-br from-[#171717]/90 via-[#0B0B0B]/95 to-[#171717]/80",
    "shadow-[0_0_32px_rgba(212,175,55,0.08)] backdrop-blur-xl",
    "transition-all duration-300 hover:border-[#D4AF37]/30 hover:shadow-[0_0_40px_rgba(212,175,55,0.12)]",
    className
  );
}
