import { supabase } from "@/lib/supabase";

export type BodyMetricField = "weight" | "waist" | "body_fat";

export type BodyMetricsRecord = {
  id: string;
  date: string;
  weight: number | null;
  waist: number | null;
  body_fat: number | null;
  steps: number | null;
  sleep_hours: number | null;
  workout_done: boolean;
  cheat_meal: boolean;
  notes: string | null;
  vg_score: number | null;
  created_at?: string;
};

export type MetricsHistorySummary = {
  totalEntries: number;
  currentWeight: number | null;
  totalWeightLost: number;
  averageSteps: number | null;
};

export function normalizeBodyMetricsDate(date: string): string {
  return date.trim().slice(0, 10);
}

function normalizeDate(date: string): string {
  return normalizeBodyMetricsDate(date);
}

export async function markBodyMetricsFetchDynamic(): Promise<void> {
  if (typeof window === "undefined") {
    const { unstable_noStore: noStore } = await import("next/cache");
    noStore();
  }
}

export function sortBodyMetricsByDateDesc<T extends { date: string }>(
  records: T[]
): T[] {
  return [...records].sort((a, b) =>
    normalizeDate(b.date).localeCompare(normalizeDate(a.date))
  );
}

export function sortBodyMetricsByDateAsc<T extends { date: string }>(
  records: T[]
): T[] {
  return [...records].sort((a, b) =>
    normalizeDate(a.date).localeCompare(normalizeDate(b.date))
  );
}

export const MIN_BODY_WEIGHT_KG = 30;
export const MAX_BODY_WEIGHT_KG = 200;

function coerceNumeric(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isValidBodyWeight(weight: number | null | undefined): boolean {
  return (
    weight != null &&
    Number.isFinite(weight) &&
    weight >= MIN_BODY_WEIGHT_KG &&
    weight <= MAX_BODY_WEIGHT_KG
  );
}

export function normalizeBodyMetricsRow(
  row: Record<string, unknown>
): BodyMetricsRecord {
  return {
    ...(row as BodyMetricsRecord),
    date: normalizeDate(String(row.date)),
    weight: coerceNumeric(row.weight),
    waist: coerceNumeric(row.waist),
    body_fat: coerceNumeric(row.body_fat),
    steps: coerceNumeric(row.steps),
    sleep_hours: coerceNumeric(row.sleep_hours),
    vg_score: coerceNumeric(row.vg_score),
  };
}

/**
 * Current metrics for analytics: prefer today's check-in, else latest on/before today.
 * Never uses future-dated rows. If today's weight is an outlier, falls back to the
 * most recent valid weight on or before today (waist/body fat stay on that same row).
 */
export function pickAnalyticsCurrentRecord<T extends BodyMetricsRecord>(
  records: T[],
  asOfDate: string = new Date().toISOString().slice(0, 10)
): T | null {
  if (records.length === 0) return null;

  const asOf = normalizeDate(asOfDate);
  const current = pickCurrentBodyMetricsRecord(records, asOf);
  if (!current) return null;

  if (isValidBodyWeight(current.weight)) {
    return current;
  }

  const onOrBefore = sortBodyMetricsByDateDesc(records).filter(
    (record) => normalizeDate(record.date) <= asOf
  );
  const validWeightRow = onOrBefore.find((record) =>
    isValidBodyWeight(record.weight)
  );

  return validWeightRow ?? current;
}

/**
 * Prefer today's row; otherwise the latest row on or before asOfDate.
 * Ignores future-dated rows so they do not shadow today's check-in.
 */
export function pickCurrentBodyMetricsRecord<T extends BodyMetricsRecord>(
  records: T[],
  asOfDate: string = new Date().toISOString().slice(0, 10)
): T | null {
  if (records.length === 0) return null;

  const asOf = normalizeDate(asOfDate);
  const sortedDesc = sortBodyMetricsByDateDesc(records);
  const todayRow = sortedDesc.find(
    (record) => normalizeDate(record.date) === asOf
  );
  if (todayRow) return todayRow;

  const onOrBefore = sortedDesc.filter(
    (record) => normalizeDate(record.date) <= asOf
  );
  return onOrBefore[0] ?? null;
}

/** @alias pickCurrentBodyMetricsRecord */
export const getLatestBodyMetricsRecord = pickCurrentBodyMetricsRecord;

export function getMetricFromRecord(
  record: BodyMetricsRecord | null,
  field: BodyMetricField
): number | null {
  if (!record) return null;
  const value = record[field];
  return value != null && !Number.isNaN(value) ? value : null;
}

export async function fetchAllBodyMetricsRecords(): Promise<{
  data: BodyMetricsRecord[];
  error: string | null;
}> {
  await markBodyMetricsFetchDynamic();

  try {
    const { data, error } = await supabase
      .from("body_metrics")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    const records = (data ?? []).map((row) =>
      normalizeBodyMetricsRow(row as Record<string, unknown>)
    );

    console.log("BODY METRICS FETCH ALL", {
      count: records.length,
      query: "select * order by date asc",
    });

    return { data: records, error: null };
  } catch (err) {
    return {
      data: [],
      error: getErrorMessage(err, "Failed to fetch body metrics"),
    };
  }
}

export async function fetchLatestBodyMetricsRecord(
  asOfDate?: string
): Promise<{
  data: BodyMetricsRecord | null;
  error: string | null;
}> {
  const { data, error } = await fetchAllBodyMetricsRecords();
  if (error) {
    return { data: null, error };
  }

  const current = pickCurrentBodyMetricsRecord(data, asOfDate);
  console.log("BODY METRICS FETCH CURRENT", {
    asOfDate: asOfDate ?? new Date().toISOString().slice(0, 10),
    date: current?.date ?? null,
    weight: current?.weight ?? null,
    waist: current?.waist ?? null,
    body_fat: current?.body_fat ?? null,
  });

  return { data: current, error: null };
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: string }).message);
  }
  return fallback;
}

export async function getBodyMetricsByDate(date: string): Promise<{
  data: BodyMetricsRecord | null;
  error: string | null;
}> {
  const normalizedDate = normalizeDate(date);

  if (!normalizedDate) {
    console.log("BODY METRICS ERROR", "Date is required.");
    return { data: null, error: "Date is required." };
  }

  console.log("BODY METRICS FETCH BY DATE", { date: normalizedDate });

  try {
    const { data, error } = await supabase
      .from("body_metrics")
      .select("*")
      .eq("date", normalizedDate)
      .maybeSingle();

    if (error) {
      console.log("BODY METRICS ERROR", error.message);
      return { data: null, error: error.message };
    }

    if (!data) {
      console.log("BODY METRICS FETCH BY DATE", {
        date: normalizedDate,
        found: false,
      });
      return { data: null, error: null };
    }

    const record = {
      ...(data as BodyMetricsRecord),
      date: normalizeDate(String(data.date)),
    };

    console.log("BODY METRICS FETCH BY DATE", {
      date: normalizedDate,
      found: true,
      id: record.id,
    });

    return { data: record, error: null };
  } catch (err) {
    const message = getErrorMessage(err, "Failed to fetch body metrics");
    console.log("BODY METRICS ERROR", message);
    return { data: null, error: message };
  }
}

export function calculateMetricsHistorySummary(
  records: BodyMetricsRecord[]
): MetricsHistorySummary {
  if (records.length === 0) {
    return {
      totalEntries: 0,
      currentWeight: null,
      totalWeightLost: 0,
      averageSteps: null,
    };
  }

  const sortedAsc = sortBodyMetricsByDateAsc(records);
  const currentRecord = pickCurrentBodyMetricsRecord(records);
  const latestWeight = currentRecord?.weight ?? null;
  const firstWeight = sortedAsc[0]?.weight ?? null;
  const totalWeightLost =
    firstWeight != null && latestWeight != null
      ? Math.max(0, firstWeight - latestWeight)
      : 0;

  const stepValues = records
    .map((record) => record.steps)
    .filter((value): value is number => value != null && !Number.isNaN(value));

  const averageSteps =
    stepValues.length > 0
      ? Math.round(
          stepValues.reduce((sum, value) => sum + value, 0) / stepValues.length
        )
      : null;

  return {
    totalEntries: records.length,
    currentWeight: latestWeight,
    totalWeightLost,
    averageSteps,
  };
}

export async function getBodyMetricsHistory(): Promise<{
  data: BodyMetricsRecord[];
  error: string | null;
}> {
  console.log("HISTORY FETCH START", { table: "body_metrics" });

  try {
    await markBodyMetricsFetchDynamic();

    const { data, error } = await supabase
      .from("body_metrics")
      .select(
        "id, date, weight, waist, body_fat, steps, sleep_hours, workout_done, cheat_meal, notes, vg_score"
      )
      .order("date", { ascending: false });

    if (error) {
      console.error("HISTORY FETCH ERROR", error.message);
      return { data: [], error: error.message };
    }

    const records = (data ?? []).map((row) =>
      normalizeBodyMetricsRow(row as Record<string, unknown>)
    );

    console.log("HISTORY FETCH SUCCESS", {
      table: "body_metrics",
      count: records.length,
    });

    return { data: records, error: null };
  } catch (err) {
    const message = getErrorMessage(err, "Failed to fetch metrics history");
    console.error("HISTORY FETCH ERROR", message);
    return { data: [], error: message };
  }
}

export async function deleteBodyMetric(id: string): Promise<{
  error: string | null;
}> {
  try {
    const { error } = await supabase.from("body_metrics").delete().eq("id", id);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return {
      error: getErrorMessage(err, "Failed to delete body metric"),
    };
  }
}
