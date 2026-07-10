import { randomUUID } from "crypto";
import db from "./db";
import type { Media, MediaInput, MediaUpdate } from "./types";

function rowToMedia(row: Record<string, unknown>): Media {
  return {
    id: row.id as string,
    filename: row.filename as string,
    original_url: row.original_url as string,
    thumbnail_url: (row.thumbnail_url as string) ?? null,
    type: row.type as "photo" | "video",
    size: Number(row.size),
    width: row.width != null ? Number(row.width) : null,
    height: row.height != null ? Number(row.height) : null,
    caption: (row.caption as string) ?? null,
    tags: row.tags ? JSON.parse(row.tags as string) : [],
    taken_at: (row.taken_at as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getAllMedia(limit = 50, offset = 0): Promise<Media[]> {
  const result = await db.execute({
    sql: "SELECT * FROM media ORDER BY created_at DESC LIMIT ? OFFSET ?",
    args: [limit, offset],
  });
  return result.rows.map(rowToMedia);
}

export async function getMediaById(id: string): Promise<Media | null> {
  const result = await db.execute({
    sql: "SELECT * FROM media WHERE id = ?",
    args: [id],
  });
  return result.rows[0] ? rowToMedia(result.rows[0]) : null;
}

export async function getMediaByTag(tag: string): Promise<Media[]> {
  const result = await db.execute({
    sql: "SELECT * FROM media WHERE tags LIKE ? ORDER BY created_at DESC",
    args: [`%"${tag}"%`],
  });
  return result.rows.map(rowToMedia);
}

export async function createMedia(input: MediaInput): Promise<Media> {
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO media (id, filename, original_url, thumbnail_url, type, size, width, height, caption, tags, taken_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.filename,
      input.original_url,
      input.thumbnail_url ?? null,
      input.type,
      input.size,
      input.width ?? null,
      input.height ?? null,
      input.caption ?? null,
      JSON.stringify(input.tags ?? []),
      input.taken_at ?? null,
      now,
      now,
    ],
  });
  return (await getMediaById(id))!;
}

export async function updateMedia(
  id: string,
  updates: MediaUpdate
): Promise<Media | null> {
  const existing = await getMediaById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  await db.execute({
    sql: `UPDATE media SET filename = ?, caption = ?, tags = ?, updated_at = ? WHERE id = ?`,
    args: [
      updates.filename ?? existing.filename,
      updates.caption ?? existing.caption,
      JSON.stringify(updates.tags ?? existing.tags),
      now,
      id,
    ],
  });
  return getMediaById(id);
}

export async function deleteMedia(id: string): Promise<boolean> {
  const result = await db.execute({
    sql: "DELETE FROM media WHERE id = ?",
    args: [id],
  });
  return result.rowsAffected > 0;
}

export async function deleteManyMedia(ids: string[]): Promise<number> {
  let total = 0;
  for (const id of ids) {
    const result = await db.execute({
      sql: "DELETE FROM media WHERE id = ?",
      args: [id],
    });
    total += result.rowsAffected;
  }
  return total;
}

// === Tag CRUD ===

/** Get all tags from the dedicated tags table */
export async function getAllTags(): Promise<string[]> {
  const result = await db.execute("SELECT name FROM tags ORDER BY name");
  return result.rows.map((r) => r.name as string);
}

/** Create a tag in the tags table */
export async function createTag(name: string): Promise<boolean> {
  try {
    await db.execute({
      sql: "INSERT OR IGNORE INTO tags (name) VALUES (?)",
      args: [name],
    });
    return true;
  } catch {
    return false;
  }
}

/** Delete a tag from tags table AND remove it from all media */
export async function deleteTag(name: string): Promise<number> {
  // Remove from all media
  const result = await db.execute({
    sql: "SELECT id, tags FROM media WHERE tags LIKE ?",
    args: [`%"${name}"%`],
  });
  let affected = 0;
  for (const row of result.rows) {
    const tags: string[] = JSON.parse(row.tags as string || "[]");
    const filtered = tags.filter((t) => t !== name);
    if (filtered.length !== tags.length) {
      await db.execute({
        sql: "UPDATE media SET tags = ?, updated_at = datetime('now') WHERE id = ?",
        args: [JSON.stringify(filtered), row.id as string],
      });
      affected++;
    }
  }
  // Remove from tags table
  await db.execute({ sql: "DELETE FROM tags WHERE name = ?", args: [name] });
  return affected;
}

/** Rename a tag everywhere */
export async function renameTag(oldName: string, newName: string): Promise<number> {
  const result = await db.execute({
    sql: "SELECT id, tags FROM media WHERE tags LIKE ?",
    args: [`%"${oldName}"%`],
  });
  let affected = 0;
  for (const row of result.rows) {
    const tags: string[] = JSON.parse(row.tags as string || "[]");
    const updated = tags.map((t) => (t === oldName ? newName : t));
    await db.execute({
      sql: "UPDATE media SET tags = ?, updated_at = datetime('now') WHERE id = ?",
      args: [JSON.stringify(updated), row.id as string],
    });
    affected++;
  }
  await db.execute({
    sql: "UPDATE tags SET name = ? WHERE name = ?",
    args: [newName, oldName],
  });
  return affected;
}

/** Add a tag to multiple media items */
export async function addTagToMedia(mediaIds: string[], tag: string): Promise<number> {
  let affected = 0;
  for (const id of mediaIds) {
    const result = await db.execute({
      sql: "SELECT tags FROM media WHERE id = ?",
      args: [id],
    });
    if (result.rows[0]) {
      const tags: string[] = JSON.parse(result.rows[0].tags as string || "[]");
      if (!tags.includes(tag)) {
        tags.push(tag);
        await db.execute({
          sql: "UPDATE media SET tags = ?, updated_at = datetime('now') WHERE id = ?",
          args: [JSON.stringify(tags), id],
        });
        affected++;
      }
    }
  }
  return affected;
}

/** Remove a tag from multiple media items */
export async function removeTagFromMedia(mediaIds: string[], tag: string): Promise<number> {
  let affected = 0;
  for (const id of mediaIds) {
    const result = await db.execute({
      sql: "SELECT tags FROM media WHERE id = ?",
      args: [id],
    });
    if (result.rows[0]) {
      const tags: string[] = JSON.parse(result.rows[0].tags as string || "[]");
      const filtered = tags.filter((t) => t !== tag);
      if (filtered.length !== tags.length) {
        await db.execute({
          sql: "UPDATE media SET tags = ?, updated_at = datetime('now') WHERE id = ?",
          args: [JSON.stringify(filtered), id],
        });
        affected++;
      }
    }
  }
  return affected;
}
