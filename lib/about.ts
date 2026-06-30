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

export function getAboutContent(): AboutPageContent {
  return {
    eyebrow: "The Mission",
    title: "About VG 2.0",
    description:
      "VG 2.0 is a 150-day public transformation — rebuilding body, discipline, confidence, and identity in full view.",
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
