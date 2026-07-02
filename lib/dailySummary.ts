import type { AiCoachConfig, ScoringConfig } from "@/lib/settings";
import { resolveAiConfig } from "@/lib/aiSettingsConfig";
import { resolveScoringConfig } from "@/lib/scoringSettingsConfig";

export type DailySummaryHabits = Record<string, boolean>;

export type DailySummaryInput = {
  habitScore: number;
  habits: DailySummaryHabits;
  workoutDone: boolean;
  sleepHours: number | null;
  mood: number | null;
};

export type DailySummaryOptions = {
  scoring?: ScoringConfig;
  ai?: AiCoachConfig;
  enabledHabitKeys?: string[];
  fieldLabels?: Record<string, string>;
};

export type DailySummary = {
  dailyScore: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
};

const DEFAULT_MAJOR_HABIT_KEYS = ["workout", "diet", "sleep"] as const;

const METRICS_WORKOUT_SHARE = 20 / 35;
const METRICS_SLEEP_SHARE = 15 / 35;

export function calculateSleepScore(
  sleepHours: number | null,
  ai?: AiCoachConfig
): number {
  const goodThreshold = ai?.sleep_good_threshold ?? 7;
  const badThreshold = ai?.sleep_bad_threshold ?? 5;
  const midThreshold = badThreshold + (goodThreshold - badThreshold) * 0.5;

  if (sleepHours == null || Number.isNaN(sleepHours)) return 70;
  if (sleepHours >= goodThreshold) return 100;
  if (sleepHours >= midThreshold) return 70;
  return 40;
}

export function calculateJournalScore(mood: number | null): number {
  if (mood == null || Number.isNaN(mood)) return 70;
  const clamped = Math.min(10, Math.max(1, mood));
  return Math.round(clamped * 10);
}

export function getDailySummaryGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 65) return "C";
  return "D";
}

export function getDailySummaryGradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "#22C55E";
    case "B":
      return "#D4AF37";
    case "C":
      return "#F97316";
    default:
      return "#EF4444";
  }
}

function resolveMajorHabitLabels(
  habits: DailySummaryHabits,
  options?: DailySummaryOptions
): string[] {
  const enabledKeys = options?.enabledHabitKeys ?? [...DEFAULT_MAJOR_HABIT_KEYS];
  const labelByKey = options?.fieldLabels ?? {};

  return enabledKeys
    .filter((key) => !habits[key])
    .map((key) => labelByKey[key] ?? key);
}

export function generateDailySummary(
  input: DailySummaryInput,
  options?: DailySummaryOptions
): DailySummary {
  const scoring = options?.scoring ?? resolveScoringConfig(null);
  const ai = options?.ai ?? resolveAiConfig(null);
  const goodHabitThreshold = ai.good_habit_threshold;
  const badHabitThreshold = ai.bad_habit_threshold;
  const sleepGoodThreshold = ai.sleep_good_threshold;
  const sleepBadThreshold = ai.sleep_bad_threshold;

  const workoutScore = input.workoutDone ? 100 : 0;
  const sleepScore = calculateSleepScore(input.sleepHours, ai);
  const journalScore = calculateJournalScore(input.mood);

  const metricsWeight = scoring.metrics_weight / 100;
  const dailyScore = Math.round(
    input.habitScore * (scoring.habit_weight / 100) +
      workoutScore * (metricsWeight * METRICS_WORKOUT_SHARE) +
      sleepScore * (metricsWeight * METRICS_SLEEP_SHARE) +
      journalScore * (scoring.journal_weight / 100)
  );

  console.log("HARDCODE REMOVED", {
    module: "dailySummary",
    scoring,
    dailyScore,
  });

  const grade = getDailySummaryGrade(dailyScore);
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (input.habitScore >= goodHabitThreshold) {
    strengths.push(`Strong habit performance (${input.habitScore}% habit score)`);
  }

  if (input.workoutDone) {
    strengths.push("Workout completed");
  }

  if (input.sleepHours != null && input.sleepHours >= sleepGoodThreshold) {
    strengths.push(`Solid sleep (${input.sleepHours} hours)`);
  }

  if (input.habitScore < badHabitThreshold) {
    weaknesses.push(`Habit score needs work (${input.habitScore}%)`);
  }

  if (!input.workoutDone) {
    weaknesses.push("No workout logged");
  }

  if (input.sleepHours != null && input.sleepHours < sleepBadThreshold) {
    weaknesses.push(`Low sleep (${input.sleepHours} hours)`);
  }

  const missedMajor = resolveMajorHabitLabels(input.habits, options);

  if (missedMajor.length > 0) {
    weaknesses.push(`Missed major habits: ${missedMajor.join(", ")}`);
  }

  if (strengths.length === 0) {
    strengths.push("Check-in completed — build momentum tomorrow.");
  }

  if (weaknesses.length === 0) {
    weaknesses.push("Nothing critical flagged — keep the streak going.");
  }

  return {
    dailyScore,
    grade,
    strengths,
    weaknesses,
  };
}
