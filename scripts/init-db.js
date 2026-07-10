const { createClient } = require('@libsql/client');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

async function init() {
  const db = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });

  // Execute each statement individually
  await db.execute(`
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_url TEXT NOT NULL,
      thumbnail_url TEXT,
      type TEXT NOT NULL CHECK (type IN ('photo', 'video')),
      size INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      caption TEXT,
      tags TEXT DEFAULT '[]',
      taken_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('Created table: media');

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_media_type ON media(type)`);
  console.log('Created index: idx_media_type');

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC)`);
  console.log('Created index: idx_media_created_at');

  const r = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('\nTables:', r.rows);
  console.log('Done!');
}

init().catch(e => console.error(e));
