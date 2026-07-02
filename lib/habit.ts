import { supabase } from "@/lib/supabase";
import { getConfig } from "@/lib/settings";
import {
  ALL_LEGACY_HABIT_COLUMNS,
  buildCompletionsFromRow,
  buildLegacyColumnsFromCompletions,
} from "@/lib/habitEngine";

export type HabitEntry = {
  id: string;
  date: string;
  completions: Record<string, boolean>;
  habit_score: number;
  notes: string | null;
  created_at: string;
};

export type HabitInput = {
  date: string;
  completions: Record<string, boolean>;
  notes?: string | null;
};

export const HABIT_TOTAL = 11;

export const HABIT_STREAK_THRESHOLD = 70;

export type HabitScoreContext = {
  enabledKeys?: readonly string[];
  total?: number;
  streakThreshold?: number;
  weightedFields?: { key: string; weight: number }[];
  totalWeight?: number;
  fieldLabels?: Record<string, string>;
};

export type HabitFieldDefinition = {
  key: string;
  label: string;
};

export type HabitFieldGroup = {
  title: string;
  fields: HabitFieldDefinition[];
};

/** @deprecated Legacy keys — use dynamic habit ids from config. */
export const HABIT_BOOLEAN_KEYS = [
  "gym_done",
  "steps_done",
  "protein_target_done",
  "water_target_done",
  "sleep_before_11_done",
  "reading_done",
  "english_practice_done",
  "automation_learning_done",
  "mma_done",
  "no_junk_food_done",
  "family_time_done",
] as const;

export const HABIT_FIELD_GROUPS: HabitFieldGroup[] = [
  {
    title: "Health",
    fields: [
      { key: "workout", label: "Workout" },
      { key: "steps", label: "Steps" },
      { key: "diet", label: "Diet" },
      { key: "water", label: "Water" },
      { key: "sleep", label: "Sleep" },
    ],
  },
];

export const HABIT_FIELDS: HabitFieldDefinition[] = HABIT_FIELD_GROUPS.flatMap(
  (group) => group.fields
);

export type HabitHistorySummary = {
  averageScore: number;
  bestDayScore: number;
  currentStreak: number;
  averageCompletedHabits: number;
};

export type HabitPerformanceRow = {
  key: string;
  label: string;
  completionPercent: number;
};

export type HabitDashboardSummary = {
  latestScore: number;
  completedCount: number;
  completedToday: number;
  currentStreak: number;
  bestStreak: number;
  latestDate: string | null;
};

function resolveHabitScoreContext(ctx?: HabitScoreContext) {
  const keys = ctx?.enabledKeys ?? [];
  const weightedFields = ctx?.weightedFields ?? [];
  const totalWeight =
    ctx?.totalWeight ??
    weightedFields.reduce((sum, field) => sum + field.weight, 0);

  return {
    keys,
    total: ctx?.total ?? keys.length,
    streakThreshold: ctx?.streakThreshold ?? HABIT_STREAK_THRESHOLD,
    weightedFields,
    totalWeight,
    fieldLabels: ctx?.fieldLabels ?? {},
  };
}

function getHabitLabel(
  key: string,
  fieldLabels: Record<string, string>
): string {
  return fieldLabels[key] ?? HABIT_FIELDS.find((field) => field.key === key)?.label ?? key;
}

function isHabitComplete(
  entry: Pick<HabitEntry, "completions">,
  key: string
): boolean {
  return entry.completions[key] === true;
}

export async function getHabitScoreContextFromConfig(): Promise<HabitScoreContext> {
  const { buildHabitEngineContext, toHabitScoreContext } = await import(
    "@/lib/habitConfig"
  );
  const { resolveAiConfig } = await import("@/lib/aiSettingsConfig");
  const config = await getConfig();
  const engine = buildHabitEngineContext(config, resolveAiConfig(config), "scoring");
  return toHabitScoreContext(engine);
}

function parseDateOnly(value: string): Date {
  return new Date(`${normalizeDate(value)}T00:00:00`);
}

function isConsecutiveDay(previousDate: string, nextDate: string): boolean {
  const previous = parseDateOnly(previousDate);
  const next = parseDateOnly(nextDate);
  const dayMs = 24 * 60 * 60 * 1000;
  return next.getTime() - previous.getTime() === dayMs;
}

function isQualifyingStreakDay(
  entry: HabitEntry,
  streakThreshold = HABIT_STREAK_THRESHOLD
): boolean {
  return entry.habit_score >= streakThreshold;
}

export function countCompletedHabits(
  entry: Pick<HabitEntry, "completions">,
  ctx?: HabitScoreContext
): number {
  const { keys } = resolveHabitScoreContext(ctx);
  return keys.filter((key) => isHabitComplete(entry, key)).length;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: string }).message);
  }
  return fallback;
}

function normalizeDate(date: string): string {
  return date.trim().slice(0, 10);
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeHabitEntry(row: Record<string, unknown>): HabitEntry {
  const completions = buildCompletionsFromRow(row);

  return {
    id: String(row.id ?? ""),
    date: normalizeDate(String(row.date ?? "")),
    completions,
    habit_score: Number(row.habit_score ?? 0),
    notes: (row.notes as string | null) ?? null,
    created_at: String(row.created_at ?? ""),
  };
}

export function buildEmptyCompletions(keys: readonly string[]): Record<string, boolean> {
  return Object.fromEntries(keys.map((key) => [key, false]));
}

export function mergeCompletions(
  base: Record<string, boolean>,
  patch: Record<string, boolean>
): Record<string, boolean> {
  return { ...base, ...patch };
}

function buildHabitPayload(input: HabitInput, habitScore: number) {
  const legacyColumns = buildLegacyColumnsFromCompletions(input.completions);

  return {
    date: normalizeDate(input.date),
    ...legacyColumns,
    completions: input.completions,
    habit_score: habitScore,
    notes: normalizeOptionalText(input.notes),
  };
}

export function calculateHabitScore(
  input: HabitInput,
  ctx?: HabitScoreContext
): number {
  const { keys, total, weightedFields, totalWeight } =
    resolveHabitScoreContext(ctx);

  if (weightedFields.length > 0 && totalWeight > 0) {
    const completedWeight = weightedFields
      .filter((field) => isHabitComplete(input, field.key))
      .reduce((sum, field) => sum + field.weight, 0);
    const score = Math.round((completedWeight / totalWeight) * 100);

    console.log("HABIT SCORE", {
      completedWeight,
      totalWeight,
      score,
    });

    return score;
  }

  if (total === 0) return 0;

  const completed = keys.filter((key) => isHabitComplete(input, key)).length;
  const score = Math.round((completed / total) * 100);

  console.log("HABIT SCORE", { completed, total, score });

  return score;
}

export function calculateBestHabitStreak(
  entries: HabitEntry[],
  ctx?: HabitScoreContext
): number {
  const { streakThreshold } = resolveHabitScoreContext(ctx);
  const qualifying = [...entries]
    .filter((entry) => isQualifyingStreakDay(entry, streakThreshold))
    .sort((a, b) => normalizeDate(a.date).localeCompare(normalizeDate(b.date)));

  if (qualifying.length === 0) return 0;

  let best = 1;
  let current = 1;

  for (let index = 1; index < qualifying.length; index += 1) {
    if (isConsecutiveDay(qualifying[index - 1].date, qualifying[index].date)) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}

export function calculateCurrentHabitStreak(
  entries: HabitEntry[],
  ctx?: HabitScoreContext
): number {
  const { streakThreshold } = resolveHabitScoreContext(ctx);
  const sorted = [...entries].sort((a, b) =>
    normalizeDate(b.date).localeCompare(normalizeDate(a.date))
  );

  if (sorted.length === 0 || !isQualifyingStreakDay(sorted[0], streakThreshold)) {
    return 0;
  }

  let streak = 1;

  for (let index = 1; index < sorted.length; index += 1) {
    const entry = sorted[index];
    if (!isQualifyingStreakDay(entry, streakThreshold)) break;
    if (!isConsecutiveDay(entry.date, sorted[index - 1].date)) break;
    streak += 1;
  }

  return streak;
}

export function getMissedHabitLabels(
  entry: HabitEntry,
  ctx?: HabitScoreContext
): string[] {
  const { keys, fieldLabels } = resolveHabitScoreContext(ctx);

  return keys
    .filter((key) => !isHabitComplete(entry, key))
    .map((key) => getHabitLabel(key, fieldLabels));
}

export function calculateHabitHistorySummary(
  entries: HabitEntry[],
  ctx?: HabitScoreContext
): HabitHistorySummary {
  if (entries.length === 0) {
    return {
      averageScore: 0,
      bestDayScore: 0,
      currentStreak: 0,
      averageCompletedHabits: 0,
    };
  }

  const scores = entries.map((entry) => entry.habit_score);
  const completedCounts = entries.map((entry) => countCompletedHabits(entry, ctx));

  return {
    averageScore: Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    ),
    bestDayScore: Math.max(...scores),
    currentStreak: calculateCurrentHabitStreak(entries, ctx),
    averageCompletedHabits:
      Math.round(
        (completedCounts.reduce((sum, count) => sum + count, 0) /
          completedCounts.length) *
          10
      ) / 10,
  };
}

export function calculateHabitPerformance(
  entries: HabitEntry[],
  ctx?: HabitScoreContext
): HabitPerformanceRow[] {
  if (entries.length === 0) return [];

  const { keys, fieldLabels } = resolveHabitScoreContext(ctx);
  const totalEntries = entries.length;

  return keys
    .map((key) => {
      const completedCount = entries.filter((entry) =>
        isHabitComplete(entry, key)
      ).length;

      return {
        key,
        label: getHabitLabel(key, fieldLabels),
        completionPercent: Math.round((completedCount / totalEntries) * 100),
      };
    })
    .sort((a, b) => b.completionPercent - a.completionPercent);
}

export function calculateHabitDashboardSummary(
  entries: HabitEntry[],
  latest: HabitEntry | null,
  ctx?: HabitScoreContext,
  today = normalizeDate(new Date().toISOString().split("T")[0])
): HabitDashboardSummary | null {
  if (!latest) return null;

  const completedCount = countCompletedHabits(latest, ctx);
  const completedToday =
    normalizeDate(latest.date) === today ? completedCount : 0;

  return {
    latestScore: latest.habit_score,
    completedCount,
    completedToday,
    currentStreak: calculateCurrentHabitStreak(entries, ctx),
    bestStreak: calculateBestHabitStreak(entries, ctx),
    latestDate: latest.date,
  };
}

export async function saveHabitEntry(input: HabitInput): Promise<{
  data: HabitEntry | null;
  error: string | null;
}> {
  if (!input.date.trim()) {
    const error = "Date is required.";
    console.log("HABIT ERROR", error);
    return { data: null, error };
  }

  const habitScoreContext = await getHabitScoreContextFromConfig();
  const habitScore = calculateHabitScore(input, habitScoreContext);
  const payload = buildHabitPayload(input, habitScore);

  try {
    const { data: existing, error: lookupError } = await supabase
      .from("habit_entries")
      .select("id, date")
      .eq("date", payload.date)
      .maybeSingle();

    if (lookupError) {
      console.log("HABIT ERROR", lookupError.message);
      return { data: null, error: lookupError.message };
    }

    if (existing?.id) {
      console.log("HABIT DB WRITE", {
        operation: "update",
        table: "habit_entries",
        id: existing.id,
        date: payload.date,
        payload,
      });

      const { data, error } = await supabase
        .from("habit_entries")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) {
        console.log("HABIT ERROR", error.message);
        return { data: null, error: error.message };
      }

      if (!data) {
        const message =
          "Update failed: no row returned. Check Supabase RLS policies for habit_entries.";
        console.log("HABIT ERROR", message);
        return { data: null, error: message };
      }

      console.log("HABIT UPDATE", data);
      return {
        data: normalizeHabitEntry(data as Record<string, unknown>),
        error: null,
      };
    }

    console.log("HABIT DB WRITE", {
      operation: "insert",
      table: "habit_entries",
      id: null,
      date: payload.date,
      payload,
    });

    const { data, error } = await supabase
      .from("habit_entries")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      console.log("HABIT ERROR", error.message);
      return { data: null, error: error.message };
    }

    if (!data) {
      const message =
        "Insert failed: no row returned. Check Supabase RLS policies for habit_entries.";
      console.log("HABIT ERROR", message);
      return { data: null, error: message };
    }

    console.log("HABIT INSERT", data);
    return {
      data: normalizeHabitEntry(data as Record<string, unknown>),
      error: null,
    };
  } catch (err) {
    const message = getErrorMessage(err, "Failed to save habit entry");
    console.log("HABIT ERROR", message);
    return { data: null, error: message };
  }
}

export async function getHabitEntries(): Promise<{
  data: HabitEntry[] | null;
  error: string | null;
}> {
  try {
    if (typeof window === "undefined") {
      const { unstable_noStore: noStore } = await import("next/cache");
      noStore();
    }

    const { data, error } = await supabase
      .from("habit_entries")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.log("HABIT ERROR", error.message);
      return { data: null, error: error.message };
    }

    const entries = (data ?? []).map((row) =>
      normalizeHabitEntry(row as Record<string, unknown>)
    );
    console.log("HABIT FETCH", { count: entries.length });

    return { data: entries, error: null };
  } catch (err) {
    const message = getErrorMessage(err, "Failed to fetch habit entries");
    console.log("HABIT ERROR", message);
    return { data: null, error: message };
  }
}

export async function getLatestHabitEntry(): Promise<{
  data: HabitEntry | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("habit_entries")
      .select("*")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.log("HABIT ERROR", error.message);
      return { data: null, error: error.message };
    }

    console.log("HABIT FETCH", { latest: data ?? null });

    return {
      data: data
        ? normalizeHabitEntry(data as Record<string, unknown>)
        : null,
      error: null,
    };
  } catch (err) {
    const message = getErrorMessage(err, "Failed to fetch latest habit entry");
    console.log("HABIT ERROR", message);
    return { data: null, error: message };
  }
}

export async function getHabitEntryByDate(date: string): Promise<{
  data: HabitEntry | null;
  error: string | null;
}> {
  const normalizedDate = normalizeDate(date);

  if (!normalizedDate) {
    console.log("HABIT ERROR", "Date is required.");
    return { data: null, error: "Date is required." };
  }

  console.log("HABIT FETCH BY DATE", { date: normalizedDate });

  try {
    const { data, error } = await supabase
      .from("habit_entries")
      .select("*")
      .eq("date", normalizedDate)
      .maybeSingle();

    if (error) {
      console.log("HABIT ERROR", error.message);
      return { data: null, error: error.message };
    }

    const entry = data
      ? normalizeHabitEntry(data as Record<string, unknown>)
      : null;

    console.log("HABIT FETCH BY DATE", {
      date: normalizedDate,
      found: entry != null,
      habitScore: entry?.habit_score ?? null,
    });

    return { data: entry, error: null };
  } catch (err) {
    const message = getErrorMessage(err, "Failed to fetch habit entry");
    console.log("HABIT ERROR", message);
    return { data: null, error: message };
  }
}

export async function getHabitHistory(): Promise<{
  data: HabitEntry[];
  error: string | null;
}> {
  console.log("HABIT HISTORY FETCH START", { table: "habit_entries" });

  try {
    const { data, error } = await supabase
      .from("habit_entries")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("HABIT HISTORY FETCH ERROR", error.message);
      return { data: [], error: error.message };
    }

    const entries = (data ?? []).map((row) =>
      normalizeHabitEntry(row as Record<string, unknown>)
    );

    console.log("HABIT HISTORY FETCH SUCCESS", {
      table: "habit_entries",
      count: entries.length,
    });

    return { data: entries, error: null };
  } catch (err) {
    const message = getErrorMessage(err, "Failed to fetch habit history");
    console.error("HABIT HISTORY FETCH ERROR", message);
    return { data: [], error: message };
  }
}

export async function deleteHabitEntry(id: string): Promise<{
  error: string | null;
}> {
  try {
    const { error } = await supabase.from("habit_entries").delete().eq("id", id);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return {
      error: getErrorMessage(err, "Failed to delete habit entry"),
    };
  }
}

export async function getHabitDashboardData(
  visibility: "public" | "scoring" = "public"
): Promise<{
  latest: HabitEntry | null;
  entries: HabitEntry[];
  summary: HabitDashboardSummary | null;
  habitEngine: import("@/lib/habitConfig").HabitEngineContext;
  error: string | null;
}> {
  const { buildHabitEngineContext, toHabitScoreContext } = await import(
    "@/lib/habitConfig"
  );
  const { resolveAiConfig } = await import("@/lib/aiSettingsConfig");
  const config = await getConfig();
  const filter = visibility === "public" ? "public" : "scoring";
  const habitEngine = buildHabitEngineContext(
    config,
    resolveAiConfig(config),
    filter
  );
  const habitScoreContext = toHabitScoreContext(habitEngine);
  const { data, error } = await getHabitEntries();

  if (error) {
    return {
      latest: null,
      entries: [],
      summary: null,
      habitEngine,
      error,
    };
  }

  const entries = data ?? [];

  if (entries.length === 0) {
    return {
      latest: null,
      entries: [],
      summary: null,
      habitEngine,
      error: null,
    };
  }

  const latest = entries[0];
  const summary = calculateHabitDashboardSummary(
    entries,
    latest,
    habitScoreContext
  );

  return { latest, entries, summary, habitEngine, error: null };
}

/** @deprecated Use entry.completions[key] */
export function getLegacyCompletion(
  entry: HabitEntry,
  key: string
): boolean {
  return entry.completions[key] ?? false;
}

export { ALL_LEGACY_HABIT_COLUMNS };
