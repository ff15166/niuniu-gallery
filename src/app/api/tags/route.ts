import { NextResponse } from "next/server";
import { ensureDb } from "@/lib/ensure-db";
import db from "@/lib/db";
import {
  getAllTags,
  createTag,
  deleteTag,
  renameTag,
  addTagToMedia,
  removeTagFromMedia,
} from "@/lib/media-data";

/** GET - list all tags (from tags table + media JSON, merged & deduped) */
export async function GET() {
  try {
    await ensureDb();

    // From dedicated tags table
    const tableTags = await getAllTags();

    // From media JSON
    const result = await db.execute("SELECT tags FROM media");
    const mediaTags = new Set<string>();
    for (const row of result.rows) {
      if (row.tags) {
        const parsed = JSON.parse(row.tags as string);
        if (Array.isArray(parsed)) parsed.forEach((t: string) => mediaTags.add(t));
      }
    }

    // Merge: table tags + media tags
    const merged = new Set([...tableTags, ...mediaTags]);
    return NextResponse.json(Array.from(merged).sort());
  } catch (err) {
    console.error("GET /api/tags error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/** POST - create tag, or batch add/remove tag to/from media */
export async function POST(request: Request) {
  try {
    await ensureDb();
    const body = await request.json();
    const { action } = body;

    if (action === "create") {
      const { name } = body;
      if (!name || typeof name !== "string") {
        return NextResponse.json({ error: "Missing tag name" }, { status: 400 });
      }
      const trimmed = name.trim();
      if (!trimmed) {
        return NextResponse.json({ error: "Empty tag name" }, { status: 400 });
      }
      await createTag(trimmed);
      return NextResponse.json({ ok: true, name: trimmed });
    }

    if (action === "addToMedia") {
      const { tag, mediaIds } = body;
      if (!tag || !Array.isArray(mediaIds)) {
        return NextResponse.json({ error: "Missing tag or mediaIds" }, { status: 400 });
      }
      const affected = await addTagToMedia(mediaIds, tag);
      return NextResponse.json({ ok: true, affected });
    }

    if (action === "removeFromMedia") {
      const { tag, mediaIds } = body;
      if (!tag || !Array.isArray(mediaIds)) {
        return NextResponse.json({ error: "Missing tag or mediaIds" }, { status: 400 });
      }
      const affected = await removeTagFromMedia(mediaIds, tag);
      return NextResponse.json({ ok: true, affected });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/tags error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/** DELETE - delete tag everywhere, or rename */
export async function DELETE(request: Request) {
  try {
    await ensureDb();
    const body = await request.json();
    const { name, action, newName } = body;

    if (action === "rename" && name && newName) {
      const affected = await renameTag(name.trim(), newName.trim());
      return NextResponse.json({ ok: true, affected });
    }

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Missing tag name" }, { status: 400 });
    }
    const affected = await deleteTag(name.trim());
    return NextResponse.json({ ok: true, affected });
  } catch (err) {
    console.error("DELETE /api/tags error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
