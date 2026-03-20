import { getDatabase } from './client'
import { persistDatabase } from './client'

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

export interface Stats {
  total: number
  byType: Record<string, number>
  byChannel: Record<string, number>
  byStatus: Record<string, number>
  avgQuality: number
}

function rowToContentRecord(row: unknown[]): ContentRecord {
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
  const db = getDatabase()
  if (!db) return []

  const stmt = db.prepare(
    'SELECT * FROM generated_content ORDER BY created_at DESC LIMIT ? OFFSET ?'
  )
  stmt.bind([limit, offset])

  const records: ContentRecord[] = []
  while (stmt.step()) {
    records.push(rowToContentRecord(stmt.get()))
  }
  stmt.free()
  return records
}

export function getContentByType(contentType: string, limit = 100, offset = 0): ContentRecord[] {
  const db = getDatabase()
  if (!db) return []

  const stmt = db.prepare(
    'SELECT * FROM generated_content WHERE content_type = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  )
  stmt.bind([contentType, limit, offset])

  const records: ContentRecord[] = []
  while (stmt.step()) {
    records.push(rowToContentRecord(stmt.get()))
  }
  stmt.free()
  return records
}

export function getContentByChannel(channelId: string, limit = 100, offset = 0): ContentRecord[] {
  const db = getDatabase()
  if (!db) return []

  const stmt = db.prepare(
    'SELECT * FROM generated_content WHERE channel_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  )
  stmt.bind([channelId, limit, offset])

  const records: ContentRecord[] = []
  while (stmt.step()) {
    records.push(rowToContentRecord(stmt.get()))
  }
  stmt.free()
  return records
}

export function insertContent(record: Omit<ContentRecord, 'created_at' | 'updated_at'>): void {
  const db = getDatabase()
  if (!db) return

  const now = Math.floor(Date.now() / 1000)

  db.run(
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

export function getStats(): Stats {
  const db = getDatabase()
  if (!db) {
    return { total: 0, byType: {}, byChannel: {}, byStatus: {}, avgQuality: 0 }
  }

  const totalResult = db.exec('SELECT COUNT(*) FROM generated_content')
  const total = (totalResult[0]?.values[0]?.[0] as number) || 0

  const typeResult = db.exec(
    'SELECT content_type, COUNT(*) FROM generated_content GROUP BY content_type'
  )
  const byType: Record<string, number> = {}
  typeResult[0]?.values.forEach(row => {
    byType[row[0] as string] = row[1] as number
  })

  const channelResult = db.exec(
    'SELECT channel_id, COUNT(*) FROM generated_content GROUP BY channel_id'
  )
  const byChannel: Record<string, number> = {}
  channelResult[0]?.values.forEach(row => {
    byChannel[row[0] as string] = row[1] as number
  })

  const statusResult = db.exec('SELECT status, COUNT(*) FROM generated_content GROUP BY status')
  const byStatus: Record<string, number> = {}
  statusResult[0]?.values.forEach(row => {
    byStatus[row[0] as string] = row[1] as number
  })

  const qualityResult = db.exec('SELECT AVG(quality_score) FROM generated_content')
  const avgQuality = (qualityResult[0]?.values[0]?.[0] as number) || 0

  return { total, byType, byChannel, byStatus, avgQuality }
}
