import { getRedisClient, isRedisAvailable } from './singleton.js'

const LOCK_PREFIX = 'devprep:lock:'
const DEFAULT_LOCK_TTL = 30000
const DEFAULT_RETRY_DELAY = 100
const DEFAULT_MAX_RETRIES = 30

export interface LockOptions {
  ttl?: number
  retryDelay?: number
  maxRetries?: number
  autoRelease?: boolean
}

export interface Lock {
  key: string
  token: string
  release: () => Promise<boolean>
  extend: (additionalTime: number) => Promise<boolean>
}

export interface Mutex {
  acquire: () => Promise<Lock | null>
  tryAcquire: () => Promise<Lock | null>
}

function generateToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

export async function acquireLock(
  resource: string,
  options: LockOptions = {}
): Promise<Lock | null> {
  const {
    ttl = DEFAULT_LOCK_TTL,
    retryDelay = DEFAULT_RETRY_DELAY,
    maxRetries = DEFAULT_MAX_RETRIES,
  } = options

  if (!isRedisAvailable()) return null
  const client = getRedisClient()
  if (!client) return null

  const key = `${LOCK_PREFIX}${resource}`
  const token = generateToken()
  const ttlMs = Math.floor(ttl / 1000)

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const acquired = await client.set(key, token, 'EX', ttlMs, 'NX')
      if (acquired === 'OK') {
        return {
          key,
          token,
          release: async () => releaseLock(key, token),
          extend: async (additionalTime: number) => extendLock(key, token, additionalTime),
        }
      }

      if (attempt < maxRetries - 1) {
        await sleep(retryDelay)
      }
    } catch (error) {
      console.error('[Locks] Error acquiring lock:', (error as Error).message)
      if (attempt === maxRetries - 1) return null
      await sleep(retryDelay)
    }
  }

  return null
}

export async function tryAcquireLock(
  resource: string,
  options: LockOptions = {}
): Promise<Lock | null> {
  const { ttl = DEFAULT_LOCK_TTL } = options

  if (!isRedisAvailable()) return null
  const client = getRedisClient()
  if (!client) return null

  const key = `${LOCK_PREFIX}${resource}`
  const token = generateToken()
  const ttlMs = Math.floor(ttl / 1000)

  try {
    const acquired = await client.set(key, token, 'EX', ttlMs, 'NX')
    if (acquired === 'OK') {
      return {
        key,
        token,
        release: async () => releaseLock(key, token),
        extend: async (additionalTime: number) => extendLock(key, token, additionalTime),
      }
    }
  } catch (error) {
    console.error('[Locks] Error trying to acquire lock:', (error as Error).message)
  }

  return null
}

async function releaseLock(key: string, token: string): Promise<boolean> {
  if (!isRedisAvailable()) return false
  const client = getRedisClient()
  if (!client) return false

  const luaScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `

  try {
    const result = await client.eval(luaScript, 1, key, token)
    return result === 1
  } catch (error) {
    console.error('[Locks] Error releasing lock:', (error as Error).message)
    return false
  }
}

async function extendLock(key: string, token: string, additionalTime: number): Promise<boolean> {
  if (!isRedisAvailable()) return false
  const client = getRedisClient()
  if (!client) return false

  const ttlSeconds = Math.floor(additionalTime / 1000)
  const luaScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("expire", KEYS[1], ARGV[2])
    else
      return 0
    end
  `

  try {
    const result = await client.eval(luaScript, 1, key, token, ttlSeconds)
    return result === 1
  } catch (error) {
    console.error('[Locks] Error extending lock:', (error as Error).message)
    return false
  }
}

export function createMutex(resource: string, options: LockOptions = {}): Mutex {
  return {
    acquire: () => acquireLock(resource, options),
    tryAcquire: () => tryAcquireLock(resource, options),
  }
}

export async function withLock<T>(
  resource: string,
  fn: () => Promise<T>,
  options: LockOptions = {}
): Promise<T | null> {
  const lock = await acquireLock(resource, options)
  if (!lock) return null

  try {
    return await fn()
  } finally {
    await lock.release()
  }
}

export async function withMutex<T>(
  resource: string,
  fn: () => Promise<T>,
  options: LockOptions = {}
): Promise<T | null> {
  return withLock(resource, fn, options)
}

export async function isLocked(resource: string): Promise<boolean> {
  if (!isRedisAvailable()) return false
  const client = getRedisClient()
  if (!client) return false

  try {
    const key = `${LOCK_PREFIX}${resource}`
    const exists = await client.exists(key)
    return exists === 1
  } catch (error) {
    console.error('[Locks] Error checking lock status:', (error as Error).message)
    return false
  }
}

export async function getLockTTL(resource: string): Promise<number> {
  if (!isRedisAvailable()) return -1
  const client = getRedisClient()
  if (!client) return -1

  try {
    const key = `${LOCK_PREFIX}${resource}`
    const ttl = await client.ttl(key)
    return ttl
  } catch (error) {
    console.error('[Locks] Error getting lock TTL:', (error as Error).message)
    return -1
  }
}

export async function forceReleaseLock(resource: string): Promise<boolean> {
  if (!isRedisAvailable()) return false
  const client = getRedisClient()
  if (!client) return false

  try {
    const key = `${LOCK_PREFIX}${resource}`
    await client.del(key)
    return true
  } catch (error) {
    console.error('[Locks] Error force releasing lock:', (error as Error).message)
    return false
  }
}

export async function acquireMultipleLocks(
  resources: string[],
  options: LockOptions = {}
): Promise<Lock[] | null> {
  const locks: Lock[] = []

  for (const resource of resources) {
    const lock = await acquireLock(resource, options)
    if (!lock) {
      for (const l of locks) {
        await l.release()
      }
      return null
    }
    locks.push(lock)
  }

  return locks
}

export async function releaseMultipleLocks(locks: Lock[]): Promise<void> {
  for (const lock of locks) {
    await lock.release()
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export interface RedlockOptions {
  driftFactor?: number
  retryCount?: number
  retryDelay?: number
  retryJitter?: number
  automaticExtensionThreshold?: number
}

export interface RedlockInstance {
  acquire: (resources: string[], duration: number) => Promise<Lock[] | null>
  release: (locks: Lock[]) => Promise<void>
  extend: (lock: Lock, duration: number) => Promise<boolean>
}

export function createRedlock(options: RedlockOptions = {}): RedlockInstance {
  const {
    retryCount = DEFAULT_MAX_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    retryJitter = 100,
  } = options

  return {
    async acquire(resources: string[], duration: number): Promise<Lock[] | null> {
      const startTime = Date.now()

      for (let attempt = 0; attempt < retryCount; attempt++) {
        const locks = await acquireMultipleLocks(resources, { ttl: duration })

        if (locks) {
          const drift = (Date.now() - startTime) / 1000
          const buffer = drift * 0.01 + 0.1

          if (Date.now() - startTime < duration - buffer * 1000) {
            return locks
          } else {
            await releaseMultipleLocks(locks)
          }
        }

        const jitter = Math.random() * retryJitter
        await sleep(retryDelay + jitter)
      }

      return null
    },

    async release(locks: Lock[]): Promise<void> {
      await releaseMultipleLocks(locks)
    },

    async extend(lock: Lock, duration: number): Promise<boolean> {
      return lock.extend(duration)
    },
  }
}
