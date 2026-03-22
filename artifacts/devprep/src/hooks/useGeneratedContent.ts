import { useState, useEffect, useCallback } from 'react'
import type { Question } from '@/data/questions'
import type { Flashcard } from '@/data/flashcards'
import type { ExamQuestion } from '@/data/exam'
import type { VoicePrompt } from '@/data/voicePractice'
import type { CodingChallenge } from '@/data/coding'
import { initDatabase, getDatabase } from '@/services/dbClient'

export interface GeneratedContentMap {
  question?: Question[]
  flashcard?: Flashcard[]
  exam?: ExamQuestion[]
  voice?: VoicePrompt[]
  coding?: CodingChallenge[]
}

const CACHE_KEY = 'devprep:generated-content'
const CACHE_TTL_MS = 2 * 60 * 1000

type CacheEntry = { ts: number; data: GeneratedContentMap }

function hasContent(data: GeneratedContentMap): boolean {
  return Object.values(data).some(arr => Array.isArray(arr) && arr.length > 0)
}

function loadCache(): GeneratedContentMap | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    if (hasContent(entry.data) && Date.now() - entry.ts < CACHE_TTL_MS) {
      return entry.data
    }
    localStorage.removeItem(CACHE_KEY)
  } catch {
    localStorage.removeItem(CACHE_KEY)
  }
  return null
}

function saveCache(data: GeneratedContentMap) {
  if (!hasContent(data)) return
  try {
    const entry: CacheEntry = { ts: Date.now(), data }
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    /* ignore cache write errors */
  }
}

interface UseGeneratedContentResult {
  generated: GeneratedContentMap
  loading: boolean
  error: string | null
  refresh: () => void
}

async function queryAllContent(): Promise<GeneratedContentMap> {
  await initDatabase()
  const db = getDatabase()
  if (!db) throw new Error('Database not initialized')

  const result = db.exec(
    `SELECT content_type, channel_id, data FROM generated_content WHERE status IN ('published', 'approved') ORDER BY created_at DESC`
  )

  const grouped: Record<string, unknown[]> = {
    question: [],
    flashcard: [],
    exam: [],
    voice: [],
    coding: [],
  }

  if (!result[0]) return grouped as unknown as GeneratedContentMap

  for (const row of result[0].values) {
    const [content_type, channel_id, dataStr] = row as [string, string, string]
    const type = content_type as string

    if (grouped[type] && typeof dataStr === 'string') {
      try {
        const parsed = JSON.parse(dataStr)
        if (parsed && typeof parsed === 'object') {
          const item = parsed as Record<string, unknown>
          item.channelId = channel_id
          // Ensure required fields for questions
          if (type === 'question') {
            if (!item.id) {
              item.id = `gen-${channel_id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
            }
            if (!item.difficulty) item.difficulty = 'intermediate'
            if (!Array.isArray(item.sections)) item.sections = []
            if (!item.tags) item.tags = []
            if (!item.title) continue
          }
        }
        grouped[type].push(parsed)
      } catch {
        console.warn(`[DevPrep] Failed to parse JSON for ${type}`)
      }
    }
  }

  return grouped as unknown as GeneratedContentMap
}

export function useGeneratedContent(): UseGeneratedContentResult {
  const [generated, setGenerated] = useState<GeneratedContentMap>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchContent = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const content = await queryAllContent()
      setGenerated(content)
      saveCache(content)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      console.warn('[DevPrep] Generated content unavailable:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const cached = loadCache()
    if (cached) {
      setGenerated(cached)
      return
    }

    fetchContent()
  }, [fetchContent])

  const refresh = useCallback(() => {
    localStorage.removeItem(CACHE_KEY)
    fetchContent()
  }, [fetchContent])

  return { generated, loading, error, refresh }
}
