import { getRedisClient, isRedisAvailable } from '../singleton.js'
import { executeScript, SCRIPTS } from './lua-scripts.js'

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfterMs?: number
}

export interface RateLimitInfo {
  total: number
  current: number
  remaining: number
  resetAt: number
}

type RateLimitStrategy = 'fixed' | 'sliding' | 'token_bucket'

const RATE_LIMIT_PREFIX = 'devprep:ratelimit:'

function buildRateLimitKey(identifier: string, endpoint: string): string {
  return `${RATE_LIMIT_PREFIX}${endpoint}:${identifier}`
}

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (!isRedisAvailable()) {
    return { allowed: true, remaining: config.maxRequests, resetAt: Date.now() + config.windowMs }
  }

  const client = getRedisClient()
  if (!client) {
    return { allowed: true, remaining: config.maxRequests, resetAt: Date.now() + config.windowMs }
  }

  const key = buildRateLimitKey(identifier, endpoint)
  const now = Date.now()
  const windowStart = now - config.windowMs

  try {
    const multi = client.multi()

    multi.zremrangebyscore(key, '-inf', windowStart)
    multi.zcard(key)
    multi.zadd(key, now, `${now}-${Math.random()}`)
    multi.pexpire(key, config.windowMs)

    const results = await multi.exec()

    if (!results) {
      return { allowed: true, remaining: config.maxRequests, resetAt: Date.now() + config.windowMs }
    }

    const [, countResult] = results[1]
    const count = countResult as number

    if (count >= config.maxRequests) {
      const oldestEntry = await client.zrange(key, 0, 0, 'WITHSCORES')
      const oldestTime = oldestEntry.length >= 2 ? parseInt(oldestEntry[1], 10) : now
      const retryAfterMs = oldestTime + config.windowMs - now

      return {
        allowed: false,
        remaining: 0,
        resetAt: oldestTime + config.windowMs,
        retryAfterMs,
      }
    }

    return {
      allowed: true,
      remaining: config.maxRequests - count - 1,
      resetAt: now + config.windowMs,
    }
  } catch (error) {
    console.error('[RateLimiter] Error checking rate limit:', (error as Error).message)
    return { allowed: true, remaining: config.maxRequests, resetAt: Date.now() + config.windowMs }
  }
}

export async function checkRateLimitSliding(
  identifier: string,
  endpoint: string,
  windowMs: number,
  maxRequests: number
): Promise<RateLimitResult> {
  const key = buildRateLimitKey(identifier, endpoint)
  const now = Date.now()

  const result = await executeScript('rate_limit_sliding', [key, windowMs, now])

  if (!result.success) {
    return { allowed: true, remaining: maxRequests, resetAt: now + windowMs }
  }

  const [allowed, remaining] = result.result as [number, number]

  return {
    allowed: allowed === 1,
    remaining,
    resetAt: now + windowMs,
    retryAfterMs: allowed === 0 ? windowMs : undefined,
  }
}

export async function getRateLimitInfo(
  identifier: string,
  endpoint: string,
  windowMs: number
): Promise<RateLimitInfo | null> {
  if (!isRedisAvailable()) return null
  const client = getRedisClient()
  if (!client) return null

  const key = buildRateLimitKey(identifier, endpoint)
  const now = Date.now()
  const windowStart = now - windowMs

  try {
    const multi = client.multi()

    multi.zremrangebyscore(key, '-inf', windowStart)
    multi.zcard(key)
    multi.zrange(key, -1, -1, 'WITHSCORES')

    const results = await multi.exec()

    if (!results) return null

    const countResult = results[1]?.[1]
    const lastEntryResult = results[2]?.[1]
    const count = (countResult as number) || 0
    const lastEntry = (lastEntryResult as string[]) || []

    const oldestTimestamp = lastEntry.length >= 2 ? parseInt(lastEntry[1], 10) : now

    return {
      total: count,
      current: count,
      remaining: Math.max(0, 100 - count),
      resetAt: oldestTimestamp + windowMs,
    }
  } catch (error) {
    console.error('[RateLimiter] Error getting rate limit info:', (error as Error).message)
    return null
  }
}

export async function resetRateLimit(identifier: string, endpoint: string): Promise<boolean> {
  if (!isRedisAvailable()) return false
  const client = getRedisClient()
  if (!client) return false

  const key = buildRateLimitKey(identifier, endpoint)

  try {
    await client.del(key)
    return true
  } catch (error) {
    console.error('[RateLimiter] Error resetting rate limit:', (error as Error).message)
    return false
  }
}

export class RateLimiter {
  private endpoint: string
  private config: RateLimitConfig
  private strategy: RateLimitStrategy

  constructor(endpoint: string, config: RateLimitConfig, strategy: RateLimitStrategy = 'fixed') {
    this.endpoint = endpoint
    this.config = config
    this.strategy = strategy
  }

  async check(identifier: string): Promise<RateLimitResult> {
    switch (this.strategy) {
      case 'sliding':
        return checkRateLimitSliding(
          identifier,
          this.endpoint,
          this.config.windowMs,
          this.config.maxRequests
        )
      default:
        return checkRateLimit(identifier, this.endpoint, this.config)
    }
  }

  async getInfo(identifier: string): Promise<RateLimitInfo | null> {
    return getRateLimitInfo(identifier, this.endpoint, this.config.windowMs)
  }

  async reset(identifier: string): Promise<boolean> {
    return resetRateLimit(identifier, this.endpoint)
  }
}

export class TokenBucketRateLimiter {
  private key: string
  private capacity: number
  private refillRate: number
  private tokens: number
  private lastRefill: number

  constructor(identifier: string, endpoint: string, capacity: number, refillPerSecond: number) {
    this.key = buildRateLimitKey(identifier, `bucket:${endpoint}`)
    this.capacity = capacity
    this.refillRate = refillPerSecond
    this.tokens = capacity
    this.lastRefill = Date.now()
  }

  async consume(tokens = 1): Promise<RateLimitResult> {
    if (!isRedisAvailable()) {
      return { allowed: true, remaining: this.capacity, resetAt: Date.now() }
    }

    const client = getRedisClient()
    if (!client) {
      return { allowed: true, remaining: this.capacity, resetAt: Date.now() }
    }

    try {
      await this.refill()

      if (this.tokens >= tokens) {
        this.tokens -= tokens

        const bucketData = JSON.stringify({
          tokens: this.tokens,
          lastRefill: this.lastRefill,
        })
        await client.set(this.key, bucketData, 'EX', 3600)

        return {
          allowed: true,
          remaining: this.tokens,
          resetAt: Date.now() + (this.tokens / this.refillRate) * 1000,
        }
      }

      const waitTime = ((tokens - this.tokens) / this.refillRate) * 1000

      return {
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + waitTime,
        retryAfterMs: waitTime,
      }
    } catch (error) {
      console.error('[TokenBucket] Error consuming tokens:', (error as Error).message)
      return { allowed: true, remaining: this.capacity, resetAt: Date.now() }
    }
  }

  private async refill(): Promise<void> {
    if (!isRedisAvailable()) return

    const client = getRedisClient()
    if (!client) return

    try {
      const data = await client.get(this.key)

      if (data) {
        const parsed = JSON.parse(data)
        this.tokens = parsed.tokens
        this.lastRefill = parsed.lastRefill
      }

      const now = Date.now()
      const elapsed = now - this.lastRefill
      const tokensToAdd = (elapsed / 1000) * this.refillRate

      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
      this.lastRefill = now
    } catch {
      this.tokens = this.capacity
      this.lastRefill = Date.now()
    }
  }
}

export const RATE_LIMITS = {
  API_GENERAL: { windowMs: 60000, maxRequests: 100 },
  API_CONTENT: { windowMs: 60000, maxRequests: 30 },
  API_GENERATE: { windowMs: 60000, maxRequests: 10 },
  API_SEARCH: { windowMs: 60000, maxRequests: 50 },
  SESSION_CREATE: { windowMs: 60000, maxRequests: 20 },
  AUTH_ATTEMPTS: { windowMs: 300000, maxRequests: 5 },
} as const
