import { supabase } from "@/lib/supabase";
import { calculateVGScore } from "@/lib/vgScore";
import { DEFAULT_AI_CONFIG } from "@/lib/aiSettingsConfig";
import type { AiCoachConfig, AppSettingsConfig } from "@/lib/settings";
import {
  fetchAllBodyMetricsRecords,
  isValidBodyWeight,
  pickAnalyticsCurrentRecord,
} from "@/lib/bodyMetrics";
import {
  calculateHabitPerformance,
  getHabitEntries,
  type HabitEntry,
  type HabitPerformanceRow,
  type HabitScoreContext,
} from "@/lib/habit";
import {
  calculateBmi,
  type ResolvedProfileConfig,
} from "@/lib/profileSettingsConfig";
import {
  calculateBodyGoalProgress,
  type ResolvedGoalsConfig,
} from "@/lib/goalsSettingsConfig";

export type AnalyticsRecord = {
  id: string;
  date: string;
  weight: number | null;
  waist: number | null;
  body_fat: number | null;
  steps: number | null;
  sleep_hours: number | null;
  workout_done: boolean;
  cheat_meal: boolean;
  notes: string | null;
  vg_score: number | null;
  created_at?: string;
};

export type BodyMetricsInput = {
  date: string;
  weight: number;
  waist: number;
  body_fat: number;
  steps: number;
  sleep_hours: number;
  workout_done: boolean;
  cheat_meal: boolean;
  notes?: string | null;
};

export function validateBodyMetricsInput(input: BodyMetricsInput): string | null {
  if (!input.date.trim()) return "Date is required.";
  if (!Number.isFinite(input.weight) || input.weight <= 0) {
    return "Weight must be a positive number.";
  }
  if (!Number.isFinite(input.waist) || input.waist <= 0) {
    return "Waist must be a positive number.";
  }
  if (
    !Number.isFinite(input.body_fat) ||
    input.body_fat < 1 ||
    input.body_fat > 100
  ) {
    return "Body fat must be between 1 and 100.";
  }
  if (
    !Number.isFinite(input.steps) ||
    input.steps < 0 ||
    !Number.isInteger(input.steps)
  ) {
    return "Steps must be a whole number of 0 or more.";
  }
  if (
    !Number.isFinite(input.sleep_hours) ||
    input.sleep_hours <= 0 ||
    input.sleep_hours > 24
  ) {
    return "Sleep hours must be greater than 0 and at most 24.";
  }
  return null;
}

export type AnalyticsSummary = {
  totalWeightLost: number;
  bestWorkoutStreak: number;
  currentWorkoutStreak: number;
  averageVGScore: number;
  totalWorkoutDays: number;
  recordCount: number;
  firstWeight: number | null;
  latestWeight: number | null;
  startingWeight: number | null;
  currentBmi: number | null;
  startingBmi: number | null;
};

export type TrendChartPoint = {
  date: string;
  formattedDate: string;
  value: number;
};

export type WeeklyAveragePoint = {
  weekKey: string;
  weekLabel: string;
  averageScore: number;
};

export type AnalyticsChartData = {
  weight: TrendChartPoint[];
  waist: TrendChartPoint[];
  bodyFat: TrendChartPoint[];
  vgScore: TrendChartPoint[];
  weeklyAverage: WeeklyAveragePoint[];
};

export type MetricGoalCard = {
  key: "weight" | "waist" | "bodyFat";
  label: string;
  percent: number | null;
  current: number | null;
  target: number;
  unit: string;
  tracked: boolean;
};

export type HabitIntelligence = {
  habits: HabitPerformanceRow[];
  strongest: HabitPerformanceRow | null;
  weakest: HabitPerformanceRow | null;
};

export type PerformanceInsight = {
  id: string;
  title: string;
  description: string;
  sentiment: "positive" | "negative" | "neutral";
};

export function normalizeDate(date: string): string {
  return date.trim().slice(0, 10);
}

function parseDateOnly(value: string): Date {
  return new Date(`${normalizeDate(value)}T00:00:00`);
}

export function formatChartDate(date: string): string {
  const parsed = parseDateOnly(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function resolveVgScore(
  record: AnalyticsRecord,
  ai: Pick<
    AiCoachConfig,
    "daily_steps_goal" | "sleep_good_threshold" | "sleep_bad_threshold"
  > = DEFAULT_AI_CONFIG
): number | null {
  if (record.vg_score != null && !Number.isNaN(record.vg_score)) {
    return record.vg_score;
  }

  if (record.weight == null || Number.isNaN(record.weight)) {
    return null;
  }

  return calculateVGScore(
    {
      workout_done: record.workout_done,
      cheat_meal: record.cheat_meal,
      steps: record.steps ?? undefined,
      sleep_hours: record.sleep_hours ?? undefined,
    },
    ai
  );
}

function sortByDateAsc(records: AnalyticsRecord[]): AnalyticsRecord[] {
  return [...records].sort((a, b) =>
    normalizeDate(a.date).localeCompare(normalizeDate(b.date))
  );
}

export function calculateBestStreak(
  records: Pick<AnalyticsRecord, "workout_done" | "date">[]
): number {
  if (records.length === 0) return 0;

  const sorted = sortByDateAsc(records as AnalyticsRecord[]);
  let best = 0;
  let current = 0;

  for (const record of sorted) {
    if (record.workout_done) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  return best;
}

export function calculateCurrentWorkoutStreak(
  records: Pick<AnalyticsRecord, "workout_done" | "date">[]
): number {
  if (records.length === 0) return 0;

  const sorted = sortByDateAsc(records as AnalyticsRecord[]);
  let streak = 0;

  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].workout_done) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

type VgScoreAiRules = Pick<
  AiCoachConfig,
  "daily_steps_goal" | "sleep_good_threshold" | "sleep_bad_threshold"
>;

export function calculateAverageVGScore(
  records: AnalyticsRecord[],
  ai: VgScoreAiRules = DEFAULT_AI_CONFIG
): number {
  const scores = records
    .map((record) => resolveVgScore(record, ai))
    .filter((score): score is number => score != null && !Number.isNaN(score));

  if (scores.length === 0) return 0;

  const total = scores.reduce((sum, score) => sum + score, 0);
  return Math.round(total / scores.length);
}

type AnalyticsProfileContext = Pick<
  ResolvedProfileConfig,
  "startingWeight" | "heightCm"
>;

export function calculateAnalyticsSummary(
  records: AnalyticsRecord[],
  ai: VgScoreAiRules = DEFAULT_AI_CONFIG,
  profile?: AnalyticsProfileContext
): AnalyticsSummary {
  const sorted = sortByDateAsc(records);
  const weights = sorted
    .map((record) => record.weight)
    .filter((weight): weight is number => weight != null && !Number.isNaN(weight));

  const firstWeight = weights[0] ?? null;
  const currentRecord = pickAnalyticsCurrentRecord(records);
  const latestWeight = currentRecord?.weight ?? null;
  const baselineWeight = profile?.startingWeight ?? null;

  const totalWeightLost =
    baselineWeight != null && latestWeight != null
      ? baselineWeight - latestWeight
      : 0;

  const heightCm = profile?.heightCm != null ? Number(profile.heightCm) : null;
  const currentBmi =
    latestWeight != null && heightCm
      ? calculateBmi(latestWeight, heightCm)
      : null;
  const startingBmi =
    baselineWeight != null && heightCm
      ? calculateBmi(baselineWeight, heightCm)
      : null;

  const workoutDays = sorted.filter((record) => record.workout_done).length;

  console.log("ANALYTICS SUMMARY INPUT", {
    startingWeight: baselineWeight,
    currentWeight: latestWeight,
    heightCm,
    workoutDays,
    currentRecordDate: currentRecord?.date ?? null,
    currentBmi,
    startingBmi,
  });

  return {
    totalWeightLost,
    bestWorkoutStreak: calculateBestStreak(sorted),
    currentWorkoutStreak: calculateCurrentWorkoutStreak(sorted),
    averageVGScore: calculateAverageVGScore(sorted, ai),
    totalWorkoutDays: workoutDays,
    recordCount: sorted.length,
    firstWeight,
    latestWeight,
    startingWeight: baselineWeight,
    currentBmi,
    startingBmi,
  };
}

function getWeekStartKey(date: string): string {
  const parsed = parseDateOnly(date);
  const day = parsed.getDay();
  const diff = parsed.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(parsed);
  monday.setDate(diff);
  return normalizeDate(monday.toISOString().split("T")[0]);
}

function formatWeekLabel(weekKey: string): string {
  const parsed = parseDateOnly(weekKey);
  if (Number.isNaN(parsed.getTime())) return weekKey;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function buildWeeklyAverageData(
  records: AnalyticsRecord[],
  ai: VgScoreAiRules = DEFAULT_AI_CONFIG
): WeeklyAveragePoint[] {
  const weekMap = new Map<string, number[]>();

  for (const record of sortByDateAsc(records)) {
    const score = resolveVgScore(record, ai);
    if (score == null) continue;

    const weekKey = getWeekStartKey(record.date);
    const existing = weekMap.get(weekKey) ?? [];
    existing.push(score);
    weekMap.set(weekKey, existing);
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekKey, scores]) => ({
      weekKey,
      weekLabel: formatWeekLabel(weekKey),
      averageScore: Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length
      ),
    }));
}

export function buildAnalyticsChartData(
  records: AnalyticsRecord[],
  ai: VgScoreAiRules = DEFAULT_AI_CONFIG
): AnalyticsChartData {
  const sorted = sortByDateAsc(records);

  const weight: TrendChartPoint[] = [];
  const waist: TrendChartPoint[] = [];
  const bodyFat: TrendChartPoint[] = [];
  const vgScore: TrendChartPoint[] = [];

  for (const record of sorted) {
    const formattedDate = formatChartDate(record.date);
    const weightValue = toTrendMetricValue(record.weight);
    const waistValue = toTrendMetricValue(record.waist);
    const bodyFatValue = toTrendMetricValue(record.body_fat);

    if (weightValue != null && isValidBodyWeight(weightValue)) {
      weight.push({
        date: record.date,
        formattedDate,
        value: weightValue,
      });
    }

    if (waistValue != null && isValidWaistInches(waistValue)) {
      waist.push({
        date: record.date,
        formattedDate,
        value: waistValue,
      });
    }

    if (bodyFatValue != null && isValidBodyFatPercent(bodyFatValue)) {
      bodyFat.push({
        date: record.date,
        formattedDate,
        value: bodyFatValue,
      });
    }

    const score = resolveVgScore(record, ai);
    if (score != null && Number.isFinite(score)) {
      vgScore.push({
        date: record.date,
        formattedDate,
        value: score,
      });
    }
  }

  return {
    weight,
    waist,
    bodyFat,
    vgScore,
    weeklyAverage: buildWeeklyAverageData(sorted, ai),
  };
}

const MIN_WAIST_IN = 20;
const MAX_WAIST_IN = 80;
const MIN_BODY_FAT_PERCENT = 3;
const MAX_BODY_FAT_PERCENT = 60;

function toTrendMetricValue(value: unknown): number | null {
  if (value == null || value === "") return null;

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function isValidWaistInches(value: number): boolean {
  return value >= MIN_WAIST_IN && value <= MAX_WAIST_IN;
}

function isValidBodyFatPercent(value: number): boolean {
  return value >= MIN_BODY_FAT_PERCENT && value <= MAX_BODY_FAT_PERCENT;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export type AnalyticsInputSource =
  | "app_settings"
  | "body_metrics"
  | "default_config"
  | "computed";

export type AnalyticsInputField = {
  value: number | null;
  source: AnalyticsInputSource;
  detail?: string;
};

export type AnalyticsInputAudit = {
  starting_weight: AnalyticsInputField;
  target_weight: AnalyticsInputField;
  current_weight: AnalyticsInputField;
  starting_waist: AnalyticsInputField;
  target_waist: AnalyticsInputField;
  current_waist: AnalyticsInputField;
  starting_body_fat: AnalyticsInputField;
  target_body_fat: AnalyticsInputField;
  current_body_fat: AnalyticsInputField;
  height_cm: AnalyticsInputField;
  current_record_date: string | null;
};

function resolveConfigNumberSource(
  configValue: unknown,
  resolvedValue: number | null,
  configPath: string,
  defaultLabel: string
): AnalyticsInputField {
  if (typeof configValue === "number" && Number.isFinite(configValue)) {
    return {
      value: resolvedValue,
      source: "app_settings",
      detail: configPath,
    };
  }

  if (resolvedValue != null) {
    return {
      value: resolvedValue,
      source: "default_config",
      detail: defaultLabel,
    };
  }

  return { value: null, source: "default_config", detail: "unset" };
}

export function auditAnalyticsInputs(
  records: AnalyticsRecord[],
  profile: ResolvedProfileConfig,
  goals: ResolvedGoalsConfig,
  config: AppSettingsConfig
): AnalyticsInputAudit {
  const currentRecord = pickAnalyticsCurrentRecord(records);

  const audit: AnalyticsInputAudit = {
    starting_weight: resolveConfigNumberSource(
      config.profile?.starting_weight,
      profile.startingWeight,
      "config.profile.starting_weight",
      "DEFAULT_STARTING_WEIGHT (89)"
    ),
    target_weight: resolveConfigNumberSource(
      config.goals?.target_weight,
      goals.targetWeight,
      "config.goals.target_weight",
      "DEFAULT_TARGET_WEIGHT (75)"
    ),
    current_weight: {
      value: currentRecord?.weight ?? null,
      source: "body_metrics",
      detail: currentRecord
        ? `body_metrics.date=${currentRecord.date}`
        : "no row",
    },
    starting_waist: resolveConfigNumberSource(
      config.profile?.starting_waist,
      profile.startingWaist,
      "config.profile.starting_waist",
      "unset — set in Profile settings"
    ),
    target_waist: resolveConfigNumberSource(
      config.goals?.target_waist,
      goals.targetWaist,
      "config.goals.target_waist",
      "DEFAULT_TARGET_WAIST (32)"
    ),
    current_waist: {
      value: currentRecord?.waist ?? null,
      source: "body_metrics",
      detail: currentRecord
        ? `body_metrics.date=${currentRecord.date}`
        : "no row",
    },
    starting_body_fat: resolveConfigNumberSource(
      config.profile?.starting_body_fat,
      profile.startingBodyFat,
      "config.profile.starting_body_fat",
      "unset — set in Profile settings"
    ),
    target_body_fat: resolveConfigNumberSource(
      config.goals?.target_body_fat,
      goals.targetBodyFat,
      "config.goals.target_body_fat",
      "DEFAULT_TARGET_BODY_FAT (15)"
    ),
    current_body_fat: {
      value: currentRecord?.body_fat ?? null,
      source: "body_metrics",
      detail: currentRecord
        ? `body_metrics.date=${currentRecord.date}`
        : "no row",
    },
    height_cm: resolveConfigNumberSource(
      config.profile?.height_cm,
      profile.heightCm,
      "config.profile.height_cm",
      "DEFAULT_HEIGHT_CM (175)"
    ),
    current_record_date: currentRecord?.date ?? null,
  };

  console.log("ANALYTICS SOURCE MAP", audit);
  return audit;
}

export function calculateAnalyticsGoalCards(
  records: AnalyticsRecord[],
  profile: Pick<
    ResolvedProfileConfig,
    "startingWeight" | "startingWaist" | "startingBodyFat"
  >,
  goals: Pick<
    ResolvedGoalsConfig,
    "targetWeight" | "targetWaist" | "targetBodyFat"
  >
): MetricGoalCard[] {
  const currentRecord = pickAnalyticsCurrentRecord(records);
  const currentWeight = currentRecord?.weight ?? null;
  const currentWaist = currentRecord?.waist ?? null;
  const currentBodyFat = currentRecord?.body_fat ?? null;

  return [
    {
      key: "weight",
      label: "Weight Goal",
      percent: calculateBodyGoalProgress(
        currentWeight,
        profile.startingWeight,
        goals.targetWeight
      ),
      current: currentWeight,
      target: goals.targetWeight,
      unit: "kg",
      tracked: currentWeight != null,
    },
    {
      key: "waist",
      label: "Waist Goal",
      percent: calculateBodyGoalProgress(
        currentWaist,
        profile.startingWaist,
        goals.targetWaist
      ),
      current: currentWaist,
      target: goals.targetWaist,
      unit: "in",
      tracked: currentWaist != null && profile.startingWaist != null,
    },
    {
      key: "bodyFat",
      label: "Body Fat Goal",
      percent: calculateBodyGoalProgress(
        currentBodyFat,
        profile.startingBodyFat,
        goals.targetBodyFat
      ),
      current: currentBodyFat,
      target: goals.targetBodyFat,
      unit: "%",
      tracked: currentBodyFat != null && profile.startingBodyFat != null,
    },
  ];
}

export function calculateHabitIntelligence(
  entries: HabitEntry[],
  ctx?: HabitScoreContext,
  enabledHabitIds?: readonly string[]
): HabitIntelligence {
  const filteredCtx: HabitScoreContext | undefined =
    enabledHabitIds && enabledHabitIds.length > 0
      ? {
          ...ctx,
          enabledKeys: [...enabledHabitIds],
        }
      : ctx;

  const habits = calculateHabitPerformance(entries, filteredCtx);

  return {
    habits,
    strongest: habits[0] ?? null,
    weakest: habits.length > 0 ? habits[habits.length - 1] : null,
  };
}

function averageVgScoreForRecords(
  records: AnalyticsRecord[],
  ai: VgScoreAiRules
): number | null {
  const scores = records
    .map((record) => resolveVgScore(record, ai))
    .filter((score): score is number => score != null && !Number.isNaN(score));

  if (scores.length === 0) return null;
  return average(scores);
}

const MIN_INSIGHT_SCORE_DELTA = 5;

export function generatePerformanceInsights(
  records: AnalyticsRecord[],
  ai: VgScoreAiRules = DEFAULT_AI_CONFIG
): PerformanceInsight[] {
  if (records.length === 0) return [];

  const sorted = sortByDateAsc(records);
  const insights: PerformanceInsight[] = [];

  const workoutDays = sorted.filter((record) => record.workout_done);
  const restDays = sorted.filter((record) => !record.workout_done);
  const workoutAvg = averageVgScoreForRecords(workoutDays, ai);
  const restAvg = averageVgScoreForRecords(restDays, ai);

  if (
    workoutAvg != null &&
    restAvg != null &&
    workoutDays.length >= 1 &&
    restDays.length >= 1
  ) {
    const delta = Math.round(workoutAvg - restAvg);
    if (Math.abs(delta) >= MIN_INSIGHT_SCORE_DELTA) {
      insights.push({
        id: "workout-score-delta",
        title: "Workout impact on VG Score",
        description:
          delta > 0
            ? `Workout days average ${delta} points higher than rest days (${Math.round(workoutAvg)} vs ${Math.round(restAvg)}).`
            : `Rest days average ${Math.abs(delta)} points higher than workout days (${Math.round(restAvg)} vs ${Math.round(workoutAvg)}).`,
        sentiment: delta > 0 ? "positive" : "negative",
      });
    }
  }

  const highSleepDays = sorted.filter(
    (record) =>
      record.sleep_hours != null &&
      record.sleep_hours >= ai.sleep_good_threshold
  );
  const lowSleepDays = sorted.filter(
    (record) =>
      record.sleep_hours != null && record.sleep_hours < ai.sleep_bad_threshold
  );
  const highSleepAvg = averageVgScoreForRecords(highSleepDays, ai);
  const lowSleepAvg = averageVgScoreForRecords(lowSleepDays, ai);

  if (
    highSleepAvg != null &&
    lowSleepAvg != null &&
    highSleepDays.length >= 1 &&
    lowSleepDays.length >= 1
  ) {
    const delta = Math.round(highSleepAvg - lowSleepAvg);
    if (Math.abs(delta) >= MIN_INSIGHT_SCORE_DELTA) {
      insights.push({
        id: "sleep-score-delta",
        title: "Sleep quality impact",
        description:
          delta > 0
            ? `High-sleep days (≥${ai.sleep_good_threshold}h) score ${delta} points higher than low-sleep days (<${ai.sleep_bad_threshold}h).`
            : `Low-sleep days score ${Math.abs(delta)} points higher — recovery may need attention.`,
        sentiment: delta > 0 ? "positive" : "negative",
      });
    }
  }

  const scoreDrivers = [
    {
      id: "driver-workout",
      label: "Workout",
      withFactor: sorted.filter((record) => record.workout_done),
      withoutFactor: sorted.filter((record) => !record.workout_done),
    },
    {
      id: "driver-no-cheat",
      label: "Clean eating",
      withFactor: sorted.filter((record) => !record.cheat_meal),
      withoutFactor: sorted.filter((record) => record.cheat_meal),
    },
    {
      id: "driver-steps",
      label: "Steps goal",
      withFactor: sorted.filter(
        (record) => (record.steps ?? 0) >= ai.daily_steps_goal
      ),
      withoutFactor: sorted.filter(
        (record) => (record.steps ?? 0) < ai.daily_steps_goal
      ),
    },
    {
      id: "driver-sleep",
      label: "Good sleep",
      withFactor: sorted.filter(
        (record) =>
          record.sleep_hours != null &&
          record.sleep_hours >= ai.sleep_good_threshold
      ),
      withoutFactor: sorted.filter(
        (record) =>
          record.sleep_hours == null ||
          record.sleep_hours < ai.sleep_good_threshold
      ),
    },
  ];

  let strongestDriver: { label: string; delta: number } | null = null;

  for (const driver of scoreDrivers) {
    const withAvg = averageVgScoreForRecords(driver.withFactor, ai);
    const withoutAvg = averageVgScoreForRecords(driver.withoutFactor, ai);

    if (
      withAvg == null ||
      withoutAvg == null ||
      driver.withFactor.length === 0 ||
      driver.withoutFactor.length === 0
    ) {
      continue;
    }

    const delta = withAvg - withoutAvg;
    if (
      !strongestDriver ||
      Math.abs(delta) > Math.abs(strongestDriver.delta)
    ) {
      strongestDriver = { label: driver.label, delta: Math.round(delta) };
    }
  }

  if (strongestDriver && Math.abs(strongestDriver.delta) >= MIN_INSIGHT_SCORE_DELTA) {
    insights.push({
      id: "strongest-score-correlation",
      title: "Strongest VG Score driver",
      description:
        strongestDriver.delta > 0
          ? `${strongestDriver.label} is your top lever — days with it score ${strongestDriver.delta} points higher on average.`
          : `${strongestDriver.label} correlates with lower scores by ${Math.abs(strongestDriver.delta)} points on average.`,
      sentiment: strongestDriver.delta > 0 ? "positive" : "negative",
    });
  }

  return insights;
}

function isWithinLastDays(date: string, referenceDate: string, days: number): boolean {
  const end = parseDateOnly(referenceDate).getTime();
  const start = end - days * 24 * 60 * 60 * 1000;
  const current = parseDateOnly(date).getTime();
  return current >= start && current <= end;
}

export function generateAnalyticsInsights(
  records: AnalyticsRecord[],
  ai: VgScoreAiRules = DEFAULT_AI_CONFIG,
  profile?: AnalyticsProfileContext
): string[] {
  if (records.length === 0) return [];

  const sorted = sortByDateAsc(records);
  const insights: string[] = [];
  const latestDate = sorted[sorted.length - 1].date;

  const recent30 = sorted.filter((record) =>
    isWithinLastDays(record.date, latestDate, 30)
  );

  if (recent30.length >= 2) {
    const firstWeight = recent30.find((record) => record.weight != null)?.weight;
    const lastWeight = [...recent30]
      .reverse()
      .find((record) => record.weight != null)?.weight;

    if (firstWeight != null && lastWeight != null) {
      const change = firstWeight - lastWeight;
      const direction = change >= 0 ? "lost" : "gained";
      insights.push(
        `Weight ${direction} ${Math.abs(Number(change.toFixed(1)))} kg in the last 30 days.`
      );
    }
  }

  const sleepValues = sorted
    .map((record) => record.sleep_hours)
    .filter((hours): hours is number => hours != null && !Number.isNaN(hours));

  if (sleepValues.length > 0) {
    insights.push(
      `Average sleep is ${average(sleepValues).toFixed(1)} hours across logged days.`
    );
  }

  const workoutDays = sorted.filter((record) => record.workout_done).length;
  const consistency = Math.round((workoutDays / sorted.length) * 100);
  insights.push(`Workout consistency is ${consistency}%.`);

  if (profile?.startingWeight != null) {
    const currentRecord = pickAnalyticsCurrentRecord(sorted);
    const latestWeight = currentRecord?.weight ?? null;

    if (latestWeight != null) {
      const lostFromStart = profile.startingWeight - latestWeight;
      if (lostFromStart > 0) {
        insights.push(
          `Down ${lostFromStart.toFixed(1)} kg from your ${profile.startingWeight} kg starting weight.`
        );
      } else if (lostFromStart < 0) {
        insights.push(
          `Up ${Math.abs(lostFromStart).toFixed(1)} kg from your ${profile.startingWeight} kg starting weight.`
        );
      }
    }
  }

  if (profile?.heightCm) {
    const currentRecord = pickAnalyticsCurrentRecord(sorted);
    const latestWeight = currentRecord?.weight ?? null;

    const bmi =
      latestWeight != null
        ? calculateBmi(latestWeight, profile.heightCm)
        : null;

    if (bmi != null) {
      insights.push(`Current BMI is ${bmi} at ${profile.heightCm} cm height.`);
    }
  }

  const scores = sorted
    .map((record) => resolveVgScore(record, ai))
    .filter((score): score is number => score != null);

  if (scores.length >= 4) {
    const midpoint = Math.floor(scores.length / 2);
    const firstHalfAvg = average(scores.slice(0, midpoint));
    const secondHalfAvg = average(scores.slice(midpoint));
    const improvement = secondHalfAvg - firstHalfAvg;

    if (improvement > 0) {
      insights.push(
        `VG Score improved by ${Math.round(improvement)} points over your journey.`
      );
    } else if (improvement < 0) {
      insights.push(
        `VG Score declined by ${Math.abs(Math.round(improvement))} points — time to refocus.`
      );
    } else {
      insights.push("VG Score has held steady across your logged days.");
    }
  } else if (scores.length > 0) {
    insights.push(
      `Current average VG Score is ${Math.round(average(scores))}/100.`
    );
  }

  return insights;
}

export async function fetchAnalyticsData(): Promise<{
  records: AnalyticsRecord[];
  error: string | null;
}> {
  const { data, error } = await fetchAllBodyMetricsRecords();
  return { records: data as AnalyticsRecord[], error };
}

export async function fetchAnalyticsPageData(): Promise<{
  records: AnalyticsRecord[];
  habitEntries: HabitEntry[];
  error: string | null;
}> {
  const [metricsResult, habitResult] = await Promise.all([
    fetchAllBodyMetricsRecords(),
    getHabitEntries(),
  ]);

  return {
    records: metricsResult.data as AnalyticsRecord[],
    habitEntries: habitResult.data ?? [],
    error: metricsResult.error ?? habitResult.error,
  };
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: string }).message);
  }
  return fallback;
}

export async function saveBodyMetrics(input: BodyMetricsInput): Promise<{
  data: AnalyticsRecord | null;
  error: string | null;
}> {
  const validationError = validateBodyMetricsInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }

  const payload = {
    date: normalizeDate(input.date),
    weight: input.weight,
    waist: input.waist,
    body_fat: input.body_fat,
    steps: input.steps,
    sleep_hours: input.sleep_hours,
    workout_done: input.workout_done,
    cheat_meal: input.cheat_meal,
    notes: input.notes?.trim() || null,
  };

  console.log("BODY_METRICS PAYLOAD", {
    date: payload.date,
    weight: payload.weight,
    waist: payload.waist,
    body_fat: payload.body_fat,
    steps: payload.steps,
    sleep_hours: payload.sleep_hours,
    workout_done: payload.workout_done,
    cheat_meal: payload.cheat_meal,
    notes: payload.notes,
  });

  try {
    const { data: existing, error: lookupError } = await supabase
      .from("body_metrics")
      .select("id, date, notes")
      .eq("date", payload.date)
      .maybeSingle();

    if (lookupError) {
      return { data: null, error: lookupError.message };
    }

    if (existing?.id) {
      const trimmedNotes = input.notes?.trim();
      const updatePayload: {
        weight: number;
        waist: number | null;
        body_fat: number | null;
        steps: number | null;
        sleep_hours: number | null;
        workout_done: boolean;
        cheat_meal: boolean;
        notes?: string | null;
      } = {
        weight: payload.weight,
        waist: payload.waist,
        body_fat: payload.body_fat,
        steps: payload.steps,
        sleep_hours: payload.sleep_hours,
        workout_done: payload.workout_done,
        cheat_meal: payload.cheat_meal,
      };

      if (trimmedNotes) {
        updatePayload.notes = trimmedNotes;
      }

      console.log("BODY METRICS DB WRITE", {
        operation: "update",
        table: "body_metrics",
        id: existing.id,
        date: payload.date,
        payload: updatePayload,
      });

      const { data, error } = await supabase
        .from("body_metrics")
        .update(updatePayload)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      if (!data) {
        return {
          data: null,
          error:
            "Update failed: no row returned. Check Supabase RLS policies for body_metrics.",
        };
      }

      const saved = {
        ...(data as AnalyticsRecord),
        date: normalizeDate(String(data.date)),
      };

      console.log("BODY METRICS SAVED ROW", saved);

      return {
        data: saved,
        error: null,
      };
    }

    console.log("BODY METRICS DB WRITE", {
      operation: "insert",
      table: "body_metrics",
      id: null,
      date: payload.date,
      payload,
    });

    const { data, error } = await supabase
      .from("body_metrics")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return {
        data: null,
        error:
          "Insert failed: no row returned. Check Supabase RLS policies for body_metrics.",
      };
    }

    const saved = {
      ...(data as AnalyticsRecord),
      date: normalizeDate(String(data.date)),
    };

    console.log("BODY METRICS SAVED ROW", saved);

    return {
      data: saved,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err, "Failed to save body metrics"),
    };
  }
}
