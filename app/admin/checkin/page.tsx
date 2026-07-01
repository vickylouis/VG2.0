"use client";

import { useCallback, useEffect, useMemo, useState, type ElementType } from "react";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Dumbbell,
  RotateCcw,
  Save,
  Scale,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { saveBodyMetrics } from "@/lib/analytics";
import { getBodyMetricsByDate, type BodyMetricsRecord } from "@/lib/bodyMetrics";
import {
  generateDailySummary,
  getDailySummaryGradeColor,
} from "@/lib/dailySummary";
import {
  calculateHabitScore,
  getHabitEntryByDate,
  HABIT_FIELD_GROUPS,
  HABIT_TOTAL,
  saveHabitEntry,
  type HabitEntry,
  type HabitInput,
} from "@/lib/habit";
import {
  getJournalEntryByDate,
  saveJournalEntry,
  type JournalEntry,
  type JournalInput,
} from "@/lib/journal";
import {
  calculateVGScore,
  getVGScoreColor,
  getVGScoreGrade,
  getVGScoreStatus,
  isScoreReady,
} from "@/lib/vgScore";
import { cn } from "@/lib/utils";

type BodyMetricsForm = {
  date: string;
  weight: string;
  waist: string;
  steps: string;
  sleepHours: string;
  workoutDone: boolean;
  cheatMeal: boolean;
};

type JournalForm = Pick<JournalInput, "wins" | "failures" | "reflection">;

type HabitForm = Omit<HabitInput, "date" | "notes">;

type CheckInState = {
  body: BodyMetricsForm;
  habits: HabitForm;
  journal: JournalForm;
};

const today = () => new Date().toISOString().split("T")[0];

const initialHabits = (): HabitForm => ({
  gym_done: false,
  steps_done: false,
  protein_target_done: false,
  water_target_done: false,
  sleep_before_11_done: false,
  reading_done: false,
  english_practice_done: false,
  automation_learning_done: false,
  mma_done: false,
  no_junk_food_done: false,
  family_time_done: false,
});

const initialJournal = (): JournalForm => ({
  wins: "",
  failures: "",
  reflection: "",
});

const emptyBodyForDate = (date: string): BodyMetricsForm => ({
  date,
  weight: "",
  waist: "",
  steps: "",
  sleepHours: "",
  workoutDone: false,
  cheatMeal: false,
});

const initialCheckIn = (): CheckInState => ({
  body: emptyBodyForDate(today()),
  habits: initialHabits(),
  journal: initialJournal(),
});

function formatOptionalNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  return String(value);
}

function bodyMetricsToForm(
  date: string,
  row: BodyMetricsRecord | null
): BodyMetricsForm {
  if (!row) return emptyBodyForDate(date);

  return {
    date,
    weight: formatOptionalNumber(row.weight),
    waist: formatOptionalNumber(row.waist),
    steps: formatOptionalNumber(row.steps),
    sleepHours: formatOptionalNumber(row.sleep_hours),
    workoutDone: row.workout_done,
    cheatMeal: row.cheat_meal,
  };
}

function habitEntryToForm(entry: HabitEntry): HabitForm {
  return {
    gym_done: entry.gym_done,
    steps_done: entry.steps_done,
    protein_target_done: entry.protein_target_done,
    water_target_done: entry.water_target_done,
    sleep_before_11_done: entry.sleep_before_11_done,
    reading_done: entry.reading_done,
    english_practice_done: entry.english_practice_done,
    automation_learning_done: entry.automation_learning_done,
    mma_done: entry.mma_done,
    no_junk_food_done: entry.no_junk_food_done,
    family_time_done: entry.family_time_done,
  };
}

function journalEntryToForm(entry: JournalEntry): JournalForm {
  return {
    wins: entry.wins ?? "",
    failures: entry.failures ?? "",
    reflection: entry.reflection ?? "",
  };
}

const cardClassName = cn(
  "rounded-[24px] border border-[#D4AF37]/25 p-6 sm:p-8",
  "bg-gradient-to-br from-[#171717]/90 via-[#0B0B0B]/95 to-[#171717]/80",
  "shadow-[0_0_40px_rgba(212,175,55,0.1)] backdrop-blur-xl",
  "transition-all duration-300 hover:border-[#D4AF37]/35 hover:shadow-[0_0_48px_rgba(212,175,55,0.14)]"
);

const inputClassName = cn(
  "w-full rounded-xl border border-[#D4AF37]/20 bg-[#0B0B0B]/80 px-4 py-3",
  "text-[#F5F5F5] placeholder:text-[#A3A3A3]/50",
  "outline-none transition-all duration-300",
  "focus:border-[#D4AF37]/50 focus:shadow-[0_0_20px_rgba(212,175,55,0.12)]"
);

const groupIcons = {
  Health: Activity,
  Growth: BookOpen,
  Discipline: Shield,
} as const;

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-medium text-[#A3A3A3]"
    >
      {children}
    </label>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
        <Icon className="size-5 text-[#D4AF37]" aria-hidden />
      </div>
      <div>
        <h2 className="text-xl font-bold text-[#F5F5F5]">{title}</h2>
        {subtitle && <p className="text-sm text-[#A3A3A3]">{subtitle}</p>}
      </div>
    </div>
  );
}

function HabitToggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3.5",
        "transition-all duration-300",
        checked
          ? "border-[#D4AF37]/35 bg-[#D4AF37]/10 shadow-[0_0_20px_rgba(212,175,55,0.12)]"
          : "border-[#D4AF37]/10 bg-[#0B0B0B]/50 hover:border-[#D4AF37]/25"
      )}
    >
      <span className="text-sm font-medium text-[#F5F5F5]">{label}</span>
      <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-full border transition-all duration-300",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-[#D4AF37]/50",
            checked
              ? "border-[#D4AF37]/50 bg-[#D4AF37]/30"
              : "border-[#D4AF37]/20 bg-[#171717]"
          )}
        />
        <span
          aria-hidden
          className={cn(
            "absolute size-5 rounded-full shadow transition-transform duration-300",
            checked
              ? "translate-x-6 bg-[#D4AF37]"
              : "translate-x-1 bg-[#F5F5F5]"
          )}
        />
      </span>
    </label>
  );
}

function MetricToggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5",
        "transition-all duration-300",
        checked
          ? "border-[#D4AF37]/35 bg-[#D4AF37]/10"
          : "border-[#D4AF37]/10 bg-[#0B0B0B]/50 hover:border-[#D4AF37]/25"
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-[#D4AF37]/30 bg-[#0B0B0B] text-[#D4AF37] focus:ring-[#D4AF37]/50"
      />
      <span className="text-sm font-medium text-[#F5F5F5]">{label}</span>
    </label>
  );
}

function countCompletedHabits(habits: HabitForm): number {
  return Object.values(habits).filter(Boolean).length;
}

type DaySummary = {
  date: string;
  dailyScore: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
};

function DailySummaryCard({ summary }: { summary: DaySummary }) {
  const gradeColor = getDailySummaryGradeColor(summary.grade);

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-[#D4AF37]/35 p-6 sm:p-8",
        "bg-gradient-to-br from-[#171717]/80 via-[#0B0B0B]/90 to-[#171717]/70",
        "shadow-[0_0_56px_rgba(212,175,55,0.14)] backdrop-blur-xl",
        "animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-[#D4AF37]/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-10 size-32 rounded-full bg-[#22C55E]/5 blur-3xl"
      />

      <div className="relative z-10">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 shadow-[0_0_24px_rgba(212,175,55,0.12)]">
            <Sparkles className="size-6 text-[#D4AF37]" aria-hidden />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#F5F5F5]">Today&apos;s Summary</h2>
            <p className="mt-1 text-sm text-[#A3A3A3]">Saved for {summary.date}</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0B0B0B]/50 px-5 py-4 backdrop-blur-sm">
            <p className="text-xs font-medium tracking-wide text-[#A3A3A3] uppercase">
              Daily Score
            </p>
            <p className="mt-2 text-5xl font-bold text-[#F5F5F5]">{summary.dailyScore}</p>
          </div>
          <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0B0B0B]/50 px-5 py-4 backdrop-blur-sm">
            <p className="text-xs font-medium tracking-wide text-[#A3A3A3] uppercase">
              Grade
            </p>
            <p
              className="mt-2 text-5xl font-bold"
              style={{ color: gradeColor }}
            >
              {summary.grade}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <section className="rounded-xl border border-[#22C55E]/20 bg-[#22C55E]/5 px-4 py-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="size-4 text-[#22C55E]" aria-hidden />
              <h3 className="text-sm font-semibold text-[#22C55E]">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {summary.strengths.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-[#F5F5F5]"
                >
                  <span
                    aria-hidden
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#22C55E]"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-[#F97316]/20 bg-[#F97316]/5 px-4 py-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="size-4 text-[#F97316]" aria-hidden />
              <h3 className="text-sm font-semibold text-[#F97316]">
                Needs Improvement
              </h3>
            </div>
            <ul className="space-y-2">
              {summary.weaknesses.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-[#F5F5F5]"
                >
                  <span
                    aria-hidden
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#F97316]"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </article>
  );
}

function CheckInStatusBadge({
  isLoading,
  isExisting,
}: {
  isLoading: boolean;
  isExisting: boolean;
}) {
  if (isLoading) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-2 rounded-full border border-[#A3A3A3]/20",
          "bg-[#171717]/60 px-3 py-1.5 text-xs font-medium text-[#A3A3A3]"
        )}
      >
        <span
          aria-hidden
          className="size-2 shrink-0 animate-pulse rounded-full bg-[#A3A3A3]/50"
        />
        Loading…
      </span>
    );
  }

  if (isExisting) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-2 rounded-full border border-[#D4AF37]/40",
          "bg-[#D4AF37]/5 px-3 py-1.5 text-xs font-semibold text-[#D4AF37]",
          "shadow-[0_0_16px_rgba(212,175,55,0.08)]"
        )}
      >
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.55)]"
        />
        Existing Check-In Loaded
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-[#A3A3A3]/20",
        "bg-[#171717]/60 px-3 py-1.5 text-xs font-medium text-[#A3A3A3]"
      )}
    >
      New Check-In
    </span>
  );
}

export default function AdminCheckInPage() {
  const [checkIn, setCheckIn] = useState<CheckInState>(initialCheckIn);
  const [isSaving, setIsSaving] = useState(false);
  const [daySummary, setDaySummary] = useState<DaySummary | null>(null);
  const [isExistingCheckin, setIsExistingCheckin] = useState(false);
  const [isLoadingCheckin, setIsLoadingCheckin] = useState(true);

  const loadCheckinData = useCallback(
    async (selectedDate: string, isCancelled?: () => boolean) => {
      const normalizedDate = selectedDate.trim();
      if (!normalizedDate) return;

      console.log("CHECKIN PREFILL FETCH", { date: normalizedDate });
      setIsLoadingCheckin(true);
      setCheckIn({
        body: emptyBodyForDate(normalizedDate),
        habits: initialHabits(),
        journal: initialJournal(),
      });

      try {
        const bodyResult = await getBodyMetricsByDate(normalizedDate);
        if (isCancelled?.()) return;

        const habitResult = await getHabitEntryByDate(normalizedDate);
        if (isCancelled?.()) return;

        const journalResult = await getJournalEntryByDate(normalizedDate);
        if (isCancelled?.()) return;

        if (bodyResult.error || habitResult.error || journalResult.error) {
          const error =
            bodyResult.error ?? habitResult.error ?? journalResult.error;
          console.error("CHECKIN PREFILL ERROR", {
            date: normalizedDate,
            error,
          });
          setIsExistingCheckin(false);
          return;
        }

        const hasBody = bodyResult.data != null;
        const hasHabit = habitResult.data != null;
        const hasJournal = journalResult.data != null;
        const hasExisting = hasBody || hasHabit || hasJournal;

        if (hasExisting) {
          console.log("CHECKIN PREFILL FOUND", {
            date: normalizedDate,
            body: hasBody,
            habit: hasHabit,
            journal: hasJournal,
            habitScore: habitResult.data?.habit_score ?? null,
          });
          setIsExistingCheckin(true);
        } else {
          console.log("CHECKIN PREFILL EMPTY", { date: normalizedDate });
          setIsExistingCheckin(false);
        }

        setCheckIn({
          body: bodyMetricsToForm(normalizedDate, bodyResult.data),
          habits: hasHabit
            ? habitEntryToForm(habitResult.data!)
            : initialHabits(),
          journal: hasJournal
            ? journalEntryToForm(journalResult.data!)
            : initialJournal(),
        });
      } catch (err) {
        if (isCancelled?.()) return;

        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("CHECKIN PREFILL ERROR", {
          date: normalizedDate,
          error: message,
          err,
        });
        setIsExistingCheckin(false);
      } finally {
        if (!isCancelled?.()) {
          setIsLoadingCheckin(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const selectedDate = checkIn.body.date.trim();
    if (!selectedDate) return;

    let cancelled = false;
    void loadCheckinData(selectedDate, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [checkIn.body.date, loadCheckinData]);

  const habitInput = useMemo<HabitInput>(
    () => ({
      date: checkIn.body.date,
      ...checkIn.habits,
      notes: null,
    }),
    [checkIn.body.date, checkIn.habits]
  );

  const habitScore = useMemo(() => calculateHabitScore(habitInput), [habitInput]);
  const completedHabits = useMemo(
    () => countCompletedHabits(checkIn.habits),
    [checkIn.habits]
  );

  const scoreReady = isScoreReady(checkIn.body.date, checkIn.body.weight);

  const estimatedDailyScore = useMemo(() => {
    if (!scoreReady) return null;

    const steps =
      checkIn.body.steps.trim() === "" ? undefined : Number(checkIn.body.steps);
    const sleepHours =
      checkIn.body.sleepHours.trim() === ""
        ? undefined
        : Number(checkIn.body.sleepHours);

    return calculateVGScore({
      workout_done: checkIn.body.workoutDone,
      cheat_meal: checkIn.body.cheatMeal,
      steps: Number.isNaN(steps) ? undefined : steps,
      sleep_hours: Number.isNaN(sleepHours) ? undefined : sleepHours,
    });
  }, [checkIn.body, scoreReady]);

  function updateBody<K extends keyof BodyMetricsForm>(
    key: K,
    value: BodyMetricsForm[K]
  ) {
    setCheckIn((prev) => ({
      ...prev,
      body: { ...prev.body, [key]: value },
    }));
  }

  function updateHabit<K extends keyof HabitForm>(key: K, value: HabitForm[K]) {
    setCheckIn((prev) => ({
      ...prev,
      habits: { ...prev.habits, [key]: value },
    }));
  }

  function updateJournal<K extends keyof JournalForm>(
    key: K,
    value: JournalForm[K]
  ) {
    setCheckIn((prev) => ({
      ...prev,
      journal: { ...prev.journal, [key]: value },
    }));
  }

  function handleReset() {
    setCheckIn(initialCheckIn());
    setDaySummary(null);
    setIsExistingCheckin(false);
    toast.message("Check-in reset");
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const date = checkIn.body.date.trim();
    const weightStr = checkIn.body.weight.trim();

    if (!date) {
      toast.error("Date is required.");
      return;
    }

    if (!weightStr) {
      toast.error("Weight is required.");
      return;
    }

    const weight = Number(weightStr);
    if (Number.isNaN(weight)) {
      toast.error("Weight must be a valid number.");
      return;
    }

    setIsSaving(true);
    setDaySummary(null);

    const waistRaw = checkIn.body.waist.trim();
    const stepsRaw = checkIn.body.steps.trim();
    const sleepRaw = checkIn.body.sleepHours.trim();
    const waist = waistRaw ? Number(waistRaw) : null;
    const steps = stepsRaw ? Number(stepsRaw) : null;
    const sleepHours = sleepRaw ? Number(sleepRaw) : null;

    const bodyPayload = {
      date,
      weight,
      waist: waist != null && !Number.isNaN(waist) ? waist : null,
      steps: steps != null && !Number.isNaN(steps) ? steps : null,
      sleep_hours: sleepHours != null && !Number.isNaN(sleepHours) ? sleepHours : null,
      workout_done: checkIn.body.workoutDone,
      cheat_meal: checkIn.body.cheatMeal,
    };

    const habitPayload: HabitInput = {
      date,
      ...checkIn.habits,
      notes: null,
    };
    const habitScoreValue = calculateHabitScore(habitPayload);

    const journalPayload: JournalInput = {
      date,
      wins: checkIn.journal.wins,
      failures: checkIn.journal.failures,
      reflection: checkIn.journal.reflection,
    };

    try {
      console.log("CHECKIN BODY SAVE", bodyPayload);
      const bodyResult = await saveBodyMetrics(bodyPayload);
      if (bodyResult.error) {
        console.error("CHECKIN ERROR", { step: "body", error: bodyResult.error });
        toast.error(`Body metrics save failed: ${bodyResult.error}`);
        return;
      }

      console.log("CHECKIN HABIT SAVE", {
        ...habitPayload,
        habit_score: habitScoreValue,
      });
      const habitResult = await saveHabitEntry(habitPayload);
      if (habitResult.error) {
        console.error("CHECKIN ERROR", { step: "habit", error: habitResult.error });
        toast.error(`Habit save failed: ${habitResult.error}`);
        return;
      }

      console.log("CHECKIN JOURNAL SAVE", journalPayload);
      const journalResult = await saveJournalEntry(journalPayload);
      if (journalResult.error) {
        console.error("CHECKIN ERROR", {
          step: "journal",
          error: journalResult.error,
        });
        toast.error(`Journal save failed: ${journalResult.error}`);
        return;
      }

      const summary = generateDailySummary({
        habitScore: habitScoreValue,
        habits: checkIn.habits,
        workoutDone: checkIn.body.workoutDone,
        sleepHours:
          sleepHours != null && !Number.isNaN(sleepHours) ? sleepHours : null,
        mood: journalResult.data?.mood ?? null,
      });

      console.log("CHECKIN SUCCESS", {
        date,
        habitScore: habitScoreValue,
        dailyScore: summary.dailyScore,
      });

      console.log("DAILY SUMMARY GENERATED", {
        date,
        ...summary,
      });

      toast.success("Daily check-in completed successfully");
      setIsExistingCheckin(true);
      setDaySummary({
        date,
        ...summary,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("CHECKIN ERROR", { step: "unknown", error: message, err });
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  const vgScoreColor =
    estimatedDailyScore != null
      ? getVGScoreColor(estimatedDailyScore, true)
      : "#A3A3A3";

  return (
    <div className="relative mx-auto max-w-3xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-[#D4AF37]/6 blur-[120px]"
      />

      <form onSubmit={handleSave} className="relative z-10 space-y-6">
        <header className="mb-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-[#F5F5F5] sm:text-4xl">
              Daily Check-In
            </h1>
            <CheckInStatusBadge
              isLoading={isLoadingCheckin}
              isExisting={isExistingCheckin}
            />
          </div>
          <p className="mt-2 text-[#A3A3A3]">
            Complete your daily transformation check-in in 5 minutes
          </p>
        </header>

        <article className={cardClassName}>
          <SectionHeader
            icon={Scale}
            title="Body Metrics"
            subtitle="Physical performance for the day"
          />

          <div className="space-y-5">
            <div>
              <FieldLabel htmlFor="date">Date</FieldLabel>
              <input
                id="date"
                type="date"
                value={checkIn.body.date}
                onChange={(e) => updateBody("date", e.target.value)}
                className={inputClassName}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="weight">Weight (kg)</FieldLabel>
                <input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={checkIn.body.weight}
                  onChange={(e) => updateBody("weight", e.target.value)}
                  placeholder="e.g. 85.5"
                  className={inputClassName}
                />
              </div>
              <div>
                <FieldLabel htmlFor="waist">Waist (in)</FieldLabel>
                <input
                  id="waist"
                  type="number"
                  step="0.1"
                  value={checkIn.body.waist}
                  onChange={(e) => updateBody("waist", e.target.value)}
                  placeholder="e.g. 34"
                  className={inputClassName}
                />
              </div>
              <div>
                <FieldLabel htmlFor="steps">Steps</FieldLabel>
                <input
                  id="steps"
                  type="number"
                  value={checkIn.body.steps}
                  onChange={(e) => updateBody("steps", e.target.value)}
                  placeholder="e.g. 8500"
                  className={inputClassName}
                />
              </div>
              <div>
                <FieldLabel htmlFor="sleepHours">Sleep Hours</FieldLabel>
                <input
                  id="sleepHours"
                  type="number"
                  step="0.5"
                  value={checkIn.body.sleepHours}
                  onChange={(e) => updateBody("sleepHours", e.target.value)}
                  placeholder="e.g. 7.5"
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MetricToggle
                id="workoutDone"
                label="Workout done"
                checked={checkIn.body.workoutDone}
                onChange={(checked) => updateBody("workoutDone", checked)}
              />
              <MetricToggle
                id="cheatMeal"
                label="Cheat meal"
                checked={checkIn.body.cheatMeal}
                onChange={(checked) => updateBody("cheatMeal", checked)}
              />
            </div>
          </div>
        </article>

        <article className={cardClassName}>
          <SectionHeader
            icon={Target}
            title="Habits"
            subtitle={`${completedHabits} / ${HABIT_TOTAL} completed · ${habitScore}% score`}
          />

          <div className="space-y-6">
            {HABIT_FIELD_GROUPS.map((group) => {
              const Icon = groupIcons[group.title as keyof typeof groupIcons] ?? Dumbbell;

              return (
                <div key={group.title}>
                  <div className="mb-3 flex items-center gap-2">
                    <Icon className="size-4 text-[#D4AF37]" aria-hidden />
                    <h3 className="text-sm font-semibold tracking-wide text-[#D4AF37] uppercase">
                      {group.title}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {group.fields.map((field) => (
                      <HabitToggle
                        key={field.key}
                        id={`checkin-${field.key}`}
                        label={field.label}
                        checked={checkIn.habits[field.key]}
                        onChange={(checked) => updateHabit(field.key, checked)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className={cardClassName}>
          <SectionHeader
            icon={BookOpen}
            title="Journal"
            subtitle="Mindset, wins, and honest reflection"
          />

          <div className="space-y-5">
            <div>
              <FieldLabel htmlFor="wins">Wins</FieldLabel>
              <textarea
                id="wins"
                rows={3}
                value={checkIn.journal.wins ?? ""}
                onChange={(e) => updateJournal("wins", e.target.value)}
                placeholder="What went well today?"
                className={cn(inputClassName, "resize-none")}
              />
            </div>
            <div>
              <FieldLabel htmlFor="failures">Failures</FieldLabel>
              <textarea
                id="failures"
                rows={3}
                value={checkIn.journal.failures ?? ""}
                onChange={(e) => updateJournal("failures", e.target.value)}
                placeholder="What could have gone better?"
                className={cn(inputClassName, "resize-none")}
              />
            </div>
            <div>
              <FieldLabel htmlFor="reflection">Reflection</FieldLabel>
              <textarea
                id="reflection"
                rows={4}
                value={checkIn.journal.reflection ?? ""}
                onChange={(e) => updateJournal("reflection", e.target.value)}
                placeholder="Honest thoughts on the day…"
                className={cn(inputClassName, "resize-none")}
              />
            </div>
          </div>
        </article>

        <article className={cardClassName}>
          <SectionHeader
            icon={Sparkles}
            title="Summary"
            subtitle="Live scores before you save"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#D4AF37]/15 bg-[#0B0B0B]/50 px-4 py-5 text-center">
              <p className="text-xs font-medium tracking-wide text-[#A3A3A3] uppercase">
                Habit Score
              </p>
              <p className="mt-2 text-4xl font-bold text-[#D4AF37]">{habitScore}%</p>
              <p className="mt-1 text-sm text-[#A3A3A3]">
                {completedHabits} of {HABIT_TOTAL} habits
              </p>
            </div>
            <div className="rounded-xl border border-[#D4AF37]/15 bg-[#0B0B0B]/50 px-4 py-5 text-center">
              <p className="text-xs font-medium tracking-wide text-[#A3A3A3] uppercase">
                Estimated Daily Score
              </p>
              <p
                className="mt-2 text-4xl font-bold"
                style={{ color: vgScoreColor }}
              >
                {estimatedDailyScore != null ? estimatedDailyScore : "—"}
              </p>
              <p className="mt-1 text-sm text-[#A3A3A3]">
                {estimatedDailyScore != null
                  ? `${getVGScoreGrade(estimatedDailyScore, true)} · ${getVGScoreStatus(estimatedDailyScore, true)}`
                  : "Enter date and weight to estimate"}
              </p>
            </div>
          </div>
        </article>

        <div className="flex flex-col gap-3 pb-4 sm:flex-row">
          <button
            type="submit"
            disabled={isSaving}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#D4AF37] py-3.5",
              "text-sm font-semibold text-[#0B0B0B]",
              "transition-all duration-300 shadow-[0_0_24px_rgba(212,175,55,0.2)]",
              "hover:shadow-[0_0_36px_rgba(212,175,55,0.35)]",
              "disabled:cursor-not-allowed disabled:opacity-60"
            )}
          >
            <Save className="size-4" aria-hidden />
            {isSaving ? "Saving…" : "Save Check-In"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#D4AF37]/40 py-3.5",
              "text-sm font-semibold text-[#D4AF37]",
              "transition-all duration-300 hover:bg-[#D4AF37]/10"
            )}
          >
            <RotateCcw className="size-4" aria-hidden />
            Reset
          </button>
        </div>
      </form>

      {daySummary && (
        <div className="relative z-10 mt-6">
          <DailySummaryCard summary={daySummary} />
        </div>
      )}
    </div>
  );
}
