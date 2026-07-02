import { DEFAULT_AI_CONFIG } from "@/lib/aiSettingsConfig";
import {
  DEFAULT_VG_GRADE_BANDS,
  resolveScoringConfig,
} from "@/lib/scoringSettingsConfig";
import type { AiCoachConfig, VgGradeBands } from "@/lib/settings";

export type ScoreInput = {
  workout_done: boolean;
  cheat_meal: boolean;
  steps?: number;
  sleep_hours?: number;
};

type VgScoreRules = Pick<
  AiCoachConfig,
  "daily_steps_goal" | "sleep_good_threshold" | "sleep_bad_threshold"
>;

function resolveGradeBands(bands?: VgGradeBands): VgGradeBands {
  return bands ?? resolveScoringConfig(null).vg_grade_bands;
}

export function calculateVGScore(
  data: ScoreInput,
  ai: VgScoreRules = DEFAULT_AI_CONFIG
): number {
  let score = 0;
  const steps = data.steps ?? 0;
  const sleepHours = data.sleep_hours ?? 0;
  const stepMidGoal = Math.round(ai.daily_steps_goal * 0.625);
  const sleepMidGoal =
    ai.sleep_bad_threshold +
    (ai.sleep_good_threshold - ai.sleep_bad_threshold) * 0.5;

  if (data.workout_done) score += 30;

  if (steps >= ai.daily_steps_goal) score += 25;
  else if (steps >= stepMidGoal) score += 15;

  if (sleepHours >= ai.sleep_good_threshold) score += 25;
  else if (sleepHours >= sleepMidGoal) score += 15;

  if (!data.cheat_meal) score += 20;

  return score;
}

export function getVGScoreMotivation(
  score: number,
  bands: VgGradeBands = DEFAULT_VG_GRADE_BANDS
): string {
  const resolved = resolveGradeBands(bands);

  if (score >= resolved.A) return "Beast Mode 🔥";
  if (score >= resolved.B) return "Strong Day 💪";
  if (score >= resolved.C) return "Average Day ⚡";
  return "Needs Improvement 🎯";
}

export function isScoreReady(date: string, weight: string): boolean {
  return Boolean(date && weight.trim() !== "");
}

export function getVGScoreGrade(
  score: number,
  ready: boolean,
  bands: VgGradeBands = DEFAULT_VG_GRADE_BANDS
): string {
  if (!ready) return "—";

  const resolved = resolveGradeBands(bands);

  if (score >= resolved.A) return "A";
  if (score >= resolved.B) return "B";
  if (score >= resolved.C) return "C";
  return "D";
}

export function getVGScoreColor(
  score: number,
  ready: boolean,
  bands: VgGradeBands = DEFAULT_VG_GRADE_BANDS
): string {
  if (!ready) return "#A3A3A3";

  const resolved = resolveGradeBands(bands);

  if (score >= resolved.A) return "#22C55E";
  if (score >= resolved.B) return "#D4AF37";
  if (score >= resolved.C) return "#F97316";
  return "#EF4444";
}

export function getVGScoreStatus(
  score: number,
  ready: boolean,
  bands: VgGradeBands = DEFAULT_VG_GRADE_BANDS
): string {
  if (!ready) return "Awaiting metrics";
  return getVGScoreMotivation(score, bands);
}
