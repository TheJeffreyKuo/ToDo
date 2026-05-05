import express from "express";
import helmet from "helmet";
import { NotFoundError } from "./lib/http-errors.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { sessionMiddleware } from "./middleware/session.js";
import { authRouter } from "./routes/auth.routes.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(sessionMiddleware);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.use("/api/auth", authRouter);

app.use((_req, _res, next) => next(new NotFoundError("Route not found")));
app.use(errorHandler);

export default app;
