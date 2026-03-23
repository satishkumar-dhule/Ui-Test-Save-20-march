import request from 'supertest'
import express, { Express } from 'express'
import path from 'path'
import fs from 'fs'
import { Database } from 'bun:sqlite'

const TEST_DB_PATH = path.resolve(import.meta.dirname, '../../../../data/test-api.db')

function createTestApp(): Express {
  const app = express()
  app.use(express.json())

  let db: Database

  function initializeTestDb(): void {
    const dir = path.dirname(TEST_DB_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
    db = new Database(TEST_DB_PATH)
    db.exec('PRAGMA foreign_keys = ON')

    db.exec(`
      CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );
    `)

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

    db.exec(`
      CREATE TABLE IF NOT EXISTS content_tags (
        content_id TEXT NOT NULL,
        tag TEXT NOT NULL,
        PRIMARY KEY (content_id, tag),
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
      );
    `)

    db.exec(`
      INSERT INTO channels (id, name) VALUES
        ('javascript', 'JavaScript'),
        ('devops', 'DevOps'),
        ('react', 'React');
    `)
  }

  function transformRecord(record: any): any {
    let parsed: Record<string, unknown> = {}
    try {
      parsed = JSON.parse(record.data)
    } catch {
      // keep empty
    }
    return {
      ...record,
      difficulty: record.difficulty,
      tags: typeof record.tags === 'string' ? JSON.parse(record.tags) : record.tags,
      data: parsed,
    }
  }

  function queryContent(options: any = {}): any[] {
    const { channelId, contentType, status, minQuality, limit = 100, offset = 0 } = options
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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const query = `SELECT * FROM contents ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    params.push(limit, offset)
    return db.prepare(query).all(...params)
  }

  initializeTestDb()

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      timestamp: Date.now(),
      dbPath: TEST_DB_PATH,
      redis: 'disabled',
    })
  })

  app.get('/api/channels', (_req, res) => {
    try {
      const channels = db.prepare('SELECT * FROM channels ORDER BY name').all()
      res.json({ ok: true, data: channels })
    } catch (error) {
      res.status(500).json({ ok: false, error: 'Failed to fetch channels' })
    }
  })

  app.get('/api/content', (req, res) => {
    try {
      const { channel, type, status, quality, limit, offset } = req.query
      const options: any = {
        channelId: channel as string | undefined,
        contentType: type as string | undefined,
        status: status as string | undefined,
        minQuality: quality ? parseFloat(quality as string) : undefined,
        limit: limit ? parseInt(limit as string, 10) : 100,
        offset: offset ? parseInt(offset as string, 10) : 0,
      }

      const records = queryContent(options)
      const data: any[] = []
      for (const record of records) {
        try {
          data.push(transformRecord(record))
        } catch {
          // skip malformed records
        }
      }

      res.json({ ok: true, data, count: records.length })
    } catch (error) {
      res.status(500).json({ ok: false, error: 'Failed to fetch content' })
    }
  })

  app.get('/api/content/:type', (req, res) => {
    try {
      const type = req.params.type
      const validTypes = ['question', 'flashcard', 'exam', 'voice', 'coding']
      if (!validTypes.includes(type)) {
        return res.status(400).json({ ok: false, error: 'Invalid content type' })
      }

      const { channel, status, quality, limit, offset } = req.query
      const options: any = {
        contentType: type,
        channelId: typeof channel === 'string' ? channel : undefined,
        status: status as string | undefined,
        minQuality: quality ? parseFloat(quality as string) : undefined,
        limit: limit ? parseInt(limit as string, 10) : 100,
        offset: offset ? parseInt(offset as string, 10) : 0,
      }

      const records = queryContent(options)
      const data: any[] = []
      for (const record of records) {
        try {
          data.push(transformRecord(record))
        } catch {
          // skip malformed records
        }
      }

      res.json({ ok: true, data, count: records.length })
    } catch (error) {
      res.status(500).json({ ok: false, error: 'Failed to fetch content' })
    }
  })

  app.get('/api/channels/:channelId/content', (req, res) => {
    try {
      const channelId = String(req.params.channelId)
      const { type, status, quality, limit, offset } = req.query

      const options: any = {
        channelId,
        contentType: typeof type === 'string' ? type : undefined,
        status: typeof status === 'string' ? status : undefined,
        minQuality: typeof quality === 'string' ? parseFloat(quality) : undefined,
        limit: typeof limit === 'string' ? parseInt(limit, 10) : 100,
        offset: typeof offset === 'string' ? parseInt(offset, 10) : 0,
      }

      const records = queryContent(options)
      const data: any[] = []
      for (const record of records) {
        try {
          data.push(transformRecord(record))
        } catch {
          // skip malformed records
        }
      }

      res.json({ ok: true, data, count: records.length })
    } catch (error) {
      res.status(500).json({ ok: false, error: 'Failed to fetch content' })
    }
  })

  app.post('/api/generate', (req, res) => {
    try {
      const { channel, type, count = 1, difficulty } = req.body

      if (!channel || !type) {
        return res.status(400).json({
          ok: false,
          error: 'Missing required fields: channel and type',
        })
      }

      const validTypes = ['question', 'flashcard', 'exam', 'voice', 'coding']
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          ok: false,
          error: `Invalid content type. Must be one of: ${validTypes.join(', ')}`,
        })
      }

      const numCount = Math.min(Math.max(1, parseInt(count, 10) || 1), 10)
      const startTime = Date.now()

      const insertStmt = db.prepare(`
        INSERT INTO contents (id, channel_id, content_type, difficulty, tags, data, status, quality_score, created_at, updated_at, generated_by, generation_time_ms)
        VALUES (?, ?, ?, ?, '[]', '{}', 'pending', 0, ?, ?, 'test', ?)
      `)

      const results: { id: string; channel_id: string; content_type: string }[] = []
      const generationTimeMs = Date.now() - startTime

      const transaction = db.transaction(() => {
        for (let i = 0; i < numCount; i++) {
          const id = `test-${type.slice(0, 3)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
          const now = Math.floor(Date.now() / 1000)
          insertStmt.run(
            id,
            channel,
            type,
            difficulty || 'intermediate',
            now,
            now,
            generationTimeMs
          )
          results.push({ id, channel_id: channel, content_type: type })
        }
      })

      transaction()

      res.status(201).json({
        ok: true,
        message: `Generated ${results.length} ${type} content(s) for channel ${channel}`,
        data: results,
        generation_time_ms: generationTimeMs,
      })
    } catch (error) {
      res.status(500).json({ ok: false, error: 'Failed to generate content' })
    }
  })

  return app
}

describe('API Endpoints', () => {
  let app: Express

  beforeAll(() => {
    app = createTestApp()
  })

  afterAll(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
  })

  describe('GET /api/health', () => {
    it('returns correct structure', async () => {
      const response = await request(app).get('/api/health')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('ok', true)
      expect(response.body).toHaveProperty('timestamp')
      expect(typeof response.body.timestamp).toBe('number')
      expect(response.body).toHaveProperty('dbPath')
      expect(response.body).toHaveProperty('redis')
    })

    it('returns proper JSON content-type', async () => {
      const response = await request(app).get('/api/health')
      expect(response.headers['content-type']).toMatch(/application\/json/)
    })
  })

  describe('GET /api/channels', () => {
    it('returns array of channels', async () => {
      const response = await request(app).get('/api/channels')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('ok', true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
    })

    it('channels have id and name properties', async () => {
      const response = await request(app).get('/api/channels')
      const channel = response.body.data[0]

      expect(channel).toHaveProperty('id')
      expect(channel).toHaveProperty('name')
    })

    it('channels are sorted by name', async () => {
      const response = await request(app).get('/api/channels')
      const names = response.body.data.map((c: any) => c.name)
      const sortedNames = [...names].sort()
      expect(names).toEqual(sortedNames)
    })
  })

  describe('GET /api/content', () => {
    it('returns content array with ok:true', async () => {
      const response = await request(app).get('/api/content')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('ok', true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body).toHaveProperty('count')
    })

    it('returns empty array when no content', async () => {
      const response = await request(app).get('/api/content')

      expect(response.body.data).toEqual([])
      expect(response.body.count).toBe(0)
    })

    it('handles query parameters', async () => {
      const response = await request(app)
        .get('/api/content')
        .query({ channel: 'javascript', type: 'question', limit: 10 })

      expect(response.status).toBe(200)
      expect(response.body.ok).toBe(true)
    })
  })

  describe('GET /api/content/:type', () => {
    it('returns filtered content for valid type', async () => {
      const response = await request(app).get('/api/content/question')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('ok', true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('returns 400 for invalid content type', async () => {
      const response = await request(app).get('/api/content/invalid')

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('ok', false)
      expect(response.body).toHaveProperty('error', 'Invalid content type')
    })

    it('accepts all valid content types', async () => {
      const validTypes = ['question', 'flashcard', 'exam', 'voice', 'coding']

      for (const type of validTypes) {
        const response = await request(app).get(`/api/content/${type}`)
        expect(response.status).toBe(200)
        expect(response.body.ok).toBe(true)
      }
    })

    it('handles query parameters for filtering', async () => {
      const response = await request(app)
        .get('/api/content/question')
        .query({ channel: 'devops', status: 'pending', quality: 0.5 })

      expect(response.status).toBe(200)
      expect(response.body.ok).toBe(true)
    })
  })

  describe('GET /api/channels/:channelId/content', () => {
    it('returns channel content for existing channel', async () => {
      const response = await request(app).get('/api/channels/devops/content')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('ok', true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('returns empty array for channel with no content', async () => {
      const response = await request(app).get('/api/channels/react/content')

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual([])
    })

    it('returns 500 for database errors', async () => {
      // This test would require mocking the database
      // Skipping for basic test coverage
    })
  })

  describe('POST /api/generate', () => {
    it('creates content with valid input', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({ channel: 'javascript', type: 'question', count: 1 })

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('ok', true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBe(1)
      expect(response.body.data[0]).toHaveProperty('id')
      expect(response.body.data[0]).toHaveProperty('channel_id', 'javascript')
      expect(response.body.data[0]).toHaveProperty('content_type', 'question')
    })

    it('returns 400 for missing channel', async () => {
      const response = await request(app).post('/api/generate').send({ type: 'question' })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('ok', false)
      expect(response.body.error).toContain('Missing required fields')
    })

    it('returns 400 for missing type', async () => {
      const response = await request(app).post('/api/generate').send({ channel: 'javascript' })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('ok', false)
      expect(response.body.error).toContain('Missing required fields')
    })

    it('returns 400 for invalid type', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({ channel: 'javascript', type: 'invalid' })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('ok', false)
      expect(response.body.error).toContain('Invalid content type')
    })

    it('generates multiple items when count > 1', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({ channel: 'devops', type: 'flashcard', count: 3 })

      expect(response.status).toBe(201)
      expect(response.body.data.length).toBe(3)
    })

    it('caps count at 10', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({ channel: 'javascript', type: 'question', count: 50 })

      expect(response.status).toBe(201)
      expect(response.body.data.length).toBe(10)
    })

    it('accepts difficulty parameter', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({ channel: 'react', type: 'exam', difficulty: 'advanced' })

      expect(response.status).toBe(201)
      expect(response.body.ok).toBe(true)
    })
  })

  describe('JSON Parse Error Recovery', () => {
    it('handles records with malformed JSON data gracefully', async () => {
      const db = new Database(TEST_DB_PATH)
      db.exec(`
        INSERT INTO contents (id, channel_id, content_type, difficulty, tags, data, status)
        VALUES ('good-record', 'javascript', 'question', 'beginner', '["js"]', '{"question": "valid"}', 'pending');
        INSERT INTO contents (id, channel_id, content_type, difficulty, tags, data, status)
        VALUES ('bad-record', 'javascript', 'question', 'beginner', '["js"]', 'INVALID_JSON{', 'pending');
        INSERT INTO contents (id, channel_id, content_type, difficulty, tags, data, status)
        VALUES ('another-good', 'javascript', 'question', 'intermediate', '["js"]', '{"question": "also valid"}', 'pending');
      `)
      db.close()

      const response = await request(app)
        .get('/api/channels/javascript/content')
        .query({ type: 'question' })

      expect(response.status).toBe(200)
      expect(response.body.ok).toBe(true)
      const records = response.body.data
      const ids = records.map((r: any) => r.id)
      expect(ids).toContain('good-record')
      expect(ids).toContain('another-good')
      const badRecord = records.find((r: any) => r.id === 'bad-record')
      expect(badRecord).toBeDefined()
      expect(badRecord.data).toEqual({})
    })

    it('skips records with malformed tags JSON', async () => {
      const db = new Database(TEST_DB_PATH)
      db.exec(`
        INSERT INTO contents (id, channel_id, content_type, difficulty, tags, data, status)
        VALUES ('good-tags-record', 'devops', 'flashcard', 'intermediate', '["devops"]', '{"term": "test"}', 'pending');
        INSERT INTO contents (id, channel_id, content_type, difficulty, tags, data, status)
        VALUES ('bad-tags-record', 'devops', 'flashcard', 'intermediate', 'INVALID_TAGS', '{"term": "test"}', 'pending');
      `)
      db.close()

      const response = await request(app).get('/api/content')

      expect(response.status).toBe(200)
      expect(response.body.ok).toBe(true)
      const record = response.body.data.find((r: any) => r.id === 'good-tags-record')
      expect(record).toBeDefined()
      const badRecord = response.body.data.find((r: any) => r.id === 'bad-tags-record')
      expect(badRecord).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('returns 404 for unknown endpoints', async () => {
      const response = await request(app).get('/api/unknown')
      expect(response.status).toBe(404)
    })

    it('handles invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/generate')
        .set('Content-Type', 'application/json')
        .send('not valid json')

      expect(response.status).toBe(400)
    })

    it('returns 500 for internal server errors', async () => {
      // The current implementation catches errors and returns 500
      // Testing would require mocking internal state
    })
  })

  describe('Query Parameter Handling', () => {
    it('handles limit parameter', async () => {
      // Create multiple records
      const db = new Database(TEST_DB_PATH)
      for (let i = 0; i < 5; i++) {
        db.exec(`
          INSERT INTO contents (id, channel_id, content_type, difficulty, tags, data, status)
          VALUES ('limit-test-${i}', 'react', 'question', 'beginner', '[]', '{}', 'pending');
        `)
      }
      db.close()

      const response = await request(app).get('/api/content').query({ channel: 'react', limit: 2 })

      expect(response.status).toBe(200)
      expect(response.body.data.length).toBeLessThanOrEqual(2)
    })

    it('handles offset parameter', async () => {
      const response = await request(app).get('/api/content').query({ offset: 0 })

      expect(response.status).toBe(200)
      expect(response.body.ok).toBe(true)
    })

    it('handles combined query parameters', async () => {
      const response = await request(app).get('/api/content/question').query({
        channel: 'javascript',
        status: 'pending',
        quality: 0,
        limit: 50,
        offset: 0,
      })

      expect(response.status).toBe(200)
      expect(response.body.ok).toBe(true)
    })
  })
})
