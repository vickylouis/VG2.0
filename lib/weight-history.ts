import { supabase } from "@/lib/supabase";

export type WeightDataPoint = {
  date: string;
  weight: number;
  formattedDate: string;
};

export async function getWeightHistory(): Promise<{
  data: WeightDataPoint[] | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("body_metrics")
      .select("date, weight")
      .order("date", { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    const points = (data ?? []).map((row) => ({
      date: row.date as string,
      weight: Number(row.weight),
      formattedDate: new Date(`${row.date as string}T00:00:00`).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric" }
      ),
    }));

    return { data: points, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch weight history";
    return { data: null, error: message };
  }
}
