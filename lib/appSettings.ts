import { resolveAiConfig } from "@/lib/aiSettingsConfig";
import { buildHabitEngineContext } from "@/lib/habitConfig";
import { resolveSettingsHabits } from "@/lib/habitConfig";
import { resolveGoalsConfig, type ResolvedGoalsConfig } from "@/lib/goalsSettingsConfig";
import {
  resolveProfileConfig,
  type ResolvedProfileConfig,
} from "@/lib/profileSettingsConfig";
import { resolveScoringConfig } from "@/lib/scoringSettingsConfig";
import {
  getConfig,
  resolveAppConfig,
  type AiCoachConfig,
  type AppSettingsConfig,
  type HabitConfigItem,
  type ResolvedAppConfig,
  type ScoringConfig,
} from "@/lib/settings";
import type { HabitEngineContext } from "@/lib/habitConfig";

export type ResolvedAppSettings = {
  config: AppSettingsConfig;
  mission: ResolvedAppConfig;
  profile: ResolvedProfileConfig;
  goals: ResolvedGoalsConfig;
  ai: AiCoachConfig;
  scoring: ScoringConfig;
  habits: HabitConfigItem[];
  habitEngine: HabitEngineContext;
  checkinHabitEngine: HabitEngineContext;
  publicHabitEngine: HabitEngineContext;
};

export async function getResolvedAppSettings(): Promise<ResolvedAppSettings> {
  if (typeof window === "undefined") {
    const { unstable_noStore: noStore } = await import("next/cache");
    noStore();
  }

  const config = await getConfig();
  const ai = resolveAiConfig(config);
  const scoring = resolveScoringConfig(config);
  const mission = resolveAppConfig(config);
  const profile = resolveProfileConfig(config);
  const goals = resolveGoalsConfig(config);
  const habitEngine = buildHabitEngineContext(config, ai, "scoring");
  const checkinHabitEngine = buildHabitEngineContext(config, ai, "checkin");
  const publicHabitEngine = buildHabitEngineContext(config, ai, "public");

  return {
    config,
    mission,
    profile,
    goals,
    ai,
    scoring,
    habits: resolveSettingsHabits(config.habits),
    habitEngine,
    checkinHabitEngine,
    publicHabitEngine,
  };
}
