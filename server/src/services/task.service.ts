import { and, asc, eq, isNull, max } from "drizzle-orm";
import type { CreateTaskInput, UpdateTaskInput } from "@todo/shared/schemas/task";
import { db } from "../db/client.js";
import { tasks, type TaskRow } from "../db/schema.js";
import { NotFoundError } from "../lib/http-errors.js";
import { requireOwnership } from "./../lib/ownership.js";

export type TaskDTO = {
  id: number;
  projectId: number | null;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
};

function toDTO(row: TaskRow): TaskDTO {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    description: row.description,
    completed: row.completed,
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function nextPosition(userId: number, projectId: number | null): Promise<number> {
  const wherePid = projectId === null ? isNull(tasks.projectId) : eq(tasks.projectId, projectId);
  const [row] = await db
    .select({ max: max(tasks.position) })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), wherePid));
  return (row?.max ?? 0) + 1;
}

export async function listTasks(userId: number): Promise<TaskDTO[]> {
  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(asc(tasks.position), asc(tasks.createdAt));
  return rows.map(toDTO);
}

// Caller must call requireOwnership("task") first.
export async function getTask(id: number): Promise<TaskDTO> {
  const [row] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!row) throw new NotFoundError("task not found");
  return toDTO(row);
}

export async function createTask(userId: number, input: CreateTaskInput): Promise<TaskDTO> {
  const projectId = input.projectId ?? null;
  if (projectId !== null) {
    await requireOwnership(userId, "project", projectId);
  }
  const position = input.position ?? (await nextPosition(userId, projectId));

  const [row] = await db
    .insert(tasks)
    .values({
      userId,
      projectId,
      title: input.title,
      description: input.description ?? null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      position,
    })
    .returning();
  if (!row) throw new Error("Insert returned no row");
  return toDTO(row);
}

// Caller must call requireOwnership("task") first.
export async function updateTask(
  userId: number,
  id: number,
  input: UpdateTaskInput,
): Promise<TaskDTO> {
  if (input.projectId !== undefined && input.projectId !== null) {
    await requireOwnership(userId, "project", input.projectId);
  }

  const updates: Partial<{
    title: string;
    description: string | null;
    projectId: number | null;
    dueDate: Date | null;
    completed: boolean;
    position: number;
    updatedAt: Date;
  }> = { updatedAt: new Date() };

  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.projectId !== undefined) updates.projectId = input.projectId;
  if (input.dueDate !== undefined) updates.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  if (input.completed !== undefined) updates.completed = input.completed;
  if (input.position !== undefined) updates.position = input.position;

  const [row] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
  if (!row) throw new NotFoundError("task not found");
  return toDTO(row);
}

// Caller must call requireOwnership("task") first.
export async function deleteTask(id: number): Promise<void> {
  await db.delete(tasks).where(eq(tasks.id, id));
}
