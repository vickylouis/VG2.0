import { DEFAULT_MISSION_DAYS } from "@/lib/settings";
import type { Branding } from "@/lib/branding";
import {
  DEFAULT_MISSION_NAME,
  DEFAULT_PROFILE_NAME,
} from "@/lib/profileSettingsConfig";

export type AboutPillar = {
  title: string;
  description: string;
};

export type AboutPageContent = {
  eyebrow: string;
  title: string;
  description: string;
  pillars: AboutPillar[];
};

export function getAboutContent(
  missionDays = DEFAULT_MISSION_DAYS,
  branding?: Branding
): AboutPageContent {
  const missionName = branding?.brandName ?? DEFAULT_MISSION_NAME;
  const name = branding?.userName ?? DEFAULT_PROFILE_NAME;

  return {
    eyebrow: "The Mission",
    title: `About ${missionName}`,
    description: `${missionName} is a ${missionDays}-day public transformation — rebuilding body, discipline, confidence, and identity in full view for ${name}.`,
    pillars: [
      {
        title: "Body",
        description: "Measurable progress through weight, waist, steps, and sleep.",
      },
      {
        title: "Discipline",
        description: "Daily workouts, honest logging, and no shortcuts.",
      },
      {
        title: "Identity",
        description: "From invisible to undeniable — one day at a time.",
      },
    ],
  };
}
