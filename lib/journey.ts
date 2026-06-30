import { supabase } from "@/lib/supabase";
import { calculateVGScore } from "@/lib/vgScore";

export type BodyMetricRecord = {
  id: string;
  date: string;
  weight: number;
  waist: number | null;
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
};

export function normalizeDate(date: string): string {
  return date.trim().slice(0, 10);
}

function parseDateOnly(value: string): Date {
  return new Date(`${normalizeDate(value)}T00:00:00`);
}

export function calculateDayNumber(
  recordDate: string,
  earliestDate: string
): number {
  const start = parseDateOnly(earliestDate);
  const current = parseDateOnly(recordDate);
  const diffMs = current.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

function findEarliestDate(rows: BodyMetricRecord[]): string {
  return rows.reduce((earliest, row) => {
    const date = normalizeDate(row.date);
    return date < earliest ? date : earliest;
  }, normalizeDate(rows[0].date));
}

function enrichEntry(
  row: BodyMetricRecord,
  earliestDate: string
): JourneyEntry {
  const date = normalizeDate(row.date);
  const hasScoreData = row.weight != null && !Number.isNaN(row.weight);

  return {
    ...row,
    date,
    dayNumber: calculateDayNumber(date, earliestDate),
    vgScore: hasScoreData
      ? calculateVGScore({
          workout_done: row.workout_done,
          cheat_meal: row.cheat_meal,
          steps: row.steps ?? undefined,
          sleep_hours: row.sleep_hours ?? undefined,
        })
      : null,
  };
}

export async function fetchJourneyData(): Promise<{
  entries: JourneyEntry[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("body_metrics")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      return { entries: [], error: error.message };
    }

    const rows = (data ?? []) as BodyMetricRecord[];

    if (rows.length === 0) {
      return { entries: [], error: null };
    }

    const earliestDate = findEarliestDate(rows);
    const entries = rows.map((row) => enrichEntry(row, earliestDate));

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
