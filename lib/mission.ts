import { getCoachData } from "@/lib/coachData";
import {
  calculateCurrentHabitStreak,
  getHabitEntries,
  type HabitEntry,
} from "@/lib/habit";
import { normalizeDate, type AnalyticsRecord } from "@/lib/analytics";
import {
  fetchAllBodyMetricsRecords,
  getMetricFromRecord,
  pickCurrentBodyMetricsRecord,
} from "@/lib/bodyMetrics";
import { calculateCurrentDay } from "@/lib/dashboard";
import { getJournalEntries } from "@/lib/journal";
import {
  resolveProfileConfig,
  type ResolvedProfileConfig,
} from "@/lib/profileSettingsConfig";
import {
  resolveGoalsConfig,
  calculateBodyGoalProgress,
  type ResolvedGoalsConfig,
} from "@/lib/goalsSettingsConfig";
import { resolveAiConfig } from "@/lib/aiSettingsConfig";
import { buildHabitEngineContext, toHabitScoreContext } from "@/lib/habitConfig";
import type { HabitScoreContext } from "@/lib/habit";
import {
  getConfig,
  resolveAppConfig,
  type AppSettingsConfig,
  type ResolvedAppConfig,
} from "@/lib/settings";

export type MissionStatus = "Excellent" | "On Track" | "Behind";

export type MissionPhase = "Foundation" | "Momentum" | "Peak Transformation";

export type MissionGoals = {
  weight: {
    startingWeight: number;
    currentWeight: number | null;
    targetWeight: number;
    remainingKg: number | null;
  };
  waist: {
    startingWaist: number | null;
    currentWaist: number | null;
    targetWaist: number;
    remainingInches: number | null;
  };
  bodyFat: {
    startingBodyFat: number | null;
    currentBodyFat: number | null;
    targetBodyFat: number;
    remainingPercent: number | null;
    tracked: boolean;
  };
};

export type MissionSummary = {
  currentDay: number;
  totalDays: number;
  dayProgressPercent: number;
  startingWeight: number;
  targetWeight: number;
  targetWaist: number | null;
  targetBodyFat: number | null;
  currentWeight: number | null;
  currentWaist: number | null;
  weightGoalProgress: number;
  habitScore: number;
  consistencyScore: number;
  aiRating: string | null;
  missionRating: string;
  currentPhase: MissionPhase;
  currentStreak: number;
  missionStatus: MissionStatus;
  missionSummaryText: string;
};

export type MissionDataResult = {
  summary: MissionSummary;
  goals: MissionGoals;
  profile: ResolvedProfileConfig;
  journalEntryCount: number;
  error: string | null;
};

export type ResolvedMissionGoals = ResolvedGoalsConfig;

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: string }).message);
  }
  return fallback;
}

function averageHabitScore(entries: HabitEntry[]): number {
  const scores = entries
    .map((entry) => entry.habit_score)
    .filter((score) => !Number.isNaN(score));

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function calculateConsistencyScore(
  habitScore: number,
  records: AnalyticsRecord[]
): number {
  if (records.length === 0) return habitScore;

  const workoutDays = records.filter((record) => record.workout_done).length;
  const workoutConsistency = Math.round((workoutDays / records.length) * 100);
  return Math.round((habitScore + workoutConsistency) / 2);
}

export function resolveMissionPhase(currentDay: number): MissionPhase {
  if (currentDay <= 30) return "Foundation";
  if (currentDay <= 90) return "Momentum";
  return "Peak Transformation";
}

export function resolveMissionGoals(
  config: AppSettingsConfig | null | undefined
): ResolvedMissionGoals {
  return resolveGoalsConfig(config);
}

function buildMissionGoals(
  records: AnalyticsRecord[],
  missionGoals: ResolvedMissionGoals,
  startingWeight: number,
  profileStartingWaist: number | null,
  profileStartingBodyFat: number | null
): MissionGoals {
  const currentRecord = pickCurrentBodyMetricsRecord(records);
  const currentWeight = getMetricFromRecord(currentRecord, "weight");
  const currentWaist = getMetricFromRecord(currentRecord, "waist");
  const currentBodyFat = getMetricFromRecord(currentRecord, "body_fat");
  const { targetWeight, targetWaist, targetBodyFat } = missionGoals;

  const remainingKg =
    currentWeight != null ? Math.max(0, currentWeight - targetWeight) : null;

  const remainingInches =
    currentWaist != null ? Math.max(0, currentWaist - targetWaist) : null;

  const remainingBodyFat =
    currentBodyFat != null
      ? Math.max(0, currentBodyFat - targetBodyFat)
      : null;

  return {
    weight: {
      startingWeight,
      currentWeight,
      targetWeight,
      remainingKg,
    },
    waist: {
      startingWaist: profileStartingWaist,
      currentWaist,
      targetWaist,
      remainingInches,
    },
    bodyFat: {
      startingBodyFat: profileStartingBodyFat,
      currentBodyFat,
      targetBodyFat,
      remainingPercent: remainingBodyFat,
      tracked: currentBodyFat != null,
    },
  };
}

function resolveMissionStatus(
  aiRating: string | null,
  dayProgressPercent: number,
  weightGoalProgress: number,
  habitScore: number,
  goodHabitThreshold: number,
  badHabitThreshold: number
): MissionStatus {
  if (aiRating === "A") return "Excellent";
  if (aiRating === "D") return "Behind";
  if (
    habitScore >= goodHabitThreshold &&
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
  if (aiRating === "B" && habitScore >= badHabitThreshold + 20) return "On Track";
  if (aiRating === "C") return "On Track";
  if (habitScore >= badHabitThreshold + 10 || weightGoalProgress > 0) return "On Track";
  return "Behind";
}

function resolveMissionRating(
  aiRating: string | null,
  missionStatus: MissionStatus
): string {
  return aiRating ?? missionStatus;
}

function generateMissionSummaryText(
  status: MissionStatus,
  summary: Omit<MissionSummary, "missionStatus" | "missionSummaryText" | "missionRating">
): string {
  const dayLabel = `Day ${summary.currentDay} of ${summary.totalDays}`;
  const weightLabel =
    summary.currentWeight != null
      ? `${summary.currentWeight} kg toward ${summary.targetWeight} kg`
      : "Weight not logged yet";
  const phaseLabel = summary.currentPhase;

  switch (status) {
    case "Excellent":
      return `${dayLabel} — ${phaseLabel} phase with excellent momentum. ${weightLabel}. Consistency ${summary.consistencyScore}% with a ${summary.currentStreak}-day streak. Stay locked in on the ${summary.totalDays}-day mission.`;
    case "Behind":
      return `${dayLabel} — ${phaseLabel} phase, behind target pace. ${weightLabel}. Focus on daily habits and closing the gap on your weight goal.`;
    default:
      return `${dayLabel} — ${phaseLabel} phase, on track. ${weightLabel}. Consistency ${summary.consistencyScore}%${summary.aiRating ? `, AI rating ${summary.aiRating}` : ""}. Keep executing the daily systems.`;
  }
}

async function fetchBodyMetrics(): Promise<{
  records: AnalyticsRecord[];
  error: string | null;
}> {
  const { data, error } = await fetchAllBodyMetricsRecords();
  return { records: data as AnalyticsRecord[], error };
}

export function buildMissionSummary(
  records: AnalyticsRecord[],
  habitEntries: HabitEntry[],
  aiRating: string | null,
  config: ResolvedAppConfig = resolveAppConfig(null),
  missionGoals: ResolvedMissionGoals = resolveMissionGoals(null),
  profile: ResolvedProfileConfig = resolveProfileConfig(null),
  aiRules = resolveAiConfig(null),
  habitScoreContext?: HabitScoreContext
): MissionSummary {
  const { missionDays, missionStartDate } = config;
  const currentDay = calculateCurrentDay(
    new Date(),
    missionStartDate,
    missionDays
  );
  const dayProgressPercent =
    missionDays > 0 ? Math.round((currentDay / missionDays) * 100) : 0;
  const currentRecord = pickCurrentBodyMetricsRecord(records);
  const currentWeight = getMetricFromRecord(currentRecord, "weight");
  const currentWaist = getMetricFromRecord(currentRecord, "waist");
  const weightGoalProgress =
    calculateBodyGoalProgress(
      currentWeight,
      profile.startingWeight,
      missionGoals.targetWeight
    ) ?? 0;
  const habitScore = averageHabitScore(habitEntries);
  const consistencyScore = calculateConsistencyScore(habitScore, records);
  const currentStreak = calculateCurrentHabitStreak(
    habitEntries,
    habitScoreContext
  );
  const currentPhase = resolveMissionPhase(currentDay);

  const baseSummary = {
    currentDay,
    totalDays: missionDays,
    dayProgressPercent,
    startingWeight: profile.startingWeight,
    targetWeight: missionGoals.targetWeight,
    targetWaist: missionGoals.targetWaist,
    targetBodyFat: missionGoals.targetBodyFat,
    currentWeight,
    currentWaist,
    weightGoalProgress,
    habitScore,
    consistencyScore,
    aiRating,
    currentStreak,
    currentPhase,
  };

  const missionStatus = resolveMissionStatus(
    aiRating,
    dayProgressPercent,
    weightGoalProgress,
    habitScore,
    aiRules.good_habit_threshold,
    aiRules.bad_habit_threshold
  );

  const missionRating = resolveMissionRating(aiRating, missionStatus);

  return {
    ...baseSummary,
    missionRating,
    missionStatus,
    missionSummaryText: generateMissionSummaryText(missionStatus, baseSummary),
  };
}

export async function getMissionData(): Promise<MissionDataResult> {
  const [appConfig, coachResult, metricsResult, habitResult, journalResult] =
    await Promise.all([
      getConfig(),
      getCoachData(),
      fetchBodyMetrics(),
      getHabitEntries(),
      getJournalEntries(),
    ]);

  const missionConfig = resolveAppConfig(appConfig);
  const missionGoals = resolveMissionGoals(appConfig);
  const profile = resolveProfileConfig(appConfig);
  const aiRules = resolveAiConfig(appConfig);
  const habitEngine = buildHabitEngineContext(appConfig, aiRules);
  const habitScoreContext = toHabitScoreContext(habitEngine);

  const error =
    coachResult.error ??
    metricsResult.error ??
    habitResult.error ??
    journalResult.error;

  const records = metricsResult.records;
  const habitEntries = habitResult.data ?? [];
  const aiRating = coachResult.report?.overallRating ?? null;

  const summary = buildMissionSummary(
    records,
    habitEntries,
    aiRating,
    missionConfig,
    missionGoals,
    profile,
    aiRules,
    habitScoreContext
  );

  const goals = buildMissionGoals(
    records,
    missionGoals,
    profile.startingWeight,
    profile.startingWaist,
    profile.startingBodyFat
  );

  console.log("MISSION CONFIG APPLIED", {
    name: profile.name,
    missionName: profile.missionName,
    missionDays: missionConfig.missionDays,
    targetWeight: missionGoals.targetWeight,
    targetWaist: missionGoals.targetWaist,
    startingWaist: profile.startingWaist,
  });

  return {
    summary,
    goals,
    profile,
    journalEntryCount: journalResult.data?.length ?? 0,
    error,
  };
}
