/**
 * Redis SDK Decorators
 * @package @devprep/redis-sdk
 */

import { getRedisInstance } from '../singleton.js'
import { getHooks } from './hooks.js'

function getConnectionManager() {
  return { getClient: () => getRedisInstance() }
}

export interface CacheOptions {
  ttl?: number
  keyPrefix?: string
  keyGenerator?: (...args: unknown[]) => string
  serializer?: (value: unknown) => string
  deserializer?: (value: string) => unknown
  onCacheHit?: (key: string, value: unknown) => void
  onCacheMiss?: (key: string) => void
  condition?: (...args: unknown[]) => boolean
}

export interface InvalidateOptions {
  pattern?: string
  tags?: string[]
  keyPrefix?: string
}

const DEFAULT_CACHE_OPTIONS: Required<CacheOptions> = {
  ttl: 300,
  keyPrefix: 'cache:',
  keyGenerator: (...args) => args.map(a => String(a)).join(':'),
  serializer: value => JSON.stringify(value),
  deserializer: value => JSON.parse(value),
  onCacheHit: () => {},
  onCacheMiss: () => {},
  condition: () => true,
}

const cacheRegistry = new Map<string, { key: string; ttl: number }>()
const memoizedValues = new Map<string, { value: unknown; expiry: number }>()

/**
 * Cached decorator - caches function results in Redis
 */
export function cached(options: CacheOptions = {}) {
  const opts = { ...DEFAULT_CACHE_OPTIONS, ...options }

  return function <T extends (...args: unknown[]) => unknown>(
    _target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value!

    descriptor.value = function (this: unknown, ...args: unknown[]): unknown {
      if (!opts.condition!(...args)) {
        return originalMethod.apply(this, args)
      }

      const cacheKey = `${opts.keyPrefix}${propertyKey}:${opts.keyGenerator!(...args)}`
      const hooks = getHooks()

      try {
        const client = getConnectionManager().getClient()

        hooks.executePreHooks({
          command: 'cache:get',
          args: [cacheKey],
          key: cacheKey,
          startTime: Date.now(),
        })

        client.get(cacheKey).then(cached => {
          if (cached !== null) {
            try {
              const value = opts.deserializer!(cached)
              opts.onCacheHit!(cacheKey, value)

              hooks.executePostHooks({
                command: 'cache:get',
                args: [cacheKey],
                key: cacheKey,
                startTime: Date.now(),
                endTime: Date.now(),
                result: value,
              })
            } catch {
              opts.onCacheMiss!(cacheKey)
            }
          } else {
            opts.onCacheMiss!(cacheKey)
          }
        })
      } catch {
        return originalMethod.apply(this as object, args)
      }

      const cacheEntry = cacheRegistry.get(propertyKey)
      if (cacheEntry) {
        cacheEntry.key = cacheKey
        cacheEntry.ttl = opts.ttl!
      } else {
        cacheRegistry.set(propertyKey, { key: cacheKey, ttl: opts.ttl! })
      }

      const result = originalMethod.apply(this as object, args)

      Promise.resolve(result).then(value => {
        try {
          const client = getConnectionManager().getClient()
          client.setex(cacheKey, opts.ttl!, opts.serializer!(value))
        } catch {
          // Cache set failed
        }
      })

      return result
    } as T

    return descriptor
  }
}

/**
 * Invalidate decorator - invalidates cache after function execution
 */
export function invalidate(options: InvalidateOptions = {}) {
  const opts = {
    keyPrefix: options.keyPrefix || 'cache:',
    pattern: options.pattern,
    tags: options.tags || [],
  }

  return function <T extends (...args: unknown[]) => unknown>(
    _target: object,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value!

    descriptor.value = async function (this: unknown, ...args: unknown[]): Promise<unknown> {
      const result = await originalMethod.apply(this, args)

      try {
        const client = getConnectionManager().getClient()

        if (opts.pattern) {
          const keys = await client.keys(`${opts.keyPrefix}${opts.pattern}`)
          if (keys.length > 0) {
            await client.del(...keys)
          }
        }

        if (opts.tags.length > 0) {
          for (const tag of opts.tags) {
            const tagKey = `${opts.keyPrefix}tag:${tag}`
            const members = await client.smembers(tagKey)
            if (members.length > 0) {
              await client.del(...members)
              await client.del(tagKey)
            }
          }
        }
      } catch {
        // Invalidation failed
      }

      return result
    } as T

    return descriptor
  }
}

/**
 * Cache warm decorator - pre-populates cache on startup
 */
export function cacheWarm(ttl?: number) {
  return function <T extends (...args: unknown[]) => unknown>(
    _target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value!

    descriptor.value = async function (this: unknown, ...args: unknown[]): Promise<unknown> {
      const cacheKey = `${DEFAULT_CACHE_OPTIONS.keyPrefix}${propertyKey}:${DEFAULT_CACHE_OPTIONS.keyGenerator!(...args)}`

      try {
        const client = getConnectionManager().getClient()
        const cached = await client.get(cacheKey)

        if (cached !== null) {
          return DEFAULT_CACHE_OPTIONS.deserializer!(cached)
        }

        const result = await originalMethod.apply(this, args)

        await client.setex(
          cacheKey,
          ttl || DEFAULT_CACHE_OPTIONS.ttl!,
          DEFAULT_CACHE_OPTIONS.serializer!(result)
        )

        return result
      } catch {
        return originalMethod.apply(this, args)
      }
    } as T

    return descriptor
  }
}

/**
 * Memoize decorator - caches results in memory (not Redis)
 */
export function memoize(ttlMs = 60000) {
  return function <T extends (...args: unknown[]) => unknown>(
    _target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value!
    const cacheKey = `memo:${propertyKey}`

    descriptor.value = function (this: unknown, ...args: unknown[]): unknown {
      const key = `${cacheKey}:${JSON.stringify(args)}`
      const cached = memoizedValues.get(key)

      if (cached && cached.expiry > Date.now()) {
        return cached.value
      }

      const result = originalMethod.apply(this, args)

      Promise.resolve(result).then(value => {
        memoizedValues.set(key, {
          value,
          expiry: Date.now() + ttlMs,
        })
      })

      return result
    } as T

    return descriptor
  }
}

/**
 * Tagged cache decorator - associates cache entries with tags for bulk invalidation
 */
export function taggedCache(tag: string, options: Omit<CacheOptions, 'keyPrefix'> = {}) {
  const opts = { ...DEFAULT_CACHE_OPTIONS, ...options, keyPrefix: `cache:tag:${tag}:` }

  return function <T extends (...args: unknown[]) => unknown>(
    _target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value!

    descriptor.value = function (this: unknown, ...args: unknown[]): unknown {
      const cacheKey = `${opts.keyPrefix}${propertyKey}:${opts.keyGenerator!(...args)}`

      try {
        const client = getConnectionManager().getClient()

        client.sadd(`cache:tags:${tag}`, cacheKey).catch(() => {})
      } catch {
        return originalMethod.apply(this, args)
      }

      const result = originalMethod.apply(this, args)

      Promise.resolve(result).then(value => {
        try {
          const client = getConnectionManager().getClient()
          client.setex(cacheKey, opts.ttl!, opts.serializer!(value))
        } catch {
          // Cache set failed
        }
      })

      return result
    } as T

    return descriptor
  }
}

/**
 * Cache invalidation helper functions
 */
export async function invalidateByTag(tag: string): Promise<number> {
  try {
    const client = getConnectionManager().getClient()
    const tagKey = `cache:tags:${tag}`
    const keys = await client.smembers(tagKey)

    if (keys.length > 0) {
      await client.del(...keys)
    }
    await client.del(tagKey)

    return keys.length
  } catch {
    return 0
  }
}

export async function invalidateByPattern(pattern: string): Promise<number> {
  try {
    const client = getConnectionManager().getClient()
    const keys = await client.keys(`cache:${pattern}`)

    if (keys.length > 0) {
      await client.del(...keys)
    }

    return keys.length
  } catch {
    return 0
  }
}

export async function invalidateAll(): Promise<number> {
  try {
    const client = getConnectionManager().getClient()
    const keys = await client.keys('cache:*')

    if (keys.length > 0) {
      await client.del(...keys)
    }

    memoizedValues.clear()

    return keys.length
  } catch {
    return 0
  }
}

/**
 * Cache stats helper
 */
export function getCacheStats(): {
  memoryCacheSize: number
  registeredKeys: number
} {
  return {
    memoryCacheSize: memoizedValues.size,
    registeredKeys: cacheRegistry.size,
  }
}

/**
 * Clear memory memoization cache
 */
export function clearMemoizationCache(): void {
  memoizedValues.clear()
}

/**
 * Cache middleware factory
 */
export function createCacheMiddleware(options: CacheOptions = {}) {
  const opts = { ...DEFAULT_CACHE_OPTIONS, ...options }

  return function cacheMiddleware<T extends (...args: unknown[]) => unknown>(
    key: string,
    fn: T
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return async function (this: unknown, ...args: Parameters<T>): Promise<ReturnType<T>> {
      const cacheKey = `${opts.keyPrefix}${key}:${opts.keyGenerator!(...args)}`

      try {
        const client = getConnectionManager().getClient()
        const cached = await client.get(cacheKey)

        if (cached !== null) {
          opts.onCacheHit!(cacheKey, cached)
          return opts.deserializer!(cached) as ReturnType<T>
        }

        opts.onCacheMiss!(cacheKey)

        const result = await fn.apply(this, args)

        await client.setex(cacheKey, opts.ttl!, opts.serializer!(result))

        return result as ReturnType<T>
      } catch {
        return fn.apply(this, args) as ReturnType<T>
      }
    }
  }
}

/**
 * Lock decorator - prevents concurrent execution
 */
export function withLock(lockKey: string, lockTtl = 30) {
  return function <T extends (...args: unknown[]) => unknown>(
    _target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value!

    descriptor.value = async function (this: unknown, ...args: unknown[]): Promise<unknown> {
      const fullLockKey = `lock:${lockKey}:${propertyKey}`

      try {
        const client = getConnectionManager().getClient()
        const acquired = await client.setnx(fullLockKey, Date.now().toString())

        if (!acquired) {
          const ttl = await client.ttl(fullLockKey)
          if (ttl > 0) {
            throw new Error(`Lock held by another process (TTL: ${ttl}s)`)
          }
        }

        await client.expire(fullLockKey, lockTtl)

        const result = await originalMethod.apply(this, args)

        await client.del(fullLockKey)

        return result
      } catch (error) {
        if ((error as Error).message.includes('Lock held')) {
          throw error
        }
        return originalMethod.apply(this, args)
      }
    } as T

    return descriptor
  }
}

/**
 * Rate limit decorator
 */
export function rateLimit(maxCalls: number, windowSeconds: number) {
  const calls: Map<string, number[]> = new Map()

  return function (
    _target: object,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: unknown[]) => unknown>
  ): TypedPropertyDescriptor<(...args: unknown[]) => unknown> {
    const originalMethod = descriptor.value!

    descriptor.value = function (this: unknown, ...args: unknown[]): unknown {
      const key = `ratelimit:${Math.random().toString(36)}`
      const now = Date.now()

      const timestamps = calls.get(key) || []
      const validTimestamps = timestamps.filter(t => now - t < windowSeconds * 1000)

      if (validTimestamps.length >= maxCalls) {
        const oldestValid = validTimestamps[0]
        const waitMs = windowSeconds * 1000 - (now - oldestValid)
        throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitMs / 1000)} seconds.`)
      }

      validTimestamps.push(now)
      calls.set(key, validTimestamps)

      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

export default {
  cached,
  invalidate,
  cacheWarm,
  memoize,
  taggedCache,
  invalidateByTag,
  invalidateByPattern,
  invalidateAll,
  getCacheStats,
  clearMemoizationCache,
  createCacheMiddleware,
  withLock,
  rateLimit,
}
