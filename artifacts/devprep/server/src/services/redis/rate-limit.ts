import { Request, Response, NextFunction } from 'express'
import { getRedisClient, isRedisAvailable } from './singleton.js'

const RATE_LIMIT_PREFIX = 'devprep:ratelimit:'

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyPrefix?: string
  skipFailedRequests?: boolean
  skipSuccessfulRequests?: boolean
  keyGenerator?: (req: Request) => string
  handler?: (req: Request, res: Response) => void
  skip?: (req: Request) => boolean
  message?: string
}

export interface RateLimitInfo {
  limit: number
  current: number
  remaining: number
  resetTime: number
}

const defaultHandler = (req: Request, res: Response, message?: string) => {
  res.status(429).json({
    ok: false,
    error: message || 'Too many requests, please try again later.',
  })
}

const defaultKeyGenerator = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for']
  const ip = forwarded
    ? Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded.split(',')[0]
    : req.ip || req.socket.remoteAddress || 'unknown'
  return `${ip}:${req.path}`
}

function createRateLimitMiddleware(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyPrefix = 'default',
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
    keyGenerator = defaultKeyGenerator,
    handler = defaultHandler,
    skip = () => false,
  } = config

  const windowSeconds = Math.ceil(windowMs / 1000)

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!isRedisAvailable()) {
      return next()
    }

    const client = getRedisClient()
    if (!client) {
      return next()
    }

    if (skip(req)) {
      return next()
    }

    const key = `${RATE_LIMIT_PREFIX}${keyPrefix}:${keyGenerator(req)}`
    const now = Date.now()
    const windowStart = now - windowMs

    try {
      const multi = client.multi()
      multi.zremrangebyscore(key, 0, windowStart)
      multi.zadd(key, now, `${now}:${Math.random()}`)
      multi.zcard(key)
      multi.expire(key, windowSeconds)
      const results = await multi.exec()

      if (!results) {
        return next()
      }

      const current = (results[2] as [unknown, number])?.[1] ?? 0

      res.setHeader('X-RateLimit-Limit', String(maxRequests))
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - current)))
      res.setHeader('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)))

      if (current > maxRequests) {
        return handler(req, res, config.message)
      }

      res.on('finish', async () => {
        if (!isRedisAvailable()) return
        const updateClient = getRedisClient()
        if (!updateClient) return

        if (skipFailedRequests && res.statusCode >= 400) {
          await updateClient.zremrangebyscore(key, 0, windowStart)
        } else if (skipSuccessfulRequests && res.statusCode < 400) {
          await updateClient.zremrangebyscore(key, 0, windowStart)
        }
      })

      next()
    } catch (error) {
      console.error('[RateLimit] Error:', (error as Error).message)
      next()
    }
  }
}

export function rateLimit(config: RateLimitConfig) {
  return createRateLimitMiddleware(config)
}

export function createSlidingWindowLimiter(config: RateLimitConfig) {
  return createRateLimitMiddleware(config)
}

export function createTokenBucketLimiter(options: {
  bucketSize: number
  refillRate: number
  prefix?: string
}) {
  const { bucketSize, refillRate, prefix = 'token' } = options

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!isRedisAvailable()) {
      return next()
    }

    const client = getRedisClient()
    if (!client) {
      return next()
    }

    const key = `${RATE_LIMIT_PREFIX}token:${prefix}:${defaultKeyGenerator(req)}`
    const now = Date.now()

    try {
      const tokensKey = `${key}:tokens`
      const timestampKey = `${key}:timestamp`

      const luaScript = `
        local tokens = tonumber(redis.call('GET', KEYS[1]) or ARGV[1])
        local lastRefill = tonumber(redis.call('GET', KEYS[2]) or ARGV[2])
        local now = tonumber(ARGV[2])
        local bucketSize = tonumber(ARGV[1])
        local refillRate = tonumber(ARGV[3])

        local elapsed = (now - lastRefill) / 1000
        local refilled = math.floor(elapsed * refillRate)
        
        if refilled > 0 then
          tokens = math.min(bucketSize, tokens + refilled)
          redis.call('SET', KEYS[2], now)
        end

        if tokens > 0 then
          tokens = tokens - 1
          redis.call('SET', KEYS[1], tokens)
          return {tokens, 1}
        else
          return {tokens, 0}
        end
      `

      const result = (await client.eval(
        luaScript,
        2,
        tokensKey,
        timestampKey,
        bucketSize,
        now,
        refillRate
      )) as [number, number]

      const [tokensLeft, allowed] = result

      res.setHeader('X-RateLimit-Limit', String(bucketSize))
      res.setHeader('X-RateLimit-Remaining', String(tokensLeft))

      if (allowed === 0) {
        return res.status(429).json({
          ok: false,
          error: 'Rate limit exceeded. Please try again later.',
        })
      }

      next()
    } catch (error) {
      console.error('[TokenBucket] Error:', (error as Error).message)
      next()
    }
  }
}

export async function getRateLimitInfo(
  identifier: string,
  prefix: string = 'default'
): Promise<RateLimitInfo | null> {
  if (!isRedisAvailable()) return null
  const client = getRedisClient()
  if (!client) return null

  try {
    const key = `${RATE_LIMIT_PREFIX}${prefix}:${identifier}`
    const ttl = await client.ttl(key)

    if (ttl <= 0) {
      return { limit: 0, current: 0, remaining: 0, resetTime: 0 }
    }

    const count = await client.zcard(key)

    return {
      limit: 0,
      current: count,
      remaining: 0,
      resetTime: Date.now() + ttl * 1000,
    }
  } catch (error) {
    console.error('[RateLimit] Error getting info:', (error as Error).message)
    return null
  }
}

export async function resetRateLimit(
  identifier: string,
  prefix: string = 'default'
): Promise<boolean> {
  if (!isRedisAvailable()) return false
  const client = getRedisClient()
  if (!client) return false

  try {
    const key = `${RATE_LIMIT_PREFIX}${prefix}:${identifier}`
    await client.del(key)
    return true
  } catch (error) {
    console.error('[RateLimit] Error resetting:', (error as Error).message)
    return false
  }
}

export function createIpRateLimit(config: RateLimitConfig) {
  return createRateLimitMiddleware({
    ...config,
    keyGenerator: (req: Request) => {
      const forwarded = req.headers['x-forwarded-for']
      const ip = forwarded
        ? Array.isArray(forwarded)
          ? forwarded[0]
          : forwarded.split(',')[0]
        : req.ip || req.socket.remoteAddress || 'unknown'
      return ip
    },
  })
}

export function createUserRateLimit(config: RateLimitConfig) {
  return createRateLimitMiddleware({
    ...config,
    keyGenerator: (req: Request) => {
      const userId = req.headers['x-user-id'] || req.headers['authorization']
      return String(userId || defaultKeyGenerator(req))
    },
  })
}

export function createEndpointRateLimit(config: RateLimitConfig) {
  return createRateLimitMiddleware({
    ...config,
    keyGenerator: (req: Request) => req.path,
  })
}

export const apiRateLimit = createRateLimitMiddleware({
  windowMs: 60000,
  maxRequests: 100,
  keyPrefix: 'api',
  message: 'Too many API requests',
})

export const authRateLimit = createRateLimitMiddleware({
  windowMs: 900000,
  maxRequests: 5,
  keyPrefix: 'auth',
  message: 'Too many authentication attempts',
})

export const contentRateLimit = createRateLimitMiddleware({
  windowMs: 60000,
  maxRequests: 30,
  keyPrefix: 'content',
  message: 'Too many content requests',
})

export const searchRateLimit = createRateLimitMiddleware({
  windowMs: 60000,
  maxRequests: 20,
  keyPrefix: 'search',
  message: 'Too many search requests',
})

export const generateRateLimit = createRateLimitMiddleware({
  windowMs: 3600000,
  maxRequests: 10,
  keyPrefix: 'generate',
  message: 'Too many generation requests',
})
