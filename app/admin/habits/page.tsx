"use client";

import { useMemo, useState, type ElementType } from "react";
import {
  Activity,
  BookOpen,
  Dumbbell,
  Loader2,
  RotateCcw,
  Save,
  Shield,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import {
  calculateHabitScore,
  saveHabitEntry,
  type HabitInput,
} from "@/lib/habit";
import { cn } from "@/lib/utils";

const HABIT_TOTAL = 11;

type HabitFormState = HabitInput;

type HabitField = {
  key: keyof Pick<
    HabitInput,
    | "gym_done"
    | "steps_done"
    | "protein_target_done"
    | "water_target_done"
    | "sleep_before_11_done"
    | "reading_done"
    | "english_practice_done"
    | "automation_learning_done"
    | "mma_done"
    | "no_junk_food_done"
    | "family_time_done"
  >;
  label: string;
};

type HabitGroup = {
  title: string;
  icon: ElementType;
  fields: HabitField[];
};

const habitGroups: HabitGroup[] = [
  {
    title: "Health",
    icon: Activity,
    fields: [
      { key: "gym_done", label: "Gym completed" },
      { key: "steps_done", label: "8,000+ steps" },
      { key: "protein_target_done", label: "Protein target hit" },
      { key: "water_target_done", label: "Water target hit" },
      { key: "sleep_before_11_done", label: "Sleep before 11 PM" },
    ],
  },
  {
    title: "Growth",
    icon: BookOpen,
    fields: [
      { key: "reading_done", label: "Reading session" },
      { key: "english_practice_done", label: "English practice" },
      { key: "automation_learning_done", label: "Automation learning" },
      { key: "mma_done", label: "MMA training" },
    ],
  },
  {
    title: "Discipline",
    icon: Shield,
    fields: [
      { key: "no_junk_food_done", label: "No junk food" },
      { key: "family_time_done", label: "Family time" },
    ],
  },
];

const initialForm = (): HabitFormState => ({
  date: new Date().toISOString().split("T")[0],
  gym_done: false,
  steps_done: false,
  protein_target_done: false,
  water_target_done: false,
  sleep_before_11_done: false,
  reading_done: false,
  english_practice_done: false,
  automation_learning_done: false,
  mma_done: false,
  no_junk_food_done: false,
  family_time_done: false,
  notes: null,
});

function countCompletedHabits(form: HabitFormState): number {
  return [
    form.gym_done,
    form.steps_done,
    form.protein_target_done,
    form.water_target_done,
    form.sleep_before_11_done,
    form.reading_done,
    form.english_practice_done,
    form.automation_learning_done,
    form.mma_done,
    form.no_junk_food_done,
    form.family_time_done,
  ].filter(Boolean).length;
}

const cardClassName = cn(
  "rounded-[24px] border border-[#D4AF37]/25 p-6 sm:p-8",
  "bg-gradient-to-br from-[#171717]/90 via-[#0B0B0B]/95 to-[#171717]/80",
  "shadow-[0_0_40px_rgba(212,175,55,0.1)] backdrop-blur-xl",
  "transition-all duration-300 hover:border-[#D4AF37]/35 hover:shadow-[0_0_48px_rgba(212,175,55,0.14)]"
);

const inputClassName = cn(
  "w-full rounded-xl border border-[#D4AF37]/20 bg-[#0B0B0B]/80 px-4 py-3",
  "text-[#F5F5F5] outline-none transition-all duration-300",
  "focus:border-[#D4AF37]/50 focus:shadow-[0_0_20px_rgba(212,175,55,0.12)]"
);

function HabitToggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3.5",
        "transition-all duration-300",
        checked
          ? "border-[#D4AF37]/35 bg-[#D4AF37]/10 shadow-[0_0_20px_rgba(212,175,55,0.12)]"
          : "border-[#D4AF37]/10 bg-[#0B0B0B]/50 hover:border-[#D4AF37]/25"
      )}
    >
      <span className="text-sm font-medium text-[#F5F5F5]">{label}</span>
      <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-full border transition-all duration-300",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-[#D4AF37]/50",
            checked
              ? "border-[#D4AF37]/50 bg-[#D4AF37]/30"
              : "border-[#D4AF37]/20 bg-[#171717]"
          )}
        />
        <span
          aria-hidden
          className={cn(
            "absolute size-5 rounded-full shadow transition-transform duration-300",
            checked
              ? "translate-x-6 bg-[#D4AF37]"
              : "translate-x-1 bg-[#F5F5F5]"
          )}
        />
      </span>
    </label>
  );
}

export default function AdminHabitsPage() {
  const [form, setForm] = useState<HabitFormState>(initialForm);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const habitScore = useMemo(() => calculateHabitScore(form), [form]);
  const completedCount = useMemo(() => countCompletedHabits(form), [form]);

  function updateHabitField<K extends keyof HabitFormState>(
    key: K,
    value: HabitFormState[K]
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      console.log("HABIT FORM", next);
      return next;
    });
  }

  function handleReset() {
    const reset = initialForm();
    setForm(reset);
    setNotes("");
    console.log("HABIT FORM", reset);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.date.trim()) {
      console.log("HABIT ERROR", "Date is required.");
      toast.error("Date is required.");
      return;
    }

    setIsSaving(true);

    const payload: HabitInput = {
      ...form,
      notes: notes.trim() || null,
    };

    console.log("HABIT SAVE", payload);

    try {
      const { data, error } = await saveHabitEntry(payload);

      if (error || !data) {
        throw new Error(error ?? "Failed to save habit entry.");
      }

      console.log("HABIT SAVE", data);
      toast.success("Habits saved successfully");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save habit entry.";
      console.log("HABIT ERROR", message);
      toast.error(message || "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="relative mx-auto max-w-2xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-[#D4AF37]/6 blur-[120px]"
      />

      <div className="relative z-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#F5F5F5] sm:text-4xl">
            Habit Tracker
          </h1>
          <p className="mt-2 text-[#A3A3A3]">
            Track daily habits that build Vignesh 2.0
          </p>
        </header>

        <article className={cn(cardClassName, "mb-6")}>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
              <Target className="size-5 text-[#D4AF37]" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F5]">Live Score</h2>
              <p className="text-sm text-[#A3A3A3]">Updates as you toggle habits</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#D4AF37]/15 bg-[#0B0B0B]/50 px-4 py-5 text-center">
              <p className="text-xs font-medium tracking-wide text-[#A3A3A3] uppercase">
                Habit Score
              </p>
              <p className="mt-2 text-4xl font-bold text-[#D4AF37]">{habitScore}%</p>
            </div>
            <div className="rounded-xl border border-[#D4AF37]/15 bg-[#0B0B0B]/50 px-4 py-5 text-center">
              <p className="text-xs font-medium tracking-wide text-[#A3A3A3] uppercase">
                Completed
              </p>
              <p className="mt-2 text-4xl font-bold text-[#F5F5F5]">
                {completedCount}{" "}
                <span className="text-2xl text-[#A3A3A3]">/ {HABIT_TOTAL}</span>
              </p>
            </div>
          </div>
        </article>

        <form onSubmit={handleSubmit} className="space-y-6">
          <article className={cardClassName}>
            <h2 className="mb-5 text-xl font-bold text-[#F5F5F5]">Daily Entry</h2>
            <label
              htmlFor="date"
              className="mb-2 block text-sm font-medium text-[#A3A3A3]"
            >
              Date
            </label>
            <input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => updateHabitField("date", e.target.value)}
              className={inputClassName}
              required
            />
          </article>

          {habitGroups.map((group) => {
            const Icon = group.icon;

            return (
              <article key={group.title} className={cardClassName}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
                    <Icon className="size-5 text-[#D4AF37]" aria-hidden />
                  </div>
                  <h2 className="text-xl font-bold text-[#F5F5F5]">{group.title}</h2>
                </div>

                <div className="space-y-3">
                  {group.fields.map((field) => (
                    <HabitToggle
                      key={field.key}
                      id={field.key}
                      label={field.label}
                      checked={form[field.key]}
                      onChange={(checked) => updateHabitField(field.key, checked)}
                    />
                  ))}
                </div>
              </article>
            );
          })}

          <article className={cardClassName}>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
                <Dumbbell className="size-5 text-[#D4AF37]" aria-hidden />
              </div>
              <h2 className="text-xl font-bold text-[#F5F5F5]">Notes</h2>
            </div>
            <textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes for today…"
              className={cn(inputClassName, "resize-none placeholder:text-[#A3A3A3]/50")}
            />
          </article>

          <div className="flex flex-col gap-3 sm:flex-row">
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
                  Save Habits
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
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
