import { readConfigNumber } from "@/lib/configFallback";
import {
  DEFAULT_TARGET_WEIGHT,
  resolveAppConfig,
  type AppSettingsConfig,
} from "@/lib/settings";

export const DEFAULT_TARGET_WAIST = 32;
export const DEFAULT_TARGET_BODY_FAT = 15;
export const DEFAULT_TARGET_DAILY_STEPS = 8000;
export const DEFAULT_TARGET_SLEEP_HOURS = 7;
export const DEFAULT_TARGET_WATER_LITERS = 3;

export type ResolvedGoalsConfig = {
  targetWeight: number;
  targetWaist: number;
  targetBodyFat: number;
  targetDailySteps: number;
  targetSleepHours: number;
  targetWaterLiters: number;
};

export function resolveGoalsConfig(
  config: AppSettingsConfig | null | undefined
): ResolvedGoalsConfig {
  const goals = config?.goals;
  const mission = resolveAppConfig(config);

  return {
    targetWeight: readConfigNumber(
      "goals",
      "target_weight",
      goals?.target_weight,
      mission.targetWeight ?? DEFAULT_TARGET_WEIGHT
    ),
    targetWaist: readConfigNumber(
      "goals",
      "target_waist",
      goals?.target_waist,
      DEFAULT_TARGET_WAIST
    ),
    targetBodyFat: readConfigNumber(
      "goals",
      "target_body_fat",
      goals?.target_body_fat,
      DEFAULT_TARGET_BODY_FAT
    ),
    targetDailySteps: readConfigNumber(
      "goals",
      "target_daily_steps",
      goals?.target_daily_steps,
      DEFAULT_TARGET_DAILY_STEPS
    ),
    targetSleepHours: readConfigNumber(
      "goals",
      "target_sleep_hours",
      goals?.target_sleep_hours,
      DEFAULT_TARGET_SLEEP_HOURS
    ),
    targetWaterLiters: readConfigNumber(
      "goals",
      "target_water_liters",
      goals?.target_water_liters,
      DEFAULT_TARGET_WATER_LITERS
    ),
  };
}

function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** ((starting - current) / (starting - target)) * 100, clamped 0–100 */
export function calculateBodyGoalProgress(
  current: number | null,
  starting: number | null,
  target: number
): number | null {
  if (current == null || starting == null) return null;

  const totalRange = starting - target;
  if (totalRange <= 0) return null;

  const progress = ((starting - current) / totalRange) * 100;
  return clampProgress(progress);
}
