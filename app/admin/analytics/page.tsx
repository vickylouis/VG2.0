import { BarChart3 } from "lucide-react";
import AnalyticsKpiGrid from "@/components/analytics/AnalyticsKpiGrid";
import GoalCompletionGrid from "@/components/analytics/GoalCompletionGrid";
import HabitIntelligenceSection from "@/components/analytics/HabitIntelligenceSection";
import InsightsCard from "@/components/analytics/InsightsCard";
import PerformanceInsightsGrid from "@/components/analytics/PerformanceInsightsGrid";
import BodyFatTrendChart from "@/components/charts/BodyFatTrendChart";
import VGScoreTrendChart from "@/components/charts/VGScoreTrendChart";
import WaistTrendChart from "@/components/charts/WaistTrendChart";
import WeeklyAverageChart from "@/components/charts/WeeklyAverageChart";
import WeightTrendChart from "@/components/charts/WeightTrendChart";
import EmptyStateCard from "@/components/layout/EmptyStateCard";
import {
  buildAnalyticsChartData,
  calculateAnalyticsGoalCards,
  calculateAnalyticsSummary,
  calculateHabitIntelligence,
  fetchAnalyticsPageData,
  generateAnalyticsInsights,
  generatePerformanceInsights,
} from "@/lib/analytics";
import { getResolvedAppSettings } from "@/lib/appSettings";
import { toHabitScoreContext } from "@/lib/habitConfig";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Analytics",
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage() {
  const [{ records, habitEntries, error }, settings] = await Promise.all([
    fetchAnalyticsPageData(),
    getResolvedAppSettings(),
  ]);
  const hasData = records.length > 0;
  const ai = settings.ai;
  const gradeBands = settings.scoring.vg_grade_bands;
  const enabledHabits = settings.habits.filter((habit) => habit.enabled);
  const enabledHabitIds = enabledHabits.map((habit) => habit.id);
  const habitScoreContext = {
    ...toHabitScoreContext(settings.habitEngine),
    enabledKeys: enabledHabitIds,
    fieldLabels: Object.fromEntries(
      enabledHabits.map((habit) => [habit.id, habit.name])
    ),
  };

  const summary = hasData
    ? calculateAnalyticsSummary(records, ai, settings.profile)
    : null;
  const chartData = hasData ? buildAnalyticsChartData(records, ai) : null;
  const goalCards = hasData
    ? calculateAnalyticsGoalCards(records, settings.profile, settings.goals)
    : [];
  const habitIntelligence = calculateHabitIntelligence(
    habitEntries,
    habitScoreContext,
    enabledHabitIds
  );
  const insights = hasData
    ? generateAnalyticsInsights(records, ai, settings.profile)
    : [];
  const performanceInsights = hasData
    ? generatePerformanceInsights(records, ai)
    : [];

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
            <AnalyticsKpiGrid summary={summary} gradeBands={gradeBands} />

            {goalCards.length > 0 ? (
              <GoalCompletionGrid goals={goalCards} />
            ) : null}

            <section>
              <h2 className="mb-4 text-sm font-semibold tracking-wide text-[#D4AF37] uppercase">
                Body Metrics
              </h2>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                <WeightTrendChart data={chartData.weight} />
                <WaistTrendChart data={chartData.waist} />
                <BodyFatTrendChart data={chartData.bodyFat} />
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <VGScoreTrendChart data={chartData.vgScore} />
              <WeeklyAverageChart data={chartData.weeklyAverage} />
            </div>

            <HabitIntelligenceSection intelligence={habitIntelligence} />

            <PerformanceInsightsGrid insights={performanceInsights} />

            <InsightsCard insights={insights} />
          </div>
        )
      )}
    </div>
  );
}
