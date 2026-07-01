import { supabase } from "@/lib/supabase";

export type HabitEntry = {
  id: string;
  date: string;

  gym_done: boolean;
  steps_done: boolean;
  protein_target_done: boolean;
  water_target_done: boolean;
  sleep_before_11_done: boolean;

  reading_done: boolean;
  english_practice_done: boolean;
  automation_learning_done: boolean;
  mma_done: boolean;

  no_junk_food_done: boolean;
  family_time_done: boolean;

  habit_score: number;
  notes: string | null;
  created_at: string;
};

export type HabitInput = Omit<HabitEntry, "id" | "habit_score" | "created_at">;

export const HABIT_TOTAL = 11;

export const HABIT_STREAK_THRESHOLD = 70;

const HABIT_BOOLEAN_KEYS = [
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
] as const satisfies ReadonlyArray<keyof HabitInput>;

export type HabitFieldDefinition = {
  key: (typeof HABIT_BOOLEAN_KEYS)[number];
  label: string;
};

export type HabitFieldGroup = {
  title: string;
  fields: HabitFieldDefinition[];
};

export const HABIT_FIELD_GROUPS: HabitFieldGroup[] = [
  {
    title: "Health",
    fields: [
      { key: "gym_done", label: "Gym completed" },
      { key: "steps_done", label: "8,000+ steps" },
      { key: "protein_target_done", label: "Protein target hit" },
      { key: "water_target_done", label: "Water target hit" },
      { key: "sleep_before_11_done", label: "Sleep before 11 PM" },
    ],
  },
  {
    title: "Growth",
    fields: [
      { key: "reading_done", label: "Reading session" },
      { key: "english_practice_done", label: "English practice" },
      { key: "automation_learning_done", label: "Automation learning" },
      { key: "mma_done", label: "MMA training" },
    ],
  },
  {
    title: "Discipline",
    fields: [
      { key: "no_junk_food_done", label: "No junk food" },
      { key: "family_time_done", label: "Family time" },
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
  key: HabitFieldDefinition["key"];
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

const HABIT_TOTAL_INTERNAL = HABIT_TOTAL;

function parseDateOnly(value: string): Date {
  return new Date(`${normalizeDate(value)}T00:00:00`);
}

function isConsecutiveDay(previousDate: string, nextDate: string): boolean {
  const previous = parseDateOnly(previousDate);
  const next = parseDateOnly(nextDate);
  const dayMs = 24 * 60 * 60 * 1000;
  return next.getTime() - previous.getTime() === dayMs;
}

function isQualifyingStreakDay(entry: HabitEntry): boolean {
  return entry.habit_score >= HABIT_STREAK_THRESHOLD;
}

export function countCompletedHabits(entry: HabitEntry): number {
  return HABIT_BOOLEAN_KEYS.filter((key) => entry[key]).length;
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

function buildHabitPayload(input: HabitInput, habitScore: number) {
  return {
    date: normalizeDate(input.date),
    gym_done: input.gym_done,
    steps_done: input.steps_done,
    protein_target_done: input.protein_target_done,
    water_target_done: input.water_target_done,
    sleep_before_11_done: input.sleep_before_11_done,
    reading_done: input.reading_done,
    english_practice_done: input.english_practice_done,
    automation_learning_done: input.automation_learning_done,
    mma_done: input.mma_done,
    no_junk_food_done: input.no_junk_food_done,
    family_time_done: input.family_time_done,
    habit_score: habitScore,
    notes: normalizeOptionalText(input.notes),
  };
}

export function calculateHabitScore(input: HabitInput): number {
  const completed = HABIT_BOOLEAN_KEYS.filter((key) => input[key]).length;
  const score = Math.round((completed / HABIT_TOTAL_INTERNAL) * 100);

  console.log("HABIT SCORE", { completed, total: HABIT_TOTAL_INTERNAL, score });

  return score;
}

export function calculateBestHabitStreak(entries: HabitEntry[]): number {
  const qualifying = [...entries]
    .filter(isQualifyingStreakDay)
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

export function calculateCurrentHabitStreak(entries: HabitEntry[]): number {
  const sorted = [...entries].sort((a, b) =>
    normalizeDate(b.date).localeCompare(normalizeDate(a.date))
  );

  if (sorted.length === 0 || !isQualifyingStreakDay(sorted[0])) {
    return 0;
  }

  let streak = 1;

  for (let index = 1; index < sorted.length; index += 1) {
    const entry = sorted[index];
    if (!isQualifyingStreakDay(entry)) break;
    if (!isConsecutiveDay(entry.date, sorted[index - 1].date)) break;
    streak += 1;
  }

  return streak;
}

export function getMissedHabitLabels(entry: HabitEntry): string[] {
  return HABIT_FIELDS.filter((field) => !entry[field.key]).map(
    (field) => field.label
  );
}

export function calculateHabitHistorySummary(
  entries: HabitEntry[]
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
  const completedCounts = entries.map(countCompletedHabits);

  return {
    averageScore: Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    ),
    bestDayScore: Math.max(...scores),
    currentStreak: calculateCurrentHabitStreak(entries),
    averageCompletedHabits:
      Math.round(
        (completedCounts.reduce((sum, count) => sum + count, 0) /
          completedCounts.length) *
          10
      ) / 10,
  };
}

export function calculateHabitPerformance(
  entries: HabitEntry[]
): HabitPerformanceRow[] {
  if (entries.length === 0) return [];

  const totalEntries = entries.length;

  return HABIT_FIELDS.map((field) => {
    const completedCount = entries.filter((entry) => entry[field.key]).length;

    return {
      key: field.key,
      label: field.label,
      completionPercent: Math.round((completedCount / totalEntries) * 100),
    };
  }).sort((a, b) => b.completionPercent - a.completionPercent);
}

export function calculateHabitDashboardSummary(
  entries: HabitEntry[],
  latest: HabitEntry | null,
  today = normalizeDate(new Date().toISOString().split("T")[0])
): HabitDashboardSummary | null {
  if (!latest) return null;

  const completedCount = countCompletedHabits(latest);
  const completedToday =
    normalizeDate(latest.date) === today ? completedCount : 0;

  return {
    latestScore: latest.habit_score,
    completedCount,
    completedToday,
    currentStreak: calculateCurrentHabitStreak(entries),
    bestStreak: calculateBestHabitStreak(entries),
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

  const habitScore = calculateHabitScore(input);
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
      const { data, error } = await supabase
        .from("habit_entries")
        .update({
          gym_done: payload.gym_done,
          steps_done: payload.steps_done,
          protein_target_done: payload.protein_target_done,
          water_target_done: payload.water_target_done,
          sleep_before_11_done: payload.sleep_before_11_done,
          reading_done: payload.reading_done,
          english_practice_done: payload.english_practice_done,
          automation_learning_done: payload.automation_learning_done,
          mma_done: payload.mma_done,
          no_junk_food_done: payload.no_junk_food_done,
          family_time_done: payload.family_time_done,
          habit_score: payload.habit_score,
          notes: payload.notes,
        })
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
      return { data: data as HabitEntry, error: null };
    }

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
    return { data: data as HabitEntry, error: null };
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
    const { data, error } = await supabase
      .from("habit_entries")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.log("HABIT ERROR", error.message);
      return { data: null, error: error.message };
    }

    const entries = (data ?? []) as HabitEntry[];
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

    return { data: (data as HabitEntry | null) ?? null, error: null };
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

    const entry = (data as HabitEntry | null) ?? null;

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

    const entries = (data ?? []).map((row) => ({
      ...(row as HabitEntry),
      date: normalizeDate(String(row.date)),
    }));

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

export async function getHabitDashboardData(): Promise<{
  latest: HabitEntry | null;
  entries: HabitEntry[];
  summary: HabitDashboardSummary | null;
  error: string | null;
}> {
  const { data, error } = await getHabitEntries();

  if (error) {
    return { latest: null, entries: [], summary: null, error };
  }

  const entries = data ?? [];

  if (entries.length === 0) {
    return { latest: null, entries: [], summary: null, error: null };
  }

  const latest = entries[0];
  const summary = calculateHabitDashboardSummary(entries, latest);

  return { latest, entries, summary, error: null };
}
