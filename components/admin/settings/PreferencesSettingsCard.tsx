"use client";

import { useState } from "react";
import { Loader2, Pencil, Settings2 } from "lucide-react";
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
  updateAppSettingsPreferences,
  type AppSettingsConfig,
  type PreferencesSettingsInput,
} from "@/lib/settings";
import { cn } from "@/lib/utils";

const UNIT_OPTIONS = [
  { value: "kg", label: "kg" },
  { value: "lbs", label: "lbs" },
] as const;

const THEME_OPTIONS = [
  { value: "dark", label: "dark" },
  { value: "light", label: "light" },
  { value: "system", label: "system" },
] as const;

const TIMEZONE_OPTIONS = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "UTC",
] as const;

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "ta", label: "Tamil" },
] as const;

type PreferencesFormState = {
  unit: string;
  theme: string;
  timezone: string;
  language: string;
};

type PreferencesSettingsCardProps = {
  settingsId: string;
  preferences: AppSettingsConfig["preferences"];
};

function normalizeUnit(unit: string | undefined): string {
  if (unit === "metric") return "kg";
  if (unit === "imperial") return "lbs";
  return unit ?? "";
}

function toPreferencesForm(
  preferences: AppSettingsConfig["preferences"]
): PreferencesFormState {
  return {
    unit: normalizeUnit(preferences?.unit),
    theme: preferences?.theme ?? "",
    timezone: preferences?.timezone ?? "",
    language: preferences?.language ?? "",
  };
}

function validatePreferencesForm(form: PreferencesFormState): string | null {
  if (!form.unit.trim()) return "Unit is required.";
  if (!UNIT_OPTIONS.some((option) => option.value === form.unit)) {
    return "Unit must be kg or lbs.";
  }

  if (!form.theme.trim()) return "Theme is required.";
  if (!THEME_OPTIONS.some((option) => option.value === form.theme)) {
    return "Theme must be dark, light, or system.";
  }

  if (!form.timezone.trim()) return "Timezone is required.";

  if (!form.language.trim()) return "Language is required.";
  if (!LANGUAGE_OPTIONS.some((option) => option.value === form.language)) {
    return "Language must be en or ta.";
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

export default function PreferencesSettingsCard({
  settingsId,
  preferences,
}: PreferencesSettingsCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayPreferences, setDisplayPreferences] = useState(preferences);
  const [form, setForm] = useState<PreferencesFormState>(() =>
    toPreferencesForm(preferences)
  );

  function handleEdit() {
    console.log("PREFERENCES EDIT START");
    setForm(toPreferencesForm(displayPreferences));
    setIsEditing(true);
  }

  function handleCancel() {
    setForm(toPreferencesForm(displayPreferences));
    setIsEditing(false);
  }

  async function handleSave() {
    const validationError = validatePreferencesForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payload: PreferencesSettingsInput = {
      unit: form.unit.trim(),
      theme: form.theme.trim(),
      timezone: form.timezone.trim(),
      language: form.language as PreferencesSettingsInput["language"],
    };

    setIsSaving(true);

    const { data, error } = await updateAppSettingsPreferences(
      settingsId,
      payload
    );

    setIsSaving(false);

    if (error) {
      console.log("SETTINGS SAVE ERROR", error);
      toast.error(error);
      return;
    }

    const savedPreferences = data?.config?.preferences ?? payload;
    setDisplayPreferences(savedPreferences);
    setIsEditing(false);
    toast.success("Settings updated successfully");
    router.refresh();
  }

  const selectClassName = cn(settingsInputClassName, "cursor-pointer");

  return (
    <article className={settingsCardClassName}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
            <Settings2 className="size-5 text-[#D4AF37]" aria-hidden />
          </div>
          <h2 className="text-lg font-bold text-[#F5F5F5]">Preferences</h2>
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
            <label htmlFor="preferences-unit" className={settingsLabelClassName}>
              Unit
            </label>
            <select
              id="preferences-unit"
              value={form.unit}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, unit: event.target.value }))
              }
              className={selectClassName}
            >
              <option value="">Select unit</option>
              {UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="preferences-theme" className={settingsLabelClassName}>
              Theme
            </label>
            <select
              id="preferences-theme"
              value={form.theme}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, theme: event.target.value }))
              }
              className={selectClassName}
            >
              <option value="">Select theme</option>
              {THEME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="preferences-timezone"
              className={settingsLabelClassName}
            >
              Timezone
            </label>
            <select
              id="preferences-timezone"
              value={form.timezone}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, timezone: event.target.value }))
              }
              className={selectClassName}
            >
              <option value="">Select timezone</option>
              {TIMEZONE_OPTIONS.map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezone}
                </option>
              ))}
            </select>
            <input
              id="preferences-timezone-custom"
              type="text"
              value={form.timezone}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, timezone: event.target.value }))
              }
              placeholder="Or enter IANA timezone"
              className={cn(settingsInputClassName, "mt-2")}
            />
          </div>

          <div>
            <label
              htmlFor="preferences-language"
              className={settingsLabelClassName}
            >
              Language
            </label>
            <select
              id="preferences-language"
              value={form.language}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, language: event.target.value }))
              }
              className={selectClassName}
            >
              <option value="">Select language</option>
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
          <SettingRow label="Unit" value={displayPreferences?.unit} />
          <SettingRow label="Theme" value={displayPreferences?.theme} />
          <SettingRow label="Timezone" value={displayPreferences?.timezone} />
          <SettingRow label="Language" value={displayPreferences?.language} />
        </dl>
      )}
    </article>
  );
}
