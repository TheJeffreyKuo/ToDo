import { asc, eq, inArray, max } from "drizzle-orm";
import type { CreateTaskInput, UpdateTaskInput } from "@todo/shared/schemas/task";
import { db } from "../db/client.js";
import { labels, taskLabels, tasks, type LabelRow, type TaskRow } from "../db/schema.js";
import { NotFoundError } from "../lib/http-errors.js";
import type { LabelDTO } from "./label.service.js";

export type TaskDTO = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  scheduledFor: string | null;
  estimatedMinutes: number | null;
  position: number;
  labels: LabelDTO[];
  createdAt: string;
  updatedAt: string;
};

function toLabelDTO(row: LabelRow): LabelDTO {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.createdAt.toISOString(),
  };
}

function toTaskDTO(row: TaskRow, taskLabelsForRow: LabelDTO[]): TaskDTO {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    completed: row.completed,
    scheduledFor: row.scheduledFor,
    estimatedMinutes: row.estimatedMinutes,
    position: row.position,
    labels: taskLabelsForRow,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function fetchLabelsByTaskIds(taskIds: number[]): Promise<Map<number, LabelDTO[]>> {
  const result = new Map<number, LabelDTO[]>();
  if (taskIds.length === 0) return result;
  const rows = await db
    .select({ taskId: taskLabels.taskId, label: labels })
    .from(taskLabels)
    .innerJoin(labels, eq(taskLabels.labelId, labels.id))
    .where(inArray(taskLabels.taskId, taskIds));
  for (const r of rows) {
    const arr = result.get(r.taskId) ?? [];
    arr.push(toLabelDTO(r.label));
    result.set(r.taskId, arr);
  }
  return result;
}

async function nextPosition(userId: number): Promise<number> {
  const [row] = await db
    .select({ max: max(tasks.position) })
    .from(tasks)
    .where(eq(tasks.userId, userId));
  return (row?.max ?? 0) + 1;
}

export async function listTasks(userId: number): Promise<TaskDTO[]> {
  const taskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(asc(tasks.position), asc(tasks.createdAt));
  const labelsByTask = await fetchLabelsByTaskIds(taskRows.map((t) => t.id));
  return taskRows.map((t) => toTaskDTO(t, labelsByTask.get(t.id) ?? []));
}

// Caller must call requireOwnership("task") first.
export async function getTask(id: number): Promise<TaskDTO> {
  const [row] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!row) throw new NotFoundError("task not found");
  const labelsByTask = await fetchLabelsByTaskIds([id]);
  return toTaskDTO(row, labelsByTask.get(id) ?? []);
}

export async function createTask(userId: number, input: CreateTaskInput): Promise<TaskDTO> {
  const position = input.position ?? (await nextPosition(userId));

  const [row] = await db
    .insert(tasks)
    .values({
      userId,
      title: input.title,
      description: input.description ?? null,
      scheduledFor: input.scheduledFor ?? null,
      estimatedMinutes: input.estimatedMinutes ?? null,
      position,
    })
    .returning();
  if (!row) throw new Error("Insert returned no row");
  return toTaskDTO(row, []);
}

// Caller must call requireOwnership("task") first.
export async function updateTask(id: number, input: UpdateTaskInput): Promise<TaskDTO> {
  const updates: Partial<{
    title: string;
    description: string | null;
    scheduledFor: string | null;
    estimatedMinutes: number | null;
    completed: boolean;
    position: number;
    updatedAt: Date;
  }> = { updatedAt: new Date() };

  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.scheduledFor !== undefined) updates.scheduledFor = input.scheduledFor;
  if (input.estimatedMinutes !== undefined) updates.estimatedMinutes = input.estimatedMinutes;
  if (input.completed !== undefined) updates.completed = input.completed;
  if (input.position !== undefined) updates.position = input.position;

  const [row] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
  if (!row) throw new NotFoundError("task not found");
  const labelsByTask = await fetchLabelsByTaskIds([id]);
  return toTaskDTO(row, labelsByTask.get(id) ?? []);
}

// Caller must call requireOwnership("task") first.
export async function deleteTask(id: number): Promise<void> {
  await db.delete(tasks).where(eq(tasks.id, id));
}
