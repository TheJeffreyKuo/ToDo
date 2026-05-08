import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { labels, tasks } from "../db/schema.js";
import { NotFoundError } from "./http-errors.js";

export type OwnershipKind = "task" | "label";

// Sole authority for per-resource access checks. All routes/services
// must call this rather than filtering with WHERE user_id = $1 ad-hoc.
//
// Returns 404 (not 403) when a non-owner asks for a row that exists,
// so we don't leak existence of resources to other users.
export async function requireOwnership(
  userId: number,
  kind: OwnershipKind,
  id: number,
): Promise<void> {
  let ownerId: number | undefined;

  switch (kind) {
    case "task": {
      const [row] = await db
        .select({ userId: tasks.userId })
        .from(tasks)
        .where(eq(tasks.id, id))
        .limit(1);
      ownerId = row?.userId;
      break;
    }
    case "label": {
      const [row] = await db
        .select({ userId: labels.userId })
        .from(labels)
        .where(eq(labels.id, id))
        .limit(1);
      ownerId = row?.userId;
      break;
    }
  }

  if (ownerId !== userId) {
    throw new NotFoundError(`${kind} not found`);
  }
}
