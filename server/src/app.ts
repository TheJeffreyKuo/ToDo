import express from "express";
import helmet from "helmet";
import { NotFoundError } from "./lib/http-errors.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.use((_req, _res, next) => next(new NotFoundError("Route not found")));
app.use(errorHandler);

export default app;
