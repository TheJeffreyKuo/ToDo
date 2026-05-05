import { Router } from "express";
import rateLimit from "express-rate-limit";
import { loginSchema, registerSchema } from "@todo/shared/schemas/auth";
import { asyncHandler } from "../lib/async-handler.js";
import { UnauthorizedError } from "../lib/http-errors.js";
import { validate } from "../middleware/validate.js";
import * as authService from "../services/auth.service.js";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many attempts, try again later" } },
});

authRouter.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);
    req.session.userId = user.id;
    res.status(201).json({ user });
  }),
);

authRouter.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const user = await authService.login(req.body);
    req.session.userId = user.id;
    res.json({ user });
  }),
);

authRouter.post("/logout", (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("todo.sid");
    res.status(204).end();
  });
});

authRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const userId = req.session.userId;
    if (!userId) throw new UnauthorizedError();
    const user = await authService.getUserById(userId);
    res.json({ user });
  }),
);
