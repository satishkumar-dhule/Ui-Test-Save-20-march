import express, { Request, Response } from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { z } from 'zod'
import path from 'path'
import fs from 'fs'
import { Database } from 'bun:sqlite'
import { DatabaseWatcher } from './dbWatcher.js'
import { initializeRedis, isRedisAvailable, closeRedis } from './services/redis/client.js'
import {
  getCachedContent,
  setCachedContent,
  getCachedChannelContent,
  setCachedChannelContent,
  getCachedStats,
  setCachedStats,
  getCachedTaggedContent,
  setCachedTaggedContent,
  invalidateContentCache,
  invalidateChannelCache,
  invalidateTaggedCache,
} from './services/redis/cache.js'
import {
  apiRateLimit,
  authRateLimit,
  contentRateLimit,
  searchRateLimit,
  generateRateLimit,
} from './services/redis/rate-limit.js'

const generateSchema = z.object({
  channelId: z.string().min(1, 'channelId is required'),
  contentType: z.enum(['question', 'flashcard', 'exam', 'voice', 'coding'], {
    errorMap: () => ({
      message: 'contentType must be one of: question, flashcard, exam, voice, coding',
    }),
  }),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('beginner'),
  count: z.number().int().min(1).max(10).optional().default(1),
})

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

app.use(express.json({ limit: '1mb' }))
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
)
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})
app.use(apiRateLimit)

const AUTH_API_KEY = process.env.AUTH_API_KEY

const apiAuthMiddleware = (req: Request, res: Response, next: () => void) => {
  const publicEndpoints = ['/api/health', '/api/channels', '/api/content', '/api/content/stats']
  if (publicEndpoints.some(p => req.path.startsWith(p))) {
    return next()
  }
  next()
}

app.use(apiAuthMiddleware)

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
    {
      id: '20260326_01_sync_missing_content',
      up: () => {
        // Sync records from generated_content that are missing in contents.
        // This catches records written by external processes after the initial migration.
        const missingRows = db
          .prepare(
            `SELECT gc.* FROM generated_content gc
             LEFT JOIN contents c ON gc.id = c.id
             WHERE c.id IS NULL`
          )
          .all() as any[]
        if (missingRows.length === 0) {
          console.log('[Migration] No missing records to sync')
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

        const syncAll = db.transaction(() => {
          for (const row of missingRows) {
            let parsed: any = {}
            try {
              parsed = JSON.parse(row.data)
            } catch {
              /* keep empty */
            }

            let difficulty = 'intermediate'
            if (
              parsed.difficulty &&
              ['beginner', 'intermediate', 'advanced', 'easy', 'medium', 'hard'].includes(
                parsed.difficulty
              )
            ) {
              difficulty = parsed.difficulty
            }

            let tags: string[] = []
            if (Array.isArray(parsed.tags) && parsed.tags.length > 0) {
              tags = parsed.tags.slice(0, 5)
            } else if (row.channel_id) {
              tags = [row.channel_id]
            }

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

            for (const tag of tags) {
              insertTag.run(row.id, tag)
            }
          }
        })

        syncAll()
        console.log(
          `[Migration] Synced ${missingRows.length} missing records from generated_content -> contents`
        )
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

function transformRecord(record: ContentRecord): Record<string, unknown> {
  let parsed: Record<string, unknown> = {}
  try {
    if (record.data) {
      parsed = JSON.parse(record.data)
    }
  } catch {
    /* keep empty */
  }

  let tags: unknown = record.tags
  try {
    if (typeof record.tags === 'string' && record.tags) {
      tags = JSON.parse(record.tags)
    }
  } catch {
    tags = []
  }

  return {
    ...record,
    difficulty: record.difficulty,
    tags,
    data: parsed,
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
    if (status.includes(',')) {
      const statusValues = status.split(',').map(s => s.trim())
      conditions.push(`status IN (${statusValues.map(() => '?').join(', ')})`)
      params.push(...statusValues)
    } else {
      conditions.push('status = ?')
      params.push(status)
    }
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

app.get('/api/content', async (req: Request, res: Response) => {
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

    const cacheParams: Record<string, string | undefined> = {
      channel: channel as string | undefined,
      type: type as string | undefined,
      status: status as string | undefined,
      quality: quality as string | undefined,
      limit: String(limit ?? '100'),
      offset: String(offset ?? '0'),
      since: since as string | undefined,
    }

    if (isRedisAvailable()) {
      const cached = await getCachedContent<{ data: Record<string, unknown>[]; count: number }>(
        cacheParams
      )
      if (cached) {
        return res.json({ ok: true, ...cached })
      }
    }

    const records = queryContent(options)
    const data: Record<string, unknown>[] = []
    for (const record of records) {
      try {
        data.push(transformRecord(record))
      } catch (parseError) {
        console.warn(`[API] Skipping record ${record.id} due to JSON parse error:`, parseError)
      }
    }

    const response = { data, count: records.length }
    if (isRedisAvailable()) {
      await setCachedContent(cacheParams, response)
    }

    res.json({ ok: true, ...response })
  } catch (error) {
    console.error('[API] Error fetching content:', error)
    res.status(500).json({ ok: false, error: 'Failed to fetch content' })
  }
})

app.get('/api/content/stats', async (_req: Request, res: Response) => {
  try {
    if (isRedisAvailable()) {
      const cached = await getCachedStats<{ stats: Record<string, number> }>()
      if (cached) {
        return res.json({ ok: true, stats: cached.stats })
      }
    }

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

    if (isRedisAvailable()) {
      await setCachedStats({ stats })
    }

    res.json({ ok: true, stats })
  } catch (error) {
    console.error('[API] Error fetching stats:', error)
    res.status(500).json({ ok: false, error: 'Failed to fetch stats' })
  }
})

app.get('/api/content/:type', async (req: Request, res: Response) => {
  try {
    const { type: contentTypeParam } = req.params
    const type = contentTypeParam as string
    const { channel, status, quality, limit, offset, since } = req.query

    const validTypes: readonly string[] = ['question', 'flashcard', 'exam', 'voice', 'coding']
    if (!validTypes.includes(type)) {
      return res.status(400).json({ ok: false, error: 'Invalid content type' })
    }

    const options: ContentQueryOptions = {
      contentType: type,
      channelId: typeof channel === 'string' ? channel : undefined,
      status: status as string | undefined,
      minQuality: quality ? parseFloat(quality as string) : undefined,
      limit: limit ? parseInt(limit as string, 10) : 100,
      offset: offset ? parseInt(offset as string, 10) : 0,
      since: since ? parseInt(since as string, 10) : undefined,
    }

    const cacheParams: Record<string, string | undefined> = {
      type: type as string,
      channel: channel as string | undefined,
      status: status as string | undefined,
      quality: quality as string | undefined,
      limit: String(limit ?? '100'),
      offset: String(offset ?? '0'),
      since: since as string | undefined,
    }

    if (isRedisAvailable()) {
      const cached = await getCachedContent<{ data: Record<string, unknown>[]; count: number }>(
        cacheParams
      )
      if (cached) {
        return res.json({ ok: true, ...cached })
      }
    }

    const records = queryContent(options)
    const data: Record<string, unknown>[] = []
    for (const record of records) {
      try {
        data.push(transformRecord(record))
      } catch (parseError) {
        console.warn(`[API] Skipping record ${record.id} due to JSON parse error:`, parseError)
      }
    }

    const response = { data, count: records.length }
    if (isRedisAvailable()) {
      await setCachedContent(cacheParams, response)
    }

    res.json({ ok: true, ...response })
  } catch (error) {
    console.error('[API] Error fetching content by type:', error)
    res.status(500).json({ ok: false, error: 'Failed to fetch content' })
  }
})

app.get('/api/channels/:channelId/content', async (req: Request, res: Response) => {
  try {
    const channelId = String(req.params.channelId)
    const { type, status, quality, limit, offset } = req.query

    const options: ContentQueryOptions = {
      channelId,
      contentType: typeof type === 'string' ? type : undefined,
      status: typeof status === 'string' ? status : undefined,
      minQuality: typeof quality === 'string' ? parseFloat(quality) : undefined,
      limit: typeof limit === 'string' ? parseInt(limit, 10) : 100,
      offset: typeof offset === 'string' ? parseInt(offset, 10) : 0,
    }

    const cacheParams: Record<string, string | undefined> = {
      type: typeof type === 'string' ? type : undefined,
      status: typeof status === 'string' ? status : undefined,
      quality: typeof quality === 'string' ? quality : undefined,
      limit: String(limit ?? '100'),
      offset: String(offset ?? '0'),
    }

    if (isRedisAvailable()) {
      const cached = await getCachedChannelContent<{
        data: Record<string, unknown>[]
        count: number
      }>(channelId as string, cacheParams)
      if (cached) {
        return res.json({ ok: true, ...cached })
      }
    }

    const records = queryContent(options)
    const data: Record<string, unknown>[] = []
    for (const record of records) {
      try {
        data.push(transformRecord(record))
      } catch (parseError) {
        console.warn(`[API] Skipping record ${record.id} due to JSON parse error:`, parseError)
      }
    }

    const response = { data, count: records.length }
    if (isRedisAvailable()) {
      await setCachedChannelContent(channelId, cacheParams, response)
    }

    res.json({ ok: true, ...response })
  } catch (error) {
    console.error('[API] Error fetching channel content:', error)
    res.status(500).json({ ok: false, error: 'Failed to fetch content' })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Tag-based query endpoint (enabled by content_tags denormalized index)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/content/tagged/:tag', async (req: Request, res: Response) => {
  try {
    const { tag } = req.params
    const { limit = '50', offset = '0' } = req.query
    const lim = parseInt(limit as string, 10)
    const off = parseInt(offset as string, 10)

    const cacheParams: Record<string, string | undefined> = {
      limit: String(lim),
      offset: String(off),
    }

    if (isRedisAvailable()) {
      const cached = await getCachedTaggedContent<{
        data: Record<string, unknown>[]
        count: number
      }>(tag as string, cacheParams)
      if (cached) {
        return res.json({ ok: true, ...cached, tag })
      }
    }

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
        .all(tag as string, lim, off) as any[]
    } else {
      rows = db
        .prepare(
          `
        SELECT * FROM generated_content
        WHERE status IN ('published', 'approved')
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `
        )
        .all(lim, off) as any[]
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

    const data: Record<string, unknown>[] = []
    for (const record of rows) {
      try {
        data.push(transformRecord(record))
      } catch (parseError) {
        console.warn(`[API] Skipping tagged record ${record.id}:`, parseError)
      }
    }

    const response = { data, count: data.length }
    if (isRedisAvailable()) {
      await setCachedTaggedContent(tag as string, cacheParams, response)
    }

    res.json({ ok: true, ...response, tag })
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
  res.json({
    ok: true,
    timestamp: Date.now(),
    dbPath: DB_PATH,
    redis: isRedisAvailable() ? 'InMemoryRedis' : 'disabled',
  })
})

app.get('/api/channels', (_req: Request, res: Response) => {
  try {
    const channels = db.prepare('SELECT * FROM channels ORDER BY name').all() as {
      id: string
      name: string
    }[]
    res.json({ ok: true, data: channels })
  } catch (error) {
    console.error('[API] Error fetching channels:', error)
    res.status(500).json({ ok: false, error: 'Failed to fetch channels' })
  }
})

app.post('/api/generate', generateRateLimit, async (req: Request, res: Response) => {
  try {
    const result = generateSchema.safeParse(req.body)
    if (!result.success) {
      const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      return res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: errors,
      })
    }

    const { channelId, contentType, difficulty, count } = result.data
    const startTime = Date.now()

    const insertStmt = db.prepare(`
      INSERT INTO contents (id, channel_id, content_type, difficulty, tags, data, status, quality_score, created_at, updated_at, generated_by, generation_time_ms)
      VALUES (?, ?, ?, ?, '[]', '{}', 'pending', 0, ?, ?, 'api', ?)
    `)

    const results: { id: string; channel_id: string; content_type: string }[] = []
    const generationTimeMs = Date.now() - startTime

    const transaction = db.transaction(() => {
      for (let i = 0; i < count; i++) {
        const id = `${contentType.slice(0, 3)}-api-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const now = Math.floor(Date.now() / 1000)
        insertStmt.run(id, channelId, contentType, difficulty, now, now, generationTimeMs)
        results.push({ id, channel_id: channelId, content_type: contentType })
      }
    })

    transaction()

    if (isRedisAvailable()) {
      await invalidateContentCache()
    }

    res.status(201).json({
      ok: true,
      message: `Generated ${results.length} ${contentType} content(s) for channel ${channelId}`,
      data: results,
      generation_time_ms: generationTimeMs,
    })
  } catch (error) {
    console.error('[API] Error generating content:', error)
    res.status(500).json({ ok: false, error: 'Failed to generate content' })
  }
})

initializeDatabase()

dbWatcher = new DatabaseWatcher({
  dbPath: DB_PATH,
  pollInterval: 2000,
  onChange: async () => {
    if (isRedisAvailable()) {
      await invalidateContentCache()
    }
    broadcastUpdate({ type: 'db_updated' })
  },
})
dbWatcher.start()

initializeRedis().then(redisConnected => {
  if (!redisConnected) {
    console.log('[API Server] Running without Redis cache - all requests will hit DB')
  }
})

server.listen(PORT, () => {
  console.log(`[API Server] Running on http://localhost:${PORT}`)
  console.log(`[API Server] WebSocket available at ws://localhost:${PORT}`)
  console.log(`[API Server] Database: ${DB_PATH}`)
  console.log(`[API Server] Database watcher active`)
  console.log(`[API Server] Cache: ${isRedisAvailable() ? 'InMemoryRedis connected' : 'disabled'}`)
})

process.on('SIGINT', async () => {
  console.log('\n[API Server] Shutting down...')
  if (dbWatcher) {
    dbWatcher.stop()
  }
  await closeRedis()
  server.close()
  process.exit(0)
})
