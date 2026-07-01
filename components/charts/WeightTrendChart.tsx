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
import { useChartLayout } from "@/components/charts/useChartLayout";
import type { TrendChartPoint } from "@/lib/analytics";

type WeightTrendChartProps = {
  data: TrendChartPoint[];
  className?: string;
};

export default function WeightTrendChart({
  data,
  className,
}: WeightTrendChartProps) {
  const { margin, yAxisWidth, tick, xAxisInterval } = useChartLayout();

  return (
    <ChartCard
      title="Weight Trend"
      subtitle="Body weight over time"
      className={className}
      isEmpty={data.length === 0}
      emptyTitle="No weight data"
      emptyMessage="Log weight entries to see your trend."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={margin}>
          <CartesianGrid {...chartGridProps} />
          <XAxis
            dataKey="formattedDate"
            {...chartAxisProps}
            tick={tick}
            interval={xAxisInterval}
            dy={8}
          />
          <YAxis
            dataKey="value"
            tick={tick}
            axisLine={false}
            tickLine={false}
            domain={["dataMin - 2", "dataMax + 2"]}
            tickFormatter={(value) => `${value} kg`}
            width={yAxisWidth}
          />
          <Tooltip
            content={<LuxuryTooltip valueSuffix=" kg" />}
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
