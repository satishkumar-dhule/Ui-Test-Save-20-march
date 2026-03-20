// sql.js loaded dynamically from CDN - no npm install needed
const SQL_JS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.min.js'
const DB_STORE_NAME = 'devprep_sqlite'
const DB_NAME = 'devprep.db'
const DB_VERSION = 1

type SqlJsDatabase = {
  run(sql: string, params?: unknown[]): void
  exec(sql: string): Array<{ columns: string[]; values: unknown[][] }>
  prepare(sql: string): {
    bind(params?: unknown[]): boolean
    step(): boolean
    get(): unknown[]
    getAsObject(): Record<string, unknown>
    free(): void
  }
  export(): Uint8Array
  close(): void
}

let sqlDb: SqlJsDatabase | null = null

export interface ContentRecord {
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

export interface ContentQueryOptions {
  channelId?: string
  contentType?: string
  status?: string
  minQuality?: number
  limit?: number
  offset?: number
  since?: number
}

async function loadSqlJs(): Promise<{
  Database: new (data?: ArrayLike<number>) => SqlJsDatabase
}> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SQL_JS_CDN
    script.onload = () => {
      const SQL = (
        window as unknown as { SQL: { Database: new (data?: ArrayLike<number>) => SqlJsDatabase } }
      ).SQL
      if (SQL) {
        resolve(SQL)
      } else {
        reject(new Error('sql.js failed to load'))
      }
    }
    script.onerror = () => reject(new Error('Failed to load sql.js from CDN'))
    document.head.appendChild(script)
  })
}

async function loadFromIndexedDB(): Promise<Uint8Array | null> {
  return new Promise(resolve => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => resolve(null)

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
          db.createObjectStore(DB_STORE_NAME)
        }
      }

      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction([DB_STORE_NAME], 'readonly')
        const store = transaction.objectStore(DB_STORE_NAME)
        const getRequest = store.get('database')

        getRequest.onsuccess = () => {
          resolve(getRequest.result || null)
        }

        getRequest.onerror = () => resolve(null)
      }
    } catch {
      resolve(null)
    }
  })
}

async function saveToIndexedDB(data: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
          db.createObjectStore(DB_STORE_NAME)
        }
      }

      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction([DB_STORE_NAME], 'readwrite')
        const store = transaction.objectStore(DB_STORE_NAME)
        const putRequest = store.put(data, 'database')

        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      }
    } catch (error) {
      reject(error)
    }
  })
}

export async function initSqlDatabase(): Promise<void> {
  const SQL = await loadSqlJs()
  const savedData = await loadFromIndexedDB()

  if (savedData) {
    sqlDb = new SQL.Database(savedData)
  } else {
    sqlDb = new SQL.Database()
    sqlDb.run(`
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
      )
    `)
    sqlDb.run(`CREATE INDEX IF NOT EXISTS idx_type ON generated_content(content_type)`)
    sqlDb.run(`CREATE INDEX IF NOT EXISTS idx_channel ON generated_content(channel_id)`)
    sqlDb.run(`CREATE INDEX IF NOT EXISTS idx_status ON generated_content(status)`)
    sqlDb.run(`CREATE INDEX IF NOT EXISTS idx_quality ON generated_content(quality_score)`)
    sqlDb.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON generated_content(created_at)`)

    await saveDb()
  }
}

async function saveDb(): Promise<void> {
  if (!sqlDb) return
  const data = sqlDb.export()
  await saveToIndexedDB(new Uint8Array(data))
}

export function getSqlDatabase(): SqlJsDatabase | null {
  return sqlDb
}

export function isSqlInitialized(): boolean {
  return sqlDb !== null
}

export function queryContent(options: ContentQueryOptions = {}): ContentRecord[] {
  if (!sqlDb) return []

  const { channelId, contentType, status, minQuality, limit = 100, offset = 0, since } = options

  const conditions: string[] = []
  const values: (string | number)[] = []

  if (channelId) {
    conditions.push('channel_id = ?')
    values.push(channelId)
  }
  if (contentType) {
    conditions.push('content_type = ?')
    values.push(contentType)
  }
  if (status) {
    conditions.push('status = ?')
    values.push(status)
  }
  if (minQuality !== undefined) {
    conditions.push('quality_score >= ?')
    values.push(minQuality)
  }
  if (since) {
    conditions.push('created_at >= ?')
    values.push(since)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const query = `
    SELECT * FROM generated_content
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  const results = sqlDb.exec(query)
  if (results.length === 0) return []

  const columns = results[0].columns
  return results[0].values.map(row => {
    const record: Record<string, unknown> = {}
    columns.forEach((col, i) => {
      record[col] = row[i]
    })
    return record as unknown as ContentRecord
  })
}

export function queryContentParsed(
  options: ContentQueryOptions = {}
): (ContentRecord & { data: unknown })[] {
  const records = queryContent(options)
  const parsed: (ContentRecord & { data: unknown })[] = []

  for (const record of records) {
    try {
      parsed.push({
        ...record,
        data: JSON.parse(record.data),
      })
    } catch {
      // Skip invalid JSON
    }
  }

  return parsed
}

export function insertContent(record: Omit<ContentRecord, 'created_at' | 'updated_at'>): void {
  if (!sqlDb) return

  const now = Math.floor(Date.now() / 1000)

  sqlDb.run(
    `INSERT OR REPLACE INTO generated_content (
      id, channel_id, content_type, data, quality_score,
      embedding_id, created_at, updated_at, status,
      generated_by, generation_time_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id,
      record.channel_id,
      record.content_type,
      record.data,
      record.quality_score,
      record.embedding_id,
      now,
      now,
      record.status,
      record.generated_by,
      record.generation_time_ms,
    ]
  )

  saveDb()
}

export function getStats(): Record<string, number> {
  if (!sqlDb) {
    return { total: 0, question: 0, flashcard: 0, exam: 0, voice: 0, coding: 0 }
  }

  const results = sqlDb.exec(`
    SELECT content_type, COUNT(*) as count
    FROM generated_content
    GROUP BY content_type
  `)

  const stats: Record<string, number> = {
    total: 0,
    question: 0,
    flashcard: 0,
    exam: 0,
    voice: 0,
    coding: 0,
  }

  if (results.length === 0) return stats

  for (const row of results[0].values) {
    const contentType = row[0] as string
    const count = row[1] as number
    stats[contentType] = count
    stats.total += count
  }

  return stats
}

export function getContentByChannel(
  channelId: string,
  options: Omit<ContentQueryOptions, 'channelId'> = {}
): (ContentRecord & { data: unknown })[] {
  return queryContentParsed({ ...options, channelId })
}

export function getContentByType(
  contentType: string,
  options: Omit<ContentQueryOptions, 'contentType'> = {}
): (ContentRecord & { data: unknown })[] {
  return queryContentParsed({ ...options, contentType })
}

export function clearDatabase(): void {
  if (!sqlDb) return
  sqlDb.run('DELETE FROM generated_content')
  saveDb()
}

export function getRecordCount(): number {
  if (!sqlDb) return 0
  const results = sqlDb.exec('SELECT COUNT(*) FROM generated_content')
  if (results.length === 0) return 0
  return results[0].values[0][0] as number
}
