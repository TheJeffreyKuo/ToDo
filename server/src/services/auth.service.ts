import { eq } from "drizzle-orm";
import type { LoginInput, RegisterInput } from "@todo/shared/schemas/auth";
import { db } from "../db/client.js";
import { users, type UserRow } from "../db/schema.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { ConflictError, NotFoundError, UnauthorizedError } from "../lib/http-errors.js";

const PG_UNIQUE_VIOLATION = "23505";

export type UserDTO = {
  id: number;
  email: string;
  createdAt: string;
};

function toDTO(row: UserRow): UserDTO {
  return {
    id: row.id,
    email: row.email,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function register(input: RegisterInput): Promise<UserDTO> {
  const passwordHash = await hashPassword(input.password);
  try {
    const [row] = await db
      .insert(users)
      .values({ email: input.email, passwordHash })
      .returning();
    if (!row) throw new Error("Insert returned no row");
    return toDTO(row);
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === PG_UNIQUE_VIOLATION) {
      throw new ConflictError("Email already registered");
    }
    throw err;
  }
}

export async function login(input: LoginInput): Promise<UserDTO> {
  const [row] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  if (!row) throw new UnauthorizedError("Invalid email or password");
  const ok = await verifyPassword(input.password, row.passwordHash);
  if (!ok) throw new UnauthorizedError("Invalid email or password");
  return toDTO(row);
}

export async function getUserById(id: number): Promise<UserDTO> {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!row) throw new NotFoundError("User not found");
  return toDTO(row);
}
