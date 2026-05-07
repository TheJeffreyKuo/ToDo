import type { Task } from "@/api/tasks";

export type TaskSummary = { open: number; total: number; minutes: number };

export function summariesByProject(tasks: Task[]): Map<number, TaskSummary> {
  const map = new Map<number, TaskSummary>();
  for (const t of tasks) {
    if (t.projectId === null) continue;
    const cur = map.get(t.projectId) ?? { open: 0, total: 0, minutes: 0 };
    cur.total += 1;
    if (!t.completed) cur.open += 1;
    cur.minutes += t.estimatedMinutes ?? 0;
    map.set(t.projectId, cur);
  }
  return map;
}

export function summarizeTasks(tasks: Task[]): TaskSummary {
  const summary: TaskSummary = { open: 0, total: 0, minutes: 0 };
  for (const t of tasks) {
    summary.total += 1;
    if (!t.completed) summary.open += 1;
    summary.minutes += t.estimatedMinutes ?? 0;
  }
  return summary;
}

export function totalMinutes(tasks: Task[]): number {
  return tasks.reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0);
}

export function formatMinutes(m: number): string {
  if (m < 60) return `${m}m`;
  const hours = Math.floor(m / 60);
  const remainder = m % 60;
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}

export function formatSummary(summary: TaskSummary): string {
  const parts = [`${summary.open} open`, `${summary.total} total`];
  if (summary.minutes > 0) parts.push(formatMinutes(summary.minutes));
  return parts.join(" · ");
}

// Compute the new position value for moving a task up or down within an ordered list.
// Returns null when the task is already at the boundary (no neighbor on that side).
// Uses midpoint between neighbors so we never have to renumber adjacent rows.
export function nextPositionForMove(
  tasks: Task[],
  idx: number,
  direction: "up" | "down",
): number | null {
  if (direction === "up") {
    if (idx <= 0) return null;
    const above = tasks[idx - 1];
    if (!above) return null;
    const aboveAbove = idx >= 2 ? tasks[idx - 2] : undefined;
    return aboveAbove ? (above.position + aboveAbove.position) / 2 : above.position - 1;
  }
  if (idx >= tasks.length - 1) return null;
  const below = tasks[idx + 1];
  if (!below) return null;
  const belowBelow = idx + 2 < tasks.length ? tasks[idx + 2] : undefined;
  return belowBelow ? (below.position + belowBelow.position) / 2 : below.position + 1;
}
