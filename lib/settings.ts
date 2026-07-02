import { supabase } from "@/lib/supabase";
import {
  readConfigNumber,
  readConfigString,
} from "@/lib/configFallback";
import { validateProfileSettingsInput } from "@/lib/profileSettingsConfig";

export const DEFAULT_MISSION_DAYS = 150;
export const DEFAULT_TARGET_WEIGHT = 75;
export const DEFAULT_STARTING_WEIGHT = 89;
export const DEFAULT_MISSION_START_DATE = "2026-08-01";

export const PROFILE_GENDERS = ["male", "female", "other"] as const;
export type ProfileGender = (typeof PROFILE_GENDERS)[number];

export const PREFERENCE_LANGUAGES = ["en", "ta"] as const;
export type PreferenceLanguage = (typeof PREFERENCE_LANGUAGES)[number];

export const HABIT_CATEGORIES = [
  "Fitness",
  "Mind",
  "Career",
  "Discipline",
  "Social",
] as const;

export type HabitCategory = (typeof HABIT_CATEGORIES)[number];

export type HabitType = "core" | "custom";

export type HabitConfigItem = {
  id: string;
  name: string;
  category: HabitCategory;
  weight: number;
  type: HabitType;
  locked: boolean;
  enabled: boolean;
  public_visible: boolean;
  show_in_checkin: boolean;
};

export type VgGradeBands = {
  A: number;
  B: number;
  C: number;
};

export type ScoringConfig = {
  habit_weight: number;
  metrics_weight: number;
  journal_weight: number;
  vg_grade_bands: VgGradeBands;
};

export type AiCoachConfig = {
  sleep_good_threshold: number;
  sleep_bad_threshold: number;
  daily_steps_goal: number;
  excellent_steps_goal: number;
  good_habit_threshold: number;
  bad_habit_threshold: number;
  high_discipline_threshold: number;
  low_discipline_threshold: number;
};

export type AppSettingsConfig = {
  profile?: {
    name?: string;
    mission_name?: string;
    height_cm?: number;
    age?: number;
    gender?: ProfileGender;
    starting_weight?: number;
    starting_waist?: number;
    starting_body_fat?: number;
  };
  mission?: {
    mission_days?: number;
    start_date?: string;
  };
  goals?: {
    target_weight?: number;
    target_waist?: number;
    target_body_fat?: number;
    target_daily_steps?: number;
    target_sleep_hours?: number;
    target_water_liters?: number;
  };
  habits?: HabitConfigItem[];
  scoring?: ScoringConfig;
  ai?: AiCoachConfig;
  /** @deprecated Use `ai` — kept for legacy config reads */
  ai_coach?: Partial<AiCoachConfig>;
  notifications?: {
    daily_checkin_enabled?: boolean;
    daily_checkin_time?: string;
  };
  preferences?: {
    unit?: string;
    theme?: string;
    timezone?: string;
    language?: PreferenceLanguage;
  };
};

export type AppSettings = {
  id?: string;
  config: AppSettingsConfig | null;
  created_at?: string;
  updated_at?: string;
};

export type ResolvedAppConfig = {
  missionDays: number;
  targetWeight: number;
  startingWeight: number;
  missionStartDate: string;
};

function parseConfig(raw: unknown): AppSettingsConfig | null {
  if (raw == null) return null;

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return typeof parsed === "object" && parsed !== null
        ? (parsed as AppSettingsConfig)
        : null;
    } catch {
      return null;
    }
  }

  if (typeof raw === "object") {
    return raw as AppSettingsConfig;
  }

  return null;
}

export function resolveAppConfig(
  config: AppSettingsConfig | null | undefined
): ResolvedAppConfig {
  const missionDays = readConfigNumber(
    "settings",
    "mission.mission_days",
    config?.mission?.mission_days,
    DEFAULT_MISSION_DAYS
  );
  const targetWeight = readConfigNumber(
    "settings",
    "goals.target_weight",
    config?.goals?.target_weight,
    DEFAULT_TARGET_WEIGHT
  );
  const startingWeight = readConfigNumber(
    "settings",
    "profile.starting_weight",
    config?.profile?.starting_weight,
    DEFAULT_STARTING_WEIGHT
  );
  const missionStartDate = readConfigString(
    "settings",
    "mission.start_date",
    config?.mission?.start_date,
    DEFAULT_MISSION_START_DATE
  );

  return {
    missionDays,
    targetWeight,
    startingWeight,
    missionStartDate,
  };
}

export function getHabitConfigCounts(
  habits: AppSettingsConfig["habits"]
): { total: number; enabled: number } {
  if (!Array.isArray(habits) || habits.length === 0) {
    return { total: 0, enabled: 0 };
  }

  return {
    total: habits.length,
    enabled: habits.filter((habit) => habit.enabled !== false).length,
  };
}

export type ProfileSettingsInput = {
  name: string;
  mission_name: string;
  height_cm: number;
  age: number;
  gender: ProfileGender;
  starting_weight: number;
  starting_waist: number;
  starting_body_fat: number;
};

export type MissionSettingsInput = {
  start_date: string;
  mission_days: number;
};

export type HabitsSettingsInput = HabitConfigItem[];

export type AiSettingsInput = AiCoachConfig;

export type ScoringSettingsInput = ScoringConfig;

export type GoalsSettingsInput = {
  target_weight: number;
  target_waist: number;
  target_body_fat: number;
  target_daily_steps: number;
  target_sleep_hours: number;
  target_water_liters: number;
};

export type PreferencesSettingsInput = {
  unit: string;
  theme: string;
  timezone: string;
  language: PreferenceLanguage;
};

export function invalidateSettingsCache(): void {
  // Settings are always fetched fresh from the database.
}

export async function getConfig(): Promise<AppSettingsConfig> {
  const { data } = await getAppSettings();
  return data?.config ?? {};
}

async function updateAppSettingsConfig(
  settingsId: string,
  config: AppSettingsConfig
): Promise<{ data: AppSettings | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .update({ config })
      .eq("id", settingsId)
      .select("*")
      .single();

    if (error) {
      console.log("SETTINGS SAVE ERROR", error.message);
      return { data: null, error: error.message };
    }

    if (!data) {
      const message =
        "Update failed: no row returned. Check Supabase RLS policies for app_settings.";
      console.log("SETTINGS SAVE ERROR", message);
      return { data: null, error: message };
    }

    const settings: AppSettings = {
      ...(data as Omit<AppSettings, "config">),
      config: parseConfig((data as { config?: unknown }).config),
    };

    console.log("SETTINGS SAVE SUCCESS", settings.config);
    invalidateSettingsCache();
    return { data: settings, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update app settings";
    console.log("SETTINGS SAVE ERROR", message);
    return { data: null, error: message };
  }
}

async function fetchAppSettingsConfig(
  settingsId: string
): Promise<{ config: AppSettingsConfig | null; error: string | null }> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("config")
    .eq("id", settingsId)
    .maybeSingle();

  if (error) {
    return { config: null, error: error.message };
  }

  return {
    config: parseConfig((data as { config?: unknown } | null)?.config),
    error: null,
  };
}

export async function updateAppSettingsProfile(
  settingsId: string,
  profile: ProfileSettingsInput
): Promise<{ data: AppSettings | null; error: string | null }> {
  const validationError = validateProfileSettingsInput(profile);
  if (validationError) {
    console.log("SETTINGS SAVE ERROR", validationError);
    return { data: null, error: validationError };
  }

  const { config: currentConfig, error: fetchError } =
    await fetchAppSettingsConfig(settingsId);

  if (fetchError) {
    console.log("SETTINGS SAVE ERROR", fetchError);
    return { data: null, error: fetchError };
  }

  const updatedConfig: AppSettingsConfig = {
    ...(currentConfig ?? {}),
    profile: {
      ...(currentConfig?.profile ?? {}),
      name: profile.name.trim(),
      mission_name: profile.mission_name.trim(),
      height_cm: profile.height_cm,
      age: profile.age,
      gender: profile.gender,
      starting_weight: profile.starting_weight,
      starting_waist: profile.starting_waist,
      starting_body_fat: profile.starting_body_fat,
    },
  };

  return updateAppSettingsConfig(settingsId, updatedConfig);
}

export async function updateAppSettingsMission(
  settingsId: string,
  mission: MissionSettingsInput
): Promise<{ data: AppSettings | null; error: string | null }> {
  const { config: currentConfig, error: fetchError } =
    await fetchAppSettingsConfig(settingsId);

  if (fetchError) {
    console.log("SETTINGS SAVE ERROR", fetchError);
    return { data: null, error: fetchError };
  }

  const updatedConfig: AppSettingsConfig = {
    ...(currentConfig ?? {}),
    mission: {
      ...(currentConfig?.mission ?? {}),
      start_date: mission.start_date.trim(),
      mission_days: mission.mission_days,
    },
  };

  return updateAppSettingsConfig(settingsId, updatedConfig);
}

export async function updateAppSettingsHabits(
  settingsId: string,
  habits: HabitsSettingsInput
): Promise<{ data: AppSettings | null; error: string | null }> {
  const { config: currentConfig, error: fetchError } =
    await fetchAppSettingsConfig(settingsId);

  if (fetchError) {
    console.log("SETTINGS SAVE ERROR", fetchError);
    return { data: null, error: fetchError };
  }

  const updatedConfig: AppSettingsConfig = {
    ...(currentConfig ?? {}),
    habits,
  };

  return updateAppSettingsConfig(settingsId, updatedConfig);
}

export async function updateAppSettingsAi(
  settingsId: string,
  ai: AiSettingsInput
): Promise<{ data: AppSettings | null; error: string | null }> {
  const { config: currentConfig, error: fetchError } =
    await fetchAppSettingsConfig(settingsId);

  if (fetchError) {
    console.log("SETTINGS SAVE ERROR", fetchError);
    return { data: null, error: fetchError };
  }

  const updatedConfig: AppSettingsConfig = {
    ...(currentConfig ?? {}),
    ai,
  };

  return updateAppSettingsConfig(settingsId, updatedConfig);
}

export async function updateAppSettingsScoring(
  settingsId: string,
  scoring: ScoringSettingsInput
): Promise<{ data: AppSettings | null; error: string | null }> {
  const { config: currentConfig, error: fetchError } =
    await fetchAppSettingsConfig(settingsId);

  if (fetchError) {
    console.log("SETTINGS SAVE ERROR", fetchError);
    return { data: null, error: fetchError };
  }

  const updatedConfig: AppSettingsConfig = {
    ...(currentConfig ?? {}),
    scoring,
  };

  return updateAppSettingsConfig(settingsId, updatedConfig);
}

export async function updateAppSettingsGoals(
  settingsId: string,
  goals: GoalsSettingsInput
): Promise<{ data: AppSettings | null; error: string | null }> {
  const { config: currentConfig, error: fetchError } =
    await fetchAppSettingsConfig(settingsId);

  if (fetchError) {
    console.log("SETTINGS SAVE ERROR", fetchError);
    return { data: null, error: fetchError };
  }

  const updatedConfig: AppSettingsConfig = {
    ...(currentConfig ?? {}),
    goals: {
      ...(currentConfig?.goals ?? {}),
      target_weight: goals.target_weight,
      target_waist: goals.target_waist,
      target_body_fat: goals.target_body_fat,
      target_daily_steps: goals.target_daily_steps,
      target_sleep_hours: goals.target_sleep_hours,
      target_water_liters: goals.target_water_liters,
    },
  };

  const result = await updateAppSettingsConfig(settingsId, updatedConfig);

  if (!result.error) {
    console.log("GOALS SAVE SUCCESS", updatedConfig.goals);
  }

  return result;
}

export async function updateAppSettingsPreferences(
  settingsId: string,
  preferences: PreferencesSettingsInput
): Promise<{ data: AppSettings | null; error: string | null }> {
  const { config: currentConfig, error: fetchError } =
    await fetchAppSettingsConfig(settingsId);

  if (fetchError) {
    console.log("SETTINGS SAVE ERROR", fetchError);
    return { data: null, error: fetchError };
  }

  const updatedConfig: AppSettingsConfig = {
    ...(currentConfig ?? {}),
    preferences: {
      ...(currentConfig?.preferences ?? {}),
      unit: preferences.unit.trim(),
      theme: preferences.theme.trim(),
      timezone: preferences.timezone.trim(),
      language: preferences.language,
    },
  };

  const result = await updateAppSettingsConfig(settingsId, updatedConfig);

  if (!result.error) {
    console.log("PREFERENCES SAVE SUCCESS", updatedConfig.preferences);
  }

  return result;
}

export async function replaceAppSettingsConfig(
  settingsId: string,
  config: AppSettingsConfig
): Promise<{ data: AppSettings | null; error: string | null }> {
  return updateAppSettingsConfig(settingsId, config);
}

export async function getAppSettings(): Promise<{
  data: AppSettings | null;
  error: string | null;
}> {
  console.log("SETTINGS LOAD START");

  try {
    if (typeof window === "undefined") {
      const { unstable_noStore: noStore } = await import("next/cache");
      noStore();
    }

    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.log("SETTINGS LOAD ERROR", error.message);
      return { data: null, error: error.message };
    }

    if (!data) {
      console.log("SETTINGS LOAD SUCCESS", "no row — using defaults");
      return { data: null, error: null };
    }

    const settings: AppSettings = {
      ...(data as Omit<AppSettings, "config">),
      config: parseConfig((data as { config?: unknown }).config),
    };

    console.log("SETTINGS LOAD SUCCESS", settings.config);
    return { data: settings, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch app settings";
    console.log("SETTINGS LOAD ERROR", message);
    return { data: null, error: message };
  }
}
