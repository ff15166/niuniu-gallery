const { createClient } = require("@libsql/client");

const db = createClient({
  url: "libsql://niuniu-gallery-ff15166.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJnaWQiOiJlMTEyMjIxMy1mYmM0LTQwNzAtYjVkOC0zYzZjODNkYzVhNTciLCJpYXQiOjE3ODM2NjM0NzYsImtpZCI6Ikl0VFNFNVhlbmxFazVXRHVwWGY5NnVpRkprdE1FR0dadVRhRWc0bzl6cEUiLCJyaWQiOiJlZWVjZGZjZC1iN2I0LTQxMjktYmU0NS1iZjc4ZTQ0Y2NiOWMifQ.32nc-VPT_6bN-xqvMNXetbfnuX0wmJ8dAVyo0ROa5fwSNaUjJDY0dK-IsszifvKkNvj8Gg1KlL3rqCBnn-BCBw",
});

async function fix() {
  const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log("Tables:", tables.rows.map(r => r.name));

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tags (
      name TEXT PRIMARY KEY,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log("✅ tags table created in production DB");

  const after = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log("Tables now:", after.rows.map(r => r.name));

  // Test
  await db.execute({ sql: "INSERT OR IGNORE INTO tags (name) VALUES (?)", args: ["测试"] });
  const tags = await db.execute("SELECT * FROM tags");
  console.log("Test tag:", tags.rows);
  await db.execute({ sql: "DELETE FROM tags WHERE name = ?", args: ["测试"] });
  console.log("✅ Production DB fixed");
}

fix().catch(e => console.error("Error:", e.message));
