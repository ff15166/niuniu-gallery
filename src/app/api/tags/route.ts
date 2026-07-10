import { NextResponse } from "next/server";
import { ensureDb } from "@/lib/ensure-db";
import db from "@/lib/db";

export async function GET() {
  try {
    await ensureDb();
    const result = await db.execute("SELECT tags FROM media");
    const tagSet = new Set<string>();
    for (const row of result.rows) {
      if (row.tags) {
        const parsed = JSON.parse(row.tags as string);
        if (Array.isArray(parsed)) parsed.forEach((t: string) => tagSet.add(t));
      }
    }
    return NextResponse.json(Array.from(tagSet).sort());
  } catch (err) {
    console.error("GET /api/tags error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
