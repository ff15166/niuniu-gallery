import { NextResponse } from "next/server";
import { ensureDb } from "@/lib/ensure-db";
import { getMediaById, updateMedia, deleteMedia } from "@/lib/media-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    const { id } = await params;
    const media = await getMediaById(id);
    if (!media) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(media);
  } catch (err) {
    console.error("GET /api/media/[id] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    const { id } = await params;
    const body = await request.json();
    const updated = await updateMedia(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/media/[id] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    const { id } = await params;
    const ok = await deleteMedia(id);
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/media/[id] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
