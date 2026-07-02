import { Percent, Ruler, Scale } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import type { MetricGoalCard } from "@/lib/analytics";

type GoalCompletionGridProps = {
  goals: MetricGoalCard[];
};

const GOAL_ICONS = {
  weight: Scale,
  waist: Ruler,
  bodyFat: Percent,
} as const;

function formatGoalValue(card: MetricGoalCard): string {
  if (card.percent != null) {
    return `${card.percent}%`;
  }

  return card.tracked ? "—" : "Not tracked";
}

function formatGoalSubtitle(card: MetricGoalCard): string {
  if (!card.tracked || card.current == null) {
    return `Target ${card.target}${card.unit}`;
  }

  return `${card.current}${card.unit} → ${card.target}${card.unit}`;
}

export default function GoalCompletionGrid({ goals }: GoalCompletionGridProps) {
  const visibleGoals = goals.filter(
    (goal) => goal.key !== "bodyFat" || goal.tracked
  );

  if (visibleGoals.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-[#D4AF37] uppercase">
        Goal Completion
      </h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {visibleGoals.map((goal) => {
          const percent = goal.percent ?? 0;

          return (
            <StatCard
              key={goal.key}
              icon={GOAL_ICONS[goal.key]}
              title={goal.label}
              value={formatGoalValue(goal)}
              subtitle={formatGoalSubtitle(goal)}
              trend={{
                text:
                  percent >= 75
                    ? "Near target"
                    : percent >= 40
                      ? "Steady progress"
                      : percent > 0
                        ? "Building momentum"
                        : "Track to unlock",
                direction:
                  percent >= 40 ? "up" : percent > 0 ? "neutral" : "neutral",
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
