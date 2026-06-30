"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { getWeightHistory, type WeightDataPoint } from "@/lib/weight-history";

type ChartState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "success"; data: WeightDataPoint[] };

interface TooltipPayload {
  value?: number;
  payload?: WeightDataPoint;
}

function LuxuryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  const weight = payload[0]?.value;

  if (!point || weight === undefined) return null;

  return (
    <div className="rounded-xl border border-[#D4AF37]/30 bg-[#171717]/95 px-4 py-3 shadow-[0_0_24px_rgba(212,175,55,0.15)] backdrop-blur-md">
      <p className="text-xs font-medium tracking-wide text-[#A3A3A3] uppercase">
        {point.formattedDate}
      </p>
      <p className="mt-1 text-lg font-bold text-[#D4AF37]">{weight} kg</p>
    </div>
  );
}

export default function WeightProgressChart({
  className,
}: {
  className?: string;
}) {
  const [state, setState] = useState<ChartState>({ status: "loading" });

  useEffect(() => {
    async function loadWeightHistory() {
      const { data, error } = await getWeightHistory();

      if (error) {
        setState({ status: "error", message: error });
        return;
      }

      if (!data?.length) {
        setState({ status: "empty" });
        return;
      }

      setState({ status: "success", data });
    }

    loadWeightHistory();
  }, []);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[24px] border border-[#D4AF37]/20 p-6",
        "bg-gradient-to-br from-[#171717]/90 via-[#0B0B0B]/95 to-[#171717]/80",
        "shadow-[0_0_32px_rgba(212,175,55,0.08)] backdrop-blur-xl",
        className
      )}
    >
      <header className="mb-6">
        <h3 className="text-xl font-bold text-[#F5F5F5]">Weight Progress</h3>
        <p className="mt-1 text-sm text-[#A3A3A3]">
          Your transformation trend
        </p>
      </header>

      {state.status === "loading" && (
        <div
          className="flex h-[280px] flex-col items-center justify-center gap-3 sm:h-[320px]"
          aria-busy="true"
          aria-label="Loading weight chart"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37]" />
          <p className="text-sm text-[#A3A3A3]">Loading chart…</p>
        </div>
      )}

      {state.status === "error" && (
        <div
          role="alert"
          className="flex h-[280px] flex-col items-center justify-center rounded-2xl border border-[#EF4444]/30 bg-[#0B0B0B]/60 px-6 text-center sm:h-[320px]"
        >
          <p className="font-medium text-[#EF4444]">Failed to load chart</p>
          <p className="mt-1 text-sm text-[#A3A3A3]">{state.message}</p>
        </div>
      )}

      {state.status === "empty" && (
        <div className="flex h-[280px] flex-col items-center justify-center rounded-2xl border border-[#D4AF37]/10 bg-[#0B0B0B]/40 px-6 text-center sm:h-[320px]">
          <p className="font-medium text-[#F5F5F5]">No weight data yet</p>
          <p className="mt-1 text-sm text-[#A3A3A3]">
            Log your first body metric to see progress here.
          </p>
        </div>
      )}

      {state.status === "success" && (
        <div className="h-[280px] w-full sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={state.data}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                stroke="#D4AF37"
                strokeOpacity={0.08}
                vertical={false}
              />
              <XAxis
                dataKey="formattedDate"
                tick={{ fill: "#A3A3A3", fontSize: 12 }}
                axisLine={{ stroke: "#D4AF37", strokeOpacity: 0.15 }}
                tickLine={false}
                dy={8}
              />
              <YAxis
                dataKey="weight"
                tick={{ fill: "#A3A3A3", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                domain={["dataMin - 2", "dataMax + 2"]}
                tickFormatter={(value) => `${value} kg`}
                width={52}
              />
              <Tooltip
                content={<LuxuryTooltip />}
                cursor={{
                  stroke: "#D4AF37",
                  strokeOpacity: 0.3,
                  strokeWidth: 1,
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#D4AF37"
                strokeWidth={2.5}
                dot={{
                  fill: "#0B0B0B",
                  stroke: "#D4AF37",
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  fill: "#D4AF37",
                  stroke: "#F5E6A3",
                  strokeWidth: 2,
                  r: 6,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}
