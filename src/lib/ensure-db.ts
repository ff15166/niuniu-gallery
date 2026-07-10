import db from "./db";
import { readFileSync } from "fs";
import { join } from "path";

let schemaApplied = false;

export async function ensureDb() {
  if (schemaApplied) return;
  try {
    const schema = readFileSync(join(process.cwd(), "src/lib/schema.sql"), "utf-8");
    const statements = schema
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const sql of statements) {
      await db.execute(sql);
    }
    schemaApplied = true;
  } catch (err) {
    console.error("DB init error:", err);
    // Don't set schemaApplied = true on error, so it retries next time
  }
}
