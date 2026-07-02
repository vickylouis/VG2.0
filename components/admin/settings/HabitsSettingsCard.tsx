"use client";

import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  displaySettingValue,
  settingsCardClassName,
  settingsEditButtonClassName,
  settingsInputClassName,
  settingsLabelClassName,
  settingsPrimaryButtonClassName,
  settingsSecondaryButtonClassName,
} from "@/components/admin/settings/settingsStyles";
import {
  createCustomHabit,
  fromHabitFormItems,
  resolveSettingsHabits,
  toHabitFormItems,
  validateHabitConfig,
  type HabitFormItem,
} from "@/lib/habitConfig";
import {
  HABIT_CATEGORIES,
  updateAppSettingsHabits,
  type AppSettingsConfig,
  type HabitCategory,
} from "@/lib/settings";
import { cn } from "@/lib/utils";

type HabitsSettingsCardProps = {
  settingsId: string;
  habits: AppSettingsConfig["habits"];
};

type AddHabitForm = {
  name: string;
  category: HabitCategory;
  weight: string;
  public_visible: boolean;
  show_in_checkin: boolean;
};

const emptyAddForm = (): AddHabitForm => ({
  name: "",
  category: "Fitness",
  weight: "1",
  public_visible: true,
  show_in_checkin: true,
});

function EnabledToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5">
      <span className="text-sm text-[#A3A3A3]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full border transition-all duration-300",
          checked
            ? "border-[#D4AF37]/50 bg-[#D4AF37]/25"
            : "border-[#D4AF37]/20 bg-[#0B0B0B]/80"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full transition-all duration-300",
            checked
              ? "left-[calc(100%-1.375rem)] bg-[#D4AF37]"
              : "left-0.5 bg-[#A3A3A3]"
          )}
        />
      </button>
    </label>
  );
}

export default function HabitsSettingsCard({
  settingsId,
  habits,
}: HabitsSettingsCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddHabitForm>(emptyAddForm);
  const [displayHabits, setDisplayHabits] = useState(() =>
    resolveSettingsHabits(habits)
  );
  const [form, setForm] = useState<HabitFormItem[]>(() =>
    toHabitFormItems(resolveSettingsHabits(habits))
  );

  const enabledCount = displayHabits.filter((habit) => habit.enabled).length;
  const archivedCount = displayHabits.filter((habit) => !habit.enabled).length;

  function handleEdit() {
    setForm(toHabitFormItems(displayHabits));
    setIsEditing(true);
  }

  function handleCancel() {
    setForm(toHabitFormItems(displayHabits));
    setIsEditing(false);
    setShowAddModal(false);
  }

  function updateHabit(index: number, patch: Partial<HabitFormItem>) {
    setForm((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    );
  }

  function handleArchive(index: number) {
    const habit = form[index];
    if (habit?.locked) {
      toast.error("Core habits cannot be archived.");
      return;
    }
    updateHabit(index, { enabled: false });
  }

  function handleRestore(index: number) {
    updateHabit(index, { enabled: true });
  }

  function handleAddHabit() {
    const weight = Number(addForm.weight);
    if (!addForm.name.trim()) {
      toast.error("Habit name is required.");
      return;
    }
    if (Number.isNaN(weight) || weight <= 0) {
      toast.error("Weight must be a positive number.");
      return;
    }

    const existingIds = new Set(form.map((item) => item.id));
    const custom = createCustomHabit(
      addForm.name,
      addForm.category,
      weight,
      addForm.public_visible,
      addForm.show_in_checkin,
      existingIds
    );

    setForm((prev) => [...prev, ...toHabitFormItems([custom])]);
    setAddForm(emptyAddForm());
    setShowAddModal(false);
    toast.success(`Added habit "${custom.name}"`);
  }

  async function handleSave() {
    const payload = fromHabitFormItems(form);
    const validationError = validateHabitConfig(payload);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSaving(true);

    const { data, error } = await updateAppSettingsHabits(settingsId, payload);

    setIsSaving(false);

    if (error) {
      toast.error(error);
      return;
    }

    const savedHabits = resolveSettingsHabits(data?.config?.habits ?? payload);
    setDisplayHabits(savedHabits);
    setForm(toHabitFormItems(savedHabits));
    setIsEditing(false);
    setShowAddModal(false);
    toast.success("Habit settings updated");
    router.refresh();
  }

  return (
    <article className={cn(settingsCardClassName, "md:col-span-2")}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
            <ListChecks className="size-5 text-[#D4AF37]" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#F5F5F5]">Habits</h2>
            <p className="mt-0.5 text-sm text-[#A3A3A3]">
              {displayHabits.length} configured · {enabledCount} enabled ·{" "}
              {archivedCount} archived
            </p>
          </div>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={handleEdit}
            className={settingsEditButtonClassName}
          >
            <span className="inline-flex items-center gap-2">
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </span>
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-end">
            <button
              type="button"
              onClick={() => setShowAddModal((open) => !open)}
              className={settingsSecondaryButtonClassName}
            >
              <span className="inline-flex items-center gap-2">
                <Plus className="size-3.5" aria-hidden />
                Add custom habit
              </span>
            </button>
          </div>

          {showAddModal && (
            <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/5 p-4 sm:p-5">
              <h3 className="mb-4 text-sm font-semibold text-[#D4AF37]">
                New custom habit
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={settingsLabelClassName}>Name</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(event) =>
                      setAddForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className={settingsInputClassName}
                    placeholder="Cold Shower"
                  />
                </div>
                <div>
                  <label className={settingsLabelClassName}>Category</label>
                  <select
                    value={addForm.category}
                    onChange={(event) =>
                      setAddForm((prev) => ({
                        ...prev,
                        category: event.target.value as HabitCategory,
                      }))
                    }
                    className={settingsInputClassName}
                  >
                    {HABIT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={settingsLabelClassName}>Weight</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={addForm.weight}
                    onChange={(event) =>
                      setAddForm((prev) => ({
                        ...prev,
                        weight: event.target.value,
                      }))
                    }
                    className={settingsInputClassName}
                  />
                </div>
                <div className="flex flex-wrap gap-4 sm:col-span-2">
                  <EnabledToggle
                    label="Public visible"
                    checked={addForm.public_visible}
                    onChange={(public_visible) =>
                      setAddForm((prev) => ({ ...prev, public_visible }))
                    }
                  />
                  <EnabledToggle
                    label="Show in check-in"
                    checked={addForm.show_in_checkin}
                    onChange={(show_in_checkin) =>
                      setAddForm((prev) => ({ ...prev, show_in_checkin }))
                    }
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={settingsSecondaryButtonClassName}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddHabit}
                  className={settingsPrimaryButtonClassName}
                >
                  Add habit
                </button>
              </div>
            </div>
          )}

          {form.map((habit, index) => (
            <div
              key={habit.id}
              className={cn(
                "rounded-2xl border p-4 sm:p-5",
                habit.enabled
                  ? "border-[#D4AF37]/15 bg-[#0B0B0B]/50"
                  : "border-[#A3A3A3]/15 bg-[#171717]/40 opacity-80"
              )}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-xs font-medium text-[#D4AF37]">
                    {habit.id}
                  </span>
                  <span className="rounded-full border border-[#D4AF37]/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#A3A3A3]">
                    {habit.type}
                  </span>
                  {!habit.enabled && (
                    <span className="rounded-full border border-[#A3A3A3]/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#A3A3A3]">
                      Archived
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {habit.enabled ? (
                    <button
                      type="button"
                      onClick={() => handleArchive(index)}
                      disabled={habit.locked}
                      className={settingsSecondaryButtonClassName}
                      title={
                        habit.locked
                          ? "Core habits cannot be archived"
                          : "Archive habit"
                      }
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Archive className="size-3.5" aria-hidden />
                        Archive
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRestore(index)}
                      className={settingsSecondaryButtonClassName}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <ArchiveRestore className="size-3.5" aria-hidden />
                        Restore
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className={settingsLabelClassName}>Name</label>
                  <input
                    type="text"
                    value={habit.name}
                    onChange={(event) =>
                      updateHabit(index, { name: event.target.value })
                    }
                    className={settingsInputClassName}
                  />
                </div>
                <div>
                  <label className={settingsLabelClassName}>Category</label>
                  <select
                    value={habit.category}
                    onChange={(event) =>
                      updateHabit(index, {
                        category: event.target.value as HabitFormItem["category"],
                      })
                    }
                    className={settingsInputClassName}
                  >
                    {HABIT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={settingsLabelClassName}>Weight</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={habit.weight}
                    onChange={(event) =>
                      updateHabit(index, { weight: event.target.value })
                    }
                    className={settingsInputClassName}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-4">
                <EnabledToggle
                  label="Public visible"
                  checked={habit.public_visible}
                  onChange={(public_visible) =>
                    updateHabit(index, { public_visible })
                  }
                />
                <EnabledToggle
                  label="Show in check-in"
                  checked={habit.show_in_checkin}
                  onChange={(show_in_checkin) =>
                    updateHabit(index, { show_in_checkin })
                  }
                />
              </div>
            </div>
          ))}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className={settingsSecondaryButtonClassName}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={settingsPrimaryButtonClassName}
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Saving…
                </span>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#D4AF37]/15 text-xs tracking-[0.15em] text-[#A3A3A3] uppercase">
                <th className="px-3 py-3 font-medium">ID</th>
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Category</th>
                <th className="px-3 py-3 font-medium">Weight</th>
                <th className="px-3 py-3 font-medium">Public</th>
                <th className="px-3 py-3 font-medium">Check-in</th>
                <th className="px-3 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayHabits.map((habit) => (
                <tr
                  key={habit.id}
                  className="border-b border-[#D4AF37]/10 last:border-b-0"
                >
                  <td className="px-3 py-3 font-mono text-xs text-[#D4AF37]/80">
                    {habit.id}
                  </td>
                  <td className="px-3 py-3 font-medium text-[#F5F5F5]">
                    {habit.name}
                  </td>
                  <td className="px-3 py-3 text-[#F5F5F5]">{habit.type}</td>
                  <td className="px-3 py-3 text-[#F5F5F5]">{habit.category}</td>
                  <td className="px-3 py-3 text-[#F5F5F5]">{habit.weight}</td>
                  <td className="px-3 py-3 text-[#F5F5F5]">
                    {displaySettingValue(habit.public_visible)}
                  </td>
                  <td className="px-3 py-3 text-[#F5F5F5]">
                    {displaySettingValue(habit.show_in_checkin)}
                  </td>
                  <td className="px-3 py-3 text-[#F5F5F5]">
                    {habit.enabled ? "Active" : "Archived"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
