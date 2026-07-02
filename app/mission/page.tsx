import {
  Calendar,
  Flame,
  Gauge,
  Ruler,
  Scale,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import type { ElementType, ReactNode } from "react";
import StatCard from "@/components/dashboard/StatCard";
import PageHeader from "@/components/layout/PageHeader";
import PageShell from "@/components/layout/PageShell";
import { getMissionData } from "@/lib/mission";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { summary, profile } = await getMissionData();

  return {
    title: "Mission Control",
    description: `${profile.missionName} — ${profile.name}'s mission command center, Day ${summary.currentDay} of ${summary.totalDays}.`,
  };
}

const cardClassName = cn(
  "overflow-hidden rounded-[24px] border border-[#D4AF37]/20 p-6 sm:p-8",
  "bg-gradient-to-br from-[#171717]/90 via-[#0B0B0B]/95 to-[#171717]/80",
  "shadow-[0_0_32px_rgba(212,175,55,0.08)] backdrop-blur-xl",
  "transition-all duration-300 hover:border-[#D4AF37]/30 hover:shadow-[0_0_40px_rgba(212,175,55,0.12)]"
);

const statusStyles = {
  Excellent: {
    label: "Excellent",
    className: "border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]",
  },
  "On Track": {
    label: "On Track",
    className: "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]",
  },
  Behind: {
    label: "Behind",
    className: "border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]",
  },
} as const;

function ProgressBar({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ElementType;
}) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Icon className="size-4 shrink-0 text-[#D4AF37]" aria-hidden />
          <span className="text-sm font-medium text-[#F5F5F5]">{label}</span>
        </div>
        <span className="text-sm font-semibold text-[#D4AF37]">{clamped}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full border border-[#D4AF37]/15 bg-[#0B0B0B]/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#D4AF37]/70 to-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.35)] transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

function GoalMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#D4AF37]/10 bg-[#0B0B0B]/50 px-3.5 py-2.5">
      <p className="text-xs font-semibold tracking-[0.2em] text-[#A3A3A3] uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[#F5F5F5]">{value}</p>
    </div>
  );
}

function GoalCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <article className={cardClassName}>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
          <Icon className="size-5 text-[#D4AF37]" aria-hidden />
        </div>
        <h2 className="text-lg font-bold text-[#F5F5F5]">{title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </article>
  );
}

function formatMetric(value: number | null, unit: string): string {
  if (value == null) return "—";
  return `${value}${unit}`;
}

function formatCurrentMetric(value: number | null, unit: string): string {
  if (value == null) return "Not logged yet";
  return `${value}${unit}`;
}

function formatWaistStarting(value: number | null): string {
  if (value == null) return "Not set";
  return `${value} in`;
}

function formatBodyFatBaseline(value: number | null): string {
  if (value == null) return "Not set";
  return `${value}%`;
}

function formatBodyFatCurrent(value: number | null): string {
  if (value == null) return "Not tracked yet";
  return `${value}%`;
}

export default async function MissionPage() {
  const { summary, goals, profile, journalEntryCount, error } =
    await getMissionData();
  const statusStyle = statusStyles[summary.missionStatus];

  return (
    <PageShell maxWidth="7xl">
      <PageHeader
        title={profile.missionName}
        description={`${profile.name}'s mission command center — Day ${summary.currentDay} of ${summary.totalDays}`}
        meta={
          <p className="mt-4 text-sm text-[#A3A3A3]">
            {journalEntryCount > 0
              ? `${journalEntryCount} journal ${journalEntryCount === 1 ? "entry" : "entries"} supporting the mission`
              : "Aggregating body metrics, habits, and check-in intelligence"}
          </p>
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

      <div className="space-y-8 min-w-0">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Calendar}
            title="Day Progress"
            value={`Day ${summary.currentDay}`}
            subtitle={`${summary.dayProgressPercent}% of ${summary.totalDays} days`}
            trend={{
              text: `${summary.totalDays - summary.currentDay} days remaining`,
              direction: summary.currentDay > 0 ? "up" : "neutral",
            }}
          />
          <StatCard
            icon={Scale}
            title="Weight Progress"
            value={`${summary.weightGoalProgress}%`}
            subtitle={
              summary.currentWeight != null
                ? `${summary.currentWeight} kg → ${summary.targetWeight} kg`
                : `${summary.startingWeight} kg start target`
            }
            trend={{
              text:
                summary.weightGoalProgress >= 50
                  ? "Halfway there"
                  : "Keep cutting",
              direction: summary.weightGoalProgress > 0 ? "up" : "neutral",
            }}
          />
          <StatCard
            icon={Target}
            title="Consistency"
            value={`${summary.consistencyScore}%`}
            subtitle="Habits + workout check-ins"
            trend={{
              text:
                summary.consistencyScore >= 70
                  ? "Strong daily systems"
                  : "Build consistency",
              direction: summary.consistencyScore >= 70 ? "up" : "neutral",
            }}
          />
          <StatCard
            icon={Flame}
            title="Current Streak"
            value={`${summary.currentStreak} ${summary.currentStreak === 1 ? "day" : "days"}`}
            subtitle="Habit score ≥ 70% streak"
            trend={{
              text:
                summary.currentStreak > 0
                  ? "Chain active"
                  : "Start a new streak",
              direction: summary.currentStreak > 0 ? "up" : "neutral",
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <GoalCard title="Weight Goal" icon={Scale}>
            <GoalMetric
              label="Starting"
              value={formatMetric(goals.weight.startingWeight, "kg")}
            />
            <GoalMetric
              label="Current"
              value={formatCurrentMetric(goals.weight.currentWeight, " kg")}
            />
            <GoalMetric
              label="Target"
              value={formatMetric(goals.weight.targetWeight, "kg")}
            />
            <GoalMetric
              label="Remaining"
              value={
                goals.weight.remainingKg != null
                  ? `${goals.weight.remainingKg} kg`
                  : "—"
              }
            />
          </GoalCard>

          <GoalCard title="Waist Goal" icon={Ruler}>
            <GoalMetric
              label="Starting"
              value={formatWaistStarting(goals.waist.startingWaist)}
            />
            <GoalMetric
              label="Current"
              value={formatCurrentMetric(goals.waist.currentWaist, " in")}
            />
            <GoalMetric
              label="Target"
              value={`${goals.waist.targetWaist} in`}
            />
            <GoalMetric
              label="Remaining"
              value={
                goals.waist.remainingInches != null
                  ? `${goals.waist.remainingInches} in`
                  : "—"
              }
            />
          </GoalCard>

          <GoalCard title="Body Fat Goal" icon={Gauge}>
            <GoalMetric
              label="Starting"
              value={formatBodyFatBaseline(goals.bodyFat.startingBodyFat)}
            />
            <GoalMetric
              label="Current"
              value={formatBodyFatCurrent(goals.bodyFat.currentBodyFat)}
            />
            <GoalMetric
              label="Target"
              value={`${goals.bodyFat.targetBodyFat}%`}
            />
            <GoalMetric
              label="Remaining"
              value={
                goals.bodyFat.remainingPercent != null
                  ? `${goals.bodyFat.remainingPercent}%`
                  : "—"
              }
            />
          </GoalCard>
        </div>

        <article className={cardClassName}>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
              <Target className="size-5 text-[#D4AF37]" aria-hidden />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#F5F5F5]">Mission Progress</h2>
              <p className="text-sm text-[#A3A3A3]">
                Time elapsed and weight goal completion
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <ProgressBar
              label={`Time Progress — Day ${summary.currentDay} / ${summary.totalDays}`}
              value={summary.dayProgressPercent}
              icon={Calendar}
            />
            <ProgressBar
              label="Weight Progress"
              value={summary.weightGoalProgress}
              icon={Scale}
            />
          </div>
        </article>

        <article className={cardClassName}>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
              <Trophy className="size-5 text-[#D4AF37]" aria-hidden />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#F5F5F5]">Current Status</h2>
              <p className="text-sm text-[#A3A3A3]">
                Phase, consistency, and mission rating
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#D4AF37]/10 bg-[#0B0B0B]/50 px-4 py-4">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#D4AF37] uppercase">
                Current Phase
              </p>
              <p className="mt-2 text-lg font-bold text-[#F5F5F5]">
                {summary.currentPhase}
              </p>
              <p className="mt-1 text-xs text-[#A3A3A3]">
                Day {summary.currentDay}
              </p>
            </div>
            <div className="rounded-xl border border-[#D4AF37]/10 bg-[#0B0B0B]/50 px-4 py-4">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#D4AF37] uppercase">
                Consistency Score
              </p>
              <p className="mt-2 text-lg font-bold text-[#F5F5F5]">
                {summary.consistencyScore}%
              </p>
              <p className="mt-1 text-xs text-[#A3A3A3]">
                Habits + workout check-ins
              </p>
            </div>
            <div className="rounded-xl border border-[#D4AF37]/10 bg-[#0B0B0B]/50 px-4 py-4">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#D4AF37] uppercase">
                Mission Rating
              </p>
              <p className="mt-2 text-lg font-bold text-[#F5F5F5]">
                {summary.missionRating}
              </p>
              <p className="mt-1 text-xs text-[#A3A3A3]">
                {summary.aiRating
                  ? "AI coach assessment"
                  : "Derived from mission metrics"}
              </p>
            </div>
          </div>
        </article>

        <article className={cardClassName}>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
                <Sparkles className="size-5 text-[#D4AF37]" aria-hidden />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#F5F5F5]">
                  AI Mission Summary
                </h2>
                <p className="text-sm text-[#A3A3A3]">
                  Generated from current mission metrics
                </p>
              </div>
            </div>
            <span
              className={cn(
                "inline-flex rounded-full border px-4 py-1.5 text-sm font-semibold",
                statusStyle.className
              )}
            >
              {statusStyle.label}
            </span>
          </div>
          <p className="text-base leading-relaxed text-[#F5F5F5]">
            {summary.missionSummaryText}
          </p>
        </article>
      </div>
    </PageShell>
  );
}
