"use client";

import { useCallback, useEffect, useState } from "react";
import { Brain, Loader2, RotateCcw, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  getLatestJournal,
  saveJournalEntry,
  type JournalEntry,
} from "@/lib/journal";
import { cn } from "@/lib/utils";

type JournalFormState = {
  date: string;
  mood: string;
  energy: string;
  discipline: string;
  wins: string;
  failures: string;
  reflection: string;
};

const initialForm = (): JournalFormState => ({
  date: new Date().toISOString().split("T")[0],
  mood: "",
  energy: "",
  discipline: "",
  wins: "",
  failures: "",
  reflection: "",
});

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

function formatScore(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value}/10`;
}

function parseOptionalScore(
  value: string,
  label: string
): { score: number | null; error: string | null } {
  if (value.trim() === "") return { score: null, error: null };

  const score = Number(value);
  if (!Number.isInteger(score) || score < 1 || score > 10) {
    return {
      score: null,
      error: `${label} must be a whole number between 1 and 10.`,
    };
  }

  return { score, error: null };
}

function validateForm(form: JournalFormState): string | null {
  if (!form.date.trim()) return "Date is required.";

  for (const [field, label] of [
    [form.mood, "Mood"],
    [form.energy, "Energy"],
    [form.discipline, "Discipline"],
  ] as const) {
    const { error } = parseOptionalScore(field, label);
    if (error) return error;
  }

  return null;
}

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#D4AF37]/10 bg-[#0B0B0B]/50 px-4 py-4 text-center">
      <p className="text-xs font-medium tracking-wide text-[#A3A3A3] uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-[#D4AF37]">{value}</p>
    </div>
  );
}

export default function AdminJournalPage() {
  const [form, setForm] = useState<JournalFormState>(initialForm);
  const [latestJournal, setLatestJournal] = useState<JournalEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  const loadLatestJournal = useCallback(async () => {
    setIsLoadingSummary(true);

    const { data, error: fetchError } = await getLatestJournal();

    if (fetchError) {
      toast.error(fetchError || "Something went wrong");
      setLatestJournal(null);
    } else {
      setLatestJournal(data);
    }

    setIsLoadingSummary(false);
  }, []);

  useEffect(() => {
    void loadLatestJournal();
  }, [loadLatestJournal]);

  function updateField<K extends keyof JournalFormState>(
    key: K,
    value: JournalFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleReset() {
    setForm(initialForm());
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationError = validateForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const moodResult = parseOptionalScore(form.mood, "Mood");
    const energyResult = parseOptionalScore(form.energy, "Energy");
    const disciplineResult = parseOptionalScore(form.discipline, "Discipline");

    const scoreError =
      moodResult.error ?? energyResult.error ?? disciplineResult.error;
    if (scoreError) {
      toast.error(scoreError);
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        date: form.date,
        mood: moodResult.score,
        energy: energyResult.score,
        discipline: disciplineResult.score,
        wins: form.wins.trim() || null,
        failures: form.failures.trim() || null,
        reflection: form.reflection.trim() || null,
      };

      const { data, error: saveError } = await saveJournalEntry(payload);

      if (saveError || !data) {
        throw new Error(saveError ?? "Failed to save journal entry.");
      }

      toast.success("Journal saved successfully");
      await loadLatestJournal();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save journal entry.";
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
            Journal Dashboard
          </h1>
          <p className="mt-2 text-[#A3A3A3]">
            Track mindset, discipline, and mental growth
          </p>
        </header>

        <article
          className={cn(
            "mb-6 rounded-2xl border border-[#D4AF37]/25 p-6 sm:p-8",
            "bg-gradient-to-br from-[#171717]/90 via-[#0B0B0B]/95 to-[#171717]/80",
            "shadow-[0_0_40px_rgba(212,175,55,0.12)] backdrop-blur-xl"
          )}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
              <Sparkles className="size-5 text-[#D4AF37]" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F5]">
                Latest Journal Stats
              </h2>
              <p className="text-sm text-[#A3A3A3]">
                {latestJournal
                  ? `Last entry: ${latestJournal.date}`
                  : "Most recent mindset snapshot"}
              </p>
            </div>
          </div>

          {isLoadingSummary ? (
            <div
              className="flex h-24 items-center justify-center"
              aria-busy="true"
            >
              <Loader2
                className="size-6 animate-spin text-[#D4AF37]"
                aria-hidden
              />
            </div>
          ) : latestJournal ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryStat label="Mood" value={formatScore(latestJournal.mood)} />
              <SummaryStat
                label="Energy"
                value={formatScore(latestJournal.energy)}
              />
              <SummaryStat
                label="Discipline"
                value={formatScore(latestJournal.discipline)}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D4AF37]/20 bg-[#0B0B0B]/40 px-6 py-8 text-center">
              <Brain className="mx-auto mb-3 size-8 text-[#D4AF37]/60" aria-hidden />
              <p className="text-sm font-medium text-[#F5F5F5]">
                No journal entries yet
              </p>
              <p className="mt-1 text-sm text-[#A3A3A3]">
                Log your first reflection below.
              </p>
            </div>
          )}
        </article>

        <article
          className={cn(
            "rounded-[24px] border border-[#D4AF37]/25 p-6 sm:p-8",
            "bg-gradient-to-br from-[#171717]/90 via-[#0B0B0B]/95 to-[#171717]/80",
            "shadow-[0_0_40px_rgba(212,175,55,0.1)] backdrop-blur-xl"
          )}
        >
          <h2 className="mb-6 text-xl font-bold text-[#F5F5F5]">
            Daily Journal Entry
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

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <FieldLabel htmlFor="mood">Mood (1–10)</FieldLabel>
                <input
                  id="mood"
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  value={form.mood}
                  onChange={(e) => updateField("mood", e.target.value)}
                  placeholder="e.g. 8"
                  className={inputClassName}
                />
              </div>
              <div>
                <FieldLabel htmlFor="energy">Energy (1–10)</FieldLabel>
                <input
                  id="energy"
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  value={form.energy}
                  onChange={(e) => updateField("energy", e.target.value)}
                  placeholder="e.g. 7"
                  className={inputClassName}
                />
              </div>
              <div>
                <FieldLabel htmlFor="discipline">Discipline (1–10)</FieldLabel>
                <input
                  id="discipline"
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  value={form.discipline}
                  onChange={(e) => updateField("discipline", e.target.value)}
                  placeholder="e.g. 9"
                  className={inputClassName}
                />
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="wins">Wins</FieldLabel>
              <textarea
                id="wins"
                rows={3}
                value={form.wins}
                onChange={(e) => updateField("wins", e.target.value)}
                placeholder="What went well today?"
                className={cn(inputClassName, "resize-none")}
              />
            </div>

            <div>
              <FieldLabel htmlFor="failures">Failures</FieldLabel>
              <textarea
                id="failures"
                rows={3}
                value={form.failures}
                onChange={(e) => updateField("failures", e.target.value)}
                placeholder="What could have gone better?"
                className={cn(inputClassName, "resize-none")}
              />
            </div>

            <div>
              <FieldLabel htmlFor="reflection">Reflection</FieldLabel>
              <textarea
                id="reflection"
                rows={4}
                value={form.reflection}
                onChange={(e) => updateField("reflection", e.target.value)}
                placeholder="Honest thoughts on the day…"
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
                    Save Journal
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
        </article>
      </div>
    </div>
  );
}
