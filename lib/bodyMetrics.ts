import { supabase } from "@/lib/supabase";

export type BodyMetricsRecord = {
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

export type MetricsHistorySummary = {
  totalEntries: number;
  currentWeight: number | null;
  totalWeightLost: number;
  averageSteps: number | null;
};

function normalizeDate(date: string): string {
  return date.trim().slice(0, 10);
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

  const latestWeight = records[0].weight;
  const firstWeight = records[records.length - 1].weight;
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
    const { data, error } = await supabase
      .from("body_metrics")
      .select(
        "id, date, weight, waist, steps, sleep_hours, workout_done, vg_score"
      )
      .order("date", { ascending: false });

    if (error) {
      console.error("HISTORY FETCH ERROR", error.message);
      return { data: [], error: error.message };
    }

    const records = (data ?? []).map((row) => ({
      ...(row as BodyMetricsRecord),
      date: normalizeDate(String(row.date)),
      cheat_meal: false,
      notes: null,
    }));

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
