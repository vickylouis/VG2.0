"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Brain,
  Calendar,
  Flame,
  Footprints,
  ListChecks,
  Loader2,
  Pencil,
  Scale,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import type { ElementType } from "react";
import { toast } from "sonner";
import StatCard from "@/components/dashboard/StatCard";
import {
  calculateMetricsHistorySummary,
  deleteBodyMetric,
  getBodyMetricsHistory,
  type BodyMetricsRecord,
} from "@/lib/bodyMetrics";
import {
  calculateHabitHistorySummary,
  calculateHabitPerformance,
  countCompletedHabits,
  deleteHabitEntry,
  getHabitHistory,
  getMissedHabitLabels,
  HABIT_FIELDS,
  HABIT_TOTAL,
  type HabitEntry,
} from "@/lib/habit";
import {
  calculateJournalHistorySummary,
  deleteJournalEntry,
  formatJournalDate,
  formatJournalScore,
  getJournalHistory,
  getJournalSentiment,
  type JournalEntry,
} from "@/lib/journal";
import { cn } from "@/lib/utils";

type HistoryTab = "metrics" | "habits" | "journal";
type DateRangeFilter = "all" | "7" | "30" | "90";

type TabConfig = {
  id: HistoryTab;
  label: string;
  icon: ElementType;
};

type DeleteTarget = {
  type: HistoryTab;
  id: string;
  date: string;
};

type TabFilterProps = {
  dateRange: DateRangeFilter;
  searchQuery: string;
  refreshKey: number;
  onEdit: () => void;
  onDelete: (target: DeleteTarget) => void;
};

const HISTORY_TABS: TabConfig[] = [
  { id: "metrics", label: "Metrics", icon: Scale },
  { id: "habits", label: "Habits", icon: ListChecks },
  { id: "journal", label: "Journal", icon: BookOpen },
];

const DATE_RANGE_OPTIONS: { value: DateRangeFilter; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
];

const cardClassName = cn(
  "rounded-[24px] border border-[#D4AF37]/25 p-6 sm:p-8",
  "bg-gradient-to-br from-[#171717]/90 via-[#0B0B0B]/95 to-[#171717]/80",
  "shadow-[0_0_40px_rgba(212,175,55,0.1)] backdrop-blur-xl",
  "transition-all duration-300"
);

const inputClassName = cn(
  "w-full rounded-xl border border-[#D4AF37]/20 bg-[#0B0B0B]/80 px-4 py-3",
  "text-[#F5F5F5] placeholder:text-[#A3A3A3]/50",
  "outline-none transition-all duration-300",
  "focus:border-[#D4AF37]/50 focus:shadow-[0_0_20px_rgba(212,175,55,0.12)]"
);

function getDateRangeCutoff(range: DateRangeFilter): string | null {
  if (range === "all") return null;

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - Number(range));

  return cutoff.toISOString().split("T")[0];
}

function filterByDateRange<T extends { date: string }>(
  items: T[],
  range: DateRangeFilter
): T[] {
  const cutoff = getDateRangeCutoff(range);
  if (!cutoff) return items;
  return items.filter((item) => item.date >= cutoff);
}

function formatHistoryDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatWeight(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value} kg`;
}

function formatNumber(value: number | null, suffix = ""): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value}${suffix}`;
}

function formatJournalText(value: string | null): string {
  if (value == null || value.trim() === "") return "—";
  return value;
}

function matchesMetricsSearch(record: BodyMetricsRecord, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return (
    record.date.toLowerCase().includes(normalized) ||
    formatHistoryDate(record.date).toLowerCase().includes(normalized)
  );
}

function matchesHabitSearch(entry: HabitEntry, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const habitNames = HABIT_FIELDS.map((field) => field.label.toLowerCase());
  const completed = HABIT_FIELDS.filter((field) => entry[field.key]).map((field) =>
    field.label.toLowerCase()
  );
  const missed = getMissedHabitLabels(entry).map((label) => label.toLowerCase());

  return (
    entry.date.toLowerCase().includes(normalized) ||
    formatHistoryDate(entry.date).toLowerCase().includes(normalized) ||
    habitNames.some((name) => name.includes(normalized)) ||
    completed.some((name) => name.includes(normalized)) ||
    missed.some((name) => name.includes(normalized))
  );
}

function matchesJournalSearch(entry: JournalEntry, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const fields = [entry.wins, entry.failures, entry.reflection]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    entry.date.toLowerCase().includes(normalized) ||
    formatJournalDate(entry.date).toLowerCase().includes(normalized) ||
    fields.includes(normalized)
  );
}

function FilteredEmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-lg font-medium text-[#F5F5F5]">No matching entries</p>
      <p className="mt-2 max-w-sm text-sm text-[#A3A3A3]">
        Adjust your date range or search to see {label.toLowerCase()} history.
      </p>
    </div>
  );
}

function EntryActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onEdit}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/25 px-2.5 py-1.5",
          "text-xs font-medium text-[#D4AF37] transition-all duration-300",
          "hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/10"
        )}
      >
        <Pencil className="size-3.5" aria-hidden />
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-[#EF4444]/25 px-2.5 py-1.5",
          "text-xs font-medium text-[#EF4444] transition-all duration-300",
          "hover:border-[#EF4444]/40 hover:bg-[#EF4444]/10"
        )}
      >
        <Trash2 className="size-3.5" aria-hidden />
        Delete
      </button>
    </div>
  );
}

function SentimentBadge({ mood }: { mood: number | null }) {
  const sentiment = getJournalSentiment(mood);
  if (!sentiment) return null;

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        sentiment.tone === "positive" &&
          "border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]",
        sentiment.tone === "neutral" &&
          "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]",
        sentiment.tone === "low" &&
          "border-[#F97316]/30 bg-[#F97316]/10 text-[#F97316]"
      )}
    >
      {sentiment.label}
    </span>
  );
}

function MetricsHistoryTab({
  dateRange,
  searchQuery,
  refreshKey,
  onEdit,
  onDelete,
}: TabFilterProps) {
  const [records, setRecords] = useState<BodyMetricsRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadMetricsHistory() {
      setIsLoading(true);
      setError(null);

      const result = await getBodyMetricsHistory();

      if (cancelled) return;

      if (result.error) {
        setError(result.error);
        setRecords([]);
      } else {
        setRecords(result.data);
      }

      setIsLoading(false);
    }

    void loadMetricsHistory();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const filteredRecords = useMemo(() => {
    return filterByDateRange(records, dateRange).filter((record) =>
      matchesMetricsSearch(record, searchQuery)
    );
  }, [records, dateRange, searchQuery]);

  const summary = useMemo(
    () => calculateMetricsHistorySummary(filteredRecords),
    [filteredRecords]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#A3A3A3]">
        <Loader2 className="size-8 animate-spin text-[#D4AF37]" aria-hidden />
        <p className="mt-4 text-sm">Loading metrics history…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-4 text-sm text-[#EF4444]"
      >
        {error}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
          <Scale className="size-7 text-[#D4AF37]" aria-hidden />
        </div>
        <p className="text-lg font-medium text-[#F5F5F5]">No metrics history yet</p>
        <p className="mt-2 max-w-sm text-sm text-[#A3A3A3]">
          Complete your first daily check-in to start building your transformation
          timeline.
        </p>
      </div>
    );
  }

  if (filteredRecords.length === 0) {
    return <FilteredEmptyState label="metrics" />;
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-[#D4AF37] uppercase">
          Summary
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Calendar}
            title="Total Entries"
            value={String(summary.totalEntries)}
            subtitle="In selected range"
          />
          <StatCard
            icon={Scale}
            title="Current Weight"
            value={formatWeight(summary.currentWeight)}
            subtitle="Latest in range"
          />
          <StatCard
            icon={TrendingDown}
            title="Total Weight Lost"
            value={`${summary.totalWeightLost} kg`}
            subtitle="Within range"
          />
          <StatCard
            icon={Footprints}
            title="Average Steps"
            value={
              summary.averageSteps != null
                ? summary.averageSteps.toLocaleString()
                : "—"
            }
            subtitle="In selected range"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-[#D4AF37] uppercase">
          Timeline
        </h2>
        <div className="overflow-hidden rounded-2xl border border-[#D4AF37]/15 bg-[#0B0B0B]/50">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#D4AF37]/15 bg-[#171717]/60">
                  {[
                    "Date",
                    "Weight",
                    "Waist",
                    "Steps",
                    "Sleep",
                    "Workout",
                    "Actions",
                  ].map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="px-4 py-3 text-xs font-semibold tracking-wide text-[#A3A3A3] uppercase whitespace-nowrap"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-[#D4AF37]/10 transition-colors duration-200 last:border-b-0 hover:bg-[#D4AF37]/5"
                  >
                    <td className="px-4 py-3.5 font-medium text-[#F5F5F5] whitespace-nowrap">
                      {formatHistoryDate(record.date)}
                    </td>
                    <td className="px-4 py-3.5 text-[#F5F5F5] whitespace-nowrap">
                      {formatWeight(record.weight)}
                    </td>
                    <td className="px-4 py-3.5 text-[#A3A3A3] whitespace-nowrap">
                      {formatNumber(record.waist, " in")}
                    </td>
                    <td className="px-4 py-3.5 text-[#A3A3A3] whitespace-nowrap">
                      {record.steps != null
                        ? record.steps.toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-[#A3A3A3] whitespace-nowrap">
                      {formatNumber(record.sleep_hours, " h")}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                          record.workout_done
                            ? "border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]"
                            : "border-[#A3A3A3]/25 bg-[#171717]/80 text-[#A3A3A3]"
                        )}
                      >
                        {record.workout_done ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <EntryActions
                        onEdit={onEdit}
                        onDelete={() =>
                          onDelete({
                            type: "metrics",
                            id: record.id,
                            date: record.date,
                          })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function HabitsHistoryTab({
  dateRange,
  searchQuery,
  refreshKey,
  onEdit,
  onDelete,
}: TabFilterProps) {
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadHabitHistory() {
      setIsLoading(true);
      setError(null);

      const result = await getHabitHistory();

      if (cancelled) return;

      if (result.error) {
        setError(result.error);
        setEntries([]);
      } else {
        setEntries(result.data);
      }

      setIsLoading(false);
    }

    void loadHabitHistory();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const filteredEntries = useMemo(() => {
    return filterByDateRange(entries, dateRange).filter((entry) =>
      matchesHabitSearch(entry, searchQuery)
    );
  }, [entries, dateRange, searchQuery]);

  const summary = useMemo(
    () => calculateHabitHistorySummary(filteredEntries),
    [filteredEntries]
  );

  const performance = useMemo(
    () => calculateHabitPerformance(filteredEntries),
    [filteredEntries]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#A3A3A3]">
        <Loader2 className="size-8 animate-spin text-[#D4AF37]" aria-hidden />
        <p className="mt-4 text-sm">Loading habit history…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-4 text-sm text-[#EF4444]"
      >
        {error}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
          <ListChecks className="size-7 text-[#D4AF37]" aria-hidden />
        </div>
        <p className="text-lg font-medium text-[#F5F5F5]">No habit history yet</p>
        <p className="mt-2 max-w-sm text-sm text-[#A3A3A3]">
          Log habits through your daily check-in to track consistency over time.
        </p>
      </div>
    );
  }

  if (filteredEntries.length === 0) {
    return <FilteredEmptyState label="habit" />;
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-[#D4AF37] uppercase">
          Summary
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Target}
            title="Average Habit Score"
            value={`${summary.averageScore}%`}
            subtitle="In selected range"
          />
          <StatCard
            icon={Trophy}
            title="Best Day Score"
            value={`${summary.bestDayScore}%`}
            subtitle="Peak in range"
          />
          <StatCard
            icon={Flame}
            title="Current Streak"
            value={`${summary.currentStreak}`}
            subtitle="Days above 70% score"
          />
          <StatCard
            icon={ListChecks}
            title="Average Completed Habits"
            value={`${summary.averageCompletedHabits}/${HABIT_TOTAL}`}
            subtitle="In selected range"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-[#D4AF37] uppercase">
          Habit Performance
        </h2>
        <div className="overflow-hidden rounded-2xl border border-[#D4AF37]/15 bg-[#0B0B0B]/50">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#D4AF37]/15 bg-[#171717]/60">
                  <th
                    scope="col"
                    className="px-4 py-3 text-xs font-semibold tracking-wide text-[#A3A3A3] uppercase"
                  >
                    Habit Name
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-xs font-semibold tracking-wide text-[#A3A3A3] uppercase"
                  >
                    Completion %
                  </th>
                </tr>
              </thead>
              <tbody>
                {performance.map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-[#D4AF37]/10 transition-colors duration-200 last:border-b-0 hover:bg-[#D4AF37]/5"
                  >
                    <td className="px-4 py-3.5 font-medium text-[#F5F5F5]">
                      {row.label}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 max-w-[200px] overflow-hidden rounded-full bg-[#171717]">
                          <div
                            className="h-full rounded-full bg-[#D4AF37] transition-all duration-500"
                            style={{ width: `${row.completionPercent}%` }}
                          />
                        </div>
                        <span className="w-10 text-right font-semibold text-[#D4AF37]">
                          {row.completionPercent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-[#D4AF37] uppercase">
          Daily Timeline
        </h2>
        <div className="space-y-3">
          {filteredEntries.map((entry) => {
            const completed = countCompletedHabits(entry);
            const missed = getMissedHabitLabels(entry);

            return (
              <article
                key={entry.id}
                className="rounded-2xl border border-[#D4AF37]/15 bg-[#0B0B0B]/50 p-4 sm:p-5 transition-colors duration-200 hover:border-[#D4AF37]/25"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-[#F5F5F5]">
                      {formatHistoryDate(entry.date)}
                    </p>
                    <p className="mt-1 text-sm text-[#A3A3A3]">
                      {completed} of {HABIT_TOTAL} habits completed
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-sm font-bold text-[#D4AF37]">
                      {entry.habit_score}%
                    </span>
                    <EntryActions
                      onEdit={onEdit}
                      onDelete={() =>
                        onDelete({
                          type: "habits",
                          id: entry.id,
                          date: entry.date,
                        })
                      }
                    />
                  </div>
                </div>
                {missed.length > 0 && (
                  <div className="mt-3 border-t border-[#D4AF37]/10 pt-3">
                    <p className="text-xs font-semibold tracking-wide text-[#A3A3A3] uppercase">
                      Missed habits
                    </p>
                    <p className="mt-1.5 text-sm text-[#F5F5F5]">
                      {missed.join(" · ")}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function JournalHistoryTab({
  dateRange,
  searchQuery,
  refreshKey,
  onEdit,
  onDelete,
}: TabFilterProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadJournalHistory() {
      setIsLoading(true);
      setError(null);

      const result = await getJournalHistory();

      if (cancelled) return;

      if (result.error) {
        setError(result.error);
        setEntries([]);
      } else {
        setEntries(result.data);
      }

      setIsLoading(false);
    }

    void loadJournalHistory();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const filteredEntries = useMemo(() => {
    return filterByDateRange(entries, dateRange).filter((entry) =>
      matchesJournalSearch(entry, searchQuery)
    );
  }, [entries, dateRange, searchQuery]);

  const summary = useMemo(
    () => calculateJournalHistorySummary(filteredEntries),
    [filteredEntries]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#A3A3A3]">
        <Loader2 className="size-8 animate-spin text-[#D4AF37]" aria-hidden />
        <p className="mt-4 text-sm">Loading journal history…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-4 text-sm text-[#EF4444]"
      >
        {error}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
          <BookOpen className="size-7 text-[#D4AF37]" aria-hidden />
        </div>
        <p className="text-lg font-medium text-[#F5F5F5]">No journal history yet</p>
        <p className="mt-2 max-w-sm text-sm text-[#A3A3A3]">
          Record wins, failures, and reflections in your daily check-in to build a
          mindset timeline.
        </p>
      </div>
    );
  }

  if (filteredEntries.length === 0) {
    return <FilteredEmptyState label="journal" />;
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-[#D4AF37] uppercase">
          Summary
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Calendar}
            title="Total Entries"
            value={String(summary.totalEntries)}
            subtitle="In selected range"
          />
          <StatCard
            icon={Sparkles}
            title="Average Mood"
            value={formatJournalScore(summary.averageMood)}
            subtitle="In selected range"
          />
          <StatCard
            icon={Zap}
            title="Average Energy"
            value={formatJournalScore(summary.averageEnergy)}
            subtitle="In selected range"
          />
          <StatCard
            icon={Brain}
            title="Average Discipline"
            value={formatJournalScore(summary.averageDiscipline)}
            subtitle="In selected range"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-[#D4AF37] uppercase">
          Journal Timeline
        </h2>
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-2xl border border-[#D4AF37]/15 bg-[#0B0B0B]/50 p-4 sm:p-5 transition-colors duration-200 hover:border-[#D4AF37]/25"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-[#F5F5F5]">
                    {formatJournalDate(entry.date)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-[#A3A3A3]">
                    <span>Mood {formatJournalScore(entry.mood)}</span>
                    <span aria-hidden>·</span>
                    <span>Energy {formatJournalScore(entry.energy)}</span>
                    <span aria-hidden>·</span>
                    <span>Discipline {formatJournalScore(entry.discipline)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <SentimentBadge mood={entry.mood} />
                  <EntryActions
                    onEdit={onEdit}
                    onDelete={() =>
                      onDelete({
                        type: "journal",
                        id: entry.id,
                        date: entry.date,
                      })
                    }
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 border-t border-[#D4AF37]/10 pt-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-[#D4AF37] uppercase">
                    Wins
                  </p>
                  <p className="mt-1.5 text-sm text-[#F5F5F5] whitespace-pre-wrap">
                    {formatJournalText(entry.wins)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wide text-[#F97316] uppercase">
                    Failures
                  </p>
                  <p className="mt-1.5 text-sm text-[#F5F5F5] whitespace-pre-wrap">
                    {formatJournalText(entry.failures)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wide text-[#A3A3A3] uppercase">
                    Reflection
                  </p>
                  <p className="mt-1.5 text-sm text-[#F5F5F5] whitespace-pre-wrap">
                    {formatJournalText(entry.reflection)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function HistoryModal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-title"
        className={cn(
          "relative z-10 w-full max-w-md rounded-[24px] border border-[#D4AF37]/30 p-6 sm:p-8",
          "bg-gradient-to-br from-[#171717]/95 via-[#0B0B0B] to-[#171717]/90",
          "shadow-[0_0_48px_rgba(212,175,55,0.2)] backdrop-blur-xl"
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="history-modal-title" className="text-xl font-bold text-[#F5F5F5]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#D4AF37]/20 p-1.5 text-[#A3A3A3] transition-colors hover:text-[#F5F5F5]"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminHistoryPage() {
  const [activeTab, setActiveTab] = useState<HistoryTab>("metrics");
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const activeConfig =
    HISTORY_TABS.find((tab) => tab.id === activeTab) ?? HISTORY_TABS[0];

  useEffect(() => {
    console.log("FILTER APPLIED", { dateRange, tab: activeTab });
  }, [dateRange, activeTab]);

  useEffect(() => {
    console.log("SEARCH APPLIED", {
      searchQuery,
      tab: activeTab,
    });
  }, [searchQuery, activeTab]);

  const tabFilterProps: TabFilterProps = {
    dateRange,
    searchQuery,
    refreshKey,
    onEdit: () => setEditOpen(true),
    onDelete: (target) => setDeleteTarget(target),
  };

  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    setIsDeleting(true);

    let error: string | null = null;

    if (deleteTarget.type === "metrics") {
      const result = await deleteBodyMetric(deleteTarget.id);
      error = result.error;
    } else if (deleteTarget.type === "habits") {
      const result = await deleteHabitEntry(deleteTarget.id);
      error = result.error;
    } else {
      const result = await deleteJournalEntry(deleteTarget.id);
      error = result.error;
    }

    if (error) {
      toast.error(error);
      setIsDeleting(false);
      return;
    }

    console.log("ENTRY DELETED", deleteTarget);
    toast.success("Entry deleted");
    setDeleteTarget(null);
    setRefreshKey((key) => key + 1);
    setIsDeleting(false);
  }

  return (
    <div className="relative mx-auto max-w-6xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-[#D4AF37]/6 blur-[120px]"
      />

      <header className="relative z-10 mb-8">
        <h1 className="text-3xl font-bold text-[#F5F5F5] sm:text-4xl">History</h1>
        <p className="mt-2 max-w-xl text-[#A3A3A3]">
          Review your complete transformation timeline
        </p>
      </header>

      <div className="relative z-10 mb-6 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {DATE_RANGE_OPTIONS.map((option) => {
              const isActive = dateRange === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDateRange(option.value)}
                  className={cn(
                    "rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-300",
                    isActive
                      ? "border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.15)]"
                      : "border-[#D4AF37]/15 bg-[#0B0B0B]/60 text-[#A3A3A3] hover:border-[#D4AF37]/25 hover:text-[#F5F5F5]"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#A3A3A3]"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search history…"
              className={cn(inputClassName, "pl-10")}
            />
          </div>
        </div>

        <div
          role="tablist"
          aria-label="History sections"
          className="flex flex-wrap gap-2 rounded-2xl border border-[#D4AF37]/15 bg-[#0B0B0B]/60 p-1.5 backdrop-blur-sm"
        >
          {HISTORY_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`history-panel-${tab.id}`}
                id={`history-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3",
                  "text-sm font-medium transition-all duration-300",
                  "min-w-[120px] sm:min-w-0",
                  isActive
                    ? "border border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_24px_rgba(212,175,55,0.18)]"
                    : "border border-transparent text-[#A3A3A3] hover:bg-[#171717]/80 hover:text-[#F5F5F5]"
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <article
        role="tabpanel"
        id={`history-panel-${activeConfig.id}`}
        aria-labelledby={`history-tab-${activeConfig.id}`}
        className={cn(cardClassName, "relative z-10")}
      >
        {activeTab === "metrics" ? (
          <MetricsHistoryTab {...tabFilterProps} />
        ) : activeTab === "habits" ? (
          <HabitsHistoryTab {...tabFilterProps} />
        ) : (
          <JournalHistoryTab {...tabFilterProps} />
        )}
      </article>

      <HistoryModal
        open={editOpen}
        title="Edit Entry"
        onClose={() => setEditOpen(false)}
      >
        <p className="text-[#A3A3A3]">Edit feature coming soon</p>
        <button
          type="button"
          onClick={() => setEditOpen(false)}
          className={cn(
            "mt-6 w-full rounded-xl border border-[#D4AF37]/30 py-3",
            "text-sm font-semibold text-[#D4AF37] transition-all duration-300",
            "hover:bg-[#D4AF37]/10"
          )}
        >
          Close
        </button>
      </HistoryModal>

      <HistoryModal
        open={deleteTarget != null}
        title="Delete Entry"
        onClose={() => !isDeleting && setDeleteTarget(null)}
      >
        <p className="text-[#A3A3A3]">
          Are you sure you want to delete the entry for{" "}
          <span className="font-medium text-[#F5F5F5]">
            {deleteTarget ? formatHistoryDate(deleteTarget.date) : ""}
          </span>
          ? This action cannot be undone.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => setDeleteTarget(null)}
            className={cn(
              "flex-1 rounded-xl border border-[#D4AF37]/25 py-3",
              "text-sm font-semibold text-[#A3A3A3] transition-all duration-300",
              "hover:bg-[#171717]/80 disabled:opacity-50"
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => void handleConfirmDelete()}
            className={cn(
              "flex-1 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 py-3",
              "text-sm font-semibold text-[#EF4444] transition-all duration-300",
              "hover:bg-[#EF4444]/20 disabled:opacity-50"
            )}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </HistoryModal>
    </div>
  );
}
