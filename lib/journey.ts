import { supabase } from "@/lib/supabase";
import { calculateCurrentDay } from "@/lib/missionDay";
import { calculateVGScore } from "@/lib/vgScore";
import { getConfig, resolveAppConfig } from "@/lib/settings";
import { resolveAiConfig } from "@/lib/aiSettingsConfig";
import type { AiCoachConfig } from "@/lib/settings";
import { markBodyMetricsFetchDynamic } from "@/lib/bodyMetrics";

export type BodyMetricRecord = {
  id: string;
  date: string;
  weight: number;
  waist: number | null;
  body_fat: number | null;
  steps: number | null;
  sleep_hours: number | null;
  workout_done: boolean;
  cheat_meal: boolean;
  notes: string | null;
  created_at?: string;
};

export type JourneyEntry = BodyMetricRecord & {
  dayNumber: number;
  vgScore: number | null;
  isFuture: boolean;
};

export function normalizeDate(date: string): string {
  return date.trim().slice(0, 10);
}

function parseDateOnly(value: string): Date {
  return new Date(`${normalizeDate(value)}T00:00:00`);
}

function isFutureDate(date: string, today: string): boolean {
  return normalizeDate(date) > normalizeDate(today);
}

function enrichEntry(
  row: BodyMetricRecord,
  missionStartDate: string,
  missionDays: number,
  today: string,
  ai: Pick<
    AiCoachConfig,
    "daily_steps_goal" | "sleep_good_threshold" | "sleep_bad_threshold"
  >
): JourneyEntry {
  const date = normalizeDate(row.date);
  const hasScoreData = row.weight != null && !Number.isNaN(row.weight);

  return {
    ...row,
    date,
    body_fat: row.body_fat ?? null,
    dayNumber: calculateCurrentDay(
      parseDateOnly(date),
      missionStartDate,
      missionDays
    ),
    isFuture: isFutureDate(date, today),
    vgScore: hasScoreData
      ? calculateVGScore(
          {
            workout_done: row.workout_done,
            cheat_meal: row.cheat_meal,
            steps: row.steps ?? undefined,
            sleep_hours: row.sleep_hours ?? undefined,
          },
          ai
        )
      : null,
  };
}

export async function fetchJourneyData(): Promise<{
  entries: JourneyEntry[];
  error: string | null;
}> {
  try {
    await markBodyMetricsFetchDynamic();

    const [metricsResult, config] = await Promise.all([
      supabase.from("body_metrics").select("*").order("date", { ascending: false }),
      getConfig(),
    ]);
    const ai = resolveAiConfig(config);
    const missionConfig = resolveAppConfig(config);
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = metricsResult;

    if (error) {
      return { entries: [], error: error.message };
    }

    const rows = (data ?? []).map((row) => ({
      ...(row as BodyMetricRecord),
      date: normalizeDate(String(row.date)),
      body_fat:
        (row as BodyMetricRecord).body_fat != null
          ? Number((row as BodyMetricRecord).body_fat)
          : null,
    }));

    if (rows.length === 0) {
      return { entries: [], error: null };
    }

    const futureRows = rows.filter((row) => isFutureDate(row.date, today));
    console.log("JOURNEY FETCH", {
      count: rows.length,
      futureCount: futureRows.length,
      futureDates: futureRows.map((row) => row.date),
      missionStartDate: missionConfig.missionStartDate,
      dayLabelSource: "calculateCurrentDay(entry_date, mission_start_date)",
    });

    const entries = rows.map((row) =>
      enrichEntry(
        row,
        missionConfig.missionStartDate,
        missionConfig.missionDays,
        today,
        ai
      )
    );

    return { entries, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch journey data";
    return { entries: [], error: message };
  }
}

export function formatJourneyDate(date: string): string {
  const parsed = parseDateOnly(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMetricValue(
  value: number | null | undefined,
  suffix = ""
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value}${suffix}`;
}
