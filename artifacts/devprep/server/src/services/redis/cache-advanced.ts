import { getRedisClient, isRedisAvailable } from './singleton.js'

const CACHE_PREFIX = process.env.CACHE_PREFIX || 'devprep:'

interface CacheEntry<T> {
  data: T
  version: number
  tags: string[]
  createdAt: number
  expiresAt: number
}

interface L1CacheOptions {
  maxSize: number
  ttlMs: number
}

class L1MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private accessOrder: string[] = []
  private readonly maxSize: number
  private readonly ttlMs: number

  constructor(options: L1CacheOptions) {
    this.maxSize = options.maxSize
    this.ttlMs = options.ttlMs
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.delete(key)
      return null
    }

    this.updateAccessOrder(key)
    return entry.data
  }

  set(key: string, data: T, tags: string[] = [], version = 1): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest()
    }

    const now = Date.now()
    this.cache.set(key, {
      data,
      version,
      tags,
      createdAt: now,
      expiresAt: now + this.ttlMs,
    })
    this.updateAccessOrder(key)
  }

  delete(key: string): boolean {
    this.removeFromAccessOrder(key)
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.accessOrder = []
  }

  invalidateByTags(tags: string[]): void {
    const keysToDelete: string[] = []
    for (const [key, entry] of this.cache) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => this.delete(key))
  }

  getVersion(key: string): number {
    return this.cache.get(key)?.version ?? 0
  }

  invalidateByVersion(key: string, expectedVersion: number): boolean {
    const entry = this.cache.get(key)
    if (entry && entry.version !== expectedVersion) {
      this.delete(key)
      return true
    }
    return false
  }

  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key)
    this.accessOrder.push(key)
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
  }

  private evictOldest(): void {
    if (this.accessOrder.length > 0) {
      const oldest = this.accessOrder.shift()!
      this.cache.delete(oldest)
    }
  }

  get size(): number {
    return this.cache.size
  }

  getStats(): { size: number; maxSize: number; hitRate: number } {
    return { size: this.cache.size, maxSize: this.maxSize, hitRate: 0 }
  }
}

type CacheStrategy = 'cache-aside' | 'write-through' | 'write-behind'
type WriteMode = 'sync' | 'async'

interface MultiLevelCacheOptions {
  l1MaxSize?: number
  l1TtlMs?: number
  l2Ttl?: number
  strategy?: CacheStrategy
  writeMode?: WriteMode
  compressThreshold?: number
}

interface CacheMetrics {
  l1Hits: number
  l1Misses: number
  l2Hits: number
  l2Misses: number
  writes: number
  invalidations: number
}

class MultiLevelCache<T> {
  private l1: L1MemoryCache<T>
  private l2Enabled: boolean
  private strategy: CacheStrategy
  private writeMode: WriteMode
  private compressThreshold: number
  private metrics: CacheMetrics = {
    l1Hits: 0,
    l1Misses: 0,
    l2Hits: 0,
    l2Misses: 0,
    writes: 0,
    invalidations: 0,
  }
  private writeQueue: Array<() => Promise<void>> = []
  private isProcessingQueue = false

  constructor(options: MultiLevelCacheOptions = {}) {
    this.l1 = new L1MemoryCache<T>({
      maxSize: options.l1MaxSize || 100,
      ttlMs: options.l1TtlMs || 5000,
    })
    this.l2Enabled = isRedisAvailable()
    this.strategy = options.strategy || 'cache-aside'
    this.writeMode = options.writeMode || 'sync'
    this.compressThreshold = options.compressThreshold || 1024
  }

  async get(key: string): Promise<T | null> {
    const cached = this.l1.get(key)
    if (cached !== null) {
      this.metrics.l1Hits++
      return cached
    }
    this.metrics.l1Misses++

    if (this.l2Enabled) {
      const client = getRedisClient()
      if (client) {
        try {
          const data = await client.get(`${CACHE_PREFIX}mlc:${key}`)
          if (data) {
            const parsed = JSON.parse(data) as CacheEntry<T>
            this.l1.set(key, parsed.data, parsed.tags, parsed.version)
            this.metrics.l2Hits++
            return parsed.data
          }
        } catch (error) {
          console.warn('[MLCache] L2 read error:', (error as Error).message)
        }
      }
    }
    this.metrics.l2Misses++
    return null
  }

  async set(
    key: string,
    data: T,
    options: { ttl?: number; tags?: string[]; version?: number } = {}
  ): Promise<void> {
    const version = options.version || 1
    const tags = options.tags || []
    const ttl = options.ttl || 300

    this.l1.set(key, data, tags, version)
    this.metrics.writes++

    if (this.strategy === 'write-through') {
      await this.writeToL2(key, data, ttl, tags, version)
    } else if (this.strategy === 'write-behind') {
      this.queueWrite(() => this.writeToL2(key, data, ttl, tags, version))
    }
  }

  private async writeToL2(
    key: string,
    data: T,
    ttl: number,
    tags: string[],
    version: number
  ): Promise<void> {
    if (!this.l2Enabled) return
    const client = getRedisClient()
    if (!client) return

    try {
      const entry: CacheEntry<T> = {
        data,
        version,
        tags,
        createdAt: Date.now(),
        expiresAt: Date.now() + ttl * 1000,
      }
      await client.setex(`${CACHE_PREFIX}mlc:${key}`, ttl, JSON.stringify(entry))

      if (tags.length > 0) {
        const tagKey = `${CACHE_PREFIX}tags:${tags.join(',')}`
        await client.sadd(tagKey, key)
        await client.expire(tagKey, ttl)
      }
    } catch (error) {
      console.warn('[MLCache] L2 write error:', (error as Error).message)
    }
  }

  private queueWrite(writeFn: () => Promise<void>): void {
    this.writeQueue.push(writeFn)
    if (!this.isProcessingQueue && this.writeMode === 'async') {
      this.processWriteQueue()
    }
  }

  private async processWriteQueue(): Promise<void> {
    if (this.isProcessingQueue) return
    this.isProcessingQueue = true

    while (this.writeQueue.length > 0) {
      const write = this.writeQueue.shift()
      if (write) {
        try {
          await write()
        } catch (error) {
          console.warn('[MLCache] Queued write failed:', (error as Error).message)
        }
      }
    }

    this.isProcessingQueue = false
  }

  async invalidate(key: string): Promise<void> {
    this.l1.delete(key)
    this.metrics.invalidations++

    if (this.l2Enabled) {
      const client = getRedisClient()
      if (client) {
        try {
          await client.del(`${CACHE_PREFIX}mlc:${key}`)
        } catch (error) {
          console.warn('[MLCache] L2 invalidation error:', (error as Error).message)
        }
      }
    }
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    this.l1.invalidateByTags(tags)
    this.metrics.invalidations++

    if (this.l2Enabled) {
      const client = getRedisClient()
      if (client) {
        try {
          for (const tag of tags) {
            const tagKey = `${CACHE_PREFIX}tags:${tag}`
            const keys = await client.smembers(tagKey)
            if (keys.length > 0) {
              await client.del(...keys, tagKey)
            }
          }
        } catch (error) {
          console.warn('[MLCache] Tag invalidation error:', (error as Error).message)
        }
      }
    }
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    if (!this.l2Enabled) return
    const client = getRedisClient()
    if (!client) return

    try {
      const keys = await client.keys(`${CACHE_PREFIX}mlc:${pattern}`)
      if (keys.length > 0) {
        await client.del(...keys)
        this.metrics.invalidations += keys.length
      }
    } catch (error) {
      console.warn('[MLCache] Pattern invalidation error:', (error as Error).message)
    }
  }

  getMetrics(): CacheMetrics {
    const total = this.metrics.l1Hits + this.metrics.l1Misses
    return {
      ...this.metrics,
      get l1HitRate() {
        return total > 0 ? this.l1Hits / total : 0
      },
      get l2HitRate() {
        const l2Total = this.l2Hits + this.l2Misses
        return l2Total > 0 ? this.l2Hits / l2Total : 0
      },
    } as CacheMetrics
  }

  resetMetrics(): void {
    this.metrics = {
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      writes: 0,
      invalidations: 0,
    }
  }

  getL1Version(key: string): number {
    return this.l1.getVersion(key)
  }

  getL1Cache(): L1MemoryCache<T> {
    return this.l1
  }
}

interface CacheWarmerOptions {
  keys: Array<{ key: string; loader: () => Promise<unknown> }>
  parallel?: boolean
  staggerMs?: number
  ttl?: number
}

async function warmCache(options: CacheWarmerOptions): Promise<void> {
  const { keys, parallel = false, staggerMs = 0, ttl = 300 } = options
  const cache = new MultiLevelCache({ strategy: 'write-through' })

  if (parallel) {
    await Promise.all(
      keys.map(async ({ key, loader }) => {
        try {
          const data = await loader()
          await cache.set(key, data as never, { ttl })
        } catch (error) {
          console.warn(`[CacheWarmer] Failed to warm ${key}:`, (error as Error).message)
        }
      })
    )
  } else {
    for (let i = 0; i < keys.length; i++) {
      const { key, loader } = keys[i]
      try {
        const data = await loader()
        await cache.set(key, data as never, { ttl })
      } catch (error) {
        console.warn(`[CacheWarmer] Failed to warm ${key}:`, (error as Error).message)
      }
      if (staggerMs > 0 && i < keys.length - 1) {
        await new Promise(resolve => setTimeout(resolve, staggerMs))
      }
    }
  }
}

interface VersionedCacheOptions {
  namespace: string
  currentVersion: number
  onVersionMismatch?: (key: string, oldVersion: number, newVersion: number) => void
}

class VersionedCache<T> {
  private namespace: string
  private currentVersion: number
  private cache: MultiLevelCache<T>
  private onVersionMismatch?: (key: string, oldVersion: number, newVersion: number) => void

  constructor(options: VersionedCacheOptions) {
    this.namespace = options.namespace
    this.currentVersion = options.currentVersion
    this.onVersionMismatch = options.onVersionMismatch
    this.cache = new MultiLevelCache<T>()
  }

  async get(key: string): Promise<T | null> {
    const l1Version = this.cache.getL1Version(key)
    if (l1Version !== this.currentVersion && l1Version > 0) {
      await this.cache.invalidate(key)
      this.onVersionMismatch?.(key, l1Version, this.currentVersion)
      return null
    }
    return this.cache.get(key)
  }

  async set(key: string, data: T, options?: { ttl?: number; tags?: string[] }): Promise<void> {
    await this.cache.set(key, data as never, {
      ...options,
      version: this.currentVersion,
    })
  }

  async invalidate(key: string): Promise<void> {
    await this.cache.invalidate(key)
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    await this.cache.invalidateByTags(tags)
  }

  setVersion(version: number): void {
    this.currentVersion = version
  }

  getVersion(): number {
    return this.currentVersion
  }

  async invalidateAllKeys(): Promise<void> {
    await this.cache.invalidateByPattern(`${this.namespace}:*`)
  }
}

interface PatternTagOptions {
  separator?: string
  maxTags?: number
}

function createTagPattern(baseTag: string, options: PatternTagOptions = {}): string {
  const { separator = ':', maxTags = 5 } = options
  return `${CACHE_PREFIX}ptag:${baseTag}${separator}*`
}

async function setWithTags<T>(key: string, data: T, tags: string[], ttl = 300): Promise<void> {
  if (!isRedisAvailable()) return
  const client = getRedisClient()
  if (!client) return

  try {
    const pipeline = client.pipeline()
    pipeline.setex(`${CACHE_PREFIX}ptag:${key}`, ttl, JSON.stringify(data))

    for (const tag of tags.slice(0, 10)) {
      pipeline.sadd(`${CACHE_PREFIX}ptag:index:${tag}`, key)
      pipeline.expire(`${CACHE_PREFIX}ptag:index:${tag}`, ttl)
    }

    await pipeline.exec()
  } catch (error) {
    console.warn('[PatternTag] Error setting with tags:', (error as Error).message)
  }
}

async function getByPatternTag(tag: string): Promise<string[]> {
  if (!isRedisAvailable()) return []
  const client = getRedisClient()
  if (!client) return []

  try {
    return await client.smembers(`${CACHE_PREFIX}ptag:index:${tag}`)
  } catch (error) {
    console.warn('[PatternTag] Error getting by tag:', (error as Error).message)
    return []
  }
}

async function invalidateByTag(tag: string): Promise<number> {
  if (!isRedisAvailable()) return 0
  const client = getRedisClient()
  if (!client) return 0

  try {
    const keys = await client.smembers(`${CACHE_PREFIX}ptag:index:${tag}`)
    if (keys.length === 0) return 0

    const fullKeys = keys.map(k => `${CACHE_PREFIX}ptag:${k}`)
    fullKeys.push(`${CACHE_PREFIX}ptag:index:${tag}`)
    return await client.del(...fullKeys)
  } catch (error) {
    console.warn('[PatternTag] Error invalidating by tag:', (error as Error).message)
    return 0
  }
}

export {
  MultiLevelCache,
  L1MemoryCache,
  type CacheMetrics,
  type MultiLevelCacheOptions,
  type CacheEntry,
  type CacheStrategy,
  type CacheWarmerOptions,
  VersionedCache,
  type VersionedCacheOptions,
  warmCache,
  createTagPattern,
  setWithTags,
  getByPatternTag,
  invalidateByTag,
}
