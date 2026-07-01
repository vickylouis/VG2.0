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

type WaistTrendChartProps = {
  data: TrendChartPoint[];
  className?: string;
};

export default function WaistTrendChart({
  data,
  className,
}: WaistTrendChartProps) {
  return (
    <ChartCard
      title="Waist Trend"
      subtitle="Waist measurement over time"
      className={className}
      isEmpty={data.length === 0}
      emptyTitle="No waist data"
      emptyMessage="Log waist measurements to see your trend."
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
            domain={["dataMin - 1", "dataMax + 1"]}
            tickFormatter={(value) => `${value} in`}
            width={52}
          />
          <Tooltip
            content={<LuxuryTooltip valueSuffix=" in" />}
            cursor={chartCursorProps}
          />
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
