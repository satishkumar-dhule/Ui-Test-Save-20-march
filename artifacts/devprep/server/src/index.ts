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
  data: string
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
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA busy_timeout = 5000')

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
  const query = `
    SELECT * FROM generated_content
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
        data.push({
          ...record,
          data: JSON.parse(record.data),
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
    const rows = db
      .prepare(
        `
      SELECT content_type, COUNT(*) as count
      FROM generated_content
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
        data.push({
          ...record,
          data: JSON.parse(record.data),
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
        data.push({
          ...record,
          data: JSON.parse(record.data),
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
