import { supabase } from "@/lib/supabase";
import { env } from "@/lib/env";
import { lookup } from "dns/promises";
import {
  getConfig,
  resolveAppConfig,
  DEFAULT_STARTING_WEIGHT,
} from "@/lib/settings";
import {
  fetchLatestBodyMetricsRecord,
  markBodyMetricsFetchDynamic,
} from "@/lib/bodyMetrics";

export {
  calculateCurrentDay,
  calculateProgress,
  MISSION_START_DATE,
  TOTAL_DAYS,
} from "@/lib/missionDay";

export const INITIAL_WEIGHT = DEFAULT_STARTING_WEIGHT;

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
  totalDays: number;
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

import {
  calculateCurrentDay,
  calculateProgress,
  MISSION_START_DATE,
  TOTAL_DAYS,
} from "@/lib/missionDay";

export function calculateWeightLost(
  latestWeight: number | null,
  startingWeight: number = INITIAL_WEIGHT
): number {
  if (latestWeight === null) return 0;
  return Math.max(0, startingWeight - latestWeight);
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
    await markBodyMetricsFetchDynamic();

    const [config, latestResult, streakResult] = await Promise.all([
      getConfig(),
      fetchLatestBodyMetricsRecord(),
      supabase
        .from("body_metrics")
        .select("workout_done")
        .order("date", { ascending: false }),
    ]);

    const missionConfig = resolveAppConfig(config);

    if (latestResult.error) {
      return { data: null, error: latestResult.error };
    }

    if (streakResult.error) {
      return { data: null, error: streakResult.error.message };
    }

    const latest = latestResult.data;
    const streakRows = (streakResult.data ?? []) as Pick<
      BodyMetricRow,
      "workout_done"
    >[];

    const day = calculateCurrentDay(
      new Date(),
      missionConfig.missionStartDate,
      missionConfig.missionDays
    );
    const progress = calculateProgress(day, missionConfig.missionDays);
    const latestWeight = latest?.weight ?? null;
    const weightLost = calculateWeightLost(latestWeight, missionConfig.startingWeight);
    const streak = calculateStreak(streakRows);

    return {
      data: {
        day,
        progress,
        weightLost,
        streak,
        latestWeight,
        latestDate: latest?.date ?? null,
        totalDays: missionConfig.missionDays,
      },
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to connect to Supabase";
    return { data: null, error: message };
  }
}
