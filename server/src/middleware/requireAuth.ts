import type { RequestHandler } from "express";
import { UnauthorizedError } from "../lib/http-errors.js";

export const requireAuth: RequestHandler = (req, _res, next) => {
  const userId = req.session.userId;
  if (!userId) return next(new UnauthorizedError());
  req.userId = userId;
  next();
};
