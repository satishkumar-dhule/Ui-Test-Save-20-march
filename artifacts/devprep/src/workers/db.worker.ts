import initSqlJs, { type Database } from 'sql.js'

type InitMessage = { type: 'INIT'; payload: { wasmUrl: string; dbUrl: string }; id: string }
type QueryMessage = { type: 'QUERY'; payload: { sql: string; params?: unknown[] }; id: string }
type QueryAllMessage = {
  type: 'QUERY_ALL'
  payload: { sql: string; params?: unknown[] }
  id: string
}
type CloseMessage = { type: 'CLOSE'; id: string }
type ReadyMessage = { type: 'READY'; id: string }

type DbWorkerMessage = InitMessage | QueryMessage | QueryAllMessage | CloseMessage | ReadyMessage

type InitCompleteResponse = { type: 'INIT_COMPLETE'; id: string; payload?: { error?: string } }
type QueryResultResponse = {
  type: 'QUERY_RESULT'
  id: string
  payload: { columns: string[]; values: unknown[][] }
}
type QueryAllResultResponse = { type: 'QUERY_ALL_RESULT'; id: string; payload: unknown[] }
type ErrorResponse = { type: 'ERROR'; id: string; payload: { message: string } }

type DbWorkerResponse =
  | InitCompleteResponse
  | QueryResultResponse
  | QueryAllResultResponse
  | ErrorResponse

let db: Database | null = null
let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null

function generateId(): string {
  return `db-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

async function initializeSqlJs(wasmUrl: string): Promise<Awaited<ReturnType<typeof initSqlJs>>> {
  return initSqlJs({ locateFile: () => wasmUrl })
}

async function loadDatabase(dbUrl: string): Promise<boolean> {
  try {
    const response = await fetch(dbUrl)
    if (!response.ok) {
      console.warn('[DB Worker] Failed to fetch database file')
      return false
    }
    const buffer = await response.arrayBuffer()
    if (buffer.byteLength === 0) {
      console.warn('[DB Worker] Database file is empty')
      return false
    }
    if (db) {
      db.close()
    }
    db = new SQL!.Database(new Uint8Array(buffer))
    return true
  } catch (error) {
    console.error('[DB Worker] Error loading database:', error)
    return false
  }
}

function createInMemoryDatabase(): void {
  if (db) {
    db.close()
  }
  db = new SQL!.Database()
  db.run(`
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
      generation_time_ms INTEGER
    )
  `)
  db.run('CREATE INDEX IF NOT EXISTS idx_type ON generated_content(content_type)')
  db.run('CREATE INDEX IF NOT EXISTS idx_channel ON generated_content(channel_id)')
  db.run('CREATE INDEX IF NOT EXISTS idx_status ON generated_content(status)')
}

function executeQuery(
  sql: string,
  params?: unknown[]
): { columns: string[]; values: unknown[][] }[] {
  if (!db) throw new Error('Database not initialized')
  return db.exec(sql, params)
}

function executeQueryAll(sql: string, params?: unknown[]): unknown[] {
  if (!db) throw new Error('Database not initialized')
  const stmt = db.prepare(sql)
  if (params && params.length > 0) {
    stmt.bind(params)
  }
  const results: unknown[] = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

function sendResponse(response: DbWorkerResponse): void {
  self.postMessage(response)
}

self.onmessage = (event: MessageEvent<DbWorkerMessage>) => {
  const message = event.data

  if (message.type === 'READY') {
    return
  }

  if (message.type === 'INIT') {
    const initPayload = message.payload as { wasmUrl: string; dbUrl: string }
    initializeSqlJs(initPayload.wasmUrl)
      .then(sqlModule => {
        SQL = sqlModule
        return loadDatabase(initPayload.dbUrl)
      })
      .then(loaded => {
        if (!loaded) {
          createInMemoryDatabase()
        }
        sendResponse({ type: 'INIT_COMPLETE', id: message.id })
      })
      .catch(error => {
        sendResponse({
          type: 'INIT_COMPLETE',
          id: message.id,
          payload: { error: error instanceof Error ? error.message : 'Init failed' },
        })
      })
    return
  }

  if (message.type === 'QUERY') {
    const queryPayload = message.payload as { sql: string; params?: unknown[] }
    try {
      const result = executeQuery(queryPayload.sql, queryPayload.params)
      sendResponse({
        type: 'QUERY_RESULT',
        id: message.id,
        payload: result[0] || { columns: [], values: [] },
      })
    } catch (error) {
      sendResponse({
        type: 'ERROR',
        id: message.id,
        payload: { message: error instanceof Error ? error.message : 'Query failed' },
      })
    }
    return
  }

  if (message.type === 'QUERY_ALL') {
    const queryPayload = message.payload as { sql: string; params?: unknown[] }
    try {
      const results = executeQueryAll(queryPayload.sql, queryPayload.params)
      sendResponse({
        type: 'QUERY_ALL_RESULT',
        id: message.id,
        payload: results,
      })
    } catch (error) {
      sendResponse({
        type: 'ERROR',
        id: message.id,
        payload: { message: error instanceof Error ? error.message : 'Query failed' },
      })
    }
    return
  }

  if (message.type === 'CLOSE') {
    if (db) {
      db.close()
      db = null
    }
    SQL = null
    sendResponse({ type: 'INIT_COMPLETE', id: message.id })
  }
}

self.postMessage({ type: 'READY', id: generateId() })
