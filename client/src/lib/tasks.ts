import type { Task } from "@/api/tasks";

export function totalMinutes(tasks: Task[]): number {
  return tasks.reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0);
}

export function formatMinutes(m: number): string {
  if (m < 60) return `${m}m`;
  const hours = Math.floor(m / 60);
  const remainder = m % 60;
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}

// Compute a position value that places an item between two neighbors in an ordered list.
// Pass the new neighbors after the conceptual move; either side may be undefined for ends.
// Uses midpoint between neighbors so we never have to renumber adjacent rows.
export function positionBetween(
  prev: number | undefined,
  next: number | undefined,
): number {
  if (prev === undefined && next === undefined) return 0;
  if (prev === undefined) return (next as number) - 1;
  if (next === undefined) return prev + 1;
  return (prev + next) / 2;
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayLocal(): string {
  return formatLocalDate(new Date());
}

// Monday-of-week for a given local date string (or today if omitted), as YYYY-MM-DD.
export function mondayOfWeek(dateStr?: string): string {
  const base = dateStr
    ? (() => {
        const [y, m, d] = dateStr.split("-").map(Number) as [number, number, number];
        return new Date(y, m - 1, d);
      })()
    : new Date();
  const dow = base.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const offsetToMon = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offsetToMon);
  return formatLocalDate(monday);
}

// Seven YYYY-MM-DD strings starting from the given Monday.
export function weekDaysFromMonday(mondayStr: string): string[] {
  const [y, m, d] = mondayStr.split("-").map(Number) as [number, number, number];
  const monday = new Date(y, m - 1, d);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(formatLocalDate(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)));
  }
  return days;
}

export function shiftWeek(mondayStr: string, weeks: number): string {
  const [y, m, d] = mondayStr.split("-").map(Number) as [number, number, number];
  const shifted = new Date(y, m - 1, d + weeks * 7);
  return formatLocalDate(shifted);
}

export function dayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function weekRangeLabel(mondayStr: string): string {
  const [y, m, d] = mondayStr.split("-").map(Number) as [number, number, number];
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 6);
  const fmt = (date: Date) =>
    date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const sameYear = start.getFullYear() === end.getFullYear();
  const yearSuffix = sameYear ? `, ${end.getFullYear()}` : "";
  return `${fmt(start)} – ${fmt(end)}${yearSuffix}`;
}
