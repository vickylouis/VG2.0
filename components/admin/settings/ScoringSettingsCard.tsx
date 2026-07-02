"use client";

import { useMemo, useState } from "react";
import { Loader2, Pencil, SlidersHorizontal } from "lucide-react";
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
  calculateScoringTotal,
  fromScoringForm,
  resolveScoringConfig,
  toScoringForm,
  validateScoringConfig,
  type ScoringFormState,
} from "@/lib/scoringSettingsConfig";
import {
  updateAppSettingsScoring,
  type AppSettingsConfig,
} from "@/lib/settings";
import { cn } from "@/lib/utils";

type ScoringSettingsCardProps = {
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

export default function ScoringSettingsCard({
  settingsId,
  config,
}: ScoringSettingsCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayScoring, setDisplayScoring] = useState(() =>
    resolveScoringConfig(config)
  );
  const [form, setForm] = useState<ScoringFormState>(() =>
    toScoringForm(resolveScoringConfig(config))
  );

  const editTotal = useMemo(() => calculateScoringTotal(form), [form]);
  const isTotalValid = editTotal === 100;

  const displayTotal =
    displayScoring.habit_weight +
    displayScoring.metrics_weight +
    displayScoring.journal_weight;

  function handleEdit() {
    console.log("SETTINGS EDIT START", "scoring");
    setForm(toScoringForm(displayScoring));
    setIsEditing(true);
  }

  function handleCancel() {
    setForm(toScoringForm(displayScoring));
    setIsEditing(false);
  }

  function updateField<K extends keyof ScoringFormState>(
    key: K,
    value: ScoringFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    const validationError = validateScoringConfig(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payload = fromScoringForm(form);

    setIsSaving(true);

    const { data, error } = await updateAppSettingsScoring(
      settingsId,
      payload
    );

    setIsSaving(false);

    if (error) {
      toast.error(error);
      return;
    }

    const savedScoring = resolveScoringConfig(data?.config ?? { scoring: payload });
    setDisplayScoring(savedScoring);
    setForm(toScoringForm(savedScoring));
    setIsEditing(false);
    toast.success("AI settings updated");
    router.refresh();
  }

  return (
    <article className={settingsCardClassName}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
            <SlidersHorizontal className="size-5 text-[#D4AF37]" aria-hidden />
          </div>
          <h2 className="text-lg font-bold text-[#F5F5F5]">Scoring Engine</h2>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="scoring-habit" className={settingsLabelClassName}>
                Habit weight
              </label>
              <input
                id="scoring-habit"
                type="number"
                min="0"
                step="1"
                value={form.habit_weight}
                onChange={(event) =>
                  updateField("habit_weight", event.target.value)
                }
                className={settingsInputClassName}
              />
            </div>
            <div>
              <label
                htmlFor="scoring-metrics"
                className={settingsLabelClassName}
              >
                Metrics weight
              </label>
              <input
                id="scoring-metrics"
                type="number"
                min="0"
                step="1"
                value={form.metrics_weight}
                onChange={(event) =>
                  updateField("metrics_weight", event.target.value)
                }
                className={settingsInputClassName}
              />
            </div>
            <div>
              <label
                htmlFor="scoring-journal"
                className={settingsLabelClassName}
              >
                Journal weight
              </label>
              <input
                id="scoring-journal"
                type="number"
                min="0"
                step="1"
                value={form.journal_weight}
                onChange={(event) =>
                  updateField("journal_weight", event.target.value)
                }
                className={settingsInputClassName}
              />
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-[#A3A3A3]">
              VG grade bands
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="grade-a" className={settingsLabelClassName}>
                  Grade A ≥
                </label>
                <input
                  id="grade-a"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={form.grade_a}
                  onChange={(event) => updateField("grade_a", event.target.value)}
                  className={settingsInputClassName}
                />
              </div>
              <div>
                <label htmlFor="grade-b" className={settingsLabelClassName}>
                  Grade B ≥
                </label>
                <input
                  id="grade-b"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={form.grade_b}
                  onChange={(event) => updateField("grade_b", event.target.value)}
                  className={settingsInputClassName}
                />
              </div>
              <div>
                <label htmlFor="grade-c" className={settingsLabelClassName}>
                  Grade C ≥
                </label>
                <input
                  id="grade-c"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={form.grade_c}
                  onChange={(event) => updateField("grade_c", event.target.value)}
                  className={settingsInputClassName}
                />
              </div>
            </div>
          </div>

          <div
            className={cn(
              "rounded-xl border px-4 py-3 text-sm",
              isTotalValid
                ? "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]"
                : "border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]"
            )}
          >
            <span className="font-medium">
              Total: {Number.isNaN(editTotal) ? "—" : editTotal}
            </span>
          </div>

          {!isTotalValid && (
            <p role="alert" className="text-sm font-medium text-[#EF4444]">
              Scoring weights must total 100
            </p>
          )}

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
              disabled={isSaving || !isTotalValid}
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
            label="Habit weight"
            value={displayScoring.habit_weight}
          />
          <SettingRow
            label="Metrics weight"
            value={displayScoring.metrics_weight}
          />
          <SettingRow
            label="Journal weight"
            value={displayScoring.journal_weight}
          />
          <SettingRow label="Grade A ≥" value={displayScoring.vg_grade_bands.A} />
          <SettingRow label="Grade B ≥" value={displayScoring.vg_grade_bands.B} />
          <SettingRow label="Grade C ≥" value={displayScoring.vg_grade_bands.C} />
          <SettingRow label="Total" value={displayTotal} />
        </dl>
      )}
    </article>
  );
}
