import { DEFAULT_AI_CONFIG } from "@/lib/aiSettingsConfig";
import {
  DEFAULT_TARGET_BODY_FAT,
  DEFAULT_TARGET_DAILY_STEPS,
  DEFAULT_TARGET_SLEEP_HOURS,
  DEFAULT_TARGET_WAIST,
  DEFAULT_TARGET_WATER_LITERS,
} from "@/lib/goalsSettingsConfig";
import { getDefaultHabitConfig } from "@/lib/habitConfig";
import {
  DEFAULT_AGE,
  DEFAULT_GENDER,
  DEFAULT_HEIGHT_CM,
  DEFAULT_STARTING_BODY_FAT,
  DEFAULT_STARTING_WAIST,
} from "@/lib/profileSettingsConfig";
import { DEFAULT_SCORING_CONFIG } from "@/lib/scoringSettingsConfig";
import {
  DEFAULT_MISSION_DAYS,
  DEFAULT_MISSION_START_DATE,
  DEFAULT_STARTING_WEIGHT,
  DEFAULT_TARGET_WEIGHT,
  type AppSettingsConfig,
} from "@/lib/settings";

export function getDefaultAppSettingsConfig(): AppSettingsConfig {
  return {
    profile: {
      name: "Vignesh",
      mission_name: "VG 2.0",
      height_cm: DEFAULT_HEIGHT_CM,
      age: DEFAULT_AGE,
      gender: DEFAULT_GENDER,
      starting_weight: DEFAULT_STARTING_WEIGHT,
      starting_waist: DEFAULT_STARTING_WAIST,
      starting_body_fat: DEFAULT_STARTING_BODY_FAT,
    },
    mission: {
      mission_days: DEFAULT_MISSION_DAYS,
      start_date: DEFAULT_MISSION_START_DATE,
    },
    goals: {
      target_weight: DEFAULT_TARGET_WEIGHT,
      target_waist: DEFAULT_TARGET_WAIST,
      target_body_fat: DEFAULT_TARGET_BODY_FAT,
      target_daily_steps: DEFAULT_TARGET_DAILY_STEPS,
      target_sleep_hours: DEFAULT_TARGET_SLEEP_HOURS,
      target_water_liters: DEFAULT_TARGET_WATER_LITERS,
    },
    habits: getDefaultHabitConfig(),
    scoring: { ...DEFAULT_SCORING_CONFIG },
    ai: { ...DEFAULT_AI_CONFIG },
    notifications: {
      daily_checkin_enabled: true,
      daily_checkin_time: "21:00",
    },
    preferences: {
      unit: "kg",
      theme: "dark",
      timezone: "Asia/Kolkata",
      language: "en",
    },
  };
}
