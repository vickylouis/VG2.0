import { resolveAiConfig } from "@/lib/aiSettingsConfig";
import {
  ensureUniqueHabitId,
  getDefaultCoreHabits,
  isCoreHabitId,
  migrateLegacyHabitId,
  normalizeHabitConfigItem,
  slugifyHabitName,
} from "@/lib/habitEngine";
import type { HabitScoreContext } from "@/lib/habit";
import {
  HABIT_CATEGORIES,
  type AppSettingsConfig,
  type HabitCategory,
  type HabitConfigItem,
} from "@/lib/settings";
import type { AiCoachConfig } from "@/lib/settings";

export type HabitFieldDefinition = {
  key: string;
  label: string;
};

export type HabitFieldGroup = {
  title: string;
  fields: HabitFieldDefinition[];
};

export type EnabledHabitField = {
  key: string;
  label: string;
  category: HabitCategory;
  weight: number;
  type: HabitConfigItem["type"];
  locked: boolean;
  public_visible: boolean;
  show_in_checkin: boolean;
};

export type HabitEngineFilter = "scoring" | "checkin" | "public";

export type HabitEngineContext = {
  allHabits: HabitConfigItem[];
  enabledFields: EnabledHabitField[];
  enabledKeys: string[];
  enabledCount: number;
  streakThreshold: number;
  groups: HabitFieldGroup[];
};

function matchesFilter(
  habit: HabitConfigItem,
  filter: HabitEngineFilter
): boolean {
  if (!habit.enabled) return false;

  switch (filter) {
    case "scoring":
      return true;
    case "checkin":
      return habit.show_in_checkin;
    case "public":
      return habit.public_visible;
  }
}

function mergeCoreAndCustomHabits(habits: HabitConfigItem[]): HabitConfigItem[] {
  const coreDefaults = getDefaultCoreHabits();
  const byId = new Map<string, HabitConfigItem>();

  for (const core of coreDefaults) {
    byId.set(core.id, { ...core });
  }

  for (const habit of habits) {
    const migratedId = migrateLegacyHabitId(habit.id);
    const existing = byId.get(migratedId);

    if (existing && isCoreHabitId(migratedId)) {
      byId.set(migratedId, {
        ...existing,
        ...habit,
        id: migratedId,
        type: "core",
        locked: true,
      });
      continue;
    }

    byId.set(habit.id, habit);
  }

  return Array.from(byId.values());
}

export function getDefaultHabitConfig(): HabitConfigItem[] {
  return getDefaultCoreHabits();
}

export function resolveSettingsHabits(
  habits: AppSettingsConfig["habits"] | unknown
): HabitConfigItem[] {
  if (Array.isArray(habits) && habits.length > 0) {
    const normalized = habits
      .map((item, index) =>
        normalizeHabitConfigItem(item, `habit_${index + 1}`)
      )
      .filter((item): item is HabitConfigItem => item != null);

    if (normalized.length > 0) {
      return mergeCoreAndCustomHabits(normalized);
    }
  }

  if (typeof habits === "object" && habits !== null && "items" in habits) {
    const legacyItems = (habits as { items?: unknown }).items;
    const defaults = getDefaultCoreHabits();

    if (Array.isArray(legacyItems) && legacyItems.length > 0) {
      return defaults.map((habit, index) => {
        const legacyItem = legacyItems[index];
        if (typeof legacyItem !== "object" || legacyItem === null) {
          return habit;
        }

        const enabled =
          "enabled" in legacyItem
            ? (legacyItem as { enabled?: boolean }).enabled !== false
            : habit.enabled;

        return { ...habit, enabled };
      });
    }
  }

  return getDefaultCoreHabits();
}

export function buildHabitEngineContext(
  config: AppSettingsConfig | null | undefined,
  ai?: AiCoachConfig,
  filter: HabitEngineFilter = "scoring"
): HabitEngineContext {
  const resolvedAi = ai ?? resolveAiConfig(config);
  const allHabits = resolveSettingsHabits(config?.habits);

  const enabledFields = allHabits
    .filter((habit) => matchesFilter(habit, filter))
    .map((habit) => ({
      key: habit.id,
      label: habit.name,
      category: habit.category,
      weight: habit.weight,
      type: habit.type,
      locked: habit.locked,
      public_visible: habit.public_visible,
      show_in_checkin: habit.show_in_checkin,
    }));

  const groups = HABIT_CATEGORIES.map((category) => ({
    title: category,
    fields: enabledFields
      .filter((field) => field.category === category)
      .map((field) => ({
        key: field.key,
        label: field.label,
      })),
  })).filter((group) => group.fields.length > 0);

  console.log("HABIT ENGINE APPLIED", {
    filter,
    totalHabits: allHabits.length,
    enabledCount: enabledFields.length,
    streakThreshold: resolvedAi.good_habit_threshold,
  });

  return {
    allHabits,
    enabledFields,
    enabledKeys: enabledFields.map((field) => field.key),
    enabledCount: enabledFields.length,
    streakThreshold: resolvedAi.good_habit_threshold,
    groups,
  };
}

export function validateHabitConfig(habits: HabitConfigItem[]): string | null {
  const activeHabits = habits.filter((habit) => habit.enabled);
  if (activeHabits.length === 0) {
    return "At least one enabled habit is required.";
  }

  const ids = new Set<string>();

  for (const habit of habits) {
    if (!habit.id.trim()) {
      return "Each habit must have an id.";
    }

    if (ids.has(habit.id)) {
      return `Duplicate habit id: ${habit.id}`;
    }
    ids.add(habit.id);

    if (!habit.name.trim()) {
      return "Each habit must have a name.";
    }

    if (!HABIT_CATEGORIES.includes(habit.category)) {
      return `Invalid category for habit "${habit.name}".`;
    }

    if (!Number.isFinite(habit.weight) || habit.weight <= 0) {
      return `Weight must be a positive number for "${habit.name}".`;
    }

    if (habit.type === "core" && !isCoreHabitId(habit.id)) {
      return `Core habit "${habit.name}" has invalid id.`;
    }
  }

  return null;
}

export type HabitFormItem = {
  id: string;
  name: string;
  category: HabitCategory;
  weight: string;
  type: HabitConfigItem["type"];
  locked: boolean;
  enabled: boolean;
  public_visible: boolean;
  show_in_checkin: boolean;
};

export function toHabitFormItems(habits: HabitConfigItem[]): HabitFormItem[] {
  return habits.map((habit) => ({
    id: habit.id,
    name: habit.name,
    category: habit.category,
    weight: String(habit.weight),
    type: habit.type,
    locked: habit.locked,
    enabled: habit.enabled,
    public_visible: habit.public_visible,
    show_in_checkin: habit.show_in_checkin,
  }));
}

export function fromHabitFormItems(items: HabitFormItem[]): HabitConfigItem[] {
  return items.map((item) => ({
    id: item.id.trim(),
    name: item.name.trim(),
    category: item.category,
    weight: Number(item.weight),
    type: item.type,
    locked: item.locked,
    enabled: item.enabled,
    public_visible: item.public_visible,
    show_in_checkin: item.show_in_checkin,
  }));
}

export function createCustomHabit(
  name: string,
  category: HabitCategory,
  weight: number,
  public_visible: boolean,
  show_in_checkin: boolean,
  existingIds: Set<string>
): HabitConfigItem {
  const baseId = slugifyHabitName(name) || "custom_habit";
  const id = ensureUniqueHabitId(baseId, existingIds);

  return {
    id,
    name: name.trim(),
    category,
    weight,
    type: "custom",
    locked: false,
    enabled: true,
    public_visible,
    show_in_checkin,
  };
}

export function archiveHabit(habit: HabitConfigItem): HabitConfigItem {
  return { ...habit, enabled: false };
}

export function restoreHabit(habit: HabitConfigItem): HabitConfigItem {
  return { ...habit, enabled: true };
}

export function toHabitScoreContext(engine: HabitEngineContext): HabitScoreContext {
  const totalWeight = engine.enabledFields.reduce(
    (sum, field) => sum + field.weight,
    0
  );

  return {
    enabledKeys: engine.enabledKeys,
    total: engine.enabledCount,
    streakThreshold: engine.streakThreshold,
    weightedFields: engine.enabledFields.map((field) => ({
      key: field.key,
      weight: field.weight,
    })),
    totalWeight,
    fieldLabels: Object.fromEntries(
      engine.enabledFields.map((field) => [field.key, field.label])
    ),
  };
}

export { slugifyHabitName, ensureUniqueHabitId };
