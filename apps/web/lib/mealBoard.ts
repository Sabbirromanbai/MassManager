export const EGG_PRICE_PER_PIECE = 13;
export const GUEST_RATE_PER_MEAL = 70;

export const WEEKDAY_KEYS = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
] as const;

export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export function getWeekdayKey(day: number, month: string): WeekdayKey | null {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthNumber = Number(monthStr);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(monthNumber) ||
    monthNumber < 1 ||
    monthNumber > 12 ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  return WEEKDAY_KEYS[new Date(year, monthNumber - 1, day).getDay()] ?? null;
}

export function isFriday(day: number, month: string): boolean {
  return getWeekdayKey(day, month) === "fri";
}
