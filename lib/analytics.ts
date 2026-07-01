import { supabase } from "@/lib/supabase";
import { calculateVGScore } from "@/lib/vgScore";

export type AnalyticsRecord = {
  id: string;
  date: string;
  weight: number | null;
  waist: number | null;
  steps: number | null;
  sleep_hours: number | null;
  workout_done: boolean;
  cheat_meal: boolean;
  notes: string | null;
  vg_score: number | null;
  created_at?: string;
};

export type BodyMetricsInput = {
  date: string;
  weight: number;
  waist?: number | null;
  steps?: number | null;
  sleep_hours?: number | null;
  workout_done: boolean;
  cheat_meal: boolean;
  notes?: string | null;
};

export type AnalyticsSummary = {
  totalWeightLost: number;
  bestWorkoutStreak: number;
  averageVGScore: number;
  totalWorkoutDays: number;
  recordCount: number;
  firstWeight: number | null;
  latestWeight: number | null;
};

export type TrendChartPoint = {
  date: string;
  formattedDate: string;
  value: number;
};

export type WeeklyAveragePoint = {
  weekKey: string;
  weekLabel: string;
  averageScore: number;
};

export type AnalyticsChartData = {
  weight: TrendChartPoint[];
  waist: TrendChartPoint[];
  vgScore: TrendChartPoint[];
  weeklyAverage: WeeklyAveragePoint[];
};

export function normalizeDate(date: string): string {
  return date.trim().slice(0, 10);
}

function parseDateOnly(value: string): Date {
  return new Date(`${normalizeDate(value)}T00:00:00`);
}

export function formatChartDate(date: string): string {
  const parsed = parseDateOnly(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function resolveVgScore(record: AnalyticsRecord): number | null {
  if (record.vg_score != null && !Number.isNaN(record.vg_score)) {
    return record.vg_score;
  }

  if (record.weight == null || Number.isNaN(record.weight)) {
    return null;
  }

  return calculateVGScore({
    workout_done: record.workout_done,
    cheat_meal: record.cheat_meal,
    steps: record.steps ?? undefined,
    sleep_hours: record.sleep_hours ?? undefined,
  });
}

function sortByDateAsc(records: AnalyticsRecord[]): AnalyticsRecord[] {
  return [...records].sort((a, b) =>
    normalizeDate(a.date).localeCompare(normalizeDate(b.date))
  );
}

export function calculateBestStreak(
  records: Pick<AnalyticsRecord, "workout_done" | "date">[]
): number {
  if (records.length === 0) return 0;

  const sorted = sortByDateAsc(records as AnalyticsRecord[]);
  let best = 0;
  let current = 0;

  for (const record of sorted) {
    if (record.workout_done) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  return best;
}

export function calculateAverageVGScore(records: AnalyticsRecord[]): number {
  const scores = records
    .map(resolveVgScore)
    .filter((score): score is number => score != null && !Number.isNaN(score));

  if (scores.length === 0) return 0;

  const total = scores.reduce((sum, score) => sum + score, 0);
  return Math.round(total / scores.length);
}

export function calculateAnalyticsSummary(
  records: AnalyticsRecord[]
): AnalyticsSummary {
  const sorted = sortByDateAsc(records);
  const weights = sorted
    .map((record) => record.weight)
    .filter((weight): weight is number => weight != null && !Number.isNaN(weight));

  const firstWeight = weights[0] ?? null;
  const latestWeight = weights[weights.length - 1] ?? null;

  const totalWeightLost =
    firstWeight != null && latestWeight != null
      ? Math.max(0, firstWeight - latestWeight)
      : 0;

  return {
    totalWeightLost,
    bestWorkoutStreak: calculateBestStreak(sorted),
    averageVGScore: calculateAverageVGScore(sorted),
    totalWorkoutDays: sorted.filter((record) => record.workout_done).length,
    recordCount: sorted.length,
    firstWeight,
    latestWeight,
  };
}

function getWeekStartKey(date: string): string {
  const parsed = parseDateOnly(date);
  const day = parsed.getDay();
  const diff = parsed.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(parsed);
  monday.setDate(diff);
  return normalizeDate(monday.toISOString().split("T")[0]);
}

function formatWeekLabel(weekKey: string): string {
  const parsed = parseDateOnly(weekKey);
  if (Number.isNaN(parsed.getTime())) return weekKey;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function buildWeeklyAverageData(
  records: AnalyticsRecord[]
): WeeklyAveragePoint[] {
  const weekMap = new Map<string, number[]>();

  for (const record of sortByDateAsc(records)) {
    const score = resolveVgScore(record);
    if (score == null) continue;

    const weekKey = getWeekStartKey(record.date);
    const existing = weekMap.get(weekKey) ?? [];
    existing.push(score);
    weekMap.set(weekKey, existing);
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekKey, scores]) => ({
      weekKey,
      weekLabel: formatWeekLabel(weekKey),
      averageScore: Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length
      ),
    }));
}

export function buildAnalyticsChartData(
  records: AnalyticsRecord[]
): AnalyticsChartData {
  const sorted = sortByDateAsc(records);

  const weight: TrendChartPoint[] = [];
  const waist: TrendChartPoint[] = [];
  const vgScore: TrendChartPoint[] = [];

  for (const record of sorted) {
    const formattedDate = formatChartDate(record.date);

    if (record.weight != null && !Number.isNaN(record.weight)) {
      weight.push({
        date: record.date,
        formattedDate,
        value: record.weight,
      });
    }

    if (record.waist != null && !Number.isNaN(record.waist)) {
      waist.push({
        date: record.date,
        formattedDate,
        value: record.waist,
      });
    }

    const score = resolveVgScore(record);
    if (score != null) {
      vgScore.push({
        date: record.date,
        formattedDate,
        value: score,
      });
    }
  }

  return {
    weight,
    waist,
    vgScore,
    weeklyAverage: buildWeeklyAverageData(sorted),
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isWithinLastDays(date: string, referenceDate: string, days: number): boolean {
  const end = parseDateOnly(referenceDate).getTime();
  const start = end - days * 24 * 60 * 60 * 1000;
  const current = parseDateOnly(date).getTime();
  return current >= start && current <= end;
}

export function generateAnalyticsInsights(records: AnalyticsRecord[]): string[] {
  if (records.length === 0) return [];

  const sorted = sortByDateAsc(records);
  const insights: string[] = [];
  const latestDate = sorted[sorted.length - 1].date;

  const recent30 = sorted.filter((record) =>
    isWithinLastDays(record.date, latestDate, 30)
  );

  if (recent30.length >= 2) {
    const firstWeight = recent30.find((record) => record.weight != null)?.weight;
    const lastWeight = [...recent30]
      .reverse()
      .find((record) => record.weight != null)?.weight;

    if (firstWeight != null && lastWeight != null) {
      const change = firstWeight - lastWeight;
      const direction = change >= 0 ? "lost" : "gained";
      insights.push(
        `Weight ${direction} ${Math.abs(Number(change.toFixed(1)))} kg in the last 30 days.`
      );
    }
  }

  const sleepValues = sorted
    .map((record) => record.sleep_hours)
    .filter((hours): hours is number => hours != null && !Number.isNaN(hours));

  if (sleepValues.length > 0) {
    insights.push(
      `Average sleep is ${average(sleepValues).toFixed(1)} hours across logged days.`
    );
  }

  const workoutDays = sorted.filter((record) => record.workout_done).length;
  const consistency = Math.round((workoutDays / sorted.length) * 100);
  insights.push(`Workout consistency is ${consistency}%.`);

  const scores = sorted
    .map(resolveVgScore)
    .filter((score): score is number => score != null);

  if (scores.length >= 4) {
    const midpoint = Math.floor(scores.length / 2);
    const firstHalfAvg = average(scores.slice(0, midpoint));
    const secondHalfAvg = average(scores.slice(midpoint));
    const improvement = secondHalfAvg - firstHalfAvg;

    if (improvement > 0) {
      insights.push(
        `VG Score improved by ${Math.round(improvement)} points over your journey.`
      );
    } else if (improvement < 0) {
      insights.push(
        `VG Score declined by ${Math.abs(Math.round(improvement))} points — time to refocus.`
      );
    } else {
      insights.push("VG Score has held steady across your logged days.");
    }
  } else if (scores.length > 0) {
    insights.push(
      `Current average VG Score is ${Math.round(average(scores))}/100.`
    );
  }

  return insights;
}

export async function fetchAnalyticsData(): Promise<{
  records: AnalyticsRecord[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("body_metrics")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      return { records: [], error: error.message };
    }

    const records = (data ?? []).map((row) => ({
      ...(row as AnalyticsRecord),
      date: normalizeDate(String(row.date)),
    }));

    return { records, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch analytics data";
    return { records: [], error: message };
  }
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: string }).message);
  }
  return fallback;
}

export async function saveBodyMetrics(input: BodyMetricsInput): Promise<{
  data: AnalyticsRecord | null;
  error: string | null;
}> {
  if (!input.date.trim()) {
    return { data: null, error: "Date is required." };
  }

  if (Number.isNaN(input.weight)) {
    return { data: null, error: "Weight must be a valid number." };
  }

  const payload = {
    date: normalizeDate(input.date),
    weight: input.weight,
    waist: input.waist ?? null,
    steps: input.steps ?? null,
    sleep_hours: input.sleep_hours ?? null,
    workout_done: input.workout_done,
    cheat_meal: input.cheat_meal,
    notes: input.notes?.trim() || null,
  };

  try {
    const { data: existing, error: lookupError } = await supabase
      .from("body_metrics")
      .select("id, date")
      .eq("date", payload.date)
      .maybeSingle();

    if (lookupError) {
      return { data: null, error: lookupError.message };
    }

    if (existing?.id) {
      const { data, error } = await supabase
        .from("body_metrics")
        .update({
          weight: payload.weight,
          waist: payload.waist,
          steps: payload.steps,
          sleep_hours: payload.sleep_hours,
          workout_done: payload.workout_done,
          cheat_meal: payload.cheat_meal,
          notes: payload.notes,
        })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      if (!data) {
        return {
          data: null,
          error:
            "Update failed: no row returned. Check Supabase RLS policies for body_metrics.",
        };
      }

      return {
        data: {
          ...(data as AnalyticsRecord),
          date: normalizeDate(String(data.date)),
        },
        error: null,
      };
    }

    const { data, error } = await supabase
      .from("body_metrics")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return {
        data: null,
        error:
          "Insert failed: no row returned. Check Supabase RLS policies for body_metrics.",
      };
    }

    return {
      data: {
        ...(data as AnalyticsRecord),
        date: normalizeDate(String(data.date)),
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err, "Failed to save body metrics"),
    };
  }
}
