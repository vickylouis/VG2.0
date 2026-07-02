import { readConfigNumber } from "@/lib/configFallback";
import type { AppSettingsConfig, ScoringConfig, VgGradeBands } from "@/lib/settings";

export const DEFAULT_VG_GRADE_BANDS: VgGradeBands = {
  A: 90,
  B: 75,
  C: 50,
};

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  habit_weight: 40,
  metrics_weight: 40,
  journal_weight: 20,
  vg_grade_bands: { ...DEFAULT_VG_GRADE_BANDS },
};

function resolveVgGradeBands(source: unknown): VgGradeBands {
  const bands =
    typeof source === "object" && source !== null
      ? (source as Partial<VgGradeBands>)
      : undefined;

  const A = readConfigNumber(
    "scoring",
    "vg_grade_bands.A",
    bands?.A,
    DEFAULT_VG_GRADE_BANDS.A
  );
  const B = readConfigNumber(
    "scoring",
    "vg_grade_bands.B",
    bands?.B,
    DEFAULT_VG_GRADE_BANDS.B
  );
  const C = readConfigNumber(
    "scoring",
    "vg_grade_bands.C",
    bands?.C,
    DEFAULT_VG_GRADE_BANDS.C
  );

  return { A, B, C };
}

export function resolveScoringConfig(
  config: AppSettingsConfig | null | undefined
): ScoringConfig {
  const source = config?.scoring;

  return {
    habit_weight: readConfigNumber(
      "scoring",
      "habit_weight",
      source?.habit_weight,
      DEFAULT_SCORING_CONFIG.habit_weight
    ),
    metrics_weight: readConfigNumber(
      "scoring",
      "metrics_weight",
      source?.metrics_weight,
      DEFAULT_SCORING_CONFIG.metrics_weight
    ),
    journal_weight: readConfigNumber(
      "scoring",
      "journal_weight",
      source?.journal_weight,
      DEFAULT_SCORING_CONFIG.journal_weight
    ),
    vg_grade_bands: resolveVgGradeBands(source?.vg_grade_bands),
  };
}

export type ScoringFormState = {
  habit_weight: string;
  metrics_weight: string;
  journal_weight: string;
  grade_a: string;
  grade_b: string;
  grade_c: string;
};

export function toScoringForm(scoring: ScoringConfig): ScoringFormState {
  return {
    habit_weight: String(scoring.habit_weight),
    metrics_weight: String(scoring.metrics_weight),
    journal_weight: String(scoring.journal_weight),
    grade_a: String(scoring.vg_grade_bands.A),
    grade_b: String(scoring.vg_grade_bands.B),
    grade_c: String(scoring.vg_grade_bands.C),
  };
}

export function fromScoringForm(form: ScoringFormState): ScoringConfig {
  return {
    habit_weight: Number(form.habit_weight),
    metrics_weight: Number(form.metrics_weight),
    journal_weight: Number(form.journal_weight),
    vg_grade_bands: {
      A: Number(form.grade_a),
      B: Number(form.grade_b),
      C: Number(form.grade_c),
    },
  };
}

export function calculateScoringTotal(form: ScoringFormState): number {
  const habit = Number(form.habit_weight);
  const metrics = Number(form.metrics_weight);
  const journal = Number(form.journal_weight);

  if ([habit, metrics, journal].some((value) => Number.isNaN(value))) {
    return NaN;
  }

  return habit + metrics + journal;
}

export function validateScoringConfig(form: ScoringFormState): string | null {
  const fields: Array<[keyof ScoringFormState, string]> = [
    ["habit_weight", "Habit weight"],
    ["metrics_weight", "Metrics weight"],
    ["journal_weight", "Journal weight"],
    ["grade_a", "Grade A threshold"],
    ["grade_b", "Grade B threshold"],
    ["grade_c", "Grade C threshold"],
  ];

  for (const [key, label] of fields) {
    const parsed = Number(form[key]);
    if (!form[key].trim() || Number.isNaN(parsed) || parsed < 0) {
      return `${label} must be a non-negative number.`;
    }
  }

  const total = calculateScoringTotal(form);
  if (total !== 100) {
    return "Scoring weights must total 100";
  }

  const gradeA = Number(form.grade_a);
  const gradeB = Number(form.grade_b);
  const gradeC = Number(form.grade_c);

  if (gradeA < gradeB || gradeB < gradeC) {
    return "VG grade bands must satisfy A >= B >= C.";
  }

  return null;
}
