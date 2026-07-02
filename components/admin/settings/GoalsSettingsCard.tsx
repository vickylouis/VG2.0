"use client";

import { useState } from "react";
import { Gauge, Loader2, Pencil } from "lucide-react";
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
  updateAppSettingsGoals,
  type AppSettingsConfig,
  type GoalsSettingsInput,
} from "@/lib/settings";

type GoalsFormState = {
  target_weight: string;
  target_waist: string;
  target_body_fat: string;
  target_daily_steps: string;
  target_sleep_hours: string;
  target_water_liters: string;
};

type GoalsSettingsCardProps = {
  settingsId: string;
  goals: AppSettingsConfig["goals"];
};

function toGoalsForm(goals: AppSettingsConfig["goals"]): GoalsFormState {
  return {
    target_weight:
      goals?.target_weight != null ? String(goals.target_weight) : "",
    target_waist:
      goals?.target_waist != null ? String(goals.target_waist) : "",
    target_body_fat:
      goals?.target_body_fat != null ? String(goals.target_body_fat) : "",
    target_daily_steps:
      goals?.target_daily_steps != null
        ? String(goals.target_daily_steps)
        : "",
    target_sleep_hours:
      goals?.target_sleep_hours != null
        ? String(goals.target_sleep_hours)
        : "",
    target_water_liters:
      goals?.target_water_liters != null
        ? String(goals.target_water_liters)
        : "",
  };
}

function validateGoalsForm(form: GoalsFormState): string | null {
  const targetWeight = Number(form.target_weight);
  if (
    !form.target_weight.trim() ||
    Number.isNaN(targetWeight) ||
    targetWeight <= 0
  ) {
    return "Target weight must be greater than 0.";
  }

  const targetWaist = Number(form.target_waist);
  if (
    !form.target_waist.trim() ||
    Number.isNaN(targetWaist) ||
    targetWaist <= 0
  ) {
    return "Target waist must be greater than 0.";
  }

  const targetBodyFat = Number(form.target_body_fat);
  if (
    !form.target_body_fat.trim() ||
    Number.isNaN(targetBodyFat) ||
    targetBodyFat < 1 ||
    targetBodyFat > 100
  ) {
    return "Target body fat must be between 1 and 100.";
  }

  const targetDailySteps = Number(form.target_daily_steps);
  if (
    !form.target_daily_steps.trim() ||
    Number.isNaN(targetDailySteps) ||
    targetDailySteps <= 0
  ) {
    return "Target daily steps must be greater than 0.";
  }

  const targetSleepHours = Number(form.target_sleep_hours);
  if (
    !form.target_sleep_hours.trim() ||
    Number.isNaN(targetSleepHours) ||
    targetSleepHours <= 0
  ) {
    return "Target sleep hours must be greater than 0.";
  }

  const targetWaterLiters = Number(form.target_water_liters);
  if (
    !form.target_water_liters.trim() ||
    Number.isNaN(targetWaterLiters) ||
    targetWaterLiters <= 0
  ) {
    return "Target water liters must be greater than 0.";
  }

  return null;
}

function SettingRow({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean | null | undefined;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#D4AF37]/10 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <dt className="text-sm text-[#A3A3A3]">{label}</dt>
      <dd className="text-right text-sm font-medium text-[#F5F5F5]">
        {displaySettingValue(value)}
      </dd>
    </div>
  );
}

export default function GoalsSettingsCard({
  settingsId,
  goals,
}: GoalsSettingsCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayGoals, setDisplayGoals] = useState(goals);
  const [form, setForm] = useState<GoalsFormState>(() => toGoalsForm(goals));

  function handleEdit() {
    console.log("GOALS EDIT START");
    setForm(toGoalsForm(displayGoals));
    setIsEditing(true);
  }

  function handleCancel() {
    setForm(toGoalsForm(displayGoals));
    setIsEditing(false);
  }

  async function handleSave() {
    const validationError = validateGoalsForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payload: GoalsSettingsInput = {
      target_weight: Number(form.target_weight),
      target_waist: Number(form.target_waist),
      target_body_fat: Number(form.target_body_fat),
      target_daily_steps: Number(form.target_daily_steps),
      target_sleep_hours: Number(form.target_sleep_hours),
      target_water_liters: Number(form.target_water_liters),
    };

    setIsSaving(true);

    const { data, error } = await updateAppSettingsGoals(settingsId, payload);

    setIsSaving(false);

    if (error) {
      console.log("SETTINGS SAVE ERROR", error);
      toast.error(error);
      return;
    }

    const savedGoals = data?.config?.goals ?? payload;
    setDisplayGoals(savedGoals);
    setIsEditing(false);
    toast.success("Settings updated successfully");
    router.refresh();
  }

  return (
    <article className={settingsCardClassName}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
            <Gauge className="size-5 text-[#D4AF37]" aria-hidden />
          </div>
          <h2 className="text-lg font-bold text-[#F5F5F5]">Goals</h2>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-[#A3A3A3]">
            Body goal targets (analytics)
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="goals-target-weight" className={settingsLabelClassName}>
                Target weight (kg)
              </label>
              <input
                id="goals-target-weight"
                type="number"
                min="0.1"
                step="0.1"
                required
                value={form.target_weight}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    target_weight: event.target.value,
                  }))
                }
                className={settingsInputClassName}
              />
            </div>
            <div>
              <label htmlFor="goals-target-waist" className={settingsLabelClassName}>
                Target waist (in)
              </label>
              <input
                id="goals-target-waist"
                type="number"
                min="0.1"
                step="0.1"
                required
                value={form.target_waist}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    target_waist: event.target.value,
                  }))
                }
                className={settingsInputClassName}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="goals-target-body-fat"
              className={settingsLabelClassName}
            >
              Target body fat (%)
            </label>
            <input
              id="goals-target-body-fat"
              type="number"
              min="1"
              max="100"
              step="0.1"
              required
              value={form.target_body_fat}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  target_body_fat: event.target.value,
                }))
              }
              className={settingsInputClassName}
            />
          </div>
          <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-[#A3A3A3]">
            Habit targets
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="goals-target-daily-steps"
                className={settingsLabelClassName}
              >
                Target daily steps
              </label>
              <input
                id="goals-target-daily-steps"
                type="number"
                min="1"
                step="1"
                value={form.target_daily_steps}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    target_daily_steps: event.target.value,
                  }))
                }
                className={settingsInputClassName}
              />
            </div>
            <div>
              <label
                htmlFor="goals-target-sleep-hours"
                className={settingsLabelClassName}
              >
                Target sleep (hours)
              </label>
              <input
                id="goals-target-sleep-hours"
                type="number"
                min="0.1"
                step="0.5"
                value={form.target_sleep_hours}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    target_sleep_hours: event.target.value,
                  }))
                }
                className={settingsInputClassName}
              />
            </div>
            <div>
              <label
                htmlFor="goals-target-water-liters"
                className={settingsLabelClassName}
              >
                Target water (liters)
              </label>
              <input
                id="goals-target-water-liters"
                type="number"
                min="0.1"
                step="0.1"
                value={form.target_water_liters}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    target_water_liters: event.target.value,
                  }))
                }
                className={settingsInputClassName}
              />
            </div>
          </div>

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
        <dl>
          <SettingRow
            label="Target weight"
            value={displayGoals?.target_weight}
          />
          <SettingRow label="Target waist" value={displayGoals?.target_waist} />
          <SettingRow
            label="Target body fat"
            value={displayGoals?.target_body_fat}
          />
          <SettingRow
            label="Target daily steps"
            value={displayGoals?.target_daily_steps}
          />
          <SettingRow
            label="Target sleep hours"
            value={displayGoals?.target_sleep_hours}
          />
          <SettingRow
            label="Target water liters"
            value={displayGoals?.target_water_liters}
          />
        </dl>
      )}
    </article>
  );
}
