/**
 * Redis SDK Type-Safe Commands
 * @package @devprep/redis-sdk
 */

import { InMemoryRedis, Pipeline } from '../inmemory/client.js'
import { getConnectionManager } from './connection.js'

export type RedisClient = InMemoryRedis
export type PipelineType = Pipeline

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export interface CommandOptions {
  ttl?: number
  keyPrefix?: string
}

export interface BatchItem {
  command: string
  args: (string | number)[]
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

export interface PipelineStats {
  totalCommands: number
  executionTime: number
  errors: number
}

class CommandsWrapper {
  private client: RedisClient

  constructor(client?: RedisClient) {
    this.client = client || getConnectionManager().getClient()
  }

  /**
   * Set the client instance
   */
  setClient(client: RedisClient): void {
    this.client = client
  }

  // ============ STRING COMMANDS ============

  /**
   * Set a string value with optional TTL
   */
  async set(key: string, value: JsonValue, options?: CommandOptions): Promise<'OK'> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)

    if (options?.ttl) {
      return this.client.setex(key, options.ttl, serialized) as Promise<'OK'>
    }
    return this.client.set(key, serialized) as Promise<'OK'>
  }

  /**
   * Get a value and optionally parse as JSON
   */
  async get<T = string>(key: string, parseJson = false): Promise<T | null> {
    const value = await this.client.get(key)

    if (value === null) return null

    if (parseJson) {
      try {
        return JSON.parse(value) as T
      } catch {
        return value as unknown as T
      }
    }

    return value as unknown as T
  }

  /**
   * Set value only if key doesn't exist
   */
  async setNX(key: string, value: JsonValue): Promise<boolean> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    const result = await this.client.setnx(key, serialized)
    return result === 1
  }

  /**
   * Set value with NX and EX options (atomic)
   */
  async setNXEX(key: string, value: JsonValue, ttl: number): Promise<boolean> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    const result = await this.client.set(key, serialized, 'EX', ttl, 'NX')
    return result === 'OK'
  }

  /**
   * Get multiple keys at once
   */
  async mget<T = string>(keys: string[], parseJson = false): Promise<(T | null)[]> {
    if (keys.length === 0) return []

    const values = await this.client.mget(...keys)

    return values.map(value => {
      if (value === null) return null

      if (parseJson) {
        try {
          return JSON.parse(value) as T
        } catch {
          return value as unknown as T
        }
      }

      return value as unknown as T
    })
  }

  /**
   * Set multiple keys at once
   */
  async mset(keyValues: Record<string, JsonValue>, options?: CommandOptions): Promise<'OK'> {
    const args: (string | number)[] = []

    for (const [key, value] of Object.entries(keyValues)) {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value)
      args.push(key, serialized)
    }

    if (options?.ttl) {
      const pipeline = this.client.pipeline()
      pipeline.mset(...args)

      for (const key of Object.keys(keyValues)) {
        pipeline.expire(key, options.ttl)
      }

      await pipeline.exec()
      return 'OK'
    }

    return this.client.mset(...args) as Promise<'OK'>
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    return this.client.incr(key)
  }

  /**
   * Decrement a counter
   */
  async decr(key: string): Promise<number> {
    return this.client.decr(key)
  }

  /**
   * Increment by float amount
   */
  async incrByFloat(key: string, increment: number): Promise<number> {
    return parseFloat((await this.client.incrbyfloat(key, increment)) as string)
  }

  // ============ HASH COMMANDS ============

  /**
   * Set hash field
   */
  async hset(key: string, field: string, value: JsonValue): Promise<number> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    return this.client.hset(key, field, serialized)
  }

  /**
   * Set multiple hash fields
   */
  async hmset(key: string, fields: Record<string, JsonValue>): Promise<'OK'> {
    const serializedFields: Record<string, string | number> = {}

    for (const [field, value] of Object.entries(fields)) {
      serializedFields[field] = typeof value === 'string' ? value : JSON.stringify(value)
    }

    return this.client.hmset(key, serializedFields) as Promise<'OK'>
  }

  /**
   * Get hash field
   */
  async hget<T = string>(key: string, field: string, parseJson = false): Promise<T | null> {
    const value = await this.client.hget(key, field)

    if (value === null) return null

    if (parseJson) {
      try {
        return JSON.parse(value) as T
      } catch {
        return value as unknown as T
      }
    }

    return value as unknown as T
  }

  /**
   * Get all hash fields
   */
  async hgetall<T = Record<string, unknown>>(key: string, parseJson = false): Promise<T | null> {
    const result = await this.client.hgetall(key)

    if (!result || Object.keys(result).length === 0) return null

    if (parseJson) {
      const parsed: Record<string, unknown> = {}

      for (const [field, value] of Object.entries(result)) {
        try {
          parsed[field] = JSON.parse(value)
        } catch {
          parsed[field] = value
        }
      }

      return parsed as T
    }

    return result as unknown as T
  }

  /**
   * Check if hash field exists
   */
  async hexists(key: string, field: string): Promise<boolean> {
    const result = await this.client.hexists(key, field)
    return result === 1
  }

  /**
   * Delete hash field
   */
  async hdel(key: string, ...fields: string[]): Promise<number> {
    return this.client.hdel(key, ...fields)
  }

  /**
   * Get hash length
   */
  async hlen(key: string): Promise<number> {
    return this.client.hlen(key)
  }

  /**
   * Get all hash keys
   */
  async hkeys(key: string): Promise<string[]> {
    return this.client.hkeys(key)
  }

  /**
   * Get all hash values
   */
  async hvals<T = string>(key: string, parseJson = false): Promise<T[]> {
    const values = await this.client.hvals(key)

    if (parseJson) {
      return values.map(v => {
        try {
          return JSON.parse(v) as T
        } catch {
          return v as unknown as T
        }
      })
    }

    return values as unknown as T[]
  }

  // ============ LIST COMMANDS ============

  /**
   * Push to list (right)
   */
  async rpush(key: string, ...values: JsonValue[]): Promise<number> {
    const serialized = values.map(v => (typeof v === 'string' ? v : JSON.stringify(v)))
    return this.client.rpush(key, ...serialized)
  }

  /**
   * Push to list (left)
   */
  async lpush(key: string, ...values: JsonValue[]): Promise<number> {
    const serialized = values.map(v => (typeof v === 'string' ? v : JSON.stringify(v)))
    return this.client.lpush(key, ...serialized)
  }

  /**
   * Pop from list (right)
   */
  async rpop<T = string>(key: string, parseJson = false): Promise<T | null> {
    const value = await this.client.rpop(key)

    if (value === null) return null

    if (parseJson) {
      try {
        return JSON.parse(value) as T
      } catch {
        return value as unknown as T
      }
    }

    return value as unknown as T
  }

  /**
   * Pop from list (left)
   */
  async lpop<T = string>(key: string, parseJson = false): Promise<T | null> {
    const value = await this.client.lpop(key)

    if (value === null) return null

    if (parseJson) {
      try {
        return JSON.parse(value) as T
      } catch {
        return value as unknown as T
      }
    }

    return value as unknown as T
  }

  /**
   * Get list range
   */
  async lrange<T = string>(
    key: string,
    start: number,
    stop: number,
    parseJson = false
  ): Promise<T[]> {
    const values = await this.client.lrange(key, start, stop)

    if (parseJson) {
      return values.map(v => {
        try {
          return JSON.parse(v) as T
        } catch {
          return v as unknown as T
        }
      })
    }

    return values as unknown as T[]
  }

  /**
   * Get list length
   */
  async llen(key: string): Promise<number> {
    return this.client.llen(key)
  }

  // ============ SET COMMANDS ============

  /**
   * Add to set
   */
  async sadd(key: string, ...members: (string | number)[]): Promise<number> {
    return this.client.sadd(key, ...members)
  }

  /**
   * Remove from set
   */
  async srem(key: string, ...members: (string | number)[]): Promise<number> {
    return this.client.srem(key, ...members)
  }

  /**
   * Get all set members
   */
  async smembers<T = string>(key: string): Promise<T[]> {
    const members = await this.client.smembers(key)
    return members as T[]
  }

  /**
   * Check if member exists in set
   */
  async sismember(key: string, member: string | number): Promise<boolean> {
    const result = await this.client.sismember(key, member)
    return result === 1
  }

  /**
   * Get set cardinality
   */
  async scard(key: string): Promise<number> {
    return this.client.scard(key)
  }

  // ============ SORTED SET COMMANDS ============

  /**
   * Add to sorted set with score
   */
  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.client.zadd(key, score, member)
  }

  /**
   * Add multiple to sorted set
   */
  async zaddMultiple(
    key: string,
    items: Array<{ score: number; member: string }>
  ): Promise<number> {
    const args: (string | number)[] = []

    for (const item of items) {
      args.push(item.score, item.member)
    }

    return this.client.zadd(key, ...args)
  }

  /**
   * Get sorted set range by rank
   */
  async zrange<T = string>(
    key: string,
    start: number,
    stop: number,
    withScores = false
  ): Promise<T[] | Array<{ member: T; score: number }>> {
    if (withScores) {
      const result = (await this.client.zrange(key, start, stop, 'WITHSCORES')) as string[]
      const items: Array<{ member: T; score: number }> = []

      for (let i = 0; i < result.length; i += 2) {
        items.push({
          member: result[i + 1] as T,
          score: parseFloat(result[i]),
        })
      }

      return items
    }

    return this.client.zrange(key, start, stop) as Promise<T[]>
  }

  /**
   * Get sorted set range by score
   */
  async zrangebyscore<T = string>(
    key: string,
    min: number | string,
    max: number | string,
    withScores = false
  ): Promise<T[] | Array<{ member: T; score: number }>> {
    if (withScores) {
      const result = (await this.client.zrangebyscore(key, min, max, 'WITHSCORES')) as string[]
      const items: Array<{ member: T; score: number }> = []

      for (let i = 0; i < result.length; i += 2) {
        items.push({
          member: result[i + 1] as T,
          score: parseFloat(result[i]),
        })
      }

      return items
    }

    return this.client.zrangebyscore(key, min, max) as Promise<T[]>
  }

  /**
   * Get member score
   */
  async zscore(key: string, member: string): Promise<number | null> {
    const result = await this.client.zscore(key, member)
    return result !== null ? parseFloat(result) : null
  }

  /**
   * Remove from sorted set by rank
   */
  async zremrangebyrank(key: string, start: number, stop: number): Promise<number> {
    return this.client.zremrangebyrank(key, start, stop)
  }

  // ============ KEY COMMANDS ============

  /**
   * Delete keys
   */
  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0
    return this.client.del(...keys)
  }

  /**
   * Check if key exists
   */
  async exists(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0
    return this.client.exists(...keys)
  }

  /**
   * Set key TTL
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.client.expire(key, seconds)
    return result === 1
  }

  /**
   * Get key TTL
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key)
  }

  /**
   * Get key type
   */
  async type(key: string): Promise<string> {
    return this.client.type(key)
  }

  /**
   * Rename key
   */
  async rename(key: string, newKey: string): Promise<'OK'> {
    return this.client.rename(key, newKey) as Promise<'OK'>
  }

  /**
   * Scan keys matching pattern
   */
  async scan(match: string, count = 100): Promise<string[]> {
    const keys: string[] = []
    let cursor = '0'

    do {
      const [newCursor, foundKeys] = await this.client.scan(cursor, 'MATCH', match, 'COUNT', count)
      cursor = newCursor
      keys.push(...foundKeys)
    } while (cursor !== '0')

    return keys
  }
}

// ============ PIPELINE MANAGER ============

export class PipelineManager {
  private client: RedisClient
  private stats: PipelineStats = { totalCommands: 0, executionTime: 0, errors: 0 }

  constructor(client?: RedisClient) {
    this.client = client || getConnectionManager().getClient()
  }

  /**
   * Create a new pipeline
   */
  createPipeline(): Pipeline {
    return this.client.pipeline() as Pipeline
  }

  /**
   * Execute pipeline and get results
   */
  async execute(pipeline: Pipeline): Promise<Array<[Error | null, unknown]>> {
    const start = Date.now()
    const results = await pipeline.exec()
    this.stats.executionTime += Date.now() - start
    this.stats.totalCommands += pipeline.length()
    this.stats.errors += results?.filter(([err]) => err !== null).length ?? 0

    if (results) {
      return results
    }

    return []
  }

  /**
   * Get pipeline statistics
   */
  getStats(): PipelineStats {
    return { ...this.stats }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = { totalCommands: 0, executionTime: 0, errors: 0 }
  }

  /**
   * Create a new pipeline with commands
   */
  async run<T>(commands: (pipeline: Pipeline) => void): Promise<T[]> {
    const pipeline = this.createPipeline()
    commands(pipeline)
    const results = await this.execute(pipeline)

    return results.map(([err, value]) => {
      if (err) throw err
      return value as T
    })
  }
}

// ============ COMMAND BATCH ============

export class CommandBatch {
  private items: BatchItem[] = []
  private client: RedisClient

  constructor(client?: RedisClient) {
    this.client = client || getConnectionManager().getClient()
  }

  /**
   * Add a command to the batch
   */
  add(command: string, args: (string | number)[] = []): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.items.push({ command, args, resolve, reject })
    })
  }

  /**
   * Execute all commands in the batch
   */
  async execute(): Promise<void> {
    if (this.items.length === 0) return

    const pipeline = this.client.pipeline()

    for (const item of this.items) {
      ;(pipeline as any)[item.command](...item.args)
    }

    const results = await pipeline.exec()

    if (results) {
      for (let i = 0; i < results.length; i++) {
        const [err, value] = results[i]
        if (err) {
          this.items[i].reject(err)
        } else {
          this.items[i].resolve(value)
        }
      }
    }

    this.items = []
  }
}

// ============ FLUENT API ============

export class FluentRedis {
  private commands: CommandsWrapper
  private pipelineManager: PipelineManager

  constructor(client?: RedisClient) {
    this.commands = new CommandsWrapper(client)
    this.pipelineManager = new PipelineManager(client)
  }

  get strings(): Pick<
    CommandsWrapper,
    'set' | 'get' | 'setNX' | 'setNXEX' | 'mget' | 'mset' | 'incr' | 'decr' | 'incrByFloat'
  > {
    return this.commands
  }

  get hashes(): Pick<
    CommandsWrapper,
    'hset' | 'hmset' | 'hget' | 'hgetall' | 'hexists' | 'hdel' | 'hlen' | 'hkeys' | 'hvals'
  > {
    return this.commands
  }

  get lists(): Pick<CommandsWrapper, 'rpush' | 'lpush' | 'rpop' | 'lpop' | 'lrange' | 'llen'> {
    return this.commands
  }

  get sets(): Pick<CommandsWrapper, 'sadd' | 'srem' | 'smembers' | 'sismember' | 'scard'> {
    return this.commands
  }

  get sortedSets(): Pick<
    CommandsWrapper,
    'zadd' | 'zaddMultiple' | 'zrange' | 'zrangebyscore' | 'zscore' | 'zremrangebyrank'
  > {
    return this.commands
  }

  get keys(): Pick<
    CommandsWrapper,
    'del' | 'exists' | 'expire' | 'ttl' | 'type' | 'rename' | 'scan'
  > {
    return this.commands
  }

  get pipeline(): PipelineManager {
    return this.pipelineManager
  }

  batch(): CommandBatch {
    return new CommandBatch()
  }
}

let fluentInstance: FluentRedis | null = null

export function getRedis(): FluentRedis {
  if (!fluentInstance) {
    fluentInstance = new FluentRedis()
  }
  return fluentInstance
}

export function createRedis(client?: RedisClient): FluentRedis {
  fluentInstance = new FluentRedis(client)
  return fluentInstance
}

export { CommandsWrapper }
export default FluentRedis
