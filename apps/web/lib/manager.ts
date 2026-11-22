const ROTATION = [
  "Md Sabbir Hossen",
  "Arif",
  "Ashraful",
  "Chaitway Marma",
];

const ROTATION_START_MONTH = "2026-11";
const MONTHS_PER_MANAGER = 2;

function parseMonth(month: string): { year: number; month: number } {
  const parts = month.split("-");
  const yearStr = parts[0];
  const monthStr = parts[1];
  if (!yearStr || !monthStr) {
    throw new Error(`Invalid month format: ${month}`);
  }
  return { year: parseInt(yearStr, 10), month: parseInt(monthStr, 10) };
}

function monthToIndex(month: string): number {
  const { year, month: monthNum } = parseMonth(month);
  const { year: startYear, month: startMonth } = parseMonth(ROTATION_START_MONTH);
  return (year - startYear) * 12 + (monthNum - startMonth);
}

function getCurrentMonthInternal(): string {
  const now = new Date();
  const dhakaOffset = 6 * 60;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const dhakaTime = new Date(utc + dhakaOffset * 60000);
  const year = dhakaTime.getFullYear();
  const month = String(dhakaTime.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getManagerNameForMonth(month: string): string {
  const index = monthToIndex(month);
  if (index < 0) {
    return ROTATION[0]!;
  }
  const managerIndex = Math.floor(index / MONTHS_PER_MANAGER) % ROTATION.length;
  return ROTATION[managerIndex]!;
}

export function getCurrentMonth(): string {
  return getCurrentMonthInternal();
}

export function isManagerName(name: string): boolean {
  const currentMonth = getCurrentMonthInternal();
  const managerName = getManagerNameForMonth(currentMonth);
  return name === managerName;
}

export function getManagerRotationIndex(month: string): number {
  const index = monthToIndex(month);
  if (index < 0) {
    return 0;
  }
  return Math.floor(index / MONTHS_PER_MANAGER) % ROTATION.length;
}