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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { notifyCheckinSaved } from "@/lib/checkinSync";
import { saveBodyMetrics } from "@/lib/analytics";
import { getBodyMetricsByDate, type BodyMetricsRecord } from "@/lib/bodyMetrics";
import {
  generateDailySummary,
  getDailySummaryGradeColor,
} from "@/lib/dailySummary";
import {
  buildEmptyCompletions,
  calculateHabitScore,
  countCompletedHabits,
  getHabitEntryByDate,
  mergeCompletions,
  saveHabitEntry,
  type HabitEntry,
  type HabitInput,
} from "@/lib/habit";
import { resolveAiConfig } from "@/lib/aiSettingsConfig";
import {
  buildHabitEngineContext,
  toHabitScoreContext,
  type HabitEngineContext,
} from "@/lib/habitConfig";
import { resolveScoringConfig } from "@/lib/scoringSettingsConfig";
import { fetchClientSettings } from "@/lib/settingsClient";
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
  bodyFat: string;
  steps: string;
  sleepHours: string;
  workoutDone: boolean;
  cheatMeal: boolean;
};

type JournalForm = Pick<JournalInput, "wins" | "failures" | "reflection">;

type CheckInState = {
  body: BodyMetricsForm;
  habitCompletions: Record<string, boolean>;
  journal: JournalForm;
};

const today = () => new Date().toISOString().split("T")[0];

const initialJournal = (): JournalForm => ({
  wins: "",
  failures: "",
  reflection: "",
});

const emptyBodyForDate = (date: string): BodyMetricsForm => ({
  date,
  weight: "",
  waist: "",
  bodyFat: "",
  steps: "",
  sleepHours: "",
  workoutDone: false,
  cheatMeal: false,
});

const initialCheckIn = (habitKeys: string[] = []): CheckInState => ({
  body: emptyBodyForDate(today()),
  habitCompletions: buildEmptyCompletions(habitKeys),
  journal: initialJournal(),
});

function habitEntryToCompletions(
  entry: HabitEntry,
  habitKeys: string[]
): Record<string, boolean> {
  return mergeCompletions(
    buildEmptyCompletions(habitKeys),
    entry.completions
  );
}

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
    bodyFat: formatOptionalNumber(row.body_fat),
    steps: formatOptionalNumber(row.steps),
    sleepHours: formatOptionalNumber(row.sleep_hours),
    workoutDone: row.workout_done,
    cheatMeal: row.cheat_meal,
  };
}

function journalEntryToForm(entry: JournalEntry): JournalForm {
  return {
    wins: entry.wins ?? "",
    failures: entry.failures ?? "",
    reflection: entry.reflection ?? "",
  };
}

function validateBodyMetricsForm(body: BodyMetricsForm): string | null {
  if (!body.date.trim()) return "Date is required.";

  const weightStr = body.weight.trim();
  if (!weightStr) return "Weight is required.";
  const weight = Number(weightStr);
  if (Number.isNaN(weight) || weight <= 0) {
    return "Weight must be a positive number.";
  }

  const waistStr = body.waist.trim();
  if (!waistStr) return "Waist is required.";
  const waist = Number(waistStr);
  if (Number.isNaN(waist) || waist <= 0) {
    return "Waist must be a positive number.";
  }

  const bodyFatStr = body.bodyFat.trim();
  if (!bodyFatStr) return "Body fat is required.";
  const bodyFat = Number(bodyFatStr);
  if (Number.isNaN(bodyFat) || bodyFat < 1 || bodyFat > 100) {
    return "Body fat must be between 1 and 100.";
  }

  const stepsStr = body.steps.trim();
  if (!stepsStr) return "Steps are required.";
  const steps = Number(stepsStr);
  if (Number.isNaN(steps) || steps < 0 || !Number.isInteger(steps)) {
    return "Steps must be a whole number of 0 or more.";
  }

  const sleepStr = body.sleepHours.trim();
  if (!sleepStr) return "Sleep hours are required.";
  const sleepHours = Number(sleepStr);
  if (Number.isNaN(sleepHours) || sleepHours <= 0 || sleepHours > 24) {
    return "Sleep hours must be greater than 0 and at most 24.";
  }

  return null;
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

const groupIcons: Record<string, ElementType> = {
  Fitness: Dumbbell,
  Mind: BookOpen,
  Career: Activity,
  Discipline: Shield,
  Social: Activity,
  Health: Activity,
  Growth: BookOpen,
};

function FieldLabel({
  htmlFor,
  children,
  required = false,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-medium text-[#A3A3A3]"
    >
      {children}
      {required ? (
        <span className="ml-1 text-[#D4AF37]/80" aria-hidden>
          *
        </span>
      ) : null}
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
  const router = useRouter();
  const [checkIn, setCheckIn] = useState<CheckInState>(() => initialCheckIn());
  const [isSaving, setIsSaving] = useState(false);
  const [daySummary, setDaySummary] = useState<DaySummary | null>(null);
  const [isExistingCheckin, setIsExistingCheckin] = useState(false);
  const [isLoadingCheckin, setIsLoadingCheckin] = useState(true);
  const [checkinEngine, setCheckinEngine] = useState<HabitEngineContext>(() =>
    buildHabitEngineContext(null, undefined, "checkin")
  );
  const [scoringEngine, setScoringEngine] = useState<HabitEngineContext>(() =>
    buildHabitEngineContext(null, undefined, "scoring")
  );
  const [scoringConfig, setScoringConfig] = useState(() =>
    resolveScoringConfig(null)
  );
  const [aiConfig, setAiConfig] = useState(() => resolveAiConfig(null));

  useEffect(() => {
    void fetchClientSettings().then((settings) => {
      if (!settings) return;

      setCheckinEngine(settings.checkinHabitEngine);
      setScoringEngine(settings.habitEngine);
      setScoringConfig(settings.scoring);
      setAiConfig(settings.ai);
    });
  }, []);

  const habitScoreContext = useMemo(
    () => toHabitScoreContext(scoringEngine),
    [scoringEngine]
  );
  const checkinKeys = checkinEngine.enabledKeys;
  const enabledHabitTotal = checkinEngine.enabledCount;

  const loadCheckinData = useCallback(
    async (selectedDate: string, isCancelled?: () => boolean) => {
      const normalizedDate = selectedDate.trim();
      if (!normalizedDate) return;

      console.log("CHECKIN PREFILL FETCH", { date: normalizedDate });
      setIsLoadingCheckin(true);
      setCheckIn({
        body: emptyBodyForDate(normalizedDate),
        habitCompletions: buildEmptyCompletions(checkinKeys),
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
          habitCompletions: hasHabit
            ? habitEntryToCompletions(habitResult.data!, checkinKeys)
            : buildEmptyCompletions(checkinKeys),
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
    [checkinKeys]
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
      completions: checkIn.habitCompletions,
      notes: null,
    }),
    [checkIn.body.date, checkIn.habitCompletions]
  );

  const habitScore = useMemo(
    () => calculateHabitScore(habitInput, habitScoreContext),
    [habitInput, habitScoreContext]
  );
  const completedHabits = useMemo(
    () => countCompletedHabits(habitInput, habitScoreContext),
    [habitInput, habitScoreContext]
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

    return calculateVGScore(
      {
        workout_done: checkIn.body.workoutDone,
        cheat_meal: checkIn.body.cheatMeal,
        steps: Number.isNaN(steps) ? undefined : steps,
        sleep_hours: Number.isNaN(sleepHours) ? undefined : sleepHours,
      },
      aiConfig
    );
  }, [checkIn.body, scoreReady, aiConfig]);

  function updateBody<K extends keyof BodyMetricsForm>(
    key: K,
    value: BodyMetricsForm[K]
  ) {
    setCheckIn((prev) => ({
      ...prev,
      body: { ...prev.body, [key]: value },
    }));
  }

  function updateHabit(key: string, value: boolean) {
    setCheckIn((prev) => ({
      ...prev,
      habitCompletions: { ...prev.habitCompletions, [key]: value },
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
    setCheckIn(initialCheckIn(checkinKeys));
    setDaySummary(null);
    setIsExistingCheckin(false);
    toast.message("Check-in reset");
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationError = validateBodyMetricsForm(checkIn.body);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const date = checkIn.body.date.trim();
    const weight = Number(checkIn.body.weight.trim());
    const waist = Number(checkIn.body.waist.trim());
    const bodyFat = Number(checkIn.body.bodyFat.trim());
    const steps = Number(checkIn.body.steps.trim());
    const sleepHours = Number(checkIn.body.sleepHours.trim());

    setIsSaving(true);
    setDaySummary(null);

    const bodyPayload = {
      date,
      weight,
      waist,
      body_fat: bodyFat,
      steps,
      sleep_hours: sleepHours,
      workout_done: checkIn.body.workoutDone,
      cheat_meal: checkIn.body.cheatMeal,
    };

    console.log("BODY_METRICS PAYLOAD", {
      date: bodyPayload.date,
      weight: bodyPayload.weight,
      waist: bodyPayload.waist,
      body_fat: bodyPayload.body_fat,
      steps: bodyPayload.steps,
      sleep_hours: bodyPayload.sleep_hours,
      workout_done: bodyPayload.workout_done,
      cheat_meal: bodyPayload.cheat_meal,
    });

    const existingHabitResult = await getHabitEntryByDate(date);
    const mergedCompletions = mergeCompletions(
      existingHabitResult.data?.completions ?? {},
      checkIn.habitCompletions
    );

    const habitPayload: HabitInput = {
      date,
      completions: mergedCompletions,
      notes: null,
    };
    const habitScoreValue = calculateHabitScore(habitPayload, habitScoreContext);

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

      console.log("BODY METRICS SAVED ROW", bodyResult.data);

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

      const summary = generateDailySummary(
        {
          habitScore: habitScoreValue,
          habits: mergedCompletions,
          workoutDone: checkIn.body.workoutDone,
          sleepHours:
            sleepHours != null && !Number.isNaN(sleepHours) ? sleepHours : null,
          mood: journalResult.data?.mood ?? null,
        },
        {
          scoring: scoringConfig,
          ai: aiConfig,
          enabledHabitKeys: scoringEngine.enabledKeys,
          fieldLabels: Object.fromEntries(
            scoringEngine.enabledFields.map((field) => [field.key, field.label])
          ),
        }
      );

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
      notifyCheckinSaved();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("CHECKIN ERROR", { step: "unknown", error: message, err });
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  const gradeBands = scoringConfig.vg_grade_bands;

  const vgScoreColor =
    estimatedDailyScore != null
      ? getVGScoreColor(estimatedDailyScore, true, gradeBands)
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
            subtitle="Required daily metrics for analytics and scoring"
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
                <FieldLabel htmlFor="weight" required>
                  Weight (kg)
                </FieldLabel>
                <input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="1"
                  value={checkIn.body.weight}
                  onChange={(e) => updateBody("weight", e.target.value)}
                  placeholder="e.g. 85.5"
                  className={inputClassName}
                  required
                />
              </div>
              <div>
                <FieldLabel htmlFor="waist" required>
                  Waist (inches)
                </FieldLabel>
                <input
                  id="waist"
                  type="number"
                  step="0.1"
                  min="1"
                  value={checkIn.body.waist}
                  onChange={(e) => updateBody("waist", e.target.value)}
                  placeholder="e.g. 34"
                  className={inputClassName}
                  required
                />
                <p className="mt-1.5 text-xs text-[#A3A3A3]">
                  Updates mission current waist on save
                </p>
              </div>
              <div>
                <FieldLabel htmlFor="bodyFat" required>
                  Body fat (%)
                </FieldLabel>
                <input
                  id="bodyFat"
                  type="number"
                  step="0.1"
                  min="1"
                  max="100"
                  value={checkIn.body.bodyFat}
                  onChange={(e) => updateBody("bodyFat", e.target.value)}
                  placeholder="e.g. 18.5"
                  className={inputClassName}
                  required
                />
              </div>
              <div>
                <FieldLabel htmlFor="steps" required>
                  Steps
                </FieldLabel>
                <input
                  id="steps"
                  type="number"
                  min="0"
                  step="1"
                  value={checkIn.body.steps}
                  onChange={(e) => updateBody("steps", e.target.value)}
                  placeholder="e.g. 8500"
                  className={inputClassName}
                  required
                />
              </div>
              <div>
                <FieldLabel htmlFor="sleepHours" required>
                  Sleep Hours
                </FieldLabel>
                <input
                  id="sleepHours"
                  type="number"
                  step="0.5"
                  min="0.1"
                  max="24"
                  value={checkIn.body.sleepHours}
                  onChange={(e) => updateBody("sleepHours", e.target.value)}
                  placeholder="e.g. 7.5"
                  className={inputClassName}
                  required
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
            subtitle={`${completedHabits} / ${enabledHabitTotal} completed · ${habitScore}% score`}
          />

          <div className="space-y-6">
            {checkinEngine.groups.map((group) => {
              const Icon = groupIcons[group.title] ?? Dumbbell;

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
                        checked={checkIn.habitCompletions[field.key] === true}
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
                {completedHabits} of {enabledHabitTotal} habits
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
                  ? `${getVGScoreGrade(estimatedDailyScore, true, gradeBands)} · ${getVGScoreStatus(estimatedDailyScore, true, gradeBands)}`
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
