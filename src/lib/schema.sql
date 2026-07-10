-- niuniu-gallery schema

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
);

CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);

CREATE TABLE IF NOT EXISTS tags (
  name TEXT PRIMARY KEY,
  created_at TEXT DEFAULT (datetime('now'))
);
