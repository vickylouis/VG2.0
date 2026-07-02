"use client";

import { useState, type ReactNode } from "react";
import { Brain, Loader2, Pencil } from "lucide-react";
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
  fromAiCoachForm,
  resolveAiConfig,
  toAiCoachForm,
  validateAiConfig,
  type AiCoachFormState,
} from "@/lib/aiSettingsConfig";
import {
  updateAppSettingsAi,
  type AppSettingsConfig,
} from "@/lib/settings";

type AiCoachSettingsCardProps = {
  settingsId: string;
  config: AppSettingsConfig | null;
};

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

function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#D4AF37]/10 bg-[#0B0B0B]/40 p-4">
      <h3 className="mb-3 text-xs font-semibold tracking-[0.2em] text-[#D4AF37] uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className={settingsLabelClassName}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={settingsInputClassName}
      />
    </div>
  );
}

export default function AiCoachSettingsCard({
  settingsId,
  config,
}: AiCoachSettingsCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayAi, setDisplayAi] = useState(() => resolveAiConfig(config));
  const [form, setForm] = useState<AiCoachFormState>(() =>
    toAiCoachForm(resolveAiConfig(config))
  );

  function handleEdit() {
    console.log("SETTINGS EDIT START", "ai");
    setForm(toAiCoachForm(displayAi));
    setIsEditing(true);
  }

  function handleCancel() {
    setForm(toAiCoachForm(displayAi));
    setIsEditing(false);
  }

  function updateField<K extends keyof AiCoachFormState>(
    key: K,
    value: AiCoachFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    const validationError = validateAiConfig(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payload = fromAiCoachForm(form);

    setIsSaving(true);

    const { data, error } = await updateAppSettingsAi(settingsId, payload);

    setIsSaving(false);

    if (error) {
      toast.error(error);
      return;
    }

    const savedAi = resolveAiConfig(data?.config ?? { ai: payload });
    setDisplayAi(savedAi);
    setForm(toAiCoachForm(savedAi));
    setIsEditing(false);
    toast.success("AI settings updated");
    router.refresh();
  }

  return (
    <article className={settingsCardClassName}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
            <Brain className="size-5 text-[#D4AF37]" aria-hidden />
          </div>
          <h2 className="text-lg font-bold text-[#F5F5F5]">AI Coach Rules</h2>
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
          <FieldGroup title="Sleep">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumberField
                id="ai-sleep-good"
                label="Sleep good threshold"
                value={form.sleep_good_threshold}
                onChange={(value) => updateField("sleep_good_threshold", value)}
              />
              <NumberField
                id="ai-sleep-bad"
                label="Sleep bad threshold"
                value={form.sleep_bad_threshold}
                onChange={(value) => updateField("sleep_bad_threshold", value)}
              />
            </div>
          </FieldGroup>

          <FieldGroup title="Steps">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumberField
                id="ai-daily-steps"
                label="Daily steps goal"
                value={form.daily_steps_goal}
                onChange={(value) => updateField("daily_steps_goal", value)}
              />
              <NumberField
                id="ai-excellent-steps"
                label="Excellent steps goal"
                value={form.excellent_steps_goal}
                onChange={(value) => updateField("excellent_steps_goal", value)}
              />
            </div>
          </FieldGroup>

          <FieldGroup title="Habits">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumberField
                id="ai-good-habit"
                label="Good habit threshold"
                value={form.good_habit_threshold}
                onChange={(value) => updateField("good_habit_threshold", value)}
              />
              <NumberField
                id="ai-bad-habit"
                label="Bad habit threshold"
                value={form.bad_habit_threshold}
                onChange={(value) => updateField("bad_habit_threshold", value)}
              />
            </div>
          </FieldGroup>

          <FieldGroup title="Discipline">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumberField
                id="ai-high-discipline"
                label="High discipline threshold"
                value={form.high_discipline_threshold}
                onChange={(value) =>
                  updateField("high_discipline_threshold", value)
                }
              />
              <NumberField
                id="ai-low-discipline"
                label="Low discipline threshold"
                value={form.low_discipline_threshold}
                onChange={(value) =>
                  updateField("low_discipline_threshold", value)
                }
              />
            </div>
          </FieldGroup>

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
        <div className="space-y-4">
          <FieldGroup title="Sleep">
            <dl>
              <SettingRow
                label="Sleep good threshold"
                value={displayAi.sleep_good_threshold}
              />
              <SettingRow
                label="Sleep bad threshold"
                value={displayAi.sleep_bad_threshold}
              />
            </dl>
          </FieldGroup>
          <FieldGroup title="Steps">
            <dl>
              <SettingRow
                label="Daily steps goal"
                value={displayAi.daily_steps_goal}
              />
              <SettingRow
                label="Excellent steps goal"
                value={displayAi.excellent_steps_goal}
              />
            </dl>
          </FieldGroup>
          <FieldGroup title="Habits">
            <dl>
              <SettingRow
                label="Good habit threshold"
                value={displayAi.good_habit_threshold}
              />
              <SettingRow
                label="Bad habit threshold"
                value={displayAi.bad_habit_threshold}
              />
            </dl>
          </FieldGroup>
          <FieldGroup title="Discipline">
            <dl>
              <SettingRow
                label="High discipline threshold"
                value={displayAi.high_discipline_threshold}
              />
              <SettingRow
                label="Low discipline threshold"
                value={displayAi.low_discipline_threshold}
              />
            </dl>
          </FieldGroup>
        </div>
      )}
    </article>
  );
}
