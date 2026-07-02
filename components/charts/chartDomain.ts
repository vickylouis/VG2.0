import type { TrendChartPoint } from "@/lib/analytics";

export function computeNumericTrendDomain(
  data: TrendChartPoint[],
  padding = 1
): [number, number] | undefined {
  const values = data
    .map((point) => Number(point.value))
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) return undefined;

  const min = Math.min(...values);
  const max = Math.max(...values);

  return [min - padding, max + padding];
}

export function formatAxisUnit(value: unknown, unit: string): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return unit.trim();
  return `${numeric}${unit}`;
}
