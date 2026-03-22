import { getRedisClient, isRedisAvailable } from './singleton.js'

const CACHE_PREFIX = process.env.CACHE_PREFIX || 'devprep:'

interface CounterOptions {
  name: string
  initialValue?: number
  min?: number
  max?: number
  step?: number
}

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyPrefix?: string
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfterMs?: number
}

interface CounterSnapshot {
  value: number
  timestamp: number
  operations: number
}

class DistributedCounter {
  private name: string
  private min: number
  private max: number
  private step: number
  private key: string

  constructor(options: CounterOptions) {
    this.name = options.name
    this.min = options.min ?? -Infinity
    this.max = options.max ?? Infinity
    this.step = options.step ?? 1
    this.key = `${CACHE_PREFIX}counter:${this.name}`
  }

  async get(): Promise<number> {
    if (!isRedisAvailable()) return 0
    const client = getRedisClient()
    if (!client) return 0

    try {
      const value = await client.get(this.key)
      return value ? parseInt(value, 10) : 0
    } catch (error) {
      console.warn('[Counter] Error getting:', (error as Error).message)
      return 0
    }
  }

  async set(value: number): Promise<number> {
    if (!isRedisAvailable()) return 0
    const client = getRedisClient()
    if (!client) return 0

    const clampedValue = Math.max(this.min, Math.min(this.max, value))

    try {
      await client.set(this.key, clampedValue.toString())
      return clampedValue
    } catch (error) {
      console.warn('[Counter] Error setting:', (error as Error).message)
      return 0
    }
  }

  async increment(amount = this.step): Promise<number> {
    if (!isRedisAvailable()) return 0
    const client = getRedisClient()
    if (!client) return 0

    try {
      const newValue = await client.incrby(this.key, amount)
      const clampedValue = Math.max(this.min, Math.min(this.max, newValue))

      if (clampedValue !== newValue) {
        await client.set(this.key, clampedValue.toString())
      }

      return clampedValue
    } catch (error) {
      console.warn('[Counter] Error incrementing:', (error as Error).message)
      return 0
    }
  }

  async decrement(amount = this.step): Promise<number> {
    return this.increment(-amount)
  }

  async reset(): Promise<void> {
    if (!isRedisAvailable()) return
    const client = getRedisClient()
    if (!client) return

    try {
      await client.del(this.key)
    } catch (error) {
      console.warn('[Counter] Error resetting:', (error as Error).message)
    }
  }

  async snapshot(): Promise<CounterSnapshot> {
    const value = await this.get()
    return {
      value,
      timestamp: Date.now(),
      operations: 0,
    }
  }

  getName(): string {
    return this.name
  }
}

class SlidingWindowRateLimiter {
  private windowMs: number
  private maxRequests: number
  private keyPrefix: string

  constructor(config: RateLimitConfig) {
    this.windowMs = config.windowMs
    this.maxRequests = config.maxRequests
    this.keyPrefix = config.keyPrefix || 'ratelimit'
  }

  private buildKey(identifier: string): string {
    return `${CACHE_PREFIX}${this.keyPrefix}:${identifier}`
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    if (!isRedisAvailable()) {
      return { allowed: true, remaining: this.maxRequests, resetAt: Date.now() + this.windowMs }
    }
    const client = getRedisClient()
    if (!client) {
      return { allowed: true, remaining: this.maxRequests, resetAt: Date.now() + this.windowMs }
    }

    const key = this.buildKey(identifier)
    const now = Date.now()
    const windowStart = now - this.windowMs

    try {
      const pipeline = client.pipeline()
      pipeline.zremrangebyscore(key, 0, windowStart)
      pipeline.zcard(key)
      pipeline.zadd(key, now.toString(), `${now}:${Math.random()}`)
      pipeline.expire(key, Math.ceil(this.windowMs / 1000) + 1)
      const results = await pipeline.exec()

      if (!results) {
        return { allowed: true, remaining: this.maxRequests, resetAt: now + this.windowMs }
      }

      const currentCount = (results[1]?.[1] as number) || 0
      const remaining = Math.max(0, this.maxRequests - currentCount - 1)
      const allowed = currentCount < this.maxRequests
      const resetAt = now + this.windowMs

      if (!allowed) {
        const oldestEntry = await client.zrange(key, 0, 0, 'WITHSCORES')
        const oldestTime = oldestEntry.length > 1 ? parseInt(oldestEntry[1], 10) : now
        const retryAfterMs = Math.max(0, oldestTime + this.windowMs - now)

        return {
          allowed: false,
          remaining: 0,
          resetAt,
          retryAfterMs,
        }
      }

      return { allowed, remaining, resetAt }
    } catch (error) {
      console.warn('[RateLimiter] Error checking limit:', (error as Error).message)
      return { allowed: true, remaining: this.maxRequests, resetAt: now + this.windowMs }
    }
  }

  async getUsage(identifier: string): Promise<number> {
    if (!isRedisAvailable()) return 0
    const client = getRedisClient()
    if (!client) return 0

    const key = this.buildKey(identifier)
    const now = Date.now()
    const windowStart = now - this.windowMs

    try {
      await client.zremrangebyscore(key, 0, windowStart)
      return await client.zcard(key)
    } catch (error) {
      console.warn('[RateLimiter] Error getting usage:', (error as Error).message)
      return 0
    }
  }

  async resetLimit(identifier: string): Promise<void> {
    if (!isRedisAvailable()) return
    const client = getRedisClient()
    if (!client) return

    try {
      await client.del(this.buildKey(identifier))
    } catch (error) {
      console.warn('[RateLimiter] Error resetting limit:', (error as Error).message)
    }
  }
}

class TokenBucketRateLimiter {
  private maxTokens: number
  private refillRate: number
  private keyPrefix: string
  private tokensPerRequest: number

  constructor(config: {
    maxTokens: number
    refillRatePerSecond: number
    keyPrefix?: string
    tokensPerRequest?: number
  }) {
    this.maxTokens = config.maxTokens
    this.refillRate = config.refillRatePerSecond
    this.keyPrefix = config.keyPrefix || 'tokenbucket'
    this.tokensPerRequest = config.tokensPerRequest || 1
  }

  private buildKey(identifier: string): string {
    return `${CACHE_PREFIX}${this.keyPrefix}:${identifier}`
  }

  async consume(
    identifier: string,
    tokens = this.tokensPerRequest
  ): Promise<{
    allowed: boolean
    remainingTokens: number
    retryAfterMs?: number
  }> {
    if (!isRedisAvailable()) {
      return { allowed: true, remainingTokens: this.maxTokens }
    }
    const client = getRedisClient()
    if (!client) {
      return { allowed: true, remainingTokens: this.maxTokens }
    }

    const key = this.buildKey(identifier)
    const now = Date.now()

    try {
      const luaScript = `
        local key = KEYS[1]
        local maxTokens = tonumber(ARGV[1])
        local refillRate = tonumber(ARGV[2])
        local requested = tonumber(ARGV[3])
        local now = tonumber(ARGV[4])

        local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
        local tokens = tonumber(data[1]) or maxTokens
        local lastRefill = tonumber(data[2]) or now

        local elapsed = (now - lastRefill) / 1000
        local refillAmount = elapsed * refillRate
        tokens = math.min(maxTokens, tokens + refillAmount)

        local allowed = tokens >= requested
        if allowed then
          tokens = tokens - requested
        end

        redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
        redis.call('EXPIRE', key, 3600)

        local retryAfter = 0
        if not allowed then
          retryAfter = math.ceil((requested - tokens) / refillRate * 1000)
        end

        return {allowed and 1 or 0, math.floor(tokens), retryAfter}
      `

      const result = (await client.eval(
        luaScript,
        1,
        key,
        this.maxTokens.toString(),
        this.refillRate.toString(),
        tokens.toString(),
        now.toString()
      )) as number[]

      const allowed = result[0] === 1
      const remainingTokens = result[1]
      const retryAfterMs = result[2] > 0 ? result[2] : undefined

      return { allowed, remainingTokens, retryAfterMs }
    } catch (error) {
      console.warn('[TokenBucket] Error consuming:', (error as Error).message)
      return { allowed: true, remainingTokens: this.maxTokens }
    }
  }

  async getTokens(identifier: string): Promise<number> {
    if (!isRedisAvailable()) return this.maxTokens
    const client = getRedisClient()
    if (!client) return this.maxTokens

    const key = this.buildKey(identifier)
    const now = Date.now()

    try {
      const data = await client.hmget(key, 'tokens', 'lastRefill')
      const tokens = data[0] ? parseFloat(data[0]) : this.maxTokens
      const lastRefill = data[1] ? parseInt(data[1], 10) : now

      const elapsed = (now - lastRefill) / 1000
      const refillAmount = elapsed * this.refillRate

      return Math.min(this.maxTokens, tokens + refillAmount)
    } catch (error) {
      console.warn('[TokenBucket] Error getting tokens:', (error as Error).message)
      return this.maxTokens
    }
  }

  async reset(identifier: string): Promise<void> {
    if (!isRedisAvailable()) return
    const client = getRedisClient()
    if (!client) return

    try {
      await client.del(this.buildKey(identifier))
    } catch (error) {
      console.warn('[TokenBucket] Error resetting:', (error as Error).message)
    }
  }
}

class HitCounter {
  private name: string
  private windowSeconds: number
  private key: string

  constructor(name: string, windowSeconds = 60) {
    this.name = name
    this.windowSeconds = windowSeconds
    this.key = `${CACHE_PREFIX}hitcount:${name}`
  }

  async hit(label?: string): Promise<number> {
    if (!isRedisAvailable()) return 0
    const client = getRedisClient()
    if (!client) return 0

    const key = label ? `${this.key}:${label}` : this.key

    try {
      const pipeline = client.pipeline()
      pipeline.incr(key)
      pipeline.expire(key, this.windowSeconds)
      const results = await pipeline.exec()
      return (results?.[0]?.[1] as number) || 0
    } catch (error) {
      console.warn('[HitCounter] Error recording hit:', (error as Error).message)
      return 0
    }
  }

  async getHits(label?: string): Promise<number> {
    if (!isRedisAvailable()) return 0
    const client = getRedisClient()
    if (!client) return 0

    const key = label ? `${this.key}:${label}` : this.key

    try {
      const count = await client.get(key)
      return count ? parseInt(count, 10) : 0
    } catch (error) {
      console.warn('[HitCounter] Error getting hits:', (error as Error).message)
      return 0
    }
  }

  async getHitsWithTTL(label?: string): Promise<{ count: number; ttl: number }> {
    if (!isRedisAvailable()) return { count: 0, ttl: 0 }
    const client = getRedisClient()
    if (!client) return { count: 0, ttl: 0 }

    const key = label ? `${this.key}:${label}` : this.key

    try {
      const pipeline = client.pipeline()
      pipeline.get(key)
      pipeline.ttl(key)
      const results = await pipeline.exec()

      return {
        count: (results?.[0]?.[1] as number) || 0,
        ttl: (results?.[1]?.[1] as number) || 0,
      }
    } catch (error) {
      console.warn('[HitCounter] Error getting hits with TTL:', (error as Error).message)
      return { count: 0, ttl: 0 }
    }
  }
}

class SlidingWindowCounter {
  private windowSeconds: number
  private bucketCount: number
  private prefix: string

  constructor(windowSeconds = 60, bucketCount = 6) {
    this.windowSeconds = windowSeconds
    this.bucketCount = bucketCount
    this.prefix = `${CACHE_PREFIX}swcounter:`
  }

  private buildKey(identifier: string): string {
    return `${this.prefix}${identifier}`
  }

  private getBucketDuration(): number {
    return Math.ceil(this.windowSeconds / this.bucketCount)
  }

  async increment(identifier: string, amount = 1): Promise<number> {
    if (!isRedisAvailable()) return 0
    const client = getRedisClient()
    if (!client) return 0

    const key = this.buildKey(identifier)
    const now = Date.now()
    const bucketDuration = this.getBucketDuration()
    const currentBucket = Math.floor(now / bucketDuration)

    try {
      const pipeline = client.pipeline()

      for (let i = 0; i < this.bucketCount; i++) {
        const bucketKey = `${key}:${currentBucket - i}`
        pipeline.incrby(bucketKey, amount)
        pipeline.expire(bucketKey, bucketDuration * 2)
      }

      const results = await pipeline.exec()

      let total = 0
      const cutoff = now - this.windowSeconds * 1000

      for (let i = 0; i < this.bucketCount; i++) {
        const bucketTime = (currentBucket - i) * bucketDuration * 1000
        if (bucketTime >= cutoff) {
          total += ((results?.[i * 2]?.[1] as number) || 0) - amount
        }
      }

      return total + amount
    } catch (error) {
      console.warn('[SlidingWindowCounter] Error incrementing:', (error as Error).message)
      return 0
    }
  }

  async getCount(identifier: string): Promise<number> {
    if (!isRedisAvailable()) return 0
    const client = getRedisClient()
    if (!client) return 0

    const key = this.buildKey(identifier)
    const now = Date.now()
    const bucketDuration = this.getBucketDuration()
    const currentBucket = Math.floor(now / bucketDuration)
    const cutoff = now - this.windowSeconds * 1000

    try {
      const pipeline = client.pipeline()

      for (let i = 0; i < this.bucketCount; i++) {
        const bucketKey = `${key}:${currentBucket - i}`
        pipeline.get(bucketKey)
      }

      const results = await pipeline.exec()

      let total = 0
      for (let i = 0; i < this.bucketCount; i++) {
        const bucketTime = (currentBucket - i) * bucketDuration * 1000
        if (bucketTime >= cutoff) {
          total += parseInt((results?.[i]?.[1] as string) || '0', 10)
        }
      }

      return total
    } catch (error) {
      console.warn('[SlidingWindowCounter] Error getting count:', (error as Error).message)
      return 0
    }
  }
}

function createCounter(name: string, options?: Partial<CounterOptions>): DistributedCounter {
  return new DistributedCounter({ name, ...options })
}

function createRateLimiter(config: RateLimitConfig): SlidingWindowRateLimiter {
  return new SlidingWindowRateLimiter(config)
}

function createTokenBucketLimiter(config: {
  maxTokens: number
  refillRatePerSecond: number
  keyPrefix?: string
  tokensPerRequest?: number
}): TokenBucketRateLimiter {
  return new TokenBucketRateLimiter(config)
}

function createHitCounter(name: string, windowSeconds?: number): HitCounter {
  return new HitCounter(name, windowSeconds)
}

function createSlidingWindowCounter(
  windowSeconds?: number,
  bucketCount?: number
): SlidingWindowCounter {
  return new SlidingWindowCounter(windowSeconds, bucketCount)
}

const ContentViewCounter = createCounter('content-views')
const UserRequestCounter = createCounter('user-requests')
const ApiRateLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 100,
  keyPrefix: 'api',
})

export {
  DistributedCounter,
  SlidingWindowRateLimiter,
  TokenBucketRateLimiter,
  HitCounter,
  SlidingWindowCounter,
  type CounterOptions,
  type RateLimitConfig,
  type RateLimitResult,
  type CounterSnapshot,
  createCounter,
  createRateLimiter,
  createTokenBucketLimiter,
  createHitCounter,
  createSlidingWindowCounter,
  ContentViewCounter,
  UserRequestCounter,
  ApiRateLimiter,
}
