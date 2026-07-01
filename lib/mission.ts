import { INITIAL_WEIGHT, TOTAL_DAYS } from "@/lib/dashboard";
import { getCoachData } from "@/lib/coachData";
import {
  calculateCurrentHabitStreak,
  getHabitEntries,
  type HabitEntry,
} from "@/lib/habit";
import { normalizeDate, type AnalyticsRecord } from "@/lib/analytics";
import { getJournalEntries } from "@/lib/journal";
import { supabase } from "@/lib/supabase";

export const TARGET_WEIGHT = 75;

export type MissionStatus = "Excellent" | "On Track" | "Behind";

export type SkillProgress = {
  english: number;
  automation: number;
  mma: number;
};

export type MissionSummary = {
  currentDay: number;
  totalDays: number;
  dayProgressPercent: number;
  startingWeight: number;
  targetWeight: number;
  currentWeight: number | null;
  weightGoalProgress: number;
  habitScore: number;
  aiRating: string | null;
  currentStreak: number;
  missionStatus: MissionStatus;
  missionSummaryText: string;
  skillProgress: SkillProgress;
};

export type MissionDataResult = {
  summary: MissionSummary;
  journalEntryCount: number;
  error: string | null;
};

const SKILL_PLACEHOLDERS: SkillProgress = {
  english: 20,
  automation: 35,
  mma: 15,
};

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: string }).message);
  }
  return fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function averageHabitScore(entries: HabitEntry[]): number {
  const scores = entries
    .map((entry) => entry.habit_score)
    .filter((score) => !Number.isNaN(score));

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function habitSkillConsistency(
  entries: HabitEntry[],
  field: "english_practice_done" | "automation_learning_done" | "mma_done"
): number {
  if (entries.length === 0) return 0;
  const completed = entries.filter((entry) => entry[field]).length;
  return Math.round((completed / entries.length) * 100);
}

function buildSkillProgress(entries: HabitEntry[]): SkillProgress {
  if (entries.length === 0) {
    return { ...SKILL_PLACEHOLDERS };
  }

  return {
    english: habitSkillConsistency(entries, "english_practice_done"),
    automation: habitSkillConsistency(entries, "automation_learning_done"),
    mma: habitSkillConsistency(entries, "mma_done"),
  };
}

function getLatestWeight(records: AnalyticsRecord[]): number | null {
  const weights = records
    .map((record) => record.weight)
    .filter((weight): weight is number => weight != null && !Number.isNaN(weight));

  return weights[weights.length - 1] ?? null;
}

function calculateWeightGoalProgress(currentWeight: number | null): number {
  if (currentWeight == null) return 0;

  const totalToLose = INITIAL_WEIGHT - TARGET_WEIGHT;
  if (totalToLose <= 0) return 0;

  const lost = INITIAL_WEIGHT - currentWeight;
  return Math.round(clamp((lost / totalToLose) * 100, 0, 100));
}

function resolveMissionStatus(
  aiRating: string | null,
  dayProgressPercent: number,
  weightGoalProgress: number,
  habitScore: number
): MissionStatus {
  if (aiRating === "A") return "Excellent";
  if (aiRating === "D") return "Behind";
  if (
    habitScore >= 75 &&
    weightGoalProgress >= Math.max(dayProgressPercent * 0.6, 20)
  ) {
    return "Excellent";
  }
  if (
    weightGoalProgress < Math.max(dayProgressPercent * 0.35, 5) &&
    dayProgressPercent > 5
  ) {
    return "Behind";
  }
  if (aiRating === "B" && habitScore >= 60) return "On Track";
  if (aiRating === "C") return "On Track";
  if (habitScore >= 50 || weightGoalProgress > 0) return "On Track";
  return "Behind";
}

function generateMissionSummaryText(
  status: MissionStatus,
  summary: Omit<MissionSummary, "missionStatus" | "missionSummaryText">
): string {
  const dayLabel = `Day ${summary.currentDay} of ${summary.totalDays}`;
  const weightLabel =
    summary.currentWeight != null
      ? `${summary.currentWeight} kg toward ${summary.targetWeight} kg`
      : "Weight not logged yet";

  switch (status) {
    case "Excellent":
      return `${dayLabel} — Excellent momentum. ${weightLabel}. Habit score ${summary.habitScore}% with a ${summary.currentStreak}-day streak. Stay locked in on the 150-day mission.`;
    case "Behind":
      return `${dayLabel} — Behind target pace. ${weightLabel}. Focus on daily habits, training consistency, and closing the gap on your weight goal.`;
    default:
      return `${dayLabel} — On track. ${weightLabel}. Habit score ${summary.habitScore}%${summary.aiRating ? `, AI rating ${summary.aiRating}` : ""}. Keep executing the daily systems.`;
  }
}

async function fetchBodyMetrics(): Promise<{
  records: AnalyticsRecord[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("body_metrics")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      return { records: [], error: error.message };
    }

    const records = (data ?? []).map((row) => ({
      ...(row as AnalyticsRecord),
      date: normalizeDate(String(row.date)),
    }));

    return { records, error: null };
  } catch (err) {
    return {
      records: [],
      error: getErrorMessage(err, "Failed to fetch body metrics"),
    };
  }
}

export function buildMissionSummary(
  records: AnalyticsRecord[],
  habitEntries: HabitEntry[],
  aiRating: string | null
): MissionSummary {
  const currentDay = records.length;
  const dayProgressPercent =
    TOTAL_DAYS > 0 ? Math.round((currentDay / TOTAL_DAYS) * 100) : 0;
  const currentWeight = getLatestWeight(records);
  const weightGoalProgress = calculateWeightGoalProgress(currentWeight);
  const habitScore = averageHabitScore(habitEntries);
  const currentStreak = calculateCurrentHabitStreak(habitEntries);
  const skillProgress = buildSkillProgress(habitEntries);

  const baseSummary = {
    currentDay,
    totalDays: TOTAL_DAYS,
    dayProgressPercent,
    startingWeight: INITIAL_WEIGHT,
    targetWeight: TARGET_WEIGHT,
    currentWeight,
    weightGoalProgress,
    habitScore,
    aiRating,
    currentStreak,
    skillProgress,
  };

  const missionStatus = resolveMissionStatus(
    aiRating,
    dayProgressPercent,
    weightGoalProgress,
    habitScore
  );

  return {
    ...baseSummary,
    missionStatus,
    missionSummaryText: generateMissionSummaryText(missionStatus, baseSummary),
  };
}

export async function getMissionData(): Promise<MissionDataResult> {
  const [coachResult, metricsResult, habitResult, journalResult] =
    await Promise.all([
      getCoachData(),
      fetchBodyMetrics(),
      getHabitEntries(),
      getJournalEntries(),
    ]);

  const error =
    coachResult.error ??
    metricsResult.error ??
    habitResult.error ??
    journalResult.error;

  const records = metricsResult.records;
  const habitEntries = habitResult.data ?? [];
  const aiRating = coachResult.report?.overallRating ?? null;

  const summary = buildMissionSummary(records, habitEntries, aiRating);

  return {
    summary,
    journalEntryCount: journalResult.data?.length ?? 0,
    error,
  };
}

export const MISSION_GOALS = {
  fitness: ["Reach 75 kg"],
  skill: ["English fluency", "Automation mastery", "MMA beginner"],
  identity: ["Confidence", "Discipline", "Personal brand"],
} as const;
