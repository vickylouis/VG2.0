"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard, { LuxuryTooltip } from "@/components/charts/ChartCard";
import {
  CHART_COLORS,
  chartAxisProps,
  chartCursorProps,
  chartGridProps,
  lineActiveDotProps,
  lineDotProps,
} from "@/components/charts/chartTheme";
import type { TrendChartPoint } from "@/lib/analytics";

type VGScoreTrendChartProps = {
  data: TrendChartPoint[];
  className?: string;
};

function VGScoreTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: { formattedDate?: string } }>;
}) {
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
        {value}/100
      </p>
    </div>
  );
}

export default function VGScoreTrendChart({
  data,
  className,
}: VGScoreTrendChartProps) {
  return (
    <ChartCard
      title="VG Score Trend"
      subtitle="Daily performance score (0–100)"
      className={className}
      isEmpty={data.length === 0}
      emptyTitle="No VG Score data"
      emptyMessage="Complete daily metrics to track your score."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid {...chartGridProps} />
          <XAxis dataKey="formattedDate" {...chartAxisProps} dy={8} />
          <YAxis
            dataKey="value"
            tick={chartAxisProps.tick}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}`}
            width={40}
          />
          <Tooltip content={<VGScoreTooltip />} cursor={chartCursorProps} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={CHART_COLORS.gold}
            strokeWidth={2.5}
            dot={lineDotProps}
            activeDot={lineActiveDotProps}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
