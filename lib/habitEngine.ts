import type { HabitConfigItem, HabitCategory } from "@/lib/settings";

export const CORE_HABIT_IDS = [
  "workout",
  "steps",
  "diet",
  "sleep",
  "water",
] as const;

export type CoreHabitId = (typeof CORE_HABIT_IDS)[number];

/** Maps new core habit ids to legacy boolean columns for history compatibility. */
export const HABIT_ID_TO_LEGACY_COLUMN: Record<CoreHabitId, string> = {
  workout: "gym_done",
  steps: "steps_done",
  diet: "protein_target_done",
  sleep: "sleep_before_11_done",
  water: "water_target_done",
};

export const LEGACY_COLUMN_TO_HABIT_ID: Record<string, string> = Object.fromEntries(
  Object.entries(HABIT_ID_TO_LEGACY_COLUMN).map(([id, column]) => [column, id])
);

export const ALL_LEGACY_HABIT_COLUMNS = [
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

export type LegacyHabitColumn = (typeof ALL_LEGACY_HABIT_COLUMNS)[number];

const LEGACY_ID_MIGRATION: Record<string, string> = {
  gym_done: "workout",
  steps_done: "steps",
  protein_target_done: "diet",
  sleep_before_11_done: "sleep",
  water_target_done: "water",
};

export function slugifyHabitName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

export function getDefaultCoreHabits(): HabitConfigItem[] {
  return [
    {
      id: "workout",
      name: "Workout",
      category: "Fitness",
      weight: 1,
      type: "core",
      locked: true,
      enabled: true,
      public_visible: true,
      show_in_checkin: true,
    },
    {
      id: "steps",
      name: "Steps",
      category: "Fitness",
      weight: 1,
      type: "core",
      locked: true,
      enabled: true,
      public_visible: true,
      show_in_checkin: true,
    },
    {
      id: "diet",
      name: "Diet",
      category: "Fitness",
      weight: 1,
      type: "core",
      locked: true,
      enabled: true,
      public_visible: true,
      show_in_checkin: true,
    },
    {
      id: "sleep",
      name: "Sleep",
      category: "Discipline",
      weight: 1,
      type: "core",
      locked: true,
      enabled: true,
      public_visible: true,
      show_in_checkin: true,
    },
    {
      id: "water",
      name: "Water",
      category: "Fitness",
      weight: 1,
      type: "core",
      locked: true,
      enabled: true,
      public_visible: true,
      show_in_checkin: true,
    },
  ];
}

export function migrateLegacyHabitId(id: string): string {
  return LEGACY_ID_MIGRATION[id] ?? id;
}

export function isCoreHabitId(id: string): id is CoreHabitId {
  return CORE_HABIT_IDS.includes(id as CoreHabitId);
}

export function normalizeHabitConfigItem(
  item: unknown,
  fallbackId: string
): HabitConfigItem | null {
  if (typeof item !== "object" || item === null) {
    return null;
  }

  const record = item as Record<string, unknown>;
  const rawId =
    typeof record.id === "string" && record.id.trim()
      ? migrateLegacyHabitId(record.id.trim())
      : fallbackId;
  const id = rawId;
  const name =
    typeof record.name === "string" && record.name.trim()
      ? record.name.trim()
      : "Unnamed habit";
  const category = normalizeCategory(record.category);
  const weight =
    typeof record.weight === "number" && record.weight > 0 ? record.weight : 1;
  const type: HabitConfigItem["type"] =
    record.type === "custom" || record.type === "core"
      ? record.type
      : isCoreHabitId(id)
        ? "core"
        : "custom";
  const locked =
    typeof record.locked === "boolean" ? record.locked : type === "core";
  const enabled = record.enabled !== false;
  const public_visible =
    typeof record.public_visible === "boolean" ? record.public_visible : true;
  const show_in_checkin =
    typeof record.show_in_checkin === "boolean"
      ? record.show_in_checkin
      : true;

  return {
    id,
    name,
    category,
    weight,
    type,
    locked,
    enabled,
    public_visible,
    show_in_checkin,
  };
}

function normalizeCategory(value: unknown): HabitCategory {
  const categories: HabitCategory[] = [
    "Fitness",
    "Mind",
    "Career",
    "Discipline",
    "Social",
  ];
  if (typeof value === "string" && categories.includes(value as HabitCategory)) {
    return value as HabitCategory;
  }
  return "Fitness";
}

export function ensureUniqueHabitId(
  id: string,
  existingIds: Set<string>
): string {
  if (!existingIds.has(id)) return id;

  let suffix = 2;
  let candidate = `${id}_${suffix}`;
  while (existingIds.has(candidate)) {
    suffix += 1;
    candidate = `${id}_${suffix}`;
  }
  return candidate;
}

export function buildCompletionsFromRow(
  row: Record<string, unknown>
): Record<string, boolean> {
  const completions: Record<string, boolean> = {};

  for (const column of ALL_LEGACY_HABIT_COLUMNS) {
    const value = row[column];
    if (typeof value === "boolean") {
      completions[column] = value;
      const mappedId = LEGACY_COLUMN_TO_HABIT_ID[column];
      if (mappedId) {
        completions[mappedId] = value;
      }
    }
  }

  const jsonCompletions = row.completions;
  if (jsonCompletions && typeof jsonCompletions === "object") {
    for (const [key, value] of Object.entries(
      jsonCompletions as Record<string, unknown>
    )) {
      if (typeof value === "boolean") {
        completions[key] = value;
      }
    }
  }

  return completions;
}

export function buildLegacyColumnsFromCompletions(
  completions: Record<string, boolean>
): Record<LegacyHabitColumn, boolean> {
  const columns = {} as Record<LegacyHabitColumn, boolean>;

  for (const column of ALL_LEGACY_HABIT_COLUMNS) {
    const mappedId = LEGACY_COLUMN_TO_HABIT_ID[column];
    columns[column] =
      completions[column] ??
      (mappedId ? completions[mappedId] : false) ??
      false;
  }

  return columns;
}
