/**
 * DevPrep Database Module
 *
 * Unified database client consolidating:
 * - client.ts (basic initialization)
 * - sql.ts (SQL utilities + IndexedDB)
 * - queries.ts (query functions)
 * - storage.ts (IndexedDB helpers)
 *
 * For optimized usage with Web Worker + caching, see @/lib/db-loader
 */

import { SCHEMA_VERSION, CREATE_TABLES_SQL, CONTENT_TYPES, type ContentType } from './schema'
import { getDefaultSeedData, type SeedRecord } from './seed'

// =============================================================================
// Types
// =============================================================================

export type SqlJsDatabase = {
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

export interface ParsedContentRecord extends Omit<ContentRecord, 'data'> {
  data: unknown
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

export interface Stats {
  total: number
  byType: Record<string, number>
  byChannel: Record<string, number>
  byStatus: Record<string, number>
  avgQuality: number
}

export interface DbState {
  isReady: boolean
  isLoading: boolean
  error: Error | null
}

// =============================================================================
// Constants
// =============================================================================

const SQL_JS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.min.js'
const DB_STORE_NAME = 'devprep_sqlite'
const DB_NAME = 'devprep.db'
const DB_VERSION = 1

// =============================================================================
// State
// =============================================================================

let db: SqlJsDatabase | null = null
let initialized = false
let initPromise: Promise<SqlJsDatabase> | null = null
let initError: Error | null = null
let stateListeners: Set<(state: DbState) => void> = new Set()

// =============================================================================
// Storage (IndexedDB)
// =============================================================================

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
        const database = request.result
        const transaction = database.transaction([DB_STORE_NAME], 'readonly')
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
        const database = (event.target as IDBOpenDBRequest).result
        if (!database.objectStoreNames.contains(DB_STORE_NAME)) {
          database.createObjectStore(DB_STORE_NAME)
        }
      }

      request.onsuccess = () => {
        const database = request.result
        const transaction = database.transaction([DB_STORE_NAME], 'readwrite')
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

// =============================================================================
// SQL.js Loading
// =============================================================================

async function loadSqlJs(): Promise<{
  Database: new (data?: ArrayLike<number>) => SqlJsDatabase
}> {
  // Check if already loaded globally
  if (typeof window !== 'undefined' && (window as unknown as { SQL?: unknown }).SQL) {
    return (
      window as unknown as { SQL: { Database: new (data?: ArrayLike<number>) => SqlJsDatabase } }
    ).SQL
  }

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

// =============================================================================
// Database Initialization
// =============================================================================

function notifyListeners(): void {
  const state: DbState = {
    isReady: isReady(),
    isLoading: initPromise !== null && !initialized,
    error: initError,
  }
  stateListeners.forEach(listener => listener(state))
}

export function subscribeDbState(listener: (state: DbState) => void): () => void {
  stateListeners.add(listener)
  listener(getDbState())
  return () => stateListeners.delete(listener)
}

export function getDbState(): DbState {
  return {
    isReady: isReady(),
    isLoading: initPromise !== null && !initialized,
    error: initError,
  }
}

export function isReady(): boolean {
  return initialized && db !== null && initError === null
}

export async function initDatabase(): Promise<SqlJsDatabase> {
  if (db && initialized) return db
  if (initPromise) return initPromise

  initPromise = doInit()
  return initPromise
}

async function doInit(): Promise<SqlJsDatabase> {
  try {
    const SQL = await loadSqlJs()
    const savedData = await loadFromIndexedDB()

    if (savedData) {
      db = new SQL.Database(savedData)
    } else {
      db = new SQL.Database()

      // Create tables
      db.run(CREATE_TABLES_SQL)

      // Seed initial data
      await seedDatabase(db)
    }

    initialized = true
    initError = null
    notifyListeners()
    return db
  } catch (error) {
    initError = error instanceof Error ? error : new Error(String(error))
    notifyListeners()
    throw initError
  }
}

async function seedDatabase(database: SqlJsDatabase): Promise<void> {
  const result = database.exec('SELECT COUNT(*) as count FROM generated_content')
  const count = (result[0]?.values[0]?.[0] as number) || 0
  if (count > 0) return

  const seedData = getDefaultSeedData()
  const records = getAllSeedRecords(seedData)
  const now = Math.floor(Date.now() / 1000)

  for (const record of records) {
    database.run(
      `INSERT OR REPLACE INTO generated_content 
       (id, channel_id, content_type, data, quality_score, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.channel_id,
        record.content_type,
        record.data,
        record.quality_score,
        record.status,
        now - Math.floor(Math.random() * 86400 * 30),
        now,
      ]
    )
  }
}

function getAllSeedRecords(seedData: ReturnType<typeof getDefaultSeedData>): SeedRecord[] {
  return [
    ...seedData.questions,
    ...seedData.flashcards,
    ...seedData.exams,
    ...seedData.voices,
    ...seedData.codings,
  ]
}

// =============================================================================
// Persistence
// =============================================================================

async function persistDatabase(): Promise<void> {
  if (!db) return
  const data = db.export()
  await saveToIndexedDB(new Uint8Array(data))
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    db.close()
    db = null
    initialized = false
    initPromise = null
    initError = null
    notifyListeners()
  }
}

export function resetDatabase(): void {
  closeDatabase()
}

// =============================================================================
// Query Functions
// =============================================================================

export function getDatabase(): SqlJsDatabase | null {
  return db
}

function rowToContentRecord(row: unknown[]): ContentRecord | null {
  if (!Array.isArray(row) || row.length < 11) return null

  return {
    id: row[0] as string,
    channel_id: row[1] as string,
    content_type: row[2] as string,
    data: row[3] as string,
    quality_score: row[4] as number,
    embedding_id: row[5] as string | null,
    created_at: row[6] as number,
    updated_at: row[7] as number,
    status: row[8] as string,
    generated_by: row[9] as string | null,
    generation_time_ms: row[10] as number | null,
  }
}

export function getAllContent(limit = 100, offset = 0): ContentRecord[] {
  const database = getDatabase()
  if (!database) return []

  const stmt = database.prepare(
    'SELECT * FROM generated_content ORDER BY created_at DESC LIMIT ? OFFSET ?'
  )
  stmt.bind([limit, offset])

  const records: ContentRecord[] = []
  while (stmt.step()) {
    const record = rowToContentRecord(stmt.get())
    if (record) records.push(record)
  }
  stmt.free()
  return records
}

export function getContentByType(contentType: string, limit = 100, offset = 0): ContentRecord[] {
  const database = getDatabase()
  if (!database) return []

  const stmt = database.prepare(
    'SELECT * FROM generated_content WHERE content_type = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  )
  stmt.bind([contentType, limit, offset])

  const records: ContentRecord[] = []
  while (stmt.step()) {
    const record = rowToContentRecord(stmt.get())
    if (record) records.push(record)
  }
  stmt.free()
  return records
}

export function getContentByChannel(channelId: string, limit = 100, offset = 0): ContentRecord[] {
  const database = getDatabase()
  if (!database) return []

  const stmt = database.prepare(
    'SELECT * FROM generated_content WHERE channel_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  )
  stmt.bind([channelId, limit, offset])

  const records: ContentRecord[] = []
  while (stmt.step()) {
    const record = rowToContentRecord(stmt.get())
    if (record) records.push(record)
  }
  stmt.free()
  return records
}

export function insertContent(record: Omit<ContentRecord, 'created_at' | 'updated_at'>): void {
  const database = getDatabase()
  if (!database) return

  const now = Math.floor(Date.now() / 1000)

  database.run(
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

  persistDatabase()
}

// =============================================================================
// Parsed Queries (auto-parse JSON data)
// =============================================================================

export function getAllContentParsed(limit = 100, offset = 0): ParsedContentRecord[] {
  return getAllContent(limit, offset).map(parseContentRecord)
}

export function getContentByTypeParsed(
  contentType: string,
  limit = 100,
  offset = 0
): ParsedContentRecord[] {
  return getContentByType(contentType, limit, offset).map(parseContentRecord)
}

export function getContentByChannelParsed(
  channelId: string,
  limit = 100,
  offset = 0
): ParsedContentRecord[] {
  return getContentByChannel(channelId, limit, offset).map(parseContentRecord)
}

function parseContentRecord(record: ContentRecord): ParsedContentRecord {
  let parsedData: unknown = null
  try {
    parsedData = JSON.parse(record.data)
  } catch {
    parsedData = { raw: record.data }
  }
  return {
    ...record,
    data: parsedData,
  }
}

// =============================================================================
// Stats
// =============================================================================

export function getStats(): Stats {
  const database = getDatabase()
  if (!database) {
    return { total: 0, byType: {}, byChannel: {}, byStatus: {}, avgQuality: 0 }
  }

  const totalResult = database.exec('SELECT COUNT(*) FROM generated_content')
  const total = (totalResult[0]?.values[0]?.[0] as number) || 0

  const typeResult = database.exec(
    'SELECT content_type, COUNT(*) FROM generated_content GROUP BY content_type'
  )
  const byType: Record<string, number> = {}
  typeResult[0]?.values.forEach(row => {
    byType[row[0] as string] = row[1] as number
  })

  const channelResult = database.exec(
    'SELECT channel_id, COUNT(*) FROM generated_content GROUP BY channel_id'
  )
  const byChannel: Record<string, number> = {}
  channelResult[0]?.values.forEach(row => {
    byChannel[row[0] as string] = row[1] as number
  })

  const statusResult = database.exec(
    'SELECT status, COUNT(*) FROM generated_content GROUP BY status'
  )
  const byStatus: Record<string, number> = {}
  statusResult[0]?.values.forEach(row => {
    byStatus[row[0] as string] = row[1] as number
  })

  const qualityResult = database.exec('SELECT AVG(quality_score) FROM generated_content')
  const avgQuality = (qualityResult[0]?.values[0]?.[0] as number) || 0

  return { total, byType, byChannel, byStatus, avgQuality }
}

// =============================================================================
// Utility
// =============================================================================

export function clearDatabase(): void {
  const database = getDatabase()
  if (!database) return
  database.run('DELETE FROM generated_content')
  persistDatabase()
}

export function getRecordCount(): number {
  const database = getDatabase()
  if (!database) return 0
  const results = database.exec('SELECT COUNT(*) FROM generated_content')
  if (results.length === 0) return 0
  return results[0].values[0][0] as number
}

// =============================================================================
// Re-export common types
// =============================================================================

export { SCHEMA_VERSION, CREATE_TABLES_SQL, CONTENT_TYPES, type ContentType } from './schema'
export type { SeedRecord } from './seed'
