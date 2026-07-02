"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  calculateVGScore,
  getVGScoreColor,
  getVGScoreGrade,
  getVGScoreStatus,
  isScoreReady,
} from "@/lib/vgScore";
import { DEFAULT_VG_GRADE_BANDS } from "@/lib/scoringSettingsConfig";
import { fetchClientSettings } from "@/lib/settingsClient";
import type { AiCoachConfig, VgGradeBands } from "@/lib/settings";
import { DEFAULT_AI_CONFIG } from "@/lib/aiSettingsConfig";
import { cn } from "@/lib/utils";

const supabase = createClient();

type FormState = {
  date: string;
  weight: string;
  waist: string;
  steps: string;
  sleepHours: string;
  workoutDone: boolean;
  cheatMeal: boolean;
  notes: string;
};

type BodyMetricRow = {
  id: string;
  date: string;
  weight: number;
  waist: number | null;
  steps: number | null;
  sleep_hours: number | null;
  workout_done: boolean;
  cheat_meal: boolean;
  notes: string | null;
};

type DisplayMetrics = {
  date: string;
  weight: number | null;
  waist: number | null;
  steps: number | null;
  sleepHours: number | null;
  workoutDone: boolean;
  cheatMeal: boolean;
};

const initialForm = (): FormState => ({
  date: new Date().toISOString().split("T")[0],
  weight: "",
  waist: "",
  steps: "",
  sleepHours: "",
  workoutDone: false,
  cheatMeal: false,
  notes: "",
});

function normalizeDate(date: string): string {
  return date.trim().slice(0, 10);
}

function bodyMetricToForm(row: BodyMetricRow): FormState {
  return {
    date: normalizeDate(String(row.date)),
    weight: String(row.weight),
    waist: row.waist != null ? String(row.waist) : "",
    steps: row.steps != null ? String(row.steps) : "",
    sleepHours: row.sleep_hours != null ? String(row.sleep_hours) : "",
    workoutDone: row.workout_done,
    cheatMeal: row.cheat_meal,
    notes: row.notes ?? "",
  };
}

function bodyMetricToDisplay(row: BodyMetricRow): DisplayMetrics {
  return {
    date: normalizeDate(String(row.date)),
    weight: row.weight,
    waist: row.waist,
    steps: row.steps,
    sleepHours: row.sleep_hours,
    workoutDone: row.workout_done,
    cheatMeal: row.cheat_meal,
  };
}

function displayToScoreInput(metrics: DisplayMetrics) {
  return {
    workout_done: metrics.workoutDone,
    cheat_meal: metrics.cheatMeal,
    steps: metrics.steps ?? undefined,
    sleep_hours: metrics.sleepHours ?? undefined,
  };
}

function formatMetric(value: number | null, suffix = ""): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value}${suffix}`;
}

function validateForm(form: FormState): string | null {
  if (!form.date) return "Date is required.";

  const weight = Number(form.weight);
  if (!form.weight || Number.isNaN(weight) || weight < 30 || weight > 200) {
    return "Weight must be between 30 and 200 kg.";
  }

  const waist = Number(form.waist);
  if (!form.waist || Number.isNaN(waist) || waist < 20 || waist > 80) {
    return "Waist must be between 20 and 80 inches.";
  }

  if (form.steps !== "") {
    const steps = Number(form.steps);
    if (Number.isNaN(steps) || steps < 0 || steps > 50000) {
      return "Steps must be between 0 and 50,000.";
    }
  }

  if (form.sleepHours !== "") {
    const sleep = Number(form.sleepHours);
    if (Number.isNaN(sleep) || sleep < 0 || sleep > 24) {
      return "Sleep hours must be between 0 and 24.";
    }
  }

  return null;
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-medium text-[#A3A3A3]"
    >
      {children}
    </label>
  );
}

const inputClassName = cn(
  "w-full rounded-xl border border-[#D4AF37]/20 bg-[#0B0B0B]/80 px-4 py-3",
  "text-[#F5F5F5] placeholder:text-[#A3A3A3]/50",
  "outline-none transition-all duration-300",
  "focus:border-[#D4AF37]/50 focus:shadow-[0_0_20px_rgba(212,175,55,0.12)]"
);

export default function AdminDashboardPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [displayMetrics, setDisplayMetrics] = useState<DisplayMetrics | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [aiRules, setAiRules] = useState<
    Pick<
      AiCoachConfig,
      "daily_steps_goal" | "sleep_good_threshold" | "sleep_bad_threshold"
    >
  >(DEFAULT_AI_CONFIG);
  const [gradeBands, setGradeBands] = useState<VgGradeBands>(
    DEFAULT_VG_GRADE_BANDS
  );

  useEffect(() => {
    void fetchClientSettings().then((settings) => {
      if (!settings) return;
      setAiRules(settings.ai);
      setGradeBands(settings.scoring.vg_grade_bands);
    });
  }, []);

  async function refreshMetricsFromDb(params: {
    id?: string;
    date: string;
  }): Promise<BodyMetricRow> {
    const normalizedDate = normalizeDate(params.date);

    let query = supabase.from("body_metrics").select("*");

    if (params.id) {
      query = query.eq("id", params.id);
    } else {
      query = query.eq("date", normalizedDate);
    }

    const { data, error: refreshError } = await query.single();

    if (refreshError) throw refreshError;
    if (!data) {
      throw new Error("Refresh failed: saved row not found in body_metrics.");
    }

    return data as BodyMetricRow;
  }

  useEffect(() => {
    async function loadMetricsForToday() {
      const today = normalizeDate(new Date().toISOString().split("T")[0]);
      const { data, error: loadError } = await supabase
        .from("body_metrics")
        .select("*")
        .eq("date", today)
        .maybeSingle();

      if (loadError || !data) return;

      const row = data as BodyMetricRow;
      setForm(bodyMetricToForm(row));
      setDisplayMetrics(bodyMetricToDisplay(row));
    }

    void loadMetricsForToday();
  }, []);

  const scoreReady = isScoreReady(form.date, form.weight);

  const vgScore = useMemo(() => {
    if (!scoreReady) return 0;

    return calculateVGScore(
      {
        workout_done: form.workoutDone,
        cheat_meal: form.cheatMeal,
        steps: form.steps !== "" ? Number(form.steps) : undefined,
        sleep_hours: form.sleepHours !== "" ? Number(form.sleepHours) : undefined,
      },
      aiRules
    );
  }, [
    scoreReady,
    form.workoutDone,
    form.cheatMeal,
    form.steps,
    form.sleepHours,
    aiRules,
  ]);

  const scoreColor = getVGScoreColor(vgScore, scoreReady, gradeBands);
  const grade = getVGScoreGrade(vgScore, scoreReady, gradeBands);
  const status = getVGScoreStatus(vgScore, scoreReady, gradeBands);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleReset() {
    setForm(initialForm());
    setDisplayMetrics(null);
  }

  function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "object" && err !== null && "message" in err) {
      return String((err as { message: string }).message);
    }
    return "Failed to save metrics.";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationError = validateForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSaving(true);

    const payload = {
      date: normalizeDate(form.date),
      weight: Number(form.weight),
      waist: form.waist ? Number(form.waist) : null,
      steps: form.steps ? Number(form.steps) : null,
      sleep_hours: form.sleepHours ? Number(form.sleepHours) : null,
      workout_done: form.workoutDone,
      cheat_meal: form.cheatMeal,
      notes: form.notes.trim() || null,
    };

    if (!payload.date || !payload.weight) {
      toast.error("Date and weight are required.");
      setIsSaving(false);
      return;
    }

    if (Number.isNaN(payload.weight)) {
      toast.error("Weight must be a valid number.");
      setIsSaving(false);
      return;
    }

    try {
      const { data: existing, error: fetchError } = await supabase
        .from("body_metrics")
        .select("id, date, weight, created_at")
        .eq("date", payload.date)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let savedRows: unknown[] | null = null;

      if (existing?.id) {
        const { data, error } = await supabase
          .from("body_metrics")
          .update({
            weight: payload.weight,
            waist: payload.waist,
            steps: payload.steps,
            sleep_hours: payload.sleep_hours,
            workout_done: payload.workout_done,
            cheat_meal: payload.cheat_meal,
            notes: payload.notes,
          })
          .eq("id", existing.id)
          .select();

        if (error) throw error;
        savedRows = data;
      } else {
        const { data, error } = await supabase
          .from("body_metrics")
          .insert([payload])
          .select();

        if (error) throw error;
        savedRows = data;
      }

      if (!savedRows || savedRows.length === 0) {
        throw new Error(
          "Save failed: no rows returned. Check Supabase RLS policies for INSERT/UPDATE on body_metrics."
        );
      }

      const returned = savedRows[0] as {
        id?: string;
        date?: string;
        weight?: number;
      };

      const refreshedRow = await refreshMetricsFromDb({
        id: returned.id,
        date: payload.date,
      });

      setForm(bodyMetricToForm(refreshedRow));
      setDisplayMetrics(bodyMetricToDisplay(refreshedRow));
      toast.success("Metrics saved successfully");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="relative mx-auto min-w-0 max-w-2xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-[#D4AF37]/6 blur-[120px]"
      />

      <div className="relative z-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#F5F5F5] sm:text-4xl">
            Metrics Dashboard
          </h1>
          <p className="mt-2 text-[#A3A3A3]">
            Update daily transformation metrics
          </p>
        </header>

        <article
          className={cn(
            "mb-6 rounded-2xl border border-[#D4AF37]/25 p-6 sm:p-8",
            "bg-gradient-to-br from-[#171717]/90 via-[#0B0B0B]/95 to-[#171717]/80",
            "shadow-[0_0_40px_rgba(212,175,55,0.12)] backdrop-blur-xl"
          )}
        >
          <p className="text-sm font-medium text-[#A3A3A3]">
            Today&apos;s VG Score
          </p>
          <p
            className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            style={{ color: scoreColor }}
          >
            {vgScore}
            <span className="text-2xl font-semibold text-[#A3A3A3] sm:text-3xl">
              /100
            </span>
          </p>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs text-[#A3A3A3]">
              <span>Progress</span>
              <span style={{ color: scoreColor }}>{vgScore}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#0B0B0B]">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${vgScore}%`,
                  backgroundColor: scoreColor,
                  boxShadow: scoreReady
                    ? `0 0 12px ${scoreColor}66`
                    : undefined,
                }}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#D4AF37]/10 bg-[#0B0B0B]/50 px-4 py-3">
              <p className="text-xs text-[#A3A3A3]">Grade</p>
              <p
                className="mt-1 text-lg font-bold"
                style={{ color: scoreColor }}
              >
                {grade}
              </p>
            </div>
            <div className="rounded-xl border border-[#D4AF37]/10 bg-[#0B0B0B]/50 px-4 py-3">
              <p className="text-xs text-[#A3A3A3]">Status</p>
              <p className="mt-1 text-sm font-medium text-[#F5F5F5]">{status}</p>
            </div>
          </div>

          {!scoreReady && (
            <p className="mt-4 text-xs text-[#A3A3A3]">
              Enter date and weight to calculate your score.
            </p>
          )}
        </article>

        <article
          className={cn(
            "mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4",
            "rounded-2xl border border-[#D4AF37]/15 p-4 sm:p-5",
            "bg-[#171717]/60 backdrop-blur-xl"
          )}
        >
          {(
            [
              {
                label: "Weight",
                value: formatMetric(displayMetrics?.weight ?? null, " kg"),
              },
              {
                label: "Waist",
                value: formatMetric(displayMetrics?.waist ?? null, " in"),
              },
              {
                label: "Steps",
                value: formatMetric(displayMetrics?.steps ?? null),
              },
              {
                label: "Sleep",
                value: formatMetric(displayMetrics?.sleepHours ?? null, " hrs"),
              },
            ] as const
          ).map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-[#D4AF37]/10 bg-[#0B0B0B]/50 px-4 py-3"
            >
              <p className="text-xs text-[#A3A3A3]">{label}</p>
              <p className="mt-1 text-lg font-bold text-[#F5F5F5]">{value}</p>
            </div>
          ))}
        </article>

        <article
          className={cn(
            "rounded-[24px] border border-[#D4AF37]/25 p-6 sm:p-8",
            "bg-gradient-to-br from-[#171717]/90 via-[#0B0B0B]/95 to-[#171717]/80",
            "shadow-[0_0_40px_rgba(212,175,55,0.1)] backdrop-blur-xl"
          )}
        >
          <h2 className="mb-6 text-xl font-bold text-[#F5F5F5]">
            Daily Metrics Update
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <FieldLabel htmlFor="date">Date</FieldLabel>
              <input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
                className={inputClassName}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="weight">Weight (kg)</FieldLabel>
                <input
                  id="weight"
                  type="number"
                  min={30}
                  max={200}
                  step="0.1"
                  value={form.weight}
                  onChange={(e) => updateField("weight", e.target.value)}
                  placeholder="e.g. 89"
                  className={inputClassName}
                  required
                />
              </div>
              <div>
                <FieldLabel htmlFor="waist">Waist (inches)</FieldLabel>
                <input
                  id="waist"
                  type="number"
                  min={20}
                  max={80}
                  step="0.1"
                  value={form.waist}
                  onChange={(e) => updateField("waist", e.target.value)}
                  placeholder="e.g. 36"
                  className={inputClassName}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="steps">Steps</FieldLabel>
                <input
                  id="steps"
                  type="number"
                  min={0}
                  max={50000}
                  value={form.steps}
                  onChange={(e) => updateField("steps", e.target.value)}
                  placeholder="e.g. 8000"
                  className={inputClassName}
                />
              </div>
              <div>
                <FieldLabel htmlFor="sleepHours">Sleep Hours</FieldLabel>
                <input
                  id="sleepHours"
                  type="number"
                  min={0}
                  max={24}
                  step="0.1"
                  value={form.sleepHours}
                  onChange={(e) => updateField("sleepHours", e.target.value)}
                  placeholder="e.g. 7.5"
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.workoutDone}
                  onChange={(e) => updateField("workoutDone", e.target.checked)}
                  className="size-4 rounded border-[#D4AF37]/40 bg-[#0B0B0B] accent-[#D4AF37]"
                />
                <span className="text-sm font-medium text-[#F5F5F5]">
                  Workout Done
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.cheatMeal}
                  onChange={(e) => updateField("cheatMeal", e.target.checked)}
                  className="size-4 rounded border-[#D4AF37]/40 bg-[#0B0B0B] accent-[#D4AF37]"
                />
                <span className="text-sm font-medium text-[#F5F5F5]">
                  Cheat Meal
                </span>
              </label>
            </div>

            <div>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <textarea
                id="notes"
                rows={4}
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Optional notes for the day…"
                className={cn(inputClassName, "resize-none")}
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="submit"
                disabled={isSaving}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#D4AF37] py-3.5",
                  "text-sm font-semibold text-[#0B0B0B]",
                  "transition-all duration-300 shadow-[0_0_24px_rgba(212,175,55,0.2)]",
                  "hover:shadow-[0_0_36px_rgba(212,175,55,0.35)]",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="size-4" aria-hidden />
                    Save Metrics
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#D4AF37]/40 py-3.5",
                  "text-sm font-semibold text-[#D4AF37]",
                  "transition-all duration-300 hover:bg-[#D4AF37]/10",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                <RotateCcw className="size-4" aria-hidden />
                Reset Form
              </button>
            </div>
          </form>
        </article>
      </div>
    </div>
  );
}
