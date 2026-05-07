import { asc, eq } from "drizzle-orm";
import type { CreateProjectInput, UpdateProjectInput } from "@todo/shared/schemas/project";
import { db } from "../db/client.js";
import { projects, type ProjectRow } from "../db/schema.js";
import { ConflictError, NotFoundError } from "../lib/http-errors.js";

const PG_UNIQUE_VIOLATION = "23505";

export type ProjectDTO = {
  id: number;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

function toDTO(row: ProjectRow): ProjectDTO {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function isUniqueViolation(err: unknown): boolean {
  return !!err && typeof err === "object" && "code" in err && err.code === PG_UNIQUE_VIOLATION;
}

export async function listProjects(userId: number): Promise<ProjectDTO[]> {
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(asc(projects.createdAt));
  return rows.map(toDTO);
}

// Caller must call requireOwnership first.
export async function getProject(id: number): Promise<ProjectDTO> {
  const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!row) throw new NotFoundError("project not found");
  return toDTO(row);
}

export async function createProject(
  userId: number,
  input: CreateProjectInput,
): Promise<ProjectDTO> {
  try {
    const [row] = await db
      .insert(projects)
      .values({ userId, name: input.name, color: input.color ?? null })
      .returning();
    if (!row) throw new Error("Insert returned no row");
    return toDTO(row);
  } catch (err) {
    if (isUniqueViolation(err)) throw new ConflictError("Project name already exists");
    throw err;
  }
}

// Caller must call requireOwnership first.
export async function updateProject(id: number, input: UpdateProjectInput): Promise<ProjectDTO> {
  const updates: Partial<{ name: string; color: string | null; updatedAt: Date }> = {
    updatedAt: new Date(),
  };
  if (input.name !== undefined) updates.name = input.name;
  if (input.color !== undefined) updates.color = input.color;

  try {
    const [row] = await db.update(projects).set(updates).where(eq(projects.id, id)).returning();
    if (!row) throw new NotFoundError("project not found");
    return toDTO(row);
  } catch (err) {
    if (isUniqueViolation(err)) throw new ConflictError("Project name already exists");
    throw err;
  }
}

// Caller must call requireOwnership first.
export async function deleteProject(id: number): Promise<void> {
  await db.delete(projects).where(eq(projects.id, id));
}
