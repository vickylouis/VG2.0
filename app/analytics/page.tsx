import Link from "next/link";
import { BarChart3 } from "lucide-react";
import AnalyticsKpiGrid from "@/components/analytics/AnalyticsKpiGrid";
import InsightsCard from "@/components/analytics/InsightsCard";
import VGScoreTrendChart from "@/components/charts/VGScoreTrendChart";
import WaistTrendChart from "@/components/charts/WaistTrendChart";
import WeeklyAverageChart from "@/components/charts/WeeklyAverageChart";
import WeightTrendChart from "@/components/charts/WeightTrendChart";
import PageHeader from "@/components/layout/PageHeader";
import PageShell from "@/components/layout/PageShell";
import {
  buildAnalyticsChartData,
  calculateAnalyticsSummary,
  fetchAnalyticsData,
  generateAnalyticsInsights,
} from "@/lib/analytics";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analytics — VG 2.0",
  description:
    "Transformation analytics — weight trends, VG scores, workout streaks, and insights.",
};

export default async function AnalyticsPage() {
  const { records, error } = await fetchAnalyticsData();
  const hasData = records.length > 0;

  const summary = hasData ? calculateAnalyticsSummary(records) : null;
  const chartData = hasData ? buildAnalyticsChartData(records) : null;
  const insights = hasData ? generateAnalyticsInsights(records) : [];

  return (
    <PageShell maxWidth="7xl">
      <PageHeader
        eyebrow="Performance Intelligence"
        title="Analytics Engine"
        description="Deep insights into your transformation — trends, streaks, scores, and computed intelligence from every logged day."
        meta={
          hasData && summary ? (
            <p className="mt-4 text-sm text-[#A3A3A3]">
              Analyzing {summary.recordCount}{" "}
              {summary.recordCount === 1 ? "record" : "records"}
            </p>
          ) : undefined
        }
      />

      {error && (
        <p
          role="alert"
          className="mb-6 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#EF4444]"
        >
          {error}
        </p>
      )}

      {!hasData && !error ? (
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
            <BarChart3 className="size-6 text-[#D4AF37]" aria-hidden />
          </div>
          <p className="text-lg font-medium text-[#F5F5F5]">
            No analytics data yet. Start tracking your journey.
          </p>
          <Link
            href="/admin"
            className={cn(
              "mt-6 inline-flex items-center rounded-full border border-[#D4AF37]/40 px-6 py-2.5",
              "text-sm font-semibold text-[#D4AF37] transition-colors duration-300",
              "hover:bg-[#D4AF37]/10"
            )}
          >
            Log your first day
          </Link>
        </div>
      ) : (
        summary &&
        chartData && (
          <div className="space-y-8">
            <AnalyticsKpiGrid summary={summary} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <WeightTrendChart data={chartData.weight} />
              <WaistTrendChart data={chartData.waist} />
              <VGScoreTrendChart data={chartData.vgScore} />
              <WeeklyAverageChart data={chartData.weeklyAverage} />
            </div>

            <InsightsCard insights={insights} />
          </div>
        )
      )}
    </PageShell>
  );
}
