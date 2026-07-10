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
