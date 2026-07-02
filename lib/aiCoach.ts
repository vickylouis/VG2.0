import type { AiCoachConfig } from "@/lib/settings";

export type CoachInput = {
  averageVGScore: number;
  averageSleep: number;
  averageSteps: number;
  weightTrend: number; // negative means weight loss
  workoutConsistency: number; // percentage
  averageMood?: number;
  averageEnergy?: number;
  averageDiscipline?: number;
  habitScore?: number;
  gymConsistency?: number;
  sleepHabitConsistency?: number;
  proteinConsistency?: number;
  junkFoodDiscipline?: number;
};

export type CoachReport = {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  overallRating: string;
};

function resolveOverallRating(strengthCount: number, weaknessCount: number): string {
  if (strengthCount > weaknessCount) {
    return weaknessCount === 0 || strengthCount - weaknessCount >= 2 ? "A" : "B";
  }
  if (strengthCount === weaknessCount) {
    return "C";
  }
  return "D";
}

export function generateCoachReport(
  input: CoachInput,
  ai: AiCoachConfig
): CoachReport {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  const lowStepsThreshold = Math.round(ai.daily_steps_goal * 0.625);
  const lowActivityThreshold = Math.round(ai.daily_steps_goal * 0.5);

  console.log("HARDCODE REMOVED", { module: "aiCoach", ai });

  if (input.averageVGScore >= ai.high_discipline_threshold) {
    strengths.push("Excellent discipline");
  } else if (input.averageVGScore < ai.low_discipline_threshold) {
    weaknesses.push("Low consistency");
  }

  if (input.averageSleep >= ai.sleep_good_threshold) {
    strengths.push("Strong sleep habits");
  } else if (input.averageSleep < ai.sleep_bad_threshold) {
    weaknesses.push("Insufficient sleep");
    recommendations.push(
      `Sleep before 11 PM and target ${ai.sleep_good_threshold}+ hours`
    );
  }

  if (input.averageSteps >= ai.excellent_steps_goal) {
    strengths.push("Excellent daily step count");
  } else if (input.averageSteps >= ai.daily_steps_goal) {
    strengths.push("High daily step count");
  } else if (input.averageSteps < lowActivityThreshold) {
    weaknesses.push("Low daily activity");
    recommendations.push(`Walk ${ai.daily_steps_goal}+ steps daily`);
  } else if (input.averageSteps < lowStepsThreshold) {
    weaknesses.push("Below target step count");
    recommendations.push(`Aim for ${ai.daily_steps_goal}+ steps daily`);
  }

  if (input.weightTrend < 0) {
    strengths.push("Weight moving in right direction");
  } else if (input.weightTrend > 0) {
    weaknesses.push("Weight increasing");
    recommendations.push("Reduce calorie intake and track meals");
  }

  if (input.workoutConsistency >= ai.high_discipline_threshold) {
    strengths.push("High workout consistency");
  } else if (input.workoutConsistency < ai.low_discipline_threshold) {
    weaknesses.push("Inconsistent training");
  }

  if (input.averageMood != null && input.averageMood < 5) {
    weaknesses.push("Low mood scores");
  }

  if (input.averageEnergy != null && input.averageEnergy < 5) {
    weaknesses.push("Low energy levels");
  }

  if (input.averageDiscipline != null && input.averageDiscipline < 5) {
    weaknesses.push("Low discipline scores");
    recommendations.push("Reduce decision fatigue with fixed routines");
  }

  if (input.habitScore != null) {
    if (input.habitScore >= ai.good_habit_threshold) {
      strengths.push("Strong overall habit score");
    } else if (input.habitScore < ai.bad_habit_threshold) {
      weaknesses.push("Low habit score");
    }
  }

  if (input.gymConsistency != null) {
    if (input.gymConsistency >= ai.high_discipline_threshold) {
      strengths.push("Consistent gym habit");
    } else if (input.gymConsistency < ai.low_discipline_threshold) {
      weaknesses.push("Inconsistent gym habit");
    }
  }

  if (
    input.sleepHabitConsistency != null &&
    input.sleepHabitConsistency < ai.bad_habit_threshold
  ) {
    weaknesses.push("Weak sleep habit consistency");
    recommendations.push("Fix bedtime routine. Sleep before 11 PM.");
  }

  if (
    input.proteinConsistency != null &&
    input.proteinConsistency < ai.bad_habit_threshold
  ) {
    weaknesses.push("Low protein habit consistency");
    recommendations.push("Improve daily protein consistency.");
  }

  if (
    input.junkFoodDiscipline != null &&
    input.junkFoodDiscipline < ai.good_habit_threshold
  ) {
    weaknesses.push("Junk food discipline needs work");
    recommendations.push("Reduce junk food frequency.");
  }

  return {
    strengths,
    weaknesses,
    recommendations,
    overallRating: resolveOverallRating(strengths.length, weaknesses.length),
  };
}
