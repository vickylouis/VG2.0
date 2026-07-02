import { HABIT_CATEGORIES, PREFERENCE_LANGUAGES, PROFILE_GENDERS } from "@/lib/settings";
import type { AppSettingsConfig, HabitCategory } from "@/lib/settings";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isHabitCategory(value: unknown): value is HabitCategory {
  return (
    typeof value === "string" &&
    HABIT_CATEGORIES.includes(value as HabitCategory)
  );
}

function isHabitType(value: unknown): value is "core" | "custom" {
  return value === "core" || value === "custom";
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function validateGradeBands(
  bands: unknown,
  path: string
): string | null {
  if (!isRecord(bands)) {
    return `${path} must be an object with A, B, and C thresholds.`;
  }

  const grades = ["A", "B", "C"] as const;

  for (const grade of grades) {
    if (!isFiniteNumber(bands[grade])) {
      return `${path}.${grade} must be a number.`;
    }
  }

  const A = bands.A;
  const B = bands.B;
  const C = bands.C;

  if (!isFiniteNumber(A) || !isFiniteNumber(B) || !isFiniteNumber(C)) {
    return `${path} must include numeric A, B, and C thresholds.`;
  }

  if (A < B || B < C) {
    return `${path} must satisfy A >= B >= C.`;
  }

  return null;
}

export function validateAppSettingsConfig(raw: unknown): {
  valid: boolean;
  config: AppSettingsConfig | null;
  error: string | null;
} {
  if (!isRecord(raw)) {
    return { valid: false, config: null, error: "Settings file must be a JSON object." };
  }

  const config = raw as AppSettingsConfig;

  if (config.profile != null) {
    if (!isRecord(config.profile)) {
      return { valid: false, config: null, error: "Invalid profile section." };
    }

    if (
      config.profile.starting_waist != null &&
      !isFiniteNumber(config.profile.starting_waist)
    ) {
      return {
        valid: false,
        config: null,
        error: "profile.starting_waist must be a number.",
      };
    }

    if (
      config.profile.starting_body_fat != null &&
      !isFiniteNumber(config.profile.starting_body_fat)
    ) {
      return {
        valid: false,
        config: null,
        error: "profile.starting_body_fat must be a number.",
      };
    }

    const profileAnalyticsFields = [
      ["height_cm", "profile.height_cm"],
      ["starting_weight", "profile.starting_weight"],
      ["starting_waist", "profile.starting_waist"],
      ["starting_body_fat", "profile.starting_body_fat"],
    ] as const;

    for (const [field, label] of profileAnalyticsFields) {
      const value = config.profile[field];
      if (value != null && (!isFiniteNumber(value) || value <= 0)) {
        return {
          valid: false,
          config: null,
          error: `${label} must be a positive number.`,
        };
      }
    }

    if (
      config.profile.starting_body_fat != null &&
      (config.profile.starting_body_fat < 1 ||
        config.profile.starting_body_fat > 100)
    ) {
      return {
        valid: false,
        config: null,
        error: "profile.starting_body_fat must be between 1 and 100.",
      };
    }

    if (config.profile.age != null && (!Number.isInteger(config.profile.age) || config.profile.age <= 0)) {
      return {
        valid: false,
        config: null,
        error: "profile.age must be a positive integer.",
      };
    }

    if (
      config.profile.gender != null &&
      !PROFILE_GENDERS.includes(config.profile.gender)
    ) {
      return {
        valid: false,
        config: null,
        error: "profile.gender must be male, female, or other.",
      };
    }
  }

  if (config.goals != null) {
    if (!isRecord(config.goals)) {
      return { valid: false, config: null, error: "Invalid goals section." };
    }

    const goalNumberFields = [
      "target_weight",
      "target_waist",
      "target_body_fat",
      "target_daily_steps",
      "target_sleep_hours",
      "target_water_liters",
    ] as const;

    for (const field of goalNumberFields) {
      const value = config.goals[field];
      if (value != null && !isFiniteNumber(value)) {
        return {
          valid: false,
          config: null,
          error: `goals.${field} must be a number.`,
        };
      }
    }
  }

  if (config.preferences != null) {
    if (!isRecord(config.preferences)) {
      return { valid: false, config: null, error: "Invalid preferences section." };
    }

    if (
      config.preferences.language != null &&
      !PREFERENCE_LANGUAGES.includes(config.preferences.language)
    ) {
      return {
        valid: false,
        config: null,
        error: "preferences.language must be en or ta.",
      };
    }
  }

  if (config.mission != null) {
    if (!isRecord(config.mission)) {
      return { valid: false, config: null, error: "Invalid mission section." };
    }

    if (
      config.mission.mission_days != null &&
      (!Number.isInteger(config.mission.mission_days) ||
        config.mission.mission_days <= 0)
    ) {
      return {
        valid: false,
        config: null,
        error: "mission.mission_days must be a positive integer.",
      };
    }
  }

  if (config.scoring != null) {
    if (!isRecord(config.scoring)) {
      return { valid: false, config: null, error: "Invalid scoring section." };
    }

    const weights = [
      config.scoring.habit_weight,
      config.scoring.metrics_weight,
      config.scoring.journal_weight,
    ];

    if (weights.some((weight) => weight != null && !isFiniteNumber(weight))) {
      return {
        valid: false,
        config: null,
        error: "Scoring weights must be numbers.",
      };
    }

    if (
      weights.every(isFiniteNumber) &&
      weights[0]! + weights[1]! + weights[2]! !== 100
    ) {
      return {
        valid: false,
        config: null,
        error: "Scoring weights must total 100.",
      };
    }

    if (config.scoring.vg_grade_bands != null) {
      const gradeError = validateGradeBands(
        config.scoring.vg_grade_bands,
        "scoring.vg_grade_bands"
      );
      if (gradeError) {
        return { valid: false, config: null, error: gradeError };
      }
    }
  }

  if (config.habits != null) {
    if (!Array.isArray(config.habits)) {
      return { valid: false, config: null, error: "habits must be an array." };
    }

    const ids = new Set<string>();

    for (const [index, habit] of config.habits.entries()) {
      if (!isRecord(habit)) {
        return {
          valid: false,
          config: null,
          error: `habits[${index}] must be an object.`,
        };
      }

      if (typeof habit.id !== "string" || !habit.id.trim()) {
        return {
          valid: false,
          config: null,
          error: `habits[${index}].id is required.`,
        };
      }

      if (ids.has(habit.id)) {
        return {
          valid: false,
          config: null,
          error: `Duplicate habit id: ${habit.id}`,
        };
      }
      ids.add(habit.id);

      if (typeof habit.name !== "string" || !habit.name.trim()) {
        return {
          valid: false,
          config: null,
          error: `habits[${index}].name is required.`,
        };
      }

      if (!isHabitCategory(habit.category)) {
        return {
          valid: false,
          config: null,
          error: `habits[${index}].category is invalid.`,
        };
      }

      if (!isFiniteNumber(habit.weight) || habit.weight <= 0) {
        return {
          valid: false,
          config: null,
          error: `habits[${index}].weight must be a positive number.`,
        };
      }

      if (habit.type != null && !isHabitType(habit.type)) {
        return {
          valid: false,
          config: null,
          error: `habits[${index}].type must be "core" or "custom".`,
        };
      }

      for (const flag of [
        "locked",
        "enabled",
        "public_visible",
        "show_in_checkin",
      ] as const) {
        if (habit[flag] != null && !isBoolean(habit[flag])) {
          return {
            valid: false,
            config: null,
            error: `habits[${index}].${flag} must be a boolean.`,
          };
        }
      }
    }
  }

  if (config.ai != null && !isRecord(config.ai)) {
    return { valid: false, config: null, error: "Invalid ai section." };
  }

  return { valid: true, config, error: null };
}
