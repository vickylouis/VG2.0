import {
  Dumbbell,
  Flame,
  Scale,
  Trophy,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import type { AnalyticsSummary } from "@/lib/analytics";
import type { VgGradeBands } from "@/lib/settings";
import { DEFAULT_VG_GRADE_BANDS } from "@/lib/scoringSettingsConfig";

type AnalyticsKpiGridProps = {
  summary: AnalyticsSummary;
  gradeBands?: VgGradeBands;
};

function formatWeight(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} kg`;
}

export default function AnalyticsKpiGrid({
  summary,
  gradeBands = DEFAULT_VG_GRADE_BANDS,
}: AnalyticsKpiGridProps) {
  const kpis = [
    {
      icon: Scale,
      title: "Total Weight Lost",
      value: formatWeight(summary.totalWeightLost),
      subtitle:
        summary.startingWeight != null && summary.latestWeight != null
          ? `${formatWeight(summary.startingWeight)} → ${formatWeight(summary.latestWeight)}`
          : summary.firstWeight != null && summary.latestWeight != null
            ? `${formatWeight(summary.firstWeight)} → ${formatWeight(summary.latestWeight)}`
            : "From starting weight to latest entry",
      trend: {
        text:
          summary.totalWeightLost > 0 ? "Progress made" : "Baseline tracking",
        direction: summary.totalWeightLost > 0 ? ("up" as const) : ("neutral" as const),
      },
    },
    {
      icon: Flame,
      title: "Workout Streak",
      value: `${summary.currentWorkoutStreak} ${summary.currentWorkoutStreak === 1 ? "day" : "days"}`,
      subtitle: `Best streak: ${summary.bestWorkoutStreak} ${summary.bestWorkoutStreak === 1 ? "day" : "days"}`,
      trend: {
        text:
          summary.currentWorkoutStreak > 0
            ? "Active streak"
            : summary.bestWorkoutStreak > 0
              ? "Rebuild momentum"
              : "Build momentum",
        direction:
          summary.currentWorkoutStreak > 0
            ? ("up" as const)
            : ("neutral" as const),
      },
    },
    {
      icon: Trophy,
      title: "Average VG Score",
      value: `${summary.averageVGScore}/100`,
      subtitle: `Across ${summary.recordCount} logged days`,
      trend: {
        text:
          summary.averageVGScore >= gradeBands.B
            ? "Strong performance"
            : summary.averageVGScore >= gradeBands.C
              ? "Room to grow"
              : "Keep pushing",
        direction:
          summary.averageVGScore >= gradeBands.B
            ? ("up" as const)
            : ("neutral" as const),
      },
    },
    ...(summary.currentBmi != null
      ? [
          {
            icon: Scale,
            title: "Current BMI",
            value: `${summary.currentBmi}`,
            subtitle:
              summary.startingBmi != null
                ? `Started at ${summary.startingBmi} BMI`
                : "Based on profile height",
            trend: {
              text:
                summary.startingBmi != null &&
                summary.currentBmi < summary.startingBmi
                  ? "Body composition improving"
                  : "Track over time",
              direction:
                summary.startingBmi != null &&
                summary.currentBmi < summary.startingBmi
                  ? ("up" as const)
                  : ("neutral" as const),
            },
          },
        ]
      : []),
    {
      icon: Dumbbell,
      title: "Total Workout Days",
      value: `${summary.totalWorkoutDays}`,
      subtitle: `${Math.round((summary.totalWorkoutDays / summary.recordCount) * 100)}% of logged days`,
      trend: {
        text: "Consistency tracker",
        direction: "neutral" as const,
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <StatCard
          key={kpi.title}
          icon={kpi.icon}
          title={kpi.title}
          value={kpi.value}
          subtitle={kpi.subtitle}
          trend={kpi.trend}
        />
      ))}
    </div>
  );
}
