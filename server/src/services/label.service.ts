import { asc, eq } from "drizzle-orm";
import type { CreateLabelInput, UpdateLabelInput } from "@todo/shared/schemas/label";
import { db } from "../db/client.js";
import { labels, type LabelRow } from "../db/schema.js";
import { ConflictError, NotFoundError } from "../lib/http-errors.js";

const PG_UNIQUE_VIOLATION = "23505";

export type LabelDTO = {
  id: number;
  name: string;
  color: string | null;
  createdAt: string;
};

function toDTO(row: LabelRow): LabelDTO {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.createdAt.toISOString(),
  };
}

function isUniqueViolation(err: unknown): boolean {
  return !!err && typeof err === "object" && "code" in err && err.code === PG_UNIQUE_VIOLATION;
}

export async function listLabels(userId: number): Promise<LabelDTO[]> {
  const rows = await db
    .select()
    .from(labels)
    .where(eq(labels.userId, userId))
    .orderBy(asc(labels.createdAt));
  return rows.map(toDTO);
}

// Caller must call requireOwnership first.
export async function getLabel(id: number): Promise<LabelDTO> {
  const [row] = await db.select().from(labels).where(eq(labels.id, id)).limit(1);
  if (!row) throw new NotFoundError("label not found");
  return toDTO(row);
}

export async function createLabel(userId: number, input: CreateLabelInput): Promise<LabelDTO> {
  try {
    const [row] = await db
      .insert(labels)
      .values({ userId, name: input.name, color: input.color ?? null })
      .returning();
    if (!row) throw new Error("Insert returned no row");
    return toDTO(row);
  } catch (err) {
    if (isUniqueViolation(err)) throw new ConflictError("Label name already exists");
    throw err;
  }
}

// Caller must call requireOwnership first.
export async function updateLabel(id: number, input: UpdateLabelInput): Promise<LabelDTO> {
  const updates: Partial<{ name: string; color: string | null }> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.color !== undefined) updates.color = input.color;

  try {
    const [row] = await db.update(labels).set(updates).where(eq(labels.id, id)).returning();
    if (!row) throw new NotFoundError("label not found");
    return toDTO(row);
  } catch (err) {
    if (isUniqueViolation(err)) throw new ConflictError("Label name already exists");
    throw err;
  }
}

// Caller must call requireOwnership first.
export async function deleteLabel(id: number): Promise<void> {
  await db.delete(labels).where(eq(labels.id, id));
}
