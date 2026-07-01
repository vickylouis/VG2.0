import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Dumbbell,
  Lightbulb,
  ListChecks,
  Moon,
  Salad,
  Target,
  TrendingDown,
  UtensilsCrossed,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import EmptyStateCard from "@/components/layout/EmptyStateCard";
import PageHeader from "@/components/layout/PageHeader";
import PageShell from "@/components/layout/PageShell";
import {
  formatCoachMetric,
  formatWeightTrend,
  getCoachData,
} from "@/lib/coachData";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AI Coach",
  description:
    "Rule-based transformation coaching — strengths, weaknesses, and recommendations from your metrics and journal.",
};

const ratingLabels: Record<string, string> = {
  A: "Excellent",
  B: "Good",
  C: "Average",
  D: "Needs Focus",
};

const cardClassName = cn(
  "overflow-hidden rounded-[24px] border border-[#D4AF37]/20 p-6 sm:p-8",
  "bg-gradient-to-br from-[#171717]/90 via-[#0B0B0B]/95 to-[#171717]/80",
  "shadow-[0_0_32px_rgba(212,175,55,0.08)] backdrop-blur-xl",
  "transition-all duration-300 hover:border-[#D4AF37]/30 hover:shadow-[0_0_40px_rgba(212,175,55,0.12)]"
);

type CoachListCardProps = {
  title: string;
  subtitle: string;
  items: string[];
  icon: LucideIcon;
  iconClassName?: string;
  dotClassName?: string;
  emptyMessage: string;
  itemBorderClassName?: string;
};

function CoachListCard({
  title,
  subtitle,
  items,
  icon: Icon,
  iconClassName,
  dotClassName = "bg-[#D4AF37]",
  emptyMessage,
  itemBorderClassName = "border-[#D4AF37]/10",
}: CoachListCardProps) {
  return (
    <article className={cardClassName}>
      <div className="mb-6 flex items-center gap-3">
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-2xl",
            "border border-[#D4AF37]/25 bg-[#D4AF37]/10",
            "shadow-[0_0_20px_rgba(212,175,55,0.12)]"
          )}
        >
          <Icon className={cn("size-5", iconClassName ?? "text-[#D4AF37]")} aria-hidden />
        </div>
        <div>
          <h3 className="text-xl font-bold text-[#F5F5F5]">{title}</h3>
          <p className="text-sm text-[#A3A3A3]">{subtitle}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[#A3A3A3]">{emptyMessage}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item}
              className={cn(
                "flex gap-3 rounded-xl border bg-[#0B0B0B]/50 px-4 py-3",
                "text-sm leading-relaxed text-[#F5F5F5]",
                itemBorderClassName
              )}
            >
              <span
                aria-hidden
                className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", dotClassName)}
              />
              {item}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default async function CoachPage() {
  const { report, summary, habitSummary, hasSufficientData, error } =
    await getCoachData();

  return (
    <PageShell maxWidth="7xl">
      <PageHeader
        eyebrow="Transformation Intelligence"
        title="AI Coach"
        description="Your transformation intelligence engine"
      />

      {error && (
        <p
          role="alert"
          className="mb-6 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#EF4444]"
        >
          {error}
        </p>
      )}

      {!hasSufficientData && !error ? (
        <EmptyStateCard
          icon={Brain}
          title="Not enough data for AI coaching yet."
          message="Log body metrics and journal entries to unlock personalized coaching insights."
          action={{ label: "Open admin dashboard", href: "/admin" }}
        />
      ) : (
        report &&
        summary && (
          <div className="space-y-6 min-w-0">
            <article
              className={cn(
                cardClassName,
                "relative text-center",
                "hover:shadow-[0_0_56px_rgba(212,175,55,0.18)]"
              )}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.12),transparent_70%)]"
              />
              <p className="relative text-xs font-semibold tracking-[0.3em] text-[#D4AF37] uppercase">
                Overall Rating
              </p>
              <p
                className={cn(
                  "relative mt-4 text-7xl font-bold tracking-tight text-[#D4AF37]",
                  "drop-shadow-[0_0_40px_rgba(212,175,55,0.35)] sm:text-8xl"
                )}
              >
                {report.overallRating}
              </p>
              <p className="relative mt-3 text-lg font-medium text-[#F5F5F5]">
                {ratingLabels[report.overallRating] ?? "Assessment"}
              </p>
              <p className="relative mt-2 text-sm text-[#A3A3A3]">
                Based on {report.strengths.length} strength
                {report.strengths.length === 1 ? "" : "s"} and{" "}
                {report.weaknesses.length} area
                {report.weaknesses.length === 1 ? "" : "s"} to improve
              </p>
            </article>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <CoachListCard
                title="Strengths"
                subtitle="What you are doing well"
                items={report.strengths}
                icon={CheckCircle2}
                iconClassName="text-[#22C55E]"
                dotClassName="bg-[#22C55E]"
                itemBorderClassName="border-[#22C55E]/15"
                emptyMessage="No standout strengths yet — keep logging to build momentum."
              />
              <CoachListCard
                title="Weaknesses"
                subtitle="Areas holding progress back"
                items={report.weaknesses}
                icon={AlertTriangle}
                iconClassName="text-[#F59E0B]"
                dotClassName="bg-[#F59E0B]"
                itemBorderClassName="border-[#F59E0B]/15"
                emptyMessage="No major weaknesses detected right now."
              />
            </div>

            <CoachListCard
              title="Recommendations"
              subtitle="Actionable next steps"
              items={report.recommendations}
              icon={Lightbulb}
              emptyMessage="No specific recommendations — your current habits look balanced."
            />

            <article className={cardClassName}>
              <div className="mb-6 flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-11 items-center justify-center rounded-2xl",
                    "border border-[#D4AF37]/25 bg-[#D4AF37]/10",
                    "shadow-[0_0_20px_rgba(212,175,55,0.12)]"
                  )}
                >
                  <TrendingDown className="size-5 text-[#D4AF37]" aria-hidden />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#F5F5F5]">
                    Metrics Summary
                  </h3>
                  <p className="text-sm text-[#A3A3A3]">
                    Aggregated from body metrics
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  {
                    label: "Avg Sleep",
                    value: `${formatCoachMetric(summary.averageSleep)} hrs`,
                  },
                  {
                    label: "Avg Steps",
                    value: Math.round(summary.averageSteps).toLocaleString(),
                  },
                  {
                    label: "Avg VG Score",
                    value: `${summary.averageVGScore}/100`,
                  },
                  {
                    label: "Weight Trend",
                    value: formatWeightTrend(summary.weightTrend),
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className={cn(
                      "rounded-xl border border-[#D4AF37]/10 bg-[#0B0B0B]/50 px-4 py-4",
                      "transition-colors duration-300 hover:border-[#D4AF37]/25"
                    )}
                  >
                    <p className="text-xs font-medium tracking-wide text-[#A3A3A3] uppercase">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#D4AF37]">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            {habitSummary && (
              <section className="space-y-5">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-11 items-center justify-center rounded-2xl",
                      "border border-[#D4AF37]/25 bg-[#D4AF37]/10",
                      "shadow-[0_0_20px_rgba(212,175,55,0.12)]"
                    )}
                  >
                    <ListChecks className="size-5 text-[#D4AF37]" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#F5F5F5]">
                      Habit Analytics
                    </h3>
                    <p className="text-sm text-[#A3A3A3]">
                      Consistency insights merged into your coach report
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                  <StatCard
                    icon={Target}
                    title="Habit Score"
                    value={`${habitSummary.habitScore}%`}
                    subtitle="Average daily habit score"
                    trend={{
                      text:
                        habitSummary.habitScore >= 80
                          ? "Strong habit system"
                          : habitSummary.habitScore >= 60
                            ? "Room to improve"
                            : "Needs attention",
                      direction:
                        habitSummary.habitScore >= 80 ? "up" : "neutral",
                    }}
                  />
                  <StatCard
                    icon={Dumbbell}
                    title="Gym Consistency"
                    value={`${habitSummary.gymConsistency}%`}
                    subtitle="Days gym habit completed"
                    trend={{
                      text:
                        habitSummary.gymConsistency >= 80
                          ? "Training locked in"
                          : "Build gym rhythm",
                      direction:
                        habitSummary.gymConsistency >= 80 ? "up" : "neutral",
                    }}
                  />
                  <StatCard
                    icon={Moon}
                    title="Sleep Habit"
                    value={`${habitSummary.sleepHabitConsistency}%`}
                    subtitle="Sleep before 11 PM rate"
                    trend={{
                      text:
                        habitSummary.sleepHabitConsistency >= 60
                          ? "Bedtime on track"
                          : "Fix bedtime routine",
                      direction:
                        habitSummary.sleepHabitConsistency >= 60
                          ? "up"
                          : "neutral",
                    }}
                  />
                  <StatCard
                    icon={Salad}
                    title="Protein Consistency"
                    value={`${habitSummary.proteinConsistency}%`}
                    subtitle="Protein target hit rate"
                    trend={{
                      text:
                        habitSummary.proteinConsistency >= 60
                          ? "Protein habits solid"
                          : "Improve protein routine",
                      direction:
                        habitSummary.proteinConsistency >= 60 ? "up" : "neutral",
                    }}
                  />
                  <StatCard
                    icon={UtensilsCrossed}
                    title="Junk Food Discipline"
                    value={`${habitSummary.junkFoodDiscipline}%`}
                    subtitle="No junk food days"
                    trend={{
                      text:
                        habitSummary.junkFoodDiscipline >= 70
                          ? "Clean eating streak"
                          : "Reduce junk food",
                      direction:
                        habitSummary.junkFoodDiscipline >= 70 ? "up" : "neutral",
                    }}
                  />
                </div>
              </section>
            )}
          </div>
        )
      )}
    </PageShell>
  );
}
