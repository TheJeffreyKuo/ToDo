import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./client.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(here, "./migrations");
const journal = path.join(migrationsFolder, "meta", "_journal.json");

async function main() {
  if (!existsSync(journal)) {
    console.log("[migrate] no migrations to apply (run `npm run db:generate` first)");
    await db.execute("SELECT 1"); // verify connectivity
    console.log("[migrate] db reachable");
    await pool.end();
    return;
  }
  console.log("[migrate] applying migrations…");
  await migrate(db, { migrationsFolder });
  console.log("[migrate] done");
  await pool.end();
}

main().catch(async (err) => {
  console.error("[migrate] failed:", err);
  await pool.end().catch(() => {});
  process.exit(1);
});
