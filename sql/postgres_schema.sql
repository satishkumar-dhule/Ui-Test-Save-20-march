-- Postgres schema for content store (single source of truth)
CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contents (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL REFERENCES channels(id),
  content_type TEXT NOT NULL,
  data TEXT NOT NULL,
  quality_score REAL DEFAULT 0,
  embedding_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  generated_by TEXT,
  generation_time_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_contents_type ON contents(content_type);
CREATE INDEX IF NOT EXISTS idx_contents_channel ON contents(channel_id);
CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status);
CREATE INDEX IF NOT EXISTS idx_contents_created ON contents(created_at);

CREATE TABLE IF NOT EXISTS content_tags (
  id SERIAL PRIMARY KEY,
  content_id TEXT NOT NULL REFERENCES contents(id),
  tag TEXT NOT NULL
);

-- Optional: full-text search configuration if required later
-- ALTER TABLE contents ADD COLUMN tsv tsvector;
