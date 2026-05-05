import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import { pool } from "../db/client.js";
import { env } from "../env.js";

const PgStore = connectPgSimple(session);

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const sessionMiddleware = session({
  name: "todo.sid",
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: new PgStore({
    pool,
    tableName: "session",
    createTableIfMissing: true,
  }),
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: ONE_WEEK_MS,
  },
});
