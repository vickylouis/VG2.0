import {
  DEFAULT_MISSION_DAYS,
  DEFAULT_MISSION_START_DATE,
} from "@/lib/settings";

export const MISSION_START_DATE = DEFAULT_MISSION_START_DATE;
export const TOTAL_DAYS = DEFAULT_MISSION_DAYS;

function parseDateOnly(value: string): Date {
  return new Date(`${value.trim().slice(0, 10)}T00:00:00`);
}

export function calculateCurrentDay(
  today: Date = new Date(),
  startDate: string = MISSION_START_DATE,
  totalDays: number = TOTAL_DAYS
): number {
  const start = parseDateOnly(startDate);
  const current = new Date(today);
  current.setHours(0, 0, 0, 0);

  const diffMs = current.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(1, Math.min(totalDays, diffDays + 1));
}

export function calculateProgress(
  day: number,
  totalDays: number = TOTAL_DAYS
): number {
  return totalDays > 0 ? Math.round((day / totalDays) * 100) : 0;
}
