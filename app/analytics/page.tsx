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
import PageHeader from "@/components/layout/PageHeader";
import PageShell from "@/components/layout/PageShell";
import {
  auditAnalyticsInputs,
  buildAnalyticsChartData,
  calculateAnalyticsGoalCards,
  calculateAnalyticsSummary,
  calculateHabitIntelligence,
  fetchAnalyticsPageData,
  generateAnalyticsInsights,
  generatePerformanceInsights,
} from "@/lib/analytics";
import { getResolvedAppSettings } from "@/lib/appSettings";
import { getBranding } from "@/lib/branding";
import { toHabitScoreContext } from "@/lib/habitConfig";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const branding = await getBranding();

  return {
    title: "Analytics",
    description: `Track ${branding.userName}'s transformation — weight trends, VG scores, workout streaks, and insights.`,
  };
}

export default async function AnalyticsPage() {
  const [branding, { records, habitEntries, error }, settings] =
    await Promise.all([
      getBranding(),
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

  if (hasData) {
    auditAnalyticsInputs(records, settings.profile, settings.goals, settings.config);
  }

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
    </PageShell>
  );
}
