export const SCHEMA_VERSION = 1

export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS generated_content (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    content_type TEXT NOT NULL,
    data TEXT NOT NULL,
    quality_score REAL DEFAULT 0,
    embedding_id TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    status TEXT DEFAULT 'pending',
    generated_by TEXT,
    generation_time_ms INTEGER,
    UNIQUE(id)
  );

  CREATE INDEX IF NOT EXISTS idx_type ON generated_content(content_type);
  CREATE INDEX IF NOT EXISTS idx_channel ON generated_content(channel_id);
  CREATE INDEX IF NOT EXISTS idx_status ON generated_content(status);
  CREATE INDEX IF NOT EXISTS idx_quality ON generated_content(quality_score);
  CREATE INDEX IF NOT EXISTS idx_created_at ON generated_content(created_at);
`

export const TABLE_NAME = 'generated_content'

export const COLUMNS = [
  'id',
  'channel_id',
  'content_type',
  'data',
  'quality_score',
  'embedding_id',
  'created_at',
  'updated_at',
  'status',
  'generated_by',
  'generation_time_ms',
] as const

export type ColumnName = (typeof COLUMNS)[number]

export const CONTENT_TYPES = ['question', 'flashcard', 'exam', 'voice', 'coding'] as const

export type ContentType = (typeof CONTENT_TYPES)[number]

export const CHANNELS = ['devops', 'frontend', 'backend', 'system'] as const

export type Channel = (typeof CHANNELS)[number]

export const STATUS_VALUES = ['pending', 'completed', 'failed'] as const

export type Status = (typeof STATUS_VALUES)[number]
