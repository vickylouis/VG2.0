export type ScoreInput = {
  workout_done: boolean;
  cheat_meal: boolean;
  steps?: number;
  sleep_hours?: number;
};

export function calculateVGScore(data: ScoreInput): number {
  let score = 0;

  if (data.workout_done) score += 30;

  if ((data.steps ?? 0) >= 8000) score += 25;
  else if ((data.steps ?? 0) >= 5000) score += 15;

  if ((data.sleep_hours ?? 0) >= 7) score += 25;
  else if ((data.sleep_hours ?? 0) >= 6) score += 15;

  if (!data.cheat_meal) score += 20;

  return score;
}

export function getVGScoreMotivation(score: number): string {
  if (score >= 90) return "Beast Mode 🔥";
  if (score >= 75) return "Strong Day 💪";
  if (score >= 50) return "Average Day ⚡";
  return "Needs Improvement 🎯";
}

export function isScoreReady(date: string, weight: string): boolean {
  return Boolean(date && weight.trim() !== "");
}

export function getVGScoreGrade(score: number, ready: boolean): string {
  if (!ready) return "—";
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 50) return "C";
  return "D";
}

export function getVGScoreColor(score: number, ready: boolean): string {
  if (!ready) return "#A3A3A3";
  if (score >= 90) return "#22C55E";
  if (score >= 75) return "#D4AF37";
  if (score >= 50) return "#F97316";
  return "#EF4444";
}

export function getVGScoreStatus(score: number, ready: boolean): string {
  if (!ready) return "Awaiting metrics";
  return getVGScoreMotivation(score);
}
