import { initDatabase, getDatabase, getDbState } from './dbClient'
import type { ContentRecord, ContentQueryOptions, ContentStats } from './contentApi'

export interface DbsApiResponse<T> {
  ok: boolean
  data?: T
  count?: number
  stats?: ContentStats
  error?: string
}

function parseContentRecord(row: unknown[]): ContentRecord | null {
  if (!row || row.length < 12) return null

  const [
    id,
    channel_id,
    content_type,
    dataStr,
    quality_score,
    embedding_id,
    created_at,
    updated_at,
    status,
    generated_by,
    generation_time_ms,
  ] = row

  let parsedData: unknown = null
  try {
    if (typeof dataStr === 'string') {
      parsedData = JSON.parse(dataStr)
    }
  } catch {
    return null
  }

  return {
    id: id as string,
    channel_id: channel_id as string,
    content_type: content_type as string,
    data: parsedData,
    quality_score: quality_score as number,
    embedding_id: embedding_id as string | null,
    created_at: created_at as number,
    updated_at: updated_at as number,
    status: status as string,
    generated_by: generated_by as string | null,
    generation_time_ms: generation_time_ms as number | null,
  }
}

function buildWhereClause(options: ContentQueryOptions): {
  clause: string
} {
  const conditions: string[] = []

  if (options.channelId) {
    conditions.push(`channel_id = '${options.channelId.replace(/'/g, "''")}'`)
  }
  if (options.contentType) {
    conditions.push(`content_type = '${options.contentType.replace(/'/g, "''")}'`)
  }
  if (options.status) {
    conditions.push(`status = '${options.status.replace(/'/g, "''")}'`)
  }
  if (options.minQuality !== undefined) {
    conditions.push(`quality_score >= ${options.minQuality}`)
  }
  if (options.since) {
    conditions.push(`created_at >= ${options.since}`)
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  return { clause }
}

export async function fetchAllContent(options: ContentQueryOptions = {}): Promise<ContentRecord[]> {
  await initDatabase()
  const db = getDatabase()
  if (!db) throw new Error('Database not initialized')

  const { clause } = buildWhereClause(options)
  let query = `SELECT * FROM generated_content ${clause} ORDER BY created_at DESC`

  if (options.limit) {
    query += ` LIMIT ${options.limit}`
  }
  if (options.offset) {
    query += ` OFFSET ${options.offset}`
  }

  const result = db.exec(query)
  if (!result[0]) return []

  return result[0].values
    .map(parseContentRecord)
    .filter((record): record is ContentRecord => record !== null)
}

export async function fetchContentByType<T>(
  type: string,
  options: Omit<ContentQueryOptions, 'contentType'> = {}
): Promise<T[]> {
  const records = await fetchAllContent({ ...options, contentType: type })
  return records.map(record => record.data as T)
}

export async function fetchChannelContent<T>(
  channelId: string,
  options: Omit<ContentQueryOptions, 'channelId'> = {}
): Promise<T[]> {
  const records = await fetchAllContent({ ...options, channelId })
  return records.map(record => record.data as T)
}

export async function fetchContentStats(): Promise<ContentStats> {
  await initDatabase()
  const db = getDatabase()
  if (!db) throw new Error('Database not initialized')

  const result = db.exec(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN content_type = 'question' THEN 1 ELSE 0 END) as question,
      SUM(CASE WHEN content_type = 'flashcard' THEN 1 ELSE 0 END) as flashcard,
      SUM(CASE WHEN content_type = 'exam' THEN 1 ELSE 0 END) as exam,
      SUM(CASE WHEN content_type = 'voice' THEN 1 ELSE 0 END) as voice,
      SUM(CASE WHEN content_type = 'coding' THEN 1 ELSE 0 END) as coding
    FROM generated_content
    WHERE status IN ('published', 'approved')
  `)

  if (!result[0]?.values[0]) {
    return { total: 0, question: 0, flashcard: 0, exam: 0, voice: 0, coding: 0 }
  }

  const [total, question, flashcard, exam, voice, coding] = result[0].values[0]

  return {
    total: (total as number) || 0,
    question: (question as number) || 0,
    flashcard: (flashcard as number) || 0,
    exam: (exam as number) || 0,
    voice: (voice as number) || 0,
    coding: (coding as number) || 0,
  }
}

export async function checkDbHealth(): Promise<boolean> {
  try {
    await initDatabase()
    const db = getDatabase()
    if (!db) return false

    const result = db.exec('SELECT 1')
    return result.length > 0
  } catch {
    return false
  }
}

export async function getDbApiResponse<T>(
  operation: () => Promise<T[]>
): Promise<DbsApiResponse<T[]>> {
  try {
    await initDatabase()
    const data = await operation()
    const stats = await fetchContentStats()

    return {
      ok: true,
      data,
      count: data.length,
      stats,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Database operation failed',
    }
  }
}

export function useDbState() {
  return getDbState()
}
