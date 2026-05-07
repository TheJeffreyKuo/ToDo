import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import { BadRequestError, UnauthorizedError } from "../lib/http-errors.js";
import { requireOwnership, type OwnershipKind } from "../lib/ownership.js";

export function requireOwnershipOf(kind: OwnershipKind, paramName = "id"): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    const userId = req.userId;
    if (!userId) throw new UnauthorizedError();
    const raw = req.params[paramName];
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) throw new BadRequestError("invalid id");
    await requireOwnership(userId, kind, id);
    next();
  });
}
