const { createClient } = require("@libsql/client");
const db = createClient({ url: "file:./data/niuniu.db" });

async function test() {
  // 1. Check tags table structure
  const schema = await db.execute("SELECT sql FROM sqlite_master WHERE name='tags'");
  console.log("Tags schema:", schema.rows[0]?.sql);

  // 2. Try direct insert
  try {
    await db.execute({ sql: "INSERT OR IGNORE INTO tags (name) VALUES (?)", args: ["直接测试"] });
    const r = await db.execute("SELECT * FROM tags");
    console.log("After insert:", r.rows);
    await db.execute({ sql: "DELETE FROM tags WHERE name = ?", args: ["直接测试"] });
  } catch (e) {
    console.error("Direct insert failed:", e.message);
  }

  // 3. Check what createMedia does with tags
  const media = await db.execute("SELECT id, filename, tags FROM media LIMIT 2");
  console.log("\nMedia tags:");
  for (const row of media.rows) {
    console.log(`  ${row.filename}: ${row.tags}`);
  }

  // 4. Check if GET /api/tags would work
  const result = await db.execute("SELECT tags FROM media");
  const tagSet = new Set();
  for (const row of result.rows) {
    if (row.tags) {
      try {
        const parsed = JSON.parse(row.tags);
        if (Array.isArray(parsed)) parsed.forEach(t => tagSet.add(t));
      } catch {}
    }
  }
  console.log("\nAll tags from media:", Array.from(tagSet).sort());

  // 5. Check tags table
  const allTags = await db.execute("SELECT * FROM tags ORDER BY name");
  console.log("Tags table rows:", allTags.rows);
}

test().catch(e => console.error(e));
