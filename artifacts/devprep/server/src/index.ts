import express, { Request, Response } from 'express'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import path from 'path'
import fs from 'fs'
import { Database } from 'bun:sqlite'
import { DatabaseWatcher } from './dbWatcher.js'

const PORT = process.env.API_PORT || 3001
const DB_PATH =
  process.env.DB_PATH || path.resolve(import.meta.dirname, '../../../../data/devprep.db')

interface ContentRecord {
  id: string
  channel_id: string
  content_type: string
  difficulty: string // Spec §2: beginner/intermediate/advanced OR easy/medium/hard
  tags: string // JSON array of tags, max 5, first = channel slug
  data: string // Full JSON payload (type-specific fields per spec)
  quality_score: number
  embedding_id: string | null
  created_at: number
  updated_at: number
  status: string
  generated_by: string | null
  generation_time_ms: number | null
}

interface ContentQueryOptions {
  channelId?: string
  contentType?: string
  status?: string
  minQuality?: number
  limit?: number
  offset?: number
  since?: number
}

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

app.use(express.json())

let db: Database

function initializeDatabase(): void {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  db = new Database(DB_PATH)
  db.exec('PRAGMA foreign_keys = ON')
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA busy_timeout = 5000')

  // ─────────────────────────────────────────────────────────────────────────────
  // Legacy table (kept for backward compat — frontend local SQLite client)
  // ─────────────────────────────────────────────────────────────────────────────
  db.exec(`
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
  `)

  // ─────────────────────────────────────────────────────────────────────────────
  // Normalized schema — designed to match CONTENT_STANDARDS.md §2–§8 entities
  // ─────────────────────────────────────────────────────────────────────────────

  // Channels reference table
  db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      id   TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );
  `)

  // Central contents table — one row per content entity
  // Columns:
  //   difficulty: Spec §2 — beginner/intermediate/advanced (tech) or easy/medium/hard (cert/coding)
  //   tags:       Spec §3 — JSON array, max 5, first tag = channel slug, kebab-case
  db.exec(`
    CREATE TABLE IF NOT EXISTS contents (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      content_type TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'pending',
      quality_score REAL DEFAULT 0,
      embedding_id TEXT,
      data TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      generated_by TEXT,
      generation_time_ms INTEGER
    );
  `)

  // Composite indexes tuned for the actual API query patterns
  db.exec(`
    -- Main feed: channel + status + type (the primary /api/content query)
    CREATE INDEX IF NOT EXISTS idx_contents_ch_st_ty ON contents(channel_id, status, content_type);
    -- Type-only filter: /api/content/:type
    CREATE INDEX IF NOT EXISTS idx_contents_type ON contents(content_type);
    -- Quality ordering
    CREATE INDEX IF NOT EXISTS idx_contents_quality ON contents(quality_score DESC);
    -- Recency ordering
    CREATE INDEX IF NOT EXISTS idx_contents_created ON contents(created_at DESC);
    -- Status-only filter
    CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status);
  `)

  // Denormalized tag index — one row per (content_id, tag) for fast tag-based filtering
  db.exec(`
    CREATE TABLE IF NOT EXISTS content_tags (
      content_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      PRIMARY KEY (content_id, tag),
      FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_content_tags_tag ON content_tags(tag);
  `)

  // ─────────────────────────────────────────────────────────────────────────────
  // Migrations
  // ─────────────────────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );
  `)

  const migrations: Array<{ id: string; up: () => void }> = [
    {
      id: '20260322_01_channels',
      up: () => {
        const known = [
          { id: 'javascript', name: 'JavaScript' },
          { id: 'typescript', name: 'TypeScript' },
          { id: 'react', name: 'React' },
          { id: 'algorithms', name: 'Algorithms' },
          { id: 'system-design', name: 'System Design' },
          { id: 'devops', name: 'DevOps' },
          { id: 'networking', name: 'Networking' },
          { id: 'terraform', name: 'Terraform' },
          { id: 'aws-saa', name: 'AWS Solutions Architect' },
          { id: 'aws-dev', name: 'AWS Developer' },
          { id: 'cka', name: 'Certified Kubernetes Administrator' },
        ]
        const stmt = db.prepare('INSERT OR IGNORE INTO channels (id, name) VALUES (?, ?)')
        for (const ch of known) stmt.run(ch.id, ch.name)
        console.log('[Migration] Seeded channels table')
      },
    },
    {
      id: '20260322_02_extract_metadata',
      up: () => {
        // Migrate data from generated_content -> contents
        // Extract difficulty and tags from JSON payload per spec §2 and §3
        const countRow = db.prepare('SELECT COUNT(*) as c FROM contents').get() as any
        if ((countRow?.c ?? 0) > 0) {
          console.log('[Migration] contents already has data, skipping extraction')
          return
        }

        const legacyRows = db.prepare('SELECT * FROM generated_content').all() as any[]
        if (legacyRows.length === 0) {
          console.log('[Migration] No legacy data to migrate')
          return
        }

        const insertContent = db.prepare(`
          INSERT OR IGNORE INTO contents
            (id, channel_id, content_type, difficulty, tags, status, quality_score, embedding_id, data, created_at, updated_at, generated_by, generation_time_ms)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        const insertTag = db.prepare(
          'INSERT OR IGNORE INTO content_tags (content_id, tag) VALUES (?, ?)'
        )

        const migrateAll = db.transaction(() => {
          for (const row of legacyRows) {
            let parsed: any = {}
            try {
              parsed = JSON.parse(row.data)
            } catch {
              /* keep empty */
            }

            // Extract difficulty (Spec §2)
            let difficulty = 'intermediate' // default for tech channels
            if (
              parsed.difficulty &&
              ['beginner', 'intermediate', 'advanced', 'easy', 'medium', 'hard'].includes(
                parsed.difficulty
              )
            ) {
              difficulty = parsed.difficulty
            }

            // Extract tags (Spec §3): JSON array, kebab-case, max 5, first = channel slug
            let tags: string[] = []
            if (Array.isArray(parsed.tags) && parsed.tags.length > 0) {
              tags = parsed.tags.slice(0, 5)
            } else if (row.channel_id) {
              // Fallback: first tag = channel slug per Spec §3
              tags = [row.channel_id]
            }

            // Determine status: map legacy values
            let status = row.status || 'pending'
            if (!['pending', 'approved', 'published', 'rejected'].includes(status)) {
              status = 'pending'
            }

            insertContent.run(
              row.id,
              row.channel_id,
              row.content_type,
              difficulty,
              JSON.stringify(tags),
              status,
              row.quality_score ?? 0,
              row.embedding_id ?? null,
              row.data,
              row.created_at,
              row.updated_at,
              row.generated_by ?? null,
              row.generation_time_ms ?? null
            )

            // Populate denormalized tag index
            for (const tag of tags) {
              insertTag.run(row.id, tag)
            }
          }
        })

        migrateAll()
        console.log(
          `[Migration] Migrated ${legacyRows.length} records from generated_content -> contents + content_tags`
        )
      },
    },
    {
      id: '20260322_03_backfill_channels',
      up: () => {
        // Auto-discover any channel_ids from generated_content that aren't in channels yet
        const rows = db.prepare('SELECT DISTINCT channel_id FROM generated_content').all() as any[]
        const stmt = db.prepare('INSERT OR IGNORE INTO channels (id, name) VALUES (?, ?)')
        for (const row of rows) {
          stmt.run(row.channel_id, row.channel_id)
        }
        if (rows.length > 0) {
          console.log(`[Migration] Backfilled ${rows.length} channel(s) from generated_content`)
        }
      },
    },
  ]

  const now = Math.floor(Date.now() / 1000)
  for (const m of migrations) {
    const exists = db.prepare('SELECT 1 FROM migrations WHERE id = ?').get(m.id)
    if (!exists) {
      try {
        m.up()
        db.prepare('INSERT INTO migrations (id, applied_at) VALUES (?, ?)').run(m.id, now)
      } catch (err) {
        console.error(`[Migration] Failed: ${m.id}`, err)
      }
    }
  }
}

function queryContent(options: ContentQueryOptions = {}): ContentRecord[] {
  const { channelId, contentType, status, minQuality, limit = 100, offset = 0, since } = options

  const conditions: string[] = []
  const params: (string | number)[] = []

  if (channelId) {
    conditions.push('channel_id = ?')
    params.push(channelId)
  }
  if (contentType) {
    conditions.push('content_type = ?')
    params.push(contentType)
  }
  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }
  if (minQuality !== undefined) {
    conditions.push('quality_score >= ?')
    params.push(minQuality)
  }
  if (since) {
    conditions.push('created_at >= ?')
    params.push(since)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  // Prefer the new normalized table when available
  const tableName = ((): string => {
    try {
      const exists = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='contents'")
        .get()
      return exists ? 'contents' : 'generated_content'
    } catch {
      return 'generated_content'
    }
  })()
  const query = `
    SELECT * FROM ${tableName}
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `

  params.push(limit, offset)
  return db.prepare(query).all(...params) as ContentRecord[]
}

function broadcastUpdate(event: { type: string; data?: unknown }): void {
  const message = JSON.stringify(event)
  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}

let dbWatcher: DatabaseWatcher | null = null

wss.on('connection', (ws: WebSocket) => {
  console.log('[WebSocket] Client connected')

  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString())
      if (message.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }))
      }
    } catch {
      // Ignore invalid messages
    }
  })

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected')
  })
})

app.get('/api/content', (req: Request, res: Response) => {
  try {
    const { channel, type, status, quality, limit, offset, since } = req.query

    const options: ContentQueryOptions = {
      channelId: channel as string | undefined,
      contentType: type as string | undefined,
      status: status as string | undefined,
      minQuality: quality ? parseFloat(quality as string) : undefined,
      limit: limit ? parseInt(limit as string, 10) : 100,
      offset: offset ? parseInt(offset as string, 10) : 0,
      since: since ? parseInt(since as string, 10) : undefined,
    }

    const records = queryContent(options)
    const data = []
    for (const record of records) {
      try {
        let parsed: any = {}
        try {
          parsed = JSON.parse(record.data)
        } catch {
          /* keep empty */
        }
        data.push({
          ...record,
          difficulty: record.difficulty,
          tags: typeof record.tags === 'string' ? JSON.parse(record.tags) : record.tags,
          data: parsed,
        })
      } catch (parseError) {
        console.warn(`[API] Skipping record ${record.id} due to JSON parse error:`, parseError)
      }
    }

    res.json({ ok: true, data, count: records.length })
  } catch (error) {
    console.error('[API] Error fetching content:', error)
    res.status(500).json({ ok: false, error: 'Failed to fetch content' })
  }
})

app.get('/api/content/stats', (_req: Request, res: Response) => {
  try {
    // Prefer the new contents table if available
    const tableName = ((): string => {
      try {
        const exists = db
          .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='contents'")
          .get()
        return exists ? 'contents' : 'generated_content'
      } catch {
        return 'generated_content'
      }
    })()
    const rows = db
      .prepare(
        `
      SELECT content_type, COUNT(*) as count
      FROM ${tableName}
      GROUP BY content_type
    `
      )
      .all() as { content_type: string; count: number }[]

    const stats: Record<string, number> = {
      total: 0,
      question: 0,
      flashcard: 0,
      exam: 0,
      voice: 0,
      coding: 0,
    }

    for (const row of rows) {
      stats[row.content_type] = row.count
      stats.total += row.count
    }

    res.json({ ok: true, stats })
  } catch (error) {
    console.error('[API] Error fetching stats:', error)
    res.status(500).json({ ok: false, error: 'Failed to fetch stats' })
  }
})

app.get('/api/content/:type', (req: Request, res: Response) => {
  try {
    const { type } = req.params
    const { channel, status, quality, limit, offset, since } = req.query

    const validTypes = ['question', 'flashcard', 'exam', 'voice', 'coding']
    if (!validTypes.includes(type)) {
      return res.status(400).json({ ok: false, error: 'Invalid content type' })
    }

    const options: ContentQueryOptions = {
      contentType: type,
      channelId: channel as string | undefined,
      status: status as string | undefined,
      minQuality: quality ? parseFloat(quality as string) : undefined,
      limit: limit ? parseInt(limit as string, 10) : 100,
      offset: offset ? parseInt(offset as string, 10) : 0,
      since: since ? parseInt(since as string, 10) : undefined,
    }

    const records = queryContent(options)
    const data = []
    for (const record of records) {
      try {
        let parsed: any = {}
        try {
          parsed = JSON.parse(record.data)
        } catch {
          /* keep empty */
        }
        data.push({
          ...record,
          difficulty: record.difficulty,
          tags: typeof record.tags === 'string' ? JSON.parse(record.tags) : record.tags,
          data: parsed,
        })
      } catch (parseError) {
        console.warn(`[API] Skipping record ${record.id} due to JSON parse error:`, parseError)
      }
    }

    res.json({ ok: true, data, count: records.length })
  } catch (error) {
    console.error('[API] Error fetching content by type:', error)
    res.status(500).json({ ok: false, error: 'Failed to fetch content' })
  }
})

app.get('/api/channels/:channelId/content', (req: Request, res: Response) => {
  try {
    const { channelId } = req.params
    const { type, status, quality, limit, offset } = req.query

    const options: ContentQueryOptions = {
      channelId,
      contentType: type as string | undefined,
      status: status as string | undefined,
      minQuality: quality ? parseFloat(quality as string) : undefined,
      limit: limit ? parseInt(limit as string, 10) : 100,
      offset: offset ? parseInt(offset as string, 10) : 0,
    }

    const records = queryContent(options)
    const data = []
    for (const record of records) {
      try {
        let parsed: any = {}
        try {
          parsed = JSON.parse(record.data)
        } catch {
          /* keep empty */
        }
        data.push({
          ...record,
          difficulty: record.difficulty,
          tags: typeof record.tags === 'string' ? JSON.parse(record.tags) : record.tags,
          data: parsed,
        })
      } catch (parseError) {
        console.warn(`[API] Skipping record ${record.id} due to JSON parse error:`, parseError)
      }
    }

    res.json({ ok: true, data, count: records.length })
  } catch (error) {
    console.error('[API] Error fetching channel content:', error)
    res.status(500).json({ ok: false, error: 'Failed to fetch content' })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Tag-based query endpoint (enabled by content_tags denormalized index)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/content/tagged/:tag', (req: Request, res: Response) => {
  try {
    const { tag } = req.params
    const { limit = '50', offset = '0' } = req.query
    const lim = parseInt(limit as string, 10)
    const off = parseInt(offset as string, 10)

    const tableName = ((): string => {
      try {
        const exists = db
          .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='contents'")
          .get()
        return exists ? 'contents' : 'generated_content'
      } catch {
        return 'generated_content'
      }
    })()

    let rows: any[]
    if (tableName === 'contents') {
      // Use the denormalized content_tags index for O(1) tag lookup
      rows = db
        .prepare(
          `
        SELECT c.* FROM contents c
        JOIN content_tags t ON t.content_id = c.id
        WHERE t.tag = ? AND c.status IN ('published', 'approved')
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `
        )
        .all(tag, lim, off) as any[]
    } else {
      // Fallback: search in generated_content JSON (legacy)
      rows = db
        .prepare(
          `
        SELECT * FROM generated_content
        WHERE status IN ('published', 'approved')
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `
        )
        .all(lim + off) as any[]
      // Filter client-side by tag match in data
      rows = rows
        .filter((r: any) => {
          try {
            const d = JSON.parse(r.data)
            return Array.isArray(d.tags) && d.tags.includes(tag)
          } catch {
            return false
          }
        })
        .slice(off, off + lim)
    }

    const data = []
    for (const record of rows) {
      try {
        let parsed: any = {}
        try {
          parsed = JSON.parse(record.data)
        } catch {
          /* keep empty */
        }
        data.push({
          ...record,
          difficulty: record.difficulty ?? parsed.difficulty ?? 'intermediate',
          tags: record.tags
            ? typeof record.tags === 'string'
              ? JSON.parse(record.tags)
              : record.tags
            : (parsed.tags ?? []),
          data: parsed,
        })
      } catch (parseError) {
        console.warn(`[API] Skipping tagged record ${record.id}:`, parseError)
      }
    }

    res.json({ ok: true, data, count: data.length, tag })
  } catch (error) {
    console.error('[API] Error fetching tagged content:', error)
    res.status(500).json({ ok: false, error: 'Failed to fetch tagged content' })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Difficulty distribution endpoint (Spec §2 calibration)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/content/difficulty-stats', (_req: Request, res: Response) => {
  try {
    const rows = db
      .prepare(
        `
      SELECT channel_id, content_type, difficulty, COUNT(*) as count
      FROM contents
      WHERE status IN ('published', 'approved')
      GROUP BY channel_id, content_type, difficulty
    `
      )
      .all() as { channel_id: string; content_type: string; difficulty: string; count: number }[]

    res.json({ ok: true, distribution: rows })
  } catch (error) {
    console.error('[API] Error fetching difficulty stats:', error)
    res.status(500).json({ ok: false, error: 'Failed to fetch difficulty stats' })
  }
})

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, timestamp: Date.now(), dbPath: DB_PATH })
})

initializeDatabase()

dbWatcher = new DatabaseWatcher({
  dbPath: DB_PATH,
  pollInterval: 2000,
  onChange: () => {
    broadcastUpdate({ type: 'db_updated' })
  },
})
dbWatcher.start()

server.listen(PORT, () => {
  console.log(`[API Server] Running on http://localhost:${PORT}`)
  console.log(`[API Server] WebSocket available at ws://localhost:${PORT}`)
  console.log(`[API Server] Database: ${DB_PATH}`)
  console.log(`[API Server] Database watcher active`)
})

process.on('SIGINT', () => {
  console.log('\n[API Server] Shutting down...')
  if (dbWatcher) {
    dbWatcher.stop()
  }
  server.close()
  process.exit(0)
})
