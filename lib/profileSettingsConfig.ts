import { readConfigNumber, readConfigString } from "@/lib/configFallback";
import {
  DEFAULT_STARTING_WEIGHT,
  type AppSettingsConfig,
  type ProfileGender,
} from "@/lib/settings";

export const DEFAULT_PROFILE_NAME = "Vignesh";
export const DEFAULT_MISSION_NAME = "VG 2.0";
export const DEFAULT_HEIGHT_CM = 175;
export const DEFAULT_AGE = 30;
export const DEFAULT_GENDER: ProfileGender = "male";
export const DEFAULT_STARTING_WAIST = 36;
export const DEFAULT_STARTING_BODY_FAT = 22;

export const PROFILE_GENDER_OPTIONS: readonly {
  value: ProfileGender;
  label: string;
}[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

export type ResolvedProfileConfig = {
  name: string;
  missionName: string;
  heightCm: number;
  age: number;
  gender: ProfileGender;
  startingWeight: number;
  startingWaist: number;
  startingBodyFat: number;
};

export function validateProfileSettingsInput(input: {
  name: string;
  mission_name: string;
  height_cm: number;
  age: number;
  gender: ProfileGender;
  starting_weight: number;
  starting_waist: number;
  starting_body_fat: number;
}): string | null {
  if (!input.name.trim()) return "Name is required.";
  if (!input.mission_name.trim()) return "Mission name is required.";
  if (!Number.isFinite(input.height_cm) || input.height_cm <= 0) {
    return "Height must be a positive number.";
  }
  if (
    !Number.isFinite(input.age) ||
    !Number.isInteger(input.age) ||
    input.age <= 0
  ) {
    return "Age must be a positive whole number.";
  }
  if (!input.gender) return "Gender is required.";
  if (!Number.isFinite(input.starting_weight) || input.starting_weight <= 0) {
    return "Starting weight must be a positive number.";
  }
  if (!Number.isFinite(input.starting_waist) || input.starting_waist <= 0) {
    return "Starting waist must be a positive number.";
  }
  if (
    !Number.isFinite(input.starting_body_fat) ||
    input.starting_body_fat < 1 ||
    input.starting_body_fat > 100
  ) {
    return "Starting body fat must be between 1 and 100.";
  }
  return null;
}

function resolveProfileGender(value: unknown): ProfileGender {
  if (
    value === "male" ||
    value === "female" ||
    value === "other"
  ) {
    return value;
  }
  return DEFAULT_GENDER;
}

export function resolveProfileConfig(
  config: AppSettingsConfig | null | undefined
): ResolvedProfileConfig {
  console.log("PROFILE CONFIG LOAD");

  const profile = {
    name: readConfigString(
      "profile",
      "name",
      config?.profile?.name,
      DEFAULT_PROFILE_NAME
    ),
    missionName: readConfigString(
      "profile",
      "mission_name",
      config?.profile?.mission_name,
      DEFAULT_MISSION_NAME
    ),
    heightCm: readConfigNumber(
      "profile",
      "height_cm",
      config?.profile?.height_cm,
      DEFAULT_HEIGHT_CM
    ),
    age: readConfigNumber(
      "profile",
      "age",
      config?.profile?.age,
      DEFAULT_AGE
    ),
    gender: resolveProfileGender(config?.profile?.gender),
    startingWeight: readConfigNumber(
      "profile",
      "starting_weight",
      config?.profile?.starting_weight,
      DEFAULT_STARTING_WEIGHT
    ),
    startingWaist: readConfigNumber(
      "profile",
      "starting_waist",
      config?.profile?.starting_waist,
      DEFAULT_STARTING_WAIST
    ),
    startingBodyFat: readConfigNumber(
      "profile",
      "starting_body_fat",
      config?.profile?.starting_body_fat,
      DEFAULT_STARTING_BODY_FAT
    ),
  };

  console.log("PROFILE CONFIG APPLIED", profile);
  return profile;
}

export function calculateBmi(weightKg: number, heightCm: number): number | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm) || heightCm <= 0) {
    return null;
  }

  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}
