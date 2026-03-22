import { getDbLoader, initializeDbLoader, type DbLoader } from '@/lib/db-loader'
import type { DbLoaderState } from '@/lib/db-loader'

export interface ContentRecord {
  id: string
  channel_id: string
  content_type: string
  data: unknown
  quality_score: number
  embedding_id: string | null
  created_at: number
  updated_at: number
  status: string
  generated_by: string | null
  generation_time_ms: number | null
}

export interface ChannelRecord {
  id: string
  name: string
  shortName: string
  emoji: string
  color: string
  type: 'tech' | 'cert'
  certCode?: string
  description: string
  tagFilter: string[]
}

type DbStateListener = (state: DbLoaderState) => void

class DbClientOptimized {
  private loader: DbLoader | null = null
  private listeners: Set<DbStateListener> = new Set()
  private useOptimized: boolean = false

  async initialize(useWorker = true): Promise<void> {
    this.loader = await initializeDbLoader({
      useWorker,
      cacheQueries: true,
      cacheTtlMs: 60000,
    })

    this.useOptimized = useWorker
    this.loader.onStateChange(state => {
      this.listeners.forEach(listener => listener(state))
    })
  }

  onStateChange(listener: DbStateListener): () => void {
    if (this.loader) {
      this.loader.onStateChange(listener)
    }
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getState(): DbLoaderState {
    return this.loader?.getState() ?? { isReady: false, isLoading: true, error: null }
  }

  async getContentByType(type: string): Promise<ContentRecord[]> {
    if (!this.loader) {
      console.warn('[DbClientOptimized] Not initialized')
      return []
    }

    try {
      const results = await this.loader.query<Record<string, unknown>[]>(
        "SELECT * FROM generated_content WHERE content_type = ? AND status IN ('published', 'approved')",
        [type]
      )

      return results.map(row => this.parseRecord(row))
    } catch (error) {
      console.error('[DbClientOptimized] getContentByType error:', error)
      return []
    }
  }

  async getContentByChannel(channelId: string): Promise<ContentRecord[]> {
    if (!this.loader) {
      console.warn('[DbClientOptimized] Not initialized')
      return []
    }

    try {
      const results = await this.loader.query<Record<string, unknown>[]>(
        "SELECT * FROM generated_content WHERE channel_id = ? AND status IN ('published', 'approved')",
        [channelId]
      )

      return results.map(row => this.parseRecord(row))
    } catch (error) {
      console.error('[DbClientOptimized] getContentByChannel error:', error)
      return []
    }
  }

  async getContentByTags(tags: string[]): Promise<ContentRecord[]> {
    if (!this.loader || tags.length === 0) {
      return []
    }

    try {
      const results = await this.loader.query<Record<string, unknown>[]>(
        "SELECT * FROM generated_content WHERE status IN ('published', 'approved')",
        []
      )

      return results
        .map(row => this.parseRecord(row))
        .filter(record => {
          const data = record.data as Record<string, unknown>
          const dataTags = (data?.tags as string[]) || []
          return tags.some(tag => dataTags.includes(tag))
        })
    } catch (error) {
      console.error('[DbClientOptimized] getContentByTags error:', error)
      return []
    }
  }

  async getAllContent(): Promise<ContentRecord[]> {
    if (!this.loader) {
      console.warn('[DbClientOptimized] Not initialized')
      return []
    }

    try {
      const results = await this.loader.query<Record<string, unknown>[]>(
        "SELECT * FROM generated_content WHERE status IN ('published', 'approved') ORDER BY created_at DESC",
        []
      )

      return results.map(row => this.parseRecord(row))
    } catch (error) {
      console.error('[DbClientOptimized] getAllContent error:', error)
      return []
    }
  }

  async searchContent(query: string): Promise<ContentRecord[]> {
    if (!this.loader || !query.trim()) {
      return []
    }

    try {
      const results = await this.loader.query<Record<string, unknown>[]>(
        "SELECT * FROM generated_content WHERE status IN ('published', 'approved')",
        []
      )

      const lowerQuery = query.toLowerCase()
      return results
        .map(row => this.parseRecord(row))
        .filter(record => {
          const searchableText = JSON.stringify(record.data).toLowerCase()
          return searchableText.includes(lowerQuery)
        })
    } catch (error) {
      console.error('[DbClientOptimized] searchContent error:', error)
      return []
    }
  }

  async getChannels(): Promise<ChannelRecord[]> {
    if (!this.loader) {
      console.warn('[DbClientOptimized] Not initialized')
      return []
    }

    try {
      const results = await this.loader.query<Record<string, unknown>[]>(
        `SELECT id, name, short_name, emoji, color, type, cert_code, description, tag_filter
         FROM channels WHERE is_active = 1
         ORDER BY type ASC, sort_order ASC, name ASC`,
        []
      )

      return results.map(row => ({
        id: row.id as string,
        name: row.name as string,
        shortName: row.short_name as string,
        emoji: row.emoji as string,
        color: row.color as string,
        type: row.type as 'tech' | 'cert',
        certCode: (row.cert_code as string) || undefined,
        description: (row.description as string) || '',
        tagFilter: this.parseTagFilter(row.tag_filter),
      }))
    } catch (error) {
      console.error('[DbClientOptimized] getChannels error:', error)
      return []
    }
  }

  clearCache(): void {
    this.loader?.clearCache()
  }

  async close(): Promise<void> {
    await this.loader?.close()
    this.loader = null
  }

  private parseRecord(row: Record<string, unknown>): ContentRecord {
    let parsedData: unknown = row.data
    if (typeof row.data === 'string') {
      try {
        parsedData = JSON.parse(row.data)
      } catch {
        parsedData = { raw: row.data }
      }
    }

    return {
      id: row.id as string,
      channel_id: row.channel_id as string,
      content_type: row.content_type as string,
      data: parsedData,
      quality_score: row.quality_score as number,
      embedding_id: row.embedding_id as string | null,
      created_at: row.created_at as number,
      updated_at: row.updated_at as number,
      status: row.status as string,
      generated_by: row.generated_by as string | null,
      generation_time_ms: row.generation_time_ms as number | null,
    }
  }

  private parseTagFilter(tagFilter: unknown): string[] {
    if (typeof tagFilter === 'string') {
      try {
        return JSON.parse(tagFilter)
      } catch {
        return []
      }
    }
    if (Array.isArray(tagFilter)) {
      return tagFilter as string[]
    }
    return []
  }
}

let dbClient: DbClientOptimized | null = null

export function getDbClientOptimized(): DbClientOptimized {
  if (!dbClient) {
    dbClient = new DbClientOptimized()
  }
  return dbClient
}

export async function initializeDbClient(useWorker = true): Promise<DbClientOptimized> {
  const client = getDbClientOptimized()
  await client.initialize(useWorker)
  return client
}

export { type DbLoaderState as DbState }
export type { DbLoaderState }
