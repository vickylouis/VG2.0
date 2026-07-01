"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "@/components/charts/ChartCard";
import {
  CHART_COLORS,
  chartAxisProps,
  chartCursorProps,
  chartGridProps,
} from "@/components/charts/chartTheme";
import type { WeeklyAveragePoint } from "@/lib/analytics";

type WeeklyAverageChartProps = {
  data: WeeklyAveragePoint[];
  className?: string;
};

function WeeklyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: WeeklyAveragePoint }>;
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  const value = payload[0]?.value;

  if (value === undefined || !point) return null;

  return (
    <div className="rounded-xl border border-[#D4AF37]/30 bg-[#171717]/95 px-4 py-3 shadow-[0_0_24px_rgba(212,175,55,0.15)] backdrop-blur-md">
      <p className="text-xs font-medium tracking-wide text-[#A3A3A3] uppercase">
        Week of {point.weekLabel}
      </p>
      <p className="mt-1 text-lg font-bold text-[#D4AF37]">
        {value}/100 avg
      </p>
    </div>
  );
}

export default function WeeklyAverageChart({
  data,
  className,
}: WeeklyAverageChartProps) {
  return (
    <ChartCard
      title="Weekly Average VG Score"
      subtitle="Average score grouped by week"
      className={className}
      isEmpty={data.length === 0}
      emptyTitle="No weekly data"
      emptyMessage="Log more days to see weekly averages."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid {...chartGridProps} />
          <XAxis dataKey="weekLabel" {...chartAxisProps} dy={8} />
          <YAxis
            dataKey="averageScore"
            tick={chartAxisProps.tick}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            width={40}
          />
          <Tooltip content={<WeeklyTooltip />} cursor={chartCursorProps} />
          <Bar
            dataKey="averageScore"
            fill={CHART_COLORS.gold}
            fillOpacity={0.85}
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
