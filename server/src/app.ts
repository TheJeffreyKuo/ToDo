import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./env.js";
import { NotFoundError } from "./lib/http-errors.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { sessionMiddleware } from "./middleware/session.js";
import { authRouter } from "./routes/auth.routes.js";
import { labelRouter } from "./routes/label.routes.js";
import { projectRouter } from "./routes/project.routes.js";
import { taskRouter } from "./routes/task.routes.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(sessionMiddleware);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);
app.use("/api/labels", labelRouter);
app.use("/api/tasks", taskRouter);

app.use((_req, _res, next) => next(new NotFoundError("Route not found")));
app.use(errorHandler);

export default app;
