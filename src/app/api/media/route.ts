import { NextResponse } from "next/server";
import { ensureDb } from "@/lib/ensure-db";
import { getAllMedia } from "@/lib/media-data";

export async function GET(request: Request) {
  try {
    await ensureDb();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    const media = await getAllMedia(limit, offset);
    return NextResponse.json(media);
  } catch (err) {
    console.error("GET /api/media error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
