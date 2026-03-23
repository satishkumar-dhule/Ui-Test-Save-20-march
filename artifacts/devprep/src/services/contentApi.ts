export interface ContentRecord {
  id: string
  channel_id: string
  content_type: string
  difficulty?: string
  tags?: string[]
  data: unknown
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

export interface FetchContentOptions extends ContentQueryOptions {
  signal?: AbortSignal
}

export interface ContentStats {
  total: number
  question: number
  flashcard: number
  exam: number
  voice: number
  coding: number
}

export interface ApiResponse<T> {
  ok: boolean
  data?: T
  count?: number
  stats?: ContentStats
  error?: string
}

export class RequestTimeoutError extends Error {
  readonly name = 'RequestTimeoutError'
  constructor(message = 'Request timed out') {
    super(message)
  }
}

export class RequestCancelledError extends Error {
  readonly name = 'RequestCancelledError'
  constructor(message = 'Request was cancelled') {
    super(message)
  }
}

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const DEFAULT_TIMEOUT_MS = 30000

async function apiFetch<T>(
  endpoint: string,
  params?: Record<string, string | number>,
  options?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<ApiResponse<T>> {
  const controller = new AbortController()
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const externalSignal = options?.signal
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort())
  }

  try {
    const baseUrl = API_BASE.startsWith('http') ? API_BASE : `${window.location.origin}${API_BASE}`
    const url = new URL(`${baseUrl}${endpoint}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }

    const response = await fetch(url.toString(), {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    return response.json() as Promise<ApiResponse<T>>
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        if (externalSignal?.aborted) {
          throw new RequestCancelledError()
        }
        throw new RequestTimeoutError()
      }
    }
    throw error
  }
}

async function httpFetchAllContent(options: FetchContentOptions = {}): Promise<ContentRecord[]> {
  const params: Record<string, string | number> = {}
  if (options.channelId) params.channel = options.channelId
  if (options.contentType) params.type = options.contentType
  if (options.status) params.status = options.status
  if (options.minQuality !== undefined) params.quality = options.minQuality
  if (options.limit) params.limit = options.limit
  if (options.offset) params.offset = options.offset
  if (options.since) params.since = options.since

  const result = await apiFetch<ContentRecord[]>('/content', params, { signal: options.signal })
  if (!result.ok || !result.data) {
    throw new Error(result.error || 'Failed to fetch content')
  }
  return result.data
}

async function httpFetchContentByType<T>(
  type: string,
  options: Omit<ContentQueryOptions, 'contentType'> = {}
): Promise<T[]> {
  const params: Record<string, string | number> = {}
  if (options.channelId) params.channel = options.channelId
  if (options.status) params.status = options.status
  if (options.minQuality !== undefined) params.quality = options.minQuality
  if (options.limit) params.limit = options.limit
  if (options.offset) params.offset = options.offset

  const result = await apiFetch<ContentRecord[]>(`/content/${type}`, params)
  if (!result.ok || !result.data) {
    throw new Error(result.error || `Failed to fetch ${type} content`)
  }
  return result.data.map(record => record.data as T)
}

async function httpFetchContentStats(): Promise<ContentStats> {
  const result = await apiFetch<ContentRecord[]>('/content/stats')
  if (!result.ok || !result.stats) {
    throw new Error(result.error || 'Failed to fetch stats')
  }
  return result.stats
}

async function httpFetchChannelContent<T>(
  channelId: string,
  options: Omit<ContentQueryOptions, 'channelId'> = {}
): Promise<T[]> {
  const params: Record<string, string | number> = {}
  if (options.contentType) params.type = options.contentType
  if (options.status) params.status = options.status
  if (options.minQuality !== undefined) params.quality = options.minQuality
  if (options.limit) params.limit = options.limit
  if (options.offset) params.offset = options.offset

  const result = await apiFetch<ContentRecord[]>(`/channels/${channelId}/content`, params)
  if (!result.ok || !result.data) {
    throw new Error(result.error || 'Failed to fetch channel content')
  }
  return result.data.map(record => record.data as T)
}

async function httpFetchTaggedContent<T>(
  tag: string,
  options: { limit?: number; offset?: number } = {}
): Promise<T[]> {
  const params: Record<string, string | number> = {}
  if (options.limit) params.limit = options.limit
  if (options.offset) params.offset = options.offset

  const result = await apiFetch<ContentRecord[]>(
    `/content/tagged/${encodeURIComponent(tag)}`,
    params
  )
  if (!result.ok || !result.data) {
    throw new Error(result.error || `Failed to fetch tagged content for ${tag}`)
  }
  return result.data.map(record => record.data as T)
}

export async function fetchAllContent(options: FetchContentOptions = {}): Promise<ContentRecord[]> {
  return httpFetchAllContent(options)
}

export async function fetchContentByType<T>(
  type: string,
  options: Omit<ContentQueryOptions, 'contentType'> = {}
): Promise<T[]> {
  return httpFetchContentByType(type, options)
}

export async function fetchContentStats(): Promise<ContentStats> {
  return httpFetchContentStats()
}

export async function fetchChannelContent<T>(
  channelId: string,
  options: Omit<ContentQueryOptions, 'channelId'> = {}
): Promise<T[]> {
  return httpFetchChannelContent(channelId, options)
}

export async function fetchTaggedContent<T>(
  tag: string,
  options: { limit?: number; offset?: number } = {}
): Promise<T[]> {
  return httpFetchTaggedContent(tag, options)
}

export async function checkApiHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    const combinedSignal = signal
      ? (() => {
          signal.addEventListener('abort', () => controller.abort())
          return controller.signal
        })()
      : controller.signal

    const baseUrl = API_BASE.startsWith('http') ? API_BASE : `${window.location.origin}${API_BASE}`
    const response = await fetch(`${baseUrl}/health`, { signal: combinedSignal })
    clearTimeout(timeoutId)
    const data = await response.json()
    return data.ok === true
  } catch {
    return false
  }
}
