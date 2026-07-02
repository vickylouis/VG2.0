"use client";

import { useState } from "react";
import { Loader2, Pencil, User } from "lucide-react";
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
import { PROFILE_GENDER_OPTIONS } from "@/lib/profileSettingsConfig";
import {
  updateAppSettingsProfile,
  type AppSettingsConfig,
  type ProfileGender,
  type ProfileSettingsInput,
} from "@/lib/settings";
import { cn } from "@/lib/utils";

type ProfileFormState = {
  name: string;
  mission_name: string;
  height_cm: string;
  age: string;
  gender: ProfileGender | "";
  starting_weight: string;
  starting_waist: string;
  starting_body_fat: string;
};

type ProfileSettingsCardProps = {
  settingsId: string;
  profile: AppSettingsConfig["profile"];
};

function toProfileForm(profile: AppSettingsConfig["profile"]): ProfileFormState {
  return {
    name: profile?.name ?? "",
    mission_name: profile?.mission_name ?? "",
    height_cm:
      profile?.height_cm != null ? String(profile.height_cm) : "",
    age: profile?.age != null ? String(profile.age) : "",
    gender: profile?.gender ?? "",
    starting_weight:
      profile?.starting_weight != null ? String(profile.starting_weight) : "",
    starting_waist:
      profile?.starting_waist != null ? String(profile.starting_waist) : "",
    starting_body_fat:
      profile?.starting_body_fat != null
        ? String(profile.starting_body_fat)
        : "",
  };
}

function validateProfileForm(form: ProfileFormState): string | null {
  if (!form.name.trim()) return "Name is required.";
  if (!form.mission_name.trim()) return "Mission name is required.";

  const height = Number(form.height_cm);
  if (!form.height_cm.trim() || Number.isNaN(height) || height <= 0) {
    return "Height must be a positive number.";
  }

  const age = Number(form.age);
  if (
    !form.age.trim() ||
    Number.isNaN(age) ||
    !Number.isInteger(age) ||
    age <= 0
  ) {
    return "Age must be a positive whole number.";
  }

  if (!form.gender) return "Gender is required.";

  const startingWeight = Number(form.starting_weight);
  if (
    !form.starting_weight.trim() ||
    Number.isNaN(startingWeight) ||
    startingWeight <= 0
  ) {
    return "Starting weight must be a positive number.";
  }

  const startingWaist = Number(form.starting_waist);
  if (
    !form.starting_waist.trim() ||
    Number.isNaN(startingWaist) ||
    startingWaist <= 0
  ) {
    return "Starting waist must be a positive number.";
  }

  const startingBodyFat = Number(form.starting_body_fat);
  if (
    !form.starting_body_fat.trim() ||
    Number.isNaN(startingBodyFat) ||
    startingBodyFat < 1 ||
    startingBodyFat > 100
  ) {
    return "Starting body fat must be between 1 and 100.";
  }

  return null;
}

function RequiredMark() {
  return (
    <span className="ml-1 text-[#D4AF37]/80" aria-hidden>
      *
    </span>
  );
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

function formatGender(value: ProfileGender | undefined): string {
  if (!value) return "—";
  return PROFILE_GENDER_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export default function ProfileSettingsCard({
  settingsId,
  profile,
}: ProfileSettingsCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayProfile, setDisplayProfile] = useState(profile);
  const [form, setForm] = useState<ProfileFormState>(() => toProfileForm(profile));

  function handleEdit() {
    console.log("SETTINGS EDIT START", "profile");
    setForm(toProfileForm(displayProfile));
    setIsEditing(true);
  }

  function handleCancel() {
    setForm(toProfileForm(displayProfile));
    setIsEditing(false);
  }

  async function handleSave() {
    const validationError = validateProfileForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payload: ProfileSettingsInput = {
      name: form.name.trim(),
      mission_name: form.mission_name.trim(),
      height_cm: Number(form.height_cm),
      age: Number(form.age),
      gender: form.gender as ProfileGender,
      starting_weight: Number(form.starting_weight),
      starting_waist: Number(form.starting_waist),
      starting_body_fat: Number(form.starting_body_fat),
    };

    setIsSaving(true);

    const { data, error } = await updateAppSettingsProfile(
      settingsId,
      payload
    );

    setIsSaving(false);

    if (error) {
      toast.error(error);
      return;
    }

    const savedProfile = data?.config?.profile ?? {
      name: payload.name,
      mission_name: payload.mission_name,
      height_cm: payload.height_cm,
      age: payload.age,
      gender: payload.gender,
      starting_weight: payload.starting_weight,
      starting_waist: payload.starting_waist,
      starting_body_fat: payload.starting_body_fat,
    };
    setDisplayProfile(savedProfile);
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
            <User className="size-5 text-[#D4AF37]" aria-hidden />
          </div>
          <h2 className="text-lg font-bold text-[#F5F5F5]">Profile</h2>
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
            <label htmlFor="profile-name" className={settingsLabelClassName}>
              Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className={settingsInputClassName}
            />
          </div>
          <div>
            <label
              htmlFor="profile-mission-name"
              className={settingsLabelClassName}
            >
              Mission name
            </label>
            <input
              id="profile-mission-name"
              type="text"
              value={form.mission_name}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  mission_name: event.target.value,
                }))
              }
              className={settingsInputClassName}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="profile-height" className={settingsLabelClassName}>
                Height (cm)
                <RequiredMark />
              </label>
              <input
                id="profile-height"
                type="number"
                min="1"
                step="0.1"
                required
                value={form.height_cm}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, height_cm: event.target.value }))
                }
                className={settingsInputClassName}
              />
            </div>
            <div>
              <label htmlFor="profile-age" className={settingsLabelClassName}>
                Age
                <RequiredMark />
              </label>
              <input
                id="profile-age"
                type="number"
                min="1"
                step="1"
                required
                value={form.age}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, age: event.target.value }))
                }
                className={settingsInputClassName}
              />
            </div>
          </div>
          <div>
            <label htmlFor="profile-gender" className={settingsLabelClassName}>
              Gender
              <RequiredMark />
            </label>
            <select
              id="profile-gender"
              required
              value={form.gender}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  gender: event.target.value as ProfileGender | "",
                }))
              }
              className={selectClassName}
            >
              <option value="">Select gender</option>
              {PROFILE_GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#A3A3A3]">
            Analytics baselines
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="profile-starting-weight"
                className={settingsLabelClassName}
              >
                Starting weight (kg)
                <RequiredMark />
              </label>
              <input
                id="profile-starting-weight"
                type="number"
                min="1"
                step="0.1"
                required
                value={form.starting_weight}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    starting_weight: event.target.value,
                  }))
                }
                className={settingsInputClassName}
              />
            </div>
            <div>
              <label
                htmlFor="profile-starting-waist"
                className={settingsLabelClassName}
              >
                Starting waist (in)
                <RequiredMark />
              </label>
              <input
                id="profile-starting-waist"
                type="number"
                min="1"
                step="0.1"
                required
                value={form.starting_waist}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    starting_waist: event.target.value,
                  }))
                }
                className={settingsInputClassName}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="profile-starting-body-fat"
              className={settingsLabelClassName}
            >
              Starting body fat (%)
              <RequiredMark />
            </label>
            <input
              id="profile-starting-body-fat"
              type="number"
              min="1"
              max="100"
              step="0.1"
              required
              value={form.starting_body_fat}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  starting_body_fat: event.target.value,
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
          <SettingRow label="Name" value={displayProfile?.name} />
          <SettingRow label="Mission name" value={displayProfile?.mission_name} />
          <SettingRow label="Height (cm)" value={displayProfile?.height_cm} />
          <SettingRow label="Age" value={displayProfile?.age} />
          <SettingRow
            label="Gender"
            value={formatGender(displayProfile?.gender)}
          />
          <SettingRow
            label="Starting weight"
            value={displayProfile?.starting_weight}
          />
          <SettingRow
            label="Starting waist (in)"
            value={displayProfile?.starting_waist}
          />
          <SettingRow
            label="Starting body fat (%)"
            value={displayProfile?.starting_body_fat}
          />
        </dl>
      )}
    </article>
  );
}
