import {
  Brain,
  Calendar,
  Flag,
  Flame,
  Languages,
  Rocket,
  Scale,
  Sparkles,
  Swords,
  Target,
  Trophy,
} from "lucide-react";
import type { ElementType } from "react";
import StatCard from "@/components/dashboard/StatCard";
import PageHeader from "@/components/layout/PageHeader";
import PageShell from "@/components/layout/PageShell";
import { getMissionData, MISSION_GOALS } from "@/lib/mission";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mission Control",
  description:
    "150-day transformation command center — progress, goals, habits, and AI mission status.",
};

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

function GoalList({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold tracking-[0.25em] text-[#D4AF37] uppercase">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-center gap-2.5 rounded-xl border border-[#D4AF37]/10 bg-[#0B0B0B]/50 px-3.5 py-2.5 text-sm text-[#F5F5F5]"
          >
            <Flag className="size-3.5 shrink-0 text-[#D4AF37]" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function MissionPage() {
  const { summary, journalEntryCount, error } = await getMissionData();
  const statusStyle = statusStyles[summary.missionStatus];

  return (
    <PageShell maxWidth="7xl">
      <PageHeader
        eyebrow="150-Day Command Center"
        title="Mission Control"
        description="150-Day Transformation Command Center"
        meta={
          <p className="mt-4 text-sm text-[#A3A3A3]">
            {journalEntryCount > 0
              ? `${journalEntryCount} journal ${journalEntryCount === 1 ? "entry" : "entries"} supporting the mission`
              : "Aggregating body metrics, habits, journal, and AI coach intelligence"}
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
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
            title="Weight Goal"
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
            title="Habit Score"
            value={`${summary.habitScore}%`}
            subtitle="Average daily habit score"
            trend={{
              text:
                summary.habitScore >= 70
                  ? "Strong daily systems"
                  : "Build consistency",
              direction: summary.habitScore >= 70 ? "up" : "neutral",
            }}
          />
          <StatCard
            icon={Trophy}
            title="AI Rating"
            value={summary.aiRating ?? "—"}
            subtitle="Overall coach assessment"
            trend={{
              text: summary.aiRating
                ? `Coach grade ${summary.aiRating}`
                : "Log metrics for rating",
              direction:
                summary.aiRating === "A" || summary.aiRating === "B"
                  ? "up"
                  : "neutral",
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

        <article className={cardClassName}>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
              <Rocket className="size-5 text-[#D4AF37]" aria-hidden />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#F5F5F5]">Mission Goals</h2>
              <p className="text-sm text-[#A3A3A3]">
                Fitness, skill, and identity targets for Vignesh 2.0
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <GoalList title="Fitness" items={MISSION_GOALS.fitness} />
            <GoalList title="Skill" items={MISSION_GOALS.skill} />
            <GoalList title="Identity" items={MISSION_GOALS.identity} />
          </div>
        </article>

        <article className={cardClassName}>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
              <Sparkles className="size-5 text-[#D4AF37]" aria-hidden />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#F5F5F5]">Progress Bars</h2>
              <p className="text-sm text-[#A3A3A3]">
                Weight goal and skill development tracking
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <ProgressBar
              label="Weight Goal"
              value={summary.weightGoalProgress}
              icon={Scale}
            />
            <ProgressBar
              label="English"
              value={summary.skillProgress.english}
              icon={Languages}
            />
            <ProgressBar
              label="Automation"
              value={summary.skillProgress.automation}
              icon={Brain}
            />
            <ProgressBar
              label="MMA"
              value={summary.skillProgress.mma}
              icon={Swords}
            />
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
