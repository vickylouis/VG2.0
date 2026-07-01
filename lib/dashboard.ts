import { supabase } from "@/lib/supabase";
import { env } from "@/lib/env";
import { lookup } from "dns/promises";

export const MISSION_START_DATE = "2026-08-01";
export const INITIAL_WEIGHT = 89;
export const TOTAL_DAYS = 150;

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;

export type BodyMetricRow = {
  date: string;
  weight: number;
  waist: number;
  workout_done: boolean;
};

export type { BodyMetricsRecord } from "@/lib/bodyMetrics";
export { getBodyMetricsByDate } from "@/lib/bodyMetrics";

export type DashboardStats = {
  day: number;
  progress: number;
  weightLost: number;
  streak: number;
  latestWeight: number | null;
  latestDate: string | null;
};

async function validateSupabaseHost(): Promise<string | null> {
  if (!supabaseUrl) {
    return "Missing NEXT_PUBLIC_SUPABASE_URL in .env.local";
  }

  let hostname: string;

  try {
    hostname = new URL(supabaseUrl).hostname;
  } catch {
    return `Invalid NEXT_PUBLIC_SUPABASE_URL: "${supabaseUrl}"`;
  }

  try {
    await lookup(hostname);
    return null;
  } catch {
    return `Supabase project not found: ${hostname} does not exist.`;
  }
}

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function calculateCurrentDay(
  today: Date = new Date(),
  startDate: string = MISSION_START_DATE
): number {
  const start = parseDateOnly(startDate);
  const current = new Date(today);
  current.setHours(0, 0, 0, 0);

  const diffMs = current.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(1, Math.min(TOTAL_DAYS, diffDays + 1));
}

export function calculateProgress(day: number): number {
  return Math.round((day / TOTAL_DAYS) * 100);
}

export function calculateWeightLost(latestWeight: number | null): number {
  if (latestWeight === null) return 0;
  return Math.max(0, INITIAL_WEIGHT - latestWeight);
}

export function calculateStreak(rows: Pick<BodyMetricRow, "workout_done">[]): number {
  let streak = 0;

  for (const row of rows) {
    if (row.workout_done) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export async function getDashboardStats(): Promise<{
  data: DashboardStats | null;
  error: string | null;
}> {
  const hostError = await validateSupabaseHost();
  if (hostError) {
    return { data: null, error: hostError };
  }

  try {
    const [latestResult, streakResult] = await Promise.all([
      supabase
        .from("body_metrics")
        .select("date, weight, waist, workout_done")
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("body_metrics")
        .select("workout_done")
        .order("date", { ascending: false }),
    ]);

    if (latestResult.error) {
      return { data: null, error: latestResult.error.message };
    }

    if (streakResult.error) {
      return { data: null, error: streakResult.error.message };
    }

    const latest = latestResult.data as BodyMetricRow | null;
    const streakRows = (streakResult.data ?? []) as Pick<
      BodyMetricRow,
      "workout_done"
    >[];

    const day = calculateCurrentDay();
    const progress = calculateProgress(day);
    const latestWeight = latest?.weight ?? null;
    const weightLost = calculateWeightLost(latestWeight);
    const streak = calculateStreak(streakRows);

    return {
      data: {
        day,
        progress,
        weightLost,
        streak,
        latestWeight,
        latestDate: latest?.date ?? null,
      },
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to connect to Supabase";
    return { data: null, error: message };
  }
}
