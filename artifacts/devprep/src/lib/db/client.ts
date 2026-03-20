// sql.js loaded dynamically from CDN - no npm install needed
import { loadDatabase, saveDatabase } from './storage'

type SqlJsStatement = {
  bind(params?: unknown[]): boolean
  step(): boolean
  get(): unknown[]
  getAsObject(): Record<string, unknown>
  free(): void
}

type SqlJsDatabase = {
  run(sql: string, params?: unknown[]): void
  exec(sql: string): Array<{ columns: string[]; values: unknown[][] }>
  prepare(sql: string): SqlJsStatement
  export(): Uint8Array
  close(): void
}

let db: SqlJsDatabase | null = null
let initialized = false

async function loadSqlJs(): Promise<{
  Database: new (data?: ArrayLike<number>) => SqlJsDatabase
}> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.min.js'
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

export async function initDatabase(): Promise<SqlJsDatabase> {
  if (db && initialized) return db

  const SQL = await loadSqlJs()
  const savedData = await loadDatabase()

  if (savedData) {
    db = new SQL.Database(savedData)
  } else {
    db = new SQL.Database()
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
        generation_time_ms INTEGER,
        UNIQUE(id)
      )
    `)
    db.run(`CREATE INDEX IF NOT EXISTS idx_type ON generated_content(content_type)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_channel ON generated_content(channel_id)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_status ON generated_content(status)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_quality ON generated_content(quality_score)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON generated_content(created_at)`)
    await persistDatabase()
  }

  initialized = true
  return db
}

export async function persistDatabase(): Promise<void> {
  if (!db) return
  const data = db.export()
  await saveDatabase(new Uint8Array(data))
}

export function getDatabase(): SqlJsDatabase | null {
  return db
}

export function isInitialized(): boolean {
  return initialized
}
