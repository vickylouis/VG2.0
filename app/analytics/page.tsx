import { BarChart3 } from "lucide-react";
import AnalyticsKpiGrid from "@/components/analytics/AnalyticsKpiGrid";
import InsightsCard from "@/components/analytics/InsightsCard";
import VGScoreTrendChart from "@/components/charts/VGScoreTrendChart";
import WaistTrendChart from "@/components/charts/WaistTrendChart";
import WeeklyAverageChart from "@/components/charts/WeeklyAverageChart";
import WeightTrendChart from "@/components/charts/WeightTrendChart";
import EmptyStateCard from "@/components/layout/EmptyStateCard";
import PageHeader from "@/components/layout/PageHeader";
import PageShell from "@/components/layout/PageShell";
import {
  buildAnalyticsChartData,
  calculateAnalyticsSummary,
  fetchAnalyticsData,
  generateAnalyticsInsights,
} from "@/lib/analytics";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analytics",
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
        <EmptyStateCard
          icon={BarChart3}
          title="No analytics data yet"
          message="Start tracking daily metrics to unlock trends, scores, and insights."
          action={{ label: "Log your first day", href: "/admin" }}
        />
      ) : (
        summary &&
        chartData && (
          <div className="space-y-8 min-w-0">
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
