import {
  Dumbbell,
  Flame,
  Scale,
  Trophy,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import type { AnalyticsSummary } from "@/lib/analytics";

type AnalyticsKpiGridProps = {
  summary: AnalyticsSummary;
};

function formatWeight(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} kg`;
}

export default function AnalyticsKpiGrid({ summary }: AnalyticsKpiGridProps) {
  const kpis = [
    {
      icon: Scale,
      title: "Total Weight Lost",
      value: formatWeight(summary.totalWeightLost),
      subtitle:
        summary.firstWeight != null && summary.latestWeight != null
          ? `${summary.firstWeight} kg → ${summary.latestWeight} kg`
          : "From first to latest entry",
      trend: {
        text:
          summary.totalWeightLost > 0 ? "Progress made" : "Baseline tracking",
        direction: summary.totalWeightLost > 0 ? ("up" as const) : ("neutral" as const),
      },
    },
    {
      icon: Flame,
      title: "Best Workout Streak",
      value: `${summary.bestWorkoutStreak} ${summary.bestWorkoutStreak === 1 ? "day" : "days"}`,
      subtitle: "Longest consecutive workouts",
      trend: {
        text: summary.bestWorkoutStreak > 0 ? "Peak discipline" : "Build momentum",
        direction: summary.bestWorkoutStreak > 0 ? ("up" as const) : ("neutral" as const),
      },
    },
    {
      icon: Trophy,
      title: "Average VG Score",
      value: `${summary.averageVGScore}/100`,
      subtitle: `Across ${summary.recordCount} logged days`,
      trend: {
        text:
          summary.averageVGScore >= 75
            ? "Strong performance"
            : summary.averageVGScore >= 50
              ? "Room to grow"
              : "Keep pushing",
        direction:
          summary.averageVGScore >= 75
            ? ("up" as const)
            : ("neutral" as const),
      },
    },
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
