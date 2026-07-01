import { supabase } from "@/lib/supabase";

export type JournalEntry = {
  id: string;
  date: string;
  mood: number | null;
  energy: number | null;
  discipline: number | null;
  wins: string | null;
  failures: string | null;
  reflection: string | null;
  created_at: string;
};

export type JournalInput = {
  date: string;
  mood?: number | null;
  energy?: number | null;
  discipline?: number | null;
  wins?: string | null;
  failures?: string | null;
  reflection?: string | null;
};

export type JournalHistorySummary = {
  totalEntries: number;
  averageMood: number | null;
  averageEnergy: number | null;
  averageDiscipline: number | null;
};

export type JournalSentiment = {
  label: "Positive" | "Neutral" | "Low Motivation";
  tone: "positive" | "neutral" | "low";
};

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: string }).message);
  }
  return fallback;
}

function normalizeDate(date: string): string {
  return date.trim().slice(0, 10);
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildJournalPayload(input: JournalInput) {
  return {
    date: normalizeDate(input.date),
    mood: input.mood ?? null,
    energy: input.energy ?? null,
    discipline: input.discipline ?? null,
    wins: normalizeOptionalText(input.wins),
    failures: normalizeOptionalText(input.failures),
    reflection: normalizeOptionalText(input.reflection),
  };
}

export function formatJournalDate(date: string): string {
  const parsed = new Date(`${normalizeDate(date)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatJournalScore(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value}/10`;
}

function averageNumericField(
  entries: JournalEntry[],
  field: "mood" | "energy" | "discipline"
): number | null {
  const values = entries
    .map((entry) => entry[field])
    .filter((value): value is number => value != null && !Number.isNaN(value));

  if (values.length === 0) return null;

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(average * 10) / 10;
}

export function getJournalSentiment(mood: number | null): JournalSentiment | null {
  if (mood == null || Number.isNaN(mood)) return null;

  if (mood >= 8) {
    return { label: "Positive", tone: "positive" };
  }

  if (mood >= 5) {
    return { label: "Neutral", tone: "neutral" };
  }

  return { label: "Low Motivation", tone: "low" };
}

export function calculateJournalHistorySummary(
  entries: JournalEntry[]
): JournalHistorySummary {
  return {
    totalEntries: entries.length,
    averageMood: averageNumericField(entries, "mood"),
    averageEnergy: averageNumericField(entries, "energy"),
    averageDiscipline: averageNumericField(entries, "discipline"),
  };
}

export async function getJournalHistory(): Promise<{
  data: JournalEntry[];
  error: string | null;
}> {
  console.log("JOURNAL HISTORY FETCH START", { table: "journal_entries" });

  try {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("JOURNAL HISTORY FETCH ERROR", error.message);
      return { data: [], error: error.message };
    }

    const entries = (data ?? []).map((row) => ({
      ...(row as JournalEntry),
      date: normalizeDate(String(row.date)),
    }));

    console.log("JOURNAL HISTORY FETCH SUCCESS", {
      table: "journal_entries",
      count: entries.length,
    });

    return { data: entries, error: null };
  } catch (err) {
    const message = getErrorMessage(err, "Failed to fetch journal history");
    console.error("JOURNAL HISTORY FETCH ERROR", message);
    return { data: [], error: message };
  }
}

export async function deleteJournalEntry(id: string): Promise<{
  error: string | null;
}> {
  try {
    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", id);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return {
      error: getErrorMessage(err, "Failed to delete journal entry"),
    };
  }
}

export async function getJournalEntries(): Promise<{
  data: JournalEntry[] | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data ?? []) as JournalEntry[], error: null };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err, "Failed to fetch journal entries"),
    };
  }
}

export async function saveJournalEntry(input: JournalInput): Promise<{
  data: JournalEntry | null;
  error: string | null;
}> {
  if (!input.date.trim()) {
    return { data: null, error: "Date is required." };
  }

  const payload = buildJournalPayload(input);

  try {
    const { data: existing, error: lookupError } = await supabase
      .from("journal_entries")
      .select("id, date")
      .eq("date", payload.date)
      .maybeSingle();

    if (lookupError) {
      return { data: null, error: lookupError.message };
    }

    if (existing?.id) {
      const { data, error } = await supabase
        .from("journal_entries")
        .update({
          mood: payload.mood,
          energy: payload.energy,
          discipline: payload.discipline,
          wins: payload.wins,
          failures: payload.failures,
          reflection: payload.reflection,
        })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      if (!data) {
        return {
          data: null,
          error:
            "Update failed: no row returned. Check Supabase RLS policies for journal_entries.",
        };
      }

      return { data: data as JournalEntry, error: null };
    }

    const { data, error } = await supabase
      .from("journal_entries")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return {
        data: null,
        error:
          "Insert failed: no row returned. Check Supabase RLS policies for journal_entries.",
      };
    }

    return { data: data as JournalEntry, error: null };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err, "Failed to save journal entry"),
    };
  }
}

export async function getLatestJournal(): Promise<{
  data: JournalEntry | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as JournalEntry | null) ?? null, error: null };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err, "Failed to fetch latest journal entry"),
    };
  }
}

export async function getJournalEntryByDate(date: string): Promise<{
  data: JournalEntry | null;
  error: string | null;
}> {
  const normalizedDate = normalizeDate(date);

  if (!normalizedDate) {
    console.log("JOURNAL ERROR", "Date is required.");
    return { data: null, error: "Date is required." };
  }

  console.log("JOURNAL FETCH BY DATE", { date: normalizedDate });

  try {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("date", normalizedDate)
      .maybeSingle();

    if (error) {
      console.log("JOURNAL ERROR", error.message);
      return { data: null, error: error.message };
    }

    const entry = (data as JournalEntry | null) ?? null;

    console.log("JOURNAL FETCH BY DATE", {
      date: normalizedDate,
      found: entry != null,
      id: entry?.id ?? null,
    });

    return { data: entry, error: null };
  } catch (err) {
    const message = getErrorMessage(err, "Failed to fetch journal entry");
    console.log("JOURNAL ERROR", message);
    return { data: null, error: message };
  }
}
