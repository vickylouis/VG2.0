"use client";

import { useMemo } from "react";
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
  computeNumericTrendDomain,
  formatAxisUnit,
} from "@/components/charts/chartDomain";
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

type WaistTrendChartProps = {
  data: TrendChartPoint[];
  className?: string;
};

export default function WaistTrendChart({
  data,
  className,
}: WaistTrendChartProps) {
  const { margin, yAxisWidth, tick, xAxisInterval } = useChartLayout();
  const domain = useMemo(() => computeNumericTrendDomain(data, 1), [data]);

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
            type="number"
            tick={tick}
            axisLine={false}
            tickLine={false}
            domain={domain ?? ["auto", "auto"]}
            tickFormatter={(value) => formatAxisUnit(value, " in")}
            width={yAxisWidth + 10}
            allowDecimals
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
