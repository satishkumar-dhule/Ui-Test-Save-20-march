export interface CacheEntry<T> {
  data: T
  timestamp: number
  etag?: string
  lastModified?: string
}

export interface CacheOptions {
  ttl?: number
  staleWhileRevalidate?: number
  maxSize?: number
  storageKey?: string
}

export interface CacheMetrics {
  hits: number
  misses: number
  staleHits: number
  storageSize: number
}

const DEFAULT_TTL = 5 * 60 * 1000
const DEFAULT_STALE_WHILE_REVALIDATE = 2 * 60 * 1000
const DEFAULT_MAX_SIZE = 50

export class CacheManager<T> {
  private memoryCache: Map<string, CacheEntry<T>> = new Map()
  private pendingRequests: Map<string, Promise<T>> = new Map()
  private storageKey: string
  private ttl: number
  private staleWhileRevalidate: number
  private maxSize: number
  private metrics: CacheMetrics = { hits: 0, misses: 0, staleHits: 0, storageSize: 0 }

  constructor(options: CacheOptions = {}) {
    this.storageKey = options.storageKey ?? 'api-cache'
    this.ttl = options.ttl ?? DEFAULT_TTL
    this.staleWhileRevalidate = options.staleWhileRevalidate ?? DEFAULT_STALE_WHILE_REVALIDATE
    this.maxSize = options.maxSize ?? DEFAULT_MAX_SIZE
    this.loadFromStorage()
  }

  private generateKey(endpoint: string, params?: Record<string, unknown>): string {
    const paramStr = params ? JSON.stringify(params) : ''
    return `${endpoint}:${paramStr}`
  }

  private isStale(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.ttl
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.ttl + this.staleWhileRevalidate
  }

  get(key: string): { data: T; isStale: boolean } | null {
    const entry = this.memoryCache.get(key)
    if (!entry) {
      this.metrics.misses++
      return null
    }

    if (this.isExpired(entry)) {
      this.memoryCache.delete(key)
      this.metrics.misses++
      return null
    }

    if (this.isStale(entry)) {
      this.metrics.staleHits++
      return { data: entry.data, isStale: true }
    }

    this.metrics.hits++
    return { data: entry.data, isStale: false }
  }

  set(key: string, data: T, metadata?: { etag?: string; lastModified?: string }): void {
    if (this.memoryCache.size >= this.maxSize) {
      const oldestKey = this.findOldestKey()
      if (oldestKey) this.memoryCache.delete(oldestKey)
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      etag: metadata?.etag,
      lastModified: metadata?.lastModified,
    }

    this.memoryCache.set(key, entry)
    this.saveToStorage()
  }

  private findOldestKey(): string | null {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.memoryCache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    return oldestKey
  }

  invalidate(key: string): void {
    this.memoryCache.delete(key)
    this.saveToStorage()
  }

  invalidatePattern(pattern: RegExp): void {
    for (const key of this.memoryCache.keys()) {
      if (pattern.test(key)) {
        this.memoryCache.delete(key)
      }
    }
    this.saveToStorage()
  }

  clear(): void {
    this.memoryCache.clear()
    this.metrics = { hits: 0, misses: 0, staleHits: 0, storageSize: 0 }
    this.saveToStorage()
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.storageKey)
      if (!raw) return

      const entries = JSON.parse(raw) as Array<[string, CacheEntry<T>]>
      for (const [key, entry] of entries) {
        if (!this.isExpired(entry)) {
          this.memoryCache.set(key, entry)
        }
      }
    } catch {
      localStorage.removeItem(this.storageKey)
    }
  }

  private saveToStorage(): void {
    try {
      const entries = Array.from(this.memoryCache.entries())
      localStorage.setItem(this.storageKey, JSON.stringify(entries))
      this.metrics.storageSize = localStorage.getItem(this.storageKey)?.length ?? 0
    } catch {
      // Storage quota exceeded - clear oldest entries
      this.evictOldest(10)
    }
  }

  private evictOldest(count: number): void {
    const keys = Array.from(this.memoryCache.keys())
    const toEvict = keys.slice(0, count)
    toEvict.forEach(key => this.memoryCache.delete(key))
  }

  async getOrFetch(
    key: string,
    fetcher: () => Promise<T>,
    options?: { forceRefresh?: boolean }
  ): Promise<T> {
    if (options?.forceRefresh) {
      this.invalidate(key)
    }

    const cached = this.get(key)
    if (cached && !cached.isStale) {
      return cached.data
    }

    const pending = this.pendingRequests.get(key)
    if (pending) {
      return pending
    }

    const promise = (async () => {
      try {
        const data = await fetcher()
        this.set(key, data)
        return data
      } finally {
        this.pendingRequests.delete(key)
      }
    })()

    this.pendingRequests.set(key, promise)
    return promise
  }

  staleWhileRevalidateFetch(
    key: string,
    fetcher: () => Promise<T>,
    onStale?: (data: T) => void
  ): { data: T | null; revalidate: () => void } {
    const cached = this.get(key)

    if (cached) {
      if (cached.isStale) {
        onStale?.(cached.data)
        this.triggerBackgroundRevalidate(key, fetcher)
      }
      return { data: cached.data, revalidate: () => this.triggerBackgroundRevalidate(key, fetcher) }
    }

    this.triggerBackgroundRevalidate(key, fetcher)
    return { data: null, revalidate: () => this.triggerBackgroundRevalidate(key, fetcher) }
  }

  private triggerBackgroundRevalidate(key: string, fetcher: () => Promise<T>): void {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => this.performRevalidate(key, fetcher))
    } else {
      setTimeout(() => this.performRevalidate(key, fetcher), 100)
    }
  }

  private async performRevalidate(key: string, fetcher: () => Promise<T>): Promise<void> {
    try {
      const data = await fetcher()
      this.set(key, data)
    } catch {
      // Silently fail background revalidation
    }
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics }
  }

  warmCache(items: Array<{ key: string; data: T }>): void {
    for (const item of items) {
      this.set(item.key, item.data)
    }
  }

  isPending(key: string): boolean {
    return this.pendingRequests.has(key)
  }
}

export const apiCache = new CacheManager<unknown>({
  storageKey: 'devprep:api-cache-v2',
  ttl: 5 * 60 * 1000,
  staleWhileRevalidate: 2 * 60 * 1000,
  maxSize: 50,
})

export function createQueryKey(endpoint: string, params?: Record<string, unknown>): string {
  return `${endpoint}:${params ? JSON.stringify(params) : ''}`
}

export function cacheWarmOnStart(prefetchFn: () => Promise<void>): void {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => prefetchFn())
  } else {
    setTimeout(() => prefetchFn(), 1000)
  }
}
