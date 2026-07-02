import { readConfigNumber } from "@/lib/configFallback";
import type { AppSettingsConfig, AiCoachConfig } from "@/lib/settings";

export const DEFAULT_AI_CONFIG: AiCoachConfig = {
  sleep_good_threshold: 7,
  sleep_bad_threshold: 5,
  daily_steps_goal: 8000,
  excellent_steps_goal: 12000,
  good_habit_threshold: 70,
  bad_habit_threshold: 40,
  high_discipline_threshold: 80,
  low_discipline_threshold: 50,
};

export function resolveAiConfig(
  config: AppSettingsConfig | null | undefined
): AiCoachConfig {
  const source = config?.ai ?? config?.ai_coach;

  return {
    sleep_good_threshold: readConfigNumber(
      "ai",
      "sleep_good_threshold",
      source?.sleep_good_threshold,
      DEFAULT_AI_CONFIG.sleep_good_threshold
    ),
    sleep_bad_threshold: readConfigNumber(
      "ai",
      "sleep_bad_threshold",
      source?.sleep_bad_threshold,
      DEFAULT_AI_CONFIG.sleep_bad_threshold
    ),
    daily_steps_goal: readConfigNumber(
      "ai",
      "daily_steps_goal",
      source?.daily_steps_goal,
      DEFAULT_AI_CONFIG.daily_steps_goal
    ),
    excellent_steps_goal: readConfigNumber(
      "ai",
      "excellent_steps_goal",
      source?.excellent_steps_goal,
      DEFAULT_AI_CONFIG.excellent_steps_goal
    ),
    good_habit_threshold: readConfigNumber(
      "ai",
      "good_habit_threshold",
      source?.good_habit_threshold,
      DEFAULT_AI_CONFIG.good_habit_threshold
    ),
    bad_habit_threshold: readConfigNumber(
      "ai",
      "bad_habit_threshold",
      source?.bad_habit_threshold,
      DEFAULT_AI_CONFIG.bad_habit_threshold
    ),
    high_discipline_threshold: readConfigNumber(
      "ai",
      "high_discipline_threshold",
      source?.high_discipline_threshold,
      DEFAULT_AI_CONFIG.high_discipline_threshold
    ),
    low_discipline_threshold: readConfigNumber(
      "ai",
      "low_discipline_threshold",
      source?.low_discipline_threshold,
      DEFAULT_AI_CONFIG.low_discipline_threshold
    ),
  };
}

export type AiCoachFormState = {
  sleep_good_threshold: string;
  sleep_bad_threshold: string;
  daily_steps_goal: string;
  excellent_steps_goal: string;
  good_habit_threshold: string;
  bad_habit_threshold: string;
  high_discipline_threshold: string;
  low_discipline_threshold: string;
};

export function toAiCoachForm(ai: AiCoachConfig): AiCoachFormState {
  return {
    sleep_good_threshold: String(ai.sleep_good_threshold),
    sleep_bad_threshold: String(ai.sleep_bad_threshold),
    daily_steps_goal: String(ai.daily_steps_goal),
    excellent_steps_goal: String(ai.excellent_steps_goal),
    good_habit_threshold: String(ai.good_habit_threshold),
    bad_habit_threshold: String(ai.bad_habit_threshold),
    high_discipline_threshold: String(ai.high_discipline_threshold),
    low_discipline_threshold: String(ai.low_discipline_threshold),
  };
}

export function fromAiCoachForm(form: AiCoachFormState): AiCoachConfig {
  return {
    sleep_good_threshold: Number(form.sleep_good_threshold),
    sleep_bad_threshold: Number(form.sleep_bad_threshold),
    daily_steps_goal: Number(form.daily_steps_goal),
    excellent_steps_goal: Number(form.excellent_steps_goal),
    good_habit_threshold: Number(form.good_habit_threshold),
    bad_habit_threshold: Number(form.bad_habit_threshold),
    high_discipline_threshold: Number(form.high_discipline_threshold),
    low_discipline_threshold: Number(form.low_discipline_threshold),
  };
}

function parsePositiveNumber(
  value: string,
  label: string
): { value: number | null; error: string | null } {
  const parsed = Number(value);
  if (!value.trim() || Number.isNaN(parsed) || parsed < 0) {
    return { value: null, error: `${label} must be a non-negative number.` };
  }
  return { value: parsed, error: null };
}

export function validateAiConfig(form: AiCoachFormState): string | null {
  const fields: Array<[keyof AiCoachFormState, string]> = [
    ["sleep_good_threshold", "Sleep good threshold"],
    ["sleep_bad_threshold", "Sleep bad threshold"],
    ["daily_steps_goal", "Daily steps goal"],
    ["excellent_steps_goal", "Excellent steps goal"],
    ["good_habit_threshold", "Good habit threshold"],
    ["bad_habit_threshold", "Bad habit threshold"],
    ["high_discipline_threshold", "High discipline threshold"],
    ["low_discipline_threshold", "Low discipline threshold"],
  ];

  for (const [key, label] of fields) {
    const result = parsePositiveNumber(form[key], label);
    if (result.error) return result.error;
  }

  const ai = fromAiCoachForm(form);

  if (ai.sleep_good_threshold <= ai.sleep_bad_threshold) {
    return "Sleep good threshold must be greater than sleep bad threshold.";
  }

  if (ai.excellent_steps_goal <= ai.daily_steps_goal) {
    return "Excellent steps goal must be greater than daily steps goal.";
  }

  if (ai.good_habit_threshold <= ai.bad_habit_threshold) {
    return "Good habit threshold must be greater than bad habit threshold.";
  }

  if (ai.high_discipline_threshold <= ai.low_discipline_threshold) {
    return "High discipline threshold must be greater than low discipline threshold.";
  }

  return null;
}
