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
