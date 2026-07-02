import {
  calculateAnalyticsGoalCards,
  calculateAverageVGScore,
  type AnalyticsRecord,
  type MetricGoalCard,
} from "@/lib/analytics";
import {
  fetchAllBodyMetricsRecords,
  pickAnalyticsCurrentRecord,
} from "@/lib/bodyMetrics";
import { resolveGoalsConfig } from "@/lib/goalsSettingsConfig";
import {
  generateCoachReport,
  type CoachInput,
  type CoachReport,
} from "@/lib/aiCoach";
import { getJournalEntries, type JournalEntry } from "@/lib/journal";
import { getHabitEntries, type HabitEntry } from "@/lib/habit";
import { resolveAiConfig } from "@/lib/aiSettingsConfig";
import { getConfig } from "@/lib/settings";
import { resolveProfileConfig } from "@/lib/profileSettingsConfig";

export type CoachMetricsSummary = {
  averageSleep: number;
  averageSteps: number;
  averageVGScore: number;
  /** Positive when weight was lost (first − latest). */
  weightTrend: number;
};

export type CoachHabitSummary = {
  habitScore: number;
  gymConsistency: number;
  sleepHabitConsistency: number;
  proteinConsistency: number;
  junkFoodDiscipline: number;
};

export type CoachDataResult = {
  report: CoachReport | null;
  input: CoachInput | null;
  summary: CoachMetricsSummary | null;
  habitSummary: CoachHabitSummary | null;
  goalCards: MetricGoalCard[];
  profileName: string;
  hasSufficientData: boolean;
  error: string | null;
};

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: string }).message);
  }
  return fallback;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function averageJournalField(
  entries: JournalEntry[],
  field: "mood" | "energy" | "discipline"
): number | undefined {
  const values = entries
    .map((entry) => entry[field])
    .filter((value): value is number => value != null && !Number.isNaN(value));

  if (values.length === 0) return undefined;
  return average(values);
}

async function fetchBodyMetrics(): Promise<{
  records: AnalyticsRecord[];
  error: string | null;
}> {
  const { data, error } = await fetchAllBodyMetricsRecords();
  return { records: data as AnalyticsRecord[], error };
}

function habitCompletionConsistency(
  entries: HabitEntry[],
  habitId: string
): number {
  if (entries.length === 0) return 0;
  const completed = entries.filter(
    (entry) => entry.completions[habitId] === true
  ).length;
  return Math.round((completed / entries.length) * 100);
}

function buildHabitSummary(entries: HabitEntry[]): CoachHabitSummary {
  const scores = entries
    .map((entry) => entry.habit_score)
    .filter((score) => !Number.isNaN(score));

  return {
    habitScore:
      scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0,
    gymConsistency: habitCompletionConsistency(entries, "workout"),
    sleepHabitConsistency: habitCompletionConsistency(entries, "sleep"),
    proteinConsistency: habitCompletionConsistency(entries, "diet"),
    junkFoodDiscipline: habitCompletionConsistency(entries, "no_junk_food_done"),
  };
}

function buildCoachInput(
  records: AnalyticsRecord[],
  journalEntries: JournalEntry[],
  habitEntries: HabitEntry[],
  startingWeight: number
): { input: CoachInput; summary: CoachMetricsSummary; habitSummary: CoachHabitSummary | null } {
  const sleepValues = records
    .map((record) => record.sleep_hours)
    .filter((value): value is number => value != null && !Number.isNaN(value));

  const stepValues = records
    .map((record) => record.steps)
    .filter((value): value is number => value != null && !Number.isNaN(value));

  const currentRecord = pickAnalyticsCurrentRecord(records);
  const latestWeight = currentRecord?.weight ?? null;
  const weightTrendDisplay =
    latestWeight != null ? startingWeight - latestWeight : 0;

  const workoutDays = records.filter((record) => record.workout_done).length;
  const workoutConsistency =
    records.length > 0 ? (workoutDays / records.length) * 100 : 0;

  const averageSleep = sleepValues.length > 0 ? average(sleepValues) : 0;
  const averageSteps = stepValues.length > 0 ? average(stepValues) : 0;
  const averageVGScore = calculateAverageVGScore(records);

  const input: CoachInput = {
    averageVGScore,
    averageSleep,
    averageSteps,
    weightTrend:
      latestWeight != null
        ? latestWeight - (records[0]?.weight ?? latestWeight)
        : 0,
    workoutConsistency,
    averageMood: averageJournalField(journalEntries, "mood"),
    averageEnergy: averageJournalField(journalEntries, "energy"),
    averageDiscipline: averageJournalField(journalEntries, "discipline"),
  };

  const habitSummary =
    habitEntries.length > 0 ? buildHabitSummary(habitEntries) : null;

  if (habitSummary) {
    input.habitScore = habitSummary.habitScore;
    input.gymConsistency = habitSummary.gymConsistency;
    input.sleepHabitConsistency = habitSummary.sleepHabitConsistency;
    input.proteinConsistency = habitSummary.proteinConsistency;
    input.junkFoodDiscipline = habitSummary.junkFoodDiscipline;
  }

  return {
    input,
    summary: {
      averageSleep,
      averageSteps,
      averageVGScore,
      weightTrend: weightTrendDisplay,
    },
    habitSummary,
  };
}

export async function getCoachData(): Promise<CoachDataResult> {
  const [metricsResult, journalResult, habitResult, config] = await Promise.all([
    fetchBodyMetrics(),
    getJournalEntries(),
    getHabitEntries(),
    getConfig(),
  ]);

  const profile = resolveProfileConfig(config);
  const goals = resolveGoalsConfig(config);
  const ai = resolveAiConfig(config);

  const error =
    metricsResult.error ?? journalResult.error ?? habitResult.error;
  const records = metricsResult.records;
  const journalEntries = journalResult.data ?? [];
  const habitEntries = habitResult.data ?? [];

  if (records.length === 0) {
    return {
      report: null,
      input: null,
      summary: null,
      habitSummary: null,
      goalCards: [],
      profileName: profile.name,
      hasSufficientData: false,
      error,
    };
  }

  const { input, summary, habitSummary } = buildCoachInput(
    records,
    journalEntries,
    habitEntries,
    profile.startingWeight
  );
  const report = generateCoachReport(input, ai);
  const goalCards = calculateAnalyticsGoalCards(records, profile, goals);

  return {
    report,
    input,
    summary,
    habitSummary,
    goalCards,
    profileName: profile.name,
    hasSufficientData: true,
    error,
  };
}

export function formatCoachMetric(value: number, decimals = 1): string {
  if (Number.isNaN(value)) return "—";
  return value.toFixed(decimals);
}

export function formatWeightTrend(value: number): string {
  if (Number.isNaN(value) || value === 0) return "0 kg";
  const sign = value > 0 ? "−" : "+";
  return `${sign}${Math.abs(value).toFixed(1)} kg`;
}
