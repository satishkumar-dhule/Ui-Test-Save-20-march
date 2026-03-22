import { InMemoryRedis, Pipeline } from '../inmemory/client.js'
import { getRedisClient, isRedisAvailable } from '../singleton.js'

export type RedisClient = InMemoryRedis
export type ChainableCommander = Pipeline

export interface TransactionResult<T = unknown> {
  success: boolean
  results: T[]
  error?: string
}

export interface PipelineCommand {
  command: string
  args: (string | number | Buffer)[]
}

type TransactionExecutor = (tx: ChainableCommander) => Promise<unknown>

export async function executeTransaction<T = unknown>(
  executor: TransactionExecutor
): Promise<TransactionResult<T>> {
  if (!isRedisAvailable()) {
    return { success: false, results: [], error: 'Redis not available' }
  }

  const client = getRedisClient()
  if (!client) {
    return { success: false, results: [], error: 'No Redis client' }
  }

  const tx: ChainableCommander = client.multi()

  try {
    await executor(tx)

    const results = await tx.exec()

    if (!results) {
      return { success: false, results: [], error: 'Transaction returned no results' }
    }

    const parsedResults: T[] = []
    let hasError = false

    for (const [err, result] of results) {
      if (err) {
        hasError = true
        console.error('[Transaction] Command error:', err.message)
      }
      parsedResults.push(result as T)
    }

    if (hasError) {
      return {
        success: false,
        results: parsedResults,
        error: 'One or more commands failed',
      }
    }

    return { success: true, results: parsedResults }
  } catch (error) {
    console.error('[Transaction] Execution error:', (error as Error).message)
    return {
      success: false,
      results: [],
      error: (error as Error).message,
    }
  }
}

export async function executeBatch<T = unknown>(
  commands: PipelineCommand[]
): Promise<TransactionResult<T>> {
  if (!isRedisAvailable()) {
    return { success: false, results: [], error: 'Redis not available' }
  }

  const client = getRedisClient()
  if (!client) {
    return { success: false, results: [], error: 'No Redis client' }
  }

  try {
    const pipeline = client.pipeline()

    for (const { command, args } of commands) {
      ;(pipeline as unknown as Record<string, Function>)[command.toLowerCase()](...args)
    }

    const results = await pipeline.exec()

    if (!results) {
      return { success: false, results: [], error: 'Pipeline returned no results' }
    }

    const parsedResults: T[] = results.map(([, result]) => result as T)

    return { success: true, results: parsedResults }
  } catch (error) {
    console.error('[Transaction] Pipeline error:', (error as Error).message)
    return {
      success: false,
      results: [],
      error: (error as Error).message,
    }
  }
}

export async function watchAndExecute<T = unknown>(
  keys: string[],
  executor: TransactionExecutor
): Promise<TransactionResult<T>> {
  if (!isRedisAvailable()) {
    return { success: false, results: [], error: 'Redis not available' }
  }

  const client = getRedisClient()
  if (!client) {
    return { success: false, results: [], error: 'No Redis client' }
  }

  const maxRetries = 3
  let attempts = 0

  while (attempts < maxRetries) {
    attempts++

    try {
      const tx: ChainableCommander = client.multi()
      await tx.watch(...keys)

      await executor(tx)

      const results = await tx.exec()

      if (results === null) {
        console.warn(`[Transaction] Watch conflict on attempt ${attempts}, retrying...`)
        await new Promise(resolve => setTimeout(resolve, 50 * attempts))
        continue
      }

      const parsedResults: T[] = []
      let hasError = false

      for (const [err, result] of results) {
        if (err) {
          hasError = true
          console.error('[Transaction] Command error:', err.message)
        }
        parsedResults.push(result as T)
      }

      await client.unwatch()

      if (hasError) {
        return {
          success: false,
          results: parsedResults,
          error: 'One or more commands failed',
        }
      }

      return { success: true, results: parsedResults }
    } catch (error) {
      console.error('[Transaction] Execution error:', (error as Error).message)
      await client.unwatch()
      return {
        success: false,
        results: [],
        error: (error as Error).message,
      }
    }
  }

  return {
    success: false,
    results: [],
    error: `Max retry attempts (${maxRetries}) exceeded due to watch conflicts`,
  }
}

export class AtomicCounter {
  private key: string

  constructor(key: string, prefix = 'devprep:counter:') {
    this.key = `${prefix}${key}`
  }

  async increment(amount = 1): Promise<number | null> {
    if (!isRedisAvailable()) return null
    const client = getRedisClient()
    if (!client) return null

    try {
      return amount === 1 ? await client.incr(this.key) : await client.incrby(this.key, amount)
    } catch (error) {
      console.error('[AtomicCounter] Increment error:', (error as Error).message)
      return null
    }
  }

  async decrement(amount = 1): Promise<number | null> {
    if (!isRedisAvailable()) return null
    const client = getRedisClient()
    if (!client) return null

    try {
      return amount === 1 ? await client.decr(this.key) : await client.decrby(this.key, amount)
    } catch (error) {
      console.error('[AtomicCounter] Decrement error:', (error as Error).message)
      return null
    }
  }

  async get(): Promise<number | null> {
    if (!isRedisAvailable()) return null
    const client = getRedisClient()
    if (!client) return null

    try {
      const value = await client.get(this.key)
      return value ? parseInt(value, 10) : 0
    } catch (error) {
      console.error('[AtomicCounter] Get error:', (error as Error).message)
      return null
    }
  }

  async set(value: number): Promise<boolean> {
    if (!isRedisAvailable()) return false
    const client = getRedisClient()
    if (!client) return false

    try {
      await client.set(this.key, value)
      return true
    } catch (error) {
      console.error('[AtomicCounter] Set error:', (error as Error).message)
      return false
    }
  }
}

export class DistributedLock {
  private key: string
  private ttlMs: number
  private token: string

  constructor(key: string, ttlMs = 30000, prefix = 'devprep:lock:') {
    this.key = `${prefix}${key}`
    this.ttlMs = ttlMs
    this.token = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }

  async acquire(): Promise<boolean> {
    if (!isRedisAvailable()) return false
    const client = getRedisClient()
    if (!client) return false

    try {
      const result = await client.set(this.key, this.token, 'PX', this.ttlMs, 'NX')
      return result === 'OK'
    } catch (error) {
      console.error('[DistributedLock] Acquire error:', (error as Error).message)
      return false
    }
  }

  async release(): Promise<boolean> {
    if (!isRedisAvailable()) return false
    const client = getRedisClient()
    if (!client) return false

    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `

    try {
      const result = await client.eval(script, 1, this.key, this.token)
      return result === 1
    } catch (error) {
      console.error('[DistributedLock] Release error:', (error as Error).message)
      return false
    }
  }

  async extend(additionalMs?: number): Promise<boolean> {
    if (!isRedisAvailable()) return false
    const client = getRedisClient()
    if (!client) return false

    const ttl = additionalMs || this.ttlMs

    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("pexpire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `

    try {
      const result = await client.eval(script, 1, this.key, this.token, ttl)
      return result === 1
    } catch (error) {
      console.error('[DistributedLock] Extend error:', (error as Error).message)
      return false
    }
  }
}

export async function withLock<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs = 30000
): Promise<T | null> {
  const lock = new DistributedLock(key, ttlMs)

  const acquired = await lock.acquire()
  if (!acquired) return null

  try {
    return await fn()
  } finally {
    await lock.release()
  }
}
