"use client";

import { useState } from "react";
import { Flag, Loader2, Pencil } from "lucide-react";
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
  updateAppSettingsMission,
  type AppSettingsConfig,
  type MissionSettingsInput,
} from "@/lib/settings";

type MissionFormState = {
  start_date: string;
  mission_days: string;
};

type MissionSettingsCardProps = {
  settingsId: string;
  mission: AppSettingsConfig["mission"];
};

function toMissionForm(mission: AppSettingsConfig["mission"]): MissionFormState {
  return {
    start_date: mission?.start_date ?? "",
    mission_days:
      mission?.mission_days != null ? String(mission.mission_days) : "",
  };
}

function validateMissionForm(form: MissionFormState): string | null {
  if (!form.start_date.trim()) return "Start date is required.";

  const parsedDate = new Date(`${form.start_date}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Start date must be valid.";
  }

  const missionDays = Number(form.mission_days);
  if (
    !form.mission_days.trim() ||
    !Number.isInteger(missionDays) ||
    missionDays <= 0
  ) {
    return "Mission days must be a positive whole number.";
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

export default function MissionSettingsCard({
  settingsId,
  mission,
}: MissionSettingsCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayMission, setDisplayMission] = useState(mission);
  const [form, setForm] = useState<MissionFormState>(() => toMissionForm(mission));

  function handleEdit() {
    console.log("SETTINGS EDIT START", "mission");
    setForm(toMissionForm(displayMission));
    setIsEditing(true);
  }

  function handleCancel() {
    setForm(toMissionForm(displayMission));
    setIsEditing(false);
  }

  async function handleSave() {
    const validationError = validateMissionForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payload: MissionSettingsInput = {
      start_date: form.start_date.trim(),
      mission_days: Number(form.mission_days),
    };

    setIsSaving(true);

    const { data, error } = await updateAppSettingsMission(
      settingsId,
      payload
    );

    setIsSaving(false);

    if (error) {
      toast.error(error);
      return;
    }

    const savedMission = data?.config?.mission ?? payload;
    setDisplayMission(savedMission);
    setIsEditing(false);
    toast.success("Settings updated successfully");
    router.refresh();
  }

  return (
    <article className={settingsCardClassName}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
            <Flag className="size-5 text-[#D4AF37]" aria-hidden />
          </div>
          <h2 className="text-lg font-bold text-[#F5F5F5]">Mission</h2>
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
          <div>
            <label htmlFor="mission-start-date" className={settingsLabelClassName}>
              Start date
            </label>
            <input
              id="mission-start-date"
              type="date"
              value={form.start_date}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  start_date: event.target.value,
                }))
              }
              className={settingsInputClassName}
            />
          </div>
          <div>
            <label htmlFor="mission-days" className={settingsLabelClassName}>
              Mission days
            </label>
            <input
              id="mission-days"
              type="number"
              min="1"
              step="1"
              value={form.mission_days}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  mission_days: event.target.value,
                }))
              }
              className={settingsInputClassName}
            />
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
          <SettingRow label="Start date" value={displayMission?.start_date} />
          <SettingRow label="Mission days" value={displayMission?.mission_days} />
        </dl>
      )}
    </article>
  );
}
