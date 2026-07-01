import { BarChart3 } from "lucide-react";
import AnalyticsKpiGrid from "@/components/analytics/AnalyticsKpiGrid";
import InsightsCard from "@/components/analytics/InsightsCard";
import VGScoreTrendChart from "@/components/charts/VGScoreTrendChart";
import WaistTrendChart from "@/components/charts/WaistTrendChart";
import WeeklyAverageChart from "@/components/charts/WeeklyAverageChart";
import WeightTrendChart from "@/components/charts/WeightTrendChart";
import EmptyStateCard from "@/components/layout/EmptyStateCard";
import {
  buildAnalyticsChartData,
  calculateAnalyticsSummary,
  fetchAnalyticsData,
  generateAnalyticsInsights,
} from "@/lib/analytics";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Analytics",
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage() {
  const { records, error } = await fetchAnalyticsData();
  const hasData = records.length > 0;

  const summary = hasData ? calculateAnalyticsSummary(records) : null;
  const chartData = hasData ? buildAnalyticsChartData(records) : null;
  const insights = hasData ? generateAnalyticsInsights(records) : [];

  return (
    <div className="relative mx-auto min-w-0 max-w-7xl">
      <header className="mb-8">
        <p className="text-xs font-semibold tracking-[0.3em] text-[#D4AF37] uppercase">
          Performance Intelligence
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#F5F5F5] sm:text-4xl">
          Analytics Engine
        </h1>
        <p className="mt-3 max-w-xl text-[#A3A3A3]">
          Admin view of transformation trends, streaks, scores, and computed
          insights.
        </p>
        {hasData && summary ? (
          <p className="mt-4 text-sm text-[#A3A3A3]">
            Analyzing {summary.recordCount}{" "}
            {summary.recordCount === 1 ? "record" : "records"}
          </p>
        ) : null}
      </header>

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
          action={{ label: "Log your first day", href: "/admin/dashboard" }}
        />
      ) : (
        summary &&
        chartData && (
          <div className="min-w-0 space-y-8">
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
    </div>
  );
}
