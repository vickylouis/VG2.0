export type DailySummaryHabits = {
  gym_done: boolean;
  steps_done: boolean;
  protein_target_done: boolean;
  water_target_done: boolean;
  sleep_before_11_done: boolean;
  reading_done: boolean;
  english_practice_done: boolean;
  automation_learning_done: boolean;
  mma_done: boolean;
  no_junk_food_done: boolean;
  family_time_done: boolean;
};

export type DailySummaryInput = {
  habitScore: number;
  habits: DailySummaryHabits;
  workoutDone: boolean;
  sleepHours: number | null;
  mood: number | null;
};

export type DailySummary = {
  dailyScore: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
};

const MAJOR_HABITS = [
  { key: "gym_done" as const, label: "Gym" },
  { key: "protein_target_done" as const, label: "Protein target" },
  { key: "sleep_before_11_done" as const, label: "Sleep before 11 PM" },
  { key: "no_junk_food_done" as const, label: "No junk food" },
];

export function calculateSleepScore(sleepHours: number | null): number {
  if (sleepHours == null || Number.isNaN(sleepHours)) return 70;
  if (sleepHours >= 7) return 100;
  if (sleepHours >= 6) return 70;
  return 40;
}

export function calculateJournalScore(mood: number | null): number {
  if (mood == null || Number.isNaN(mood)) return 70;
  const clamped = Math.min(10, Math.max(1, mood));
  return Math.round(clamped * 10);
}

export function getDailySummaryGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 65) return "C";
  return "D";
}

export function getDailySummaryGradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "#22C55E";
    case "B":
      return "#D4AF37";
    case "C":
      return "#F97316";
    default:
      return "#EF4444";
  }
}

export function generateDailySummary(input: DailySummaryInput): DailySummary {
  const workoutScore = input.workoutDone ? 100 : 0;
  const sleepScore = calculateSleepScore(input.sleepHours);
  const journalScore = calculateJournalScore(input.mood);

  const dailyScore = Math.round(
    input.habitScore * 0.5 +
      workoutScore * 0.2 +
      sleepScore * 0.15 +
      journalScore * 0.15
  );

  const grade = getDailySummaryGrade(dailyScore);
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (input.habitScore >= 80) {
    strengths.push(`Strong habit performance (${input.habitScore}% habit score)`);
  }

  if (input.workoutDone) {
    strengths.push("Workout completed");
  }

  if (input.sleepHours != null && input.sleepHours >= 7) {
    strengths.push(`Solid sleep (${input.sleepHours} hours)`);
  }

  if (input.habitScore < 60) {
    weaknesses.push(`Habit score needs work (${input.habitScore}%)`);
  }

  if (!input.workoutDone) {
    weaknesses.push("No workout logged");
  }

  if (input.sleepHours != null && input.sleepHours < 6) {
    weaknesses.push(`Low sleep (${input.sleepHours} hours)`);
  }

  const missedMajor = MAJOR_HABITS.filter((habit) => !input.habits[habit.key]).map(
    (habit) => habit.label
  );

  if (missedMajor.length > 0) {
    weaknesses.push(`Missed major habits: ${missedMajor.join(", ")}`);
  }

  if (strengths.length === 0) {
    strengths.push("Check-in completed — build momentum tomorrow.");
  }

  if (weaknesses.length === 0) {
    weaknesses.push("Nothing critical flagged — keep the streak going.");
  }

  return {
    dailyScore,
    grade,
    strengths,
    weaknesses,
  };
}
