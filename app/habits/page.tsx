import {
  Activity,
  BookOpen,
  Check,
  Circle,
  Flame,
  ListChecks,
  Shield,
  Target,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import EmptyStateCard from "@/components/layout/EmptyStateCard";
import PageHeader from "@/components/layout/PageHeader";
import PageShell from "@/components/layout/PageShell";
import {
  HABIT_FIELD_GROUPS,
  HABIT_STREAK_THRESHOLD,
  HABIT_TOTAL,
  getHabitDashboardData,
  type HabitEntry,
} from "@/lib/habit";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Habit Dashboard",
  description:
    "Daily habit tracking — scores, streaks, and completion across health, growth, and discipline.",
};

const groupIcons: Record<string, LucideIcon> = {
  Health: Activity,
  Growth: BookOpen,
  Discipline: Shield,
};

const cardClassName = cn(
  "overflow-hidden rounded-[24px] border border-[#D4AF37]/20 p-6 sm:p-8",
  "bg-gradient-to-br from-[#171717]/90 via-[#0B0B0B]/95 to-[#171717]/80",
  "shadow-[0_0_32px_rgba(212,175,55,0.08)] backdrop-blur-xl",
  "transition-all duration-300 hover:border-[#D4AF37]/30 hover:shadow-[0_0_40px_rgba(212,175,55,0.12)]"
);

function formatHabitDate(date: string): string {
  const parsed = new Date(`${date.trim().slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function HabitCompletionGroup({
  title,
  entry,
  fields,
}: {
  title: string;
  entry: HabitEntry;
  fields: (typeof HABIT_FIELD_GROUPS)[number]["fields"];
}) {
  const Icon = groupIcons[title] ?? ListChecks;

  return (
    <article className={cardClassName}>
      <div className="mb-5 flex items-center gap-3">
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-2xl",
            "border border-[#D4AF37]/25 bg-[#D4AF37]/10",
            "shadow-[0_0_20px_rgba(212,175,55,0.12)]"
          )}
        >
          <Icon className="size-5 text-[#D4AF37]" aria-hidden />
        </div>
        <h3 className="text-xl font-bold text-[#F5F5F5]">{title}</h3>
      </div>

      <ul className="space-y-3">
        {fields.map((field) => {
          const completed = entry[field.key];

          return (
            <li
              key={field.key}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3.5",
                completed
                  ? "border-[#D4AF37]/30 bg-[#D4AF37]/10"
                  : "border-[#D4AF37]/10 bg-[#0B0B0B]/50"
              )}
            >
              {completed ? (
                <Check
                  className="size-5 shrink-0 text-[#D4AF37]"
                  strokeWidth={2.5}
                  aria-hidden
                />
              ) : (
                <Circle
                  className="size-5 shrink-0 text-[#A3A3A3]/40"
                  strokeWidth={1.75}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  completed ? "text-[#F5F5F5]" : "text-[#A3A3A3]"
                )}
              >
                {field.label}
              </span>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

export default async function HabitsPage() {
  const { latest, summary, error } = await getHabitDashboardData();
  const hasData = summary != null && latest != null;

  return (
    <PageShell maxWidth="7xl">
      <PageHeader
        eyebrow="Daily Discipline System"
        title="Habit Dashboard"
        description="Daily actions that build Vignesh 2.0"
        meta={
          hasData && summary.latestDate ? (
            <p className="mt-4 text-sm text-[#A3A3A3]">
              Latest entry: {formatHabitDate(summary.latestDate)}
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
          icon={ListChecks}
          title="No habit data yet."
          message="Log daily habits in admin to unlock scores, streaks, and completion tracking."
          action={{ label: "Open habit tracker", href: "/admin/habits" }}
        />
      ) : (
        summary &&
        latest && (
          <div className="space-y-8 min-w-0">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Target}
                title="Habit Score"
                value={`${summary.latestScore}%`}
                subtitle={`Latest score out of ${HABIT_TOTAL} habits`}
                trend={{
                  text:
                    summary.latestScore >= HABIT_STREAK_THRESHOLD
                      ? "Streak qualifying"
                      : "Below streak threshold",
                  direction:
                    summary.latestScore >= HABIT_STREAK_THRESHOLD
                      ? "up"
                      : "neutral",
                }}
              />
              <StatCard
                icon={Check}
                title="Completed Today"
                value={`${summary.completedToday} / ${HABIT_TOTAL}`}
                subtitle={
                  summary.completedToday > 0
                    ? "Logged for today"
                    : `Last logged ${formatHabitDate(summary.latestDate ?? latest.date)}`
                }
                trend={{
                  text:
                    summary.completedToday > 0
                      ? "On track today"
                      : "Log habits in admin",
                  direction: summary.completedToday > 0 ? "up" : "neutral",
                }}
              />
              <StatCard
                icon={Flame}
                title="Current Streak"
                value={`${summary.currentStreak} ${summary.currentStreak === 1 ? "day" : "days"}`}
                subtitle={`Score ≥ ${HABIT_STREAK_THRESHOLD}% consecutive days`}
                trend={{
                  text:
                    summary.currentStreak > 0
                      ? "Keep the chain alive"
                      : "Start a new streak",
                  direction: summary.currentStreak > 0 ? "up" : "neutral",
                }}
              />
              <StatCard
                icon={Trophy}
                title="Best Streak"
                value={`${summary.bestStreak} ${summary.bestStreak === 1 ? "day" : "days"}`}
                subtitle="Personal best consecutive run"
                trend={{
                  text:
                    summary.bestStreak > 0 ? "Peak consistency" : "Build momentum",
                  direction: summary.bestStreak > 0 ? "up" : "neutral",
                }}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {HABIT_FIELD_GROUPS.map((group) => (
                <HabitCompletionGroup
                  key={group.title}
                  title={group.title}
                  entry={latest}
                  fields={group.fields}
                />
              ))}
            </div>
          </div>
        )
      )}
    </PageShell>
  );
}
