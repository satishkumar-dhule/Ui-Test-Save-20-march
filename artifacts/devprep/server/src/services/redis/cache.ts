import { getRedisInstance, isRedisAvailable } from './singleton.js'

const CACHE_TTL = parseInt(process.env.CACHE_TTL || '300', 10)
const CACHE_PREFIX = 'devprep:'

type CacheData = Record<string, unknown> | null

function buildCacheKey(prefix: string, params: Record<string, string | undefined>): string {
  const sortedKeys = Object.keys(params).sort()
  const paramStr = sortedKeys
    .filter(k => params[k] !== undefined)
    .map(k => `${k}=${params[k]}`)
    .join('&')
  return `${CACHE_PREFIX}${prefix}:${paramStr || 'all'}`
}

export async function getCachedContent<T extends CacheData>(
  params: Record<string, string | undefined>
): Promise<T | null> {
  if (!isRedisAvailable()) return null
  const client = getRedisInstance()

  try {
    const key = buildCacheKey('content', params)
    const cached = await client.get(key)
    if (cached) {
      return JSON.parse(cached) as T
    }
  } catch (error) {
    console.warn('[Cache] Error getting content cache:', (error as Error).message)
  }
  return null
}

export async function setCachedContent(
  params: Record<string, string | undefined>,
  data: unknown
): Promise<void> {
  if (!isRedisAvailable()) return
  const client = getRedisInstance()

  try {
    const key = buildCacheKey('content', params)
    await client.setex(key, CACHE_TTL, JSON.stringify(data))
  } catch (error) {
    console.warn('[Cache] Error setting content cache:', (error as Error).message)
  }
}

export async function getCachedChannelContent<T extends CacheData>(
  channelId: string,
  params: Record<string, string | undefined>
): Promise<T | null> {
  if (!isRedisAvailable()) return null
  const client = getRedisInstance()

  try {
    const key = buildCacheKey(`channel:${channelId}`, params)
    const cached = await client.get(key)
    if (cached) {
      return JSON.parse(cached) as T
    }
  } catch (error) {
    console.warn('[Cache] Error getting channel cache:', (error as Error).message)
  }
  return null
}

export async function setCachedChannelContent(
  channelId: string,
  params: Record<string, string | undefined>,
  data: unknown
): Promise<void> {
  if (!isRedisAvailable()) return
  const client = getRedisInstance()

  try {
    const key = buildCacheKey(`channel:${channelId}`, params)
    await client.setex(key, CACHE_TTL, JSON.stringify(data))
  } catch (error) {
    console.warn('[Cache] Error setting channel cache:', (error as Error).message)
  }
}

export async function getCachedTaggedContent<T extends CacheData>(
  tag: string,
  params: Record<string, string | undefined>
): Promise<T | null> {
  if (!isRedisAvailable()) return null
  const client = getRedisInstance()

  try {
    const key = buildCacheKey(`tagged:${tag}`, params)
    const cached = await client.get(key)
    if (cached) {
      return JSON.parse(cached) as T
    }
  } catch (error) {
    console.warn('[Cache] Error getting tagged cache:', (error as Error).message)
  }
  return null
}

export async function setCachedTaggedContent(
  tag: string,
  params: Record<string, string | undefined>,
  data: unknown
): Promise<void> {
  if (!isRedisAvailable()) return
  const client = getRedisInstance()

  try {
    const key = buildCacheKey(`tagged:${tag}`, params)
    await client.setex(key, CACHE_TTL, JSON.stringify(data))
  } catch (error) {
    console.warn('[Cache] Error setting tagged cache:', (error as Error).message)
  }
}

export async function getCachedStats<T extends CacheData>(): Promise<T | null> {
  if (!isRedisAvailable()) return null
  const client = getRedisInstance()

  try {
    const key = `${CACHE_PREFIX}stats`
    const cached = await client.get(key)
    if (cached) {
      return JSON.parse(cached) as T
    }
  } catch (error) {
    console.warn('[Cache] Error getting stats cache:', (error as Error).message)
  }
  return null
}

export async function setCachedStats(data: unknown): Promise<void> {
  if (!isRedisAvailable()) return
  const client = getRedisInstance()

  try {
    const key = `${CACHE_PREFIX}stats`
    await client.setex(key, CACHE_TTL, JSON.stringify(data))
  } catch (error) {
    console.warn('[Cache] Error setting stats cache:', (error as Error).message)
  }
}

export async function invalidateContentCache(): Promise<void> {
  if (!isRedisAvailable()) return
  const client = getRedisInstance()

  try {
    const keys = await client.keys(`${CACHE_PREFIX}content:*`)
    if (keys.length > 0) {
      await client.del(...keys)
      console.log(`[Cache] Invalidated ${keys.length} content cache entries`)
    }
  } catch (error) {
    console.warn('[Cache] Error invalidating content cache:', (error as Error).message)
  }
}

export async function invalidateChannelCache(): Promise<void> {
  if (!isRedisAvailable()) return
  const client = getRedisInstance()

  try {
    const keys = await client.keys(`${CACHE_PREFIX}channel:*`)
    if (keys.length > 0) {
      await client.del(...keys)
      console.log(`[Cache] Invalidated ${keys.length} channel cache entries`)
    }
  } catch (error) {
    console.warn('[Cache] Error invalidating channel cache:', (error as Error).message)
  }
}

export async function invalidateTaggedCache(): Promise<void> {
  if (!isRedisAvailable()) return
  const client = getRedisInstance()

  try {
    const keys = await client.keys(`${CACHE_PREFIX}tagged:*`)
    if (keys.length > 0) {
      await client.del(...keys)
      console.log(`[Cache] Invalidated ${keys.length} tagged cache entries`)
    }
  } catch (error) {
    console.warn('[Cache] Error invalidating tagged cache:', (error as Error).message)
  }
}

export async function invalidateAllCache(): Promise<void> {
  if (!isRedisAvailable()) return
  const client = getRedisInstance()

  try {
    const keys = await client.keys(`${CACHE_PREFIX}*`)
    if (keys.length > 0) {
      await client.del(...keys)
      console.log(`[Cache] Invalidated ${keys.length} total cache entries`)
    }
  } catch (error) {
    console.warn('[Cache] Error invalidating all cache:', (error as Error).message)
  }
}
