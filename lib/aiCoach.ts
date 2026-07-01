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

export function generateCoachReport(input: CoachInput): CoachReport {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  if (input.averageVGScore >= 80) {
    strengths.push("Excellent discipline");
  } else if (input.averageVGScore < 50) {
    weaknesses.push("Low consistency");
  }

  if (input.averageSleep >= 7) {
    strengths.push("Strong sleep habits");
  } else if (input.averageSleep < 6) {
    weaknesses.push("Insufficient sleep");
    recommendations.push("Sleep before 11 PM and target 7+ hours");
  }

  if (input.averageSteps >= 8000) {
    strengths.push("High daily step count");
  } else if (input.averageSteps < 5000) {
    weaknesses.push("Low daily activity");
    recommendations.push("Walk 8000+ steps daily");
  }

  if (input.weightTrend < 0) {
    strengths.push("Weight moving in right direction");
  } else if (input.weightTrend > 0) {
    weaknesses.push("Weight increasing");
    recommendations.push("Reduce calorie intake and track meals");
  }

  if (input.workoutConsistency >= 80) {
    strengths.push("High workout consistency");
  } else if (input.workoutConsistency < 50) {
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
    if (input.habitScore >= 80) {
      strengths.push("Strong overall habit score");
    } else if (input.habitScore < 60) {
      weaknesses.push("Low habit score");
    }
  }

  if (input.gymConsistency != null) {
    if (input.gymConsistency >= 80) {
      strengths.push("Consistent gym habit");
    } else if (input.gymConsistency < 50) {
      weaknesses.push("Inconsistent gym habit");
    }
  }

  if (input.sleepHabitConsistency != null && input.sleepHabitConsistency < 60) {
    weaknesses.push("Weak sleep habit consistency");
    recommendations.push("Fix bedtime routine. Sleep before 11 PM.");
  }

  if (input.proteinConsistency != null && input.proteinConsistency < 60) {
    weaknesses.push("Low protein habit consistency");
    recommendations.push("Improve daily protein consistency.");
  }

  if (input.junkFoodDiscipline != null && input.junkFoodDiscipline < 70) {
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
