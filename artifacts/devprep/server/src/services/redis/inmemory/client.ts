/**
 * In-Memory Redis Implementation
 *
 * A drop-in replacement for ioredis that stores all data in memory.
 * Provides the same API surface as ioredis for seamless migration.
 */

export interface InMemoryRedisOptions {
  keyPrefix?: string
  enableReadyCheck?: boolean
  lazyConnect?: boolean
  maxRetriesPerRequest?: number
}

type ValueType = string | number | Buffer | null

interface StringValue {
  type: 'string'
  value: string
  expiresAt?: number
}

interface ListValue {
  type: 'list'
  items: string[]
  expiresAt?: number
}

interface SetValue {
  type: 'set'
  members: Set<string>
  expiresAt?: number
}

interface HashValue {
  type: 'hash'
  fields: Map<string, string>
  expiresAt?: number
}

interface SortedSetValue {
  type: 'zset'
  members: Map<string, number>
  expiresAt?: number
}

interface StreamValue {
  type: 'stream'
  entries: Map<string, Map<string, string>>
  lastId: number
  expiresAt?: number
}

type DataValue = StringValue | ListValue | SetValue | HashValue | SortedSetValue | StreamValue

export class InMemoryRedis {
  private data: Map<string, DataValue> = new Map()
  private keyPrefix: string
  private ready: boolean = true
  private events: Map<string, Set<(...args: unknown[]) => void>> = new Map()

  isReady(): boolean {
    return this.ready
  }
  private subscriptions: Map<string, Set<(channel: string, message: string) => void>> = new Map()
  private patternSubscriptions: Map<string, Set<(channel: string, message: string) => void>> =
    new Map()
  private connected: boolean = true

  constructor(options: InMemoryRedisOptions = {}) {
    this.keyPrefix = options.keyPrefix || ''
    this.ready = true
    this.connected = true

    this.startExpiryCleanup()
  }

  private startExpiryCleanup(): void {
    setInterval(() => {
      const now = Date.now()
      for (const [key, value] of this.data.entries()) {
        if (value.expiresAt && value.expiresAt <= now) {
          this.data.delete(key)
        }
      }
    }, 1000)
  }

  private buildKey(key: string): string {
    return this.keyPrefix ? `${this.keyPrefix}${key}` : key
  }

  private getValue(key: string): DataValue | undefined {
    const fullKey = this.buildKey(key)
    return this.data.get(fullKey)
  }

  private setValue(key: string, value: DataValue): void {
    const fullKey = this.buildKey(key)
    this.data.set(fullKey, value)
  }

  private deleteKey(key: string): void {
    const fullKey = this.buildKey(key)
    this.data.delete(fullKey)
  }

  private checkExpiry(value: DataValue): boolean {
    if (value.expiresAt && value.expiresAt <= Date.now()) {
      return false
    }
    return true
  }

  private emit(event: string, ...args: unknown[]): void {
    const handlers = this.events.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(...args))
    }
  }

  on(event: string, handler: (...args: unknown[]) => void): this {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(handler)
    return this
  }

  off(event: string, handler: (...args: unknown[]) => void): this {
    const handlers = this.events.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
    return this
  }

  async connect(): Promise<void> {
    this.connected = true
    this.emit('connect')
    this.emit('ready')
  }

  async quit(): Promise<void> {
    this.connected = false
    this.ready = false
    this.emit('close')
  }

  async ping(): Promise<string> {
    return 'PONG'
  }

  async get(key: string): Promise<string | null> {
    const value = this.getValue(key)
    if (!value) return null
    if (value.type !== 'string') return null
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return null
    }
    return value.value
  }

  async set(key: string, value: ValueType, ...args: (string | number)[]): Promise<string | null> {
    const stringValue = value === null ? '' : String(value)

    let expiresAt: number | undefined
    let setnx = false
    let keepttl = false

    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (arg === 'EX' || arg === 'ex') {
        const seconds = Number(args[i + 1])
        expiresAt = Date.now() + seconds * 1000
        i++
      } else if (arg === 'PX' || arg === 'px') {
        const ms = Number(args[i + 1])
        expiresAt = Date.now() + ms
        i++
      } else if (arg === 'NX' || arg === 'nx') {
        setnx = true
      } else if (arg === 'KEEPTTL' || arg === 'keepttl') {
        keepttl = true
      }
    }

    if (setnx) {
      const existing = this.getValue(key)
      if (existing && this.checkExpiry(existing)) {
        return null
      }
    }

    this.setValue(key, { type: 'string', value: stringValue, expiresAt })
    return 'OK'
  }

  async setex(key: string, seconds: number, value: ValueType): Promise<string> {
    const stringValue = value === null ? '' : String(value)
    const expiresAt = Date.now() + seconds * 1000
    this.setValue(key, { type: 'string', value: stringValue, expiresAt })
    return 'OK'
  }

  async setnx(key: string, value: ValueType): Promise<number> {
    const existing = this.getValue(key)
    if (existing && this.checkExpiry(existing)) {
      return 0
    }
    const stringValue = value === null ? '' : String(value)
    this.setValue(key, { type: 'string', value: stringValue })
    return 1
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0
    for (const key of keys) {
      if (this.data.has(this.buildKey(key))) {
        this.deleteKey(key)
        count++
      }
    }
    return count
  }

  async exists(...keys: string[]): Promise<number> {
    let count = 0
    for (const key of keys) {
      const value = this.getValue(key)
      if (value && this.checkExpiry(value)) {
        count++
      }
    }
    return count
  }

  async expire(key: string, seconds: number): Promise<number> {
    const value = this.getValue(key)
    if (!value || !this.checkExpiry(value)) return 0
    value.expiresAt = Date.now() + seconds * 1000
    return 1
  }

  async pexpire(key: string, milliseconds: number): Promise<number> {
    return this.expire(key, Math.ceil(milliseconds / 1000))
  }

  async ttl(key: string): Promise<number> {
    const value = this.getValue(key)
    if (!value) return -2
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return -2
    }
    if (!value.expiresAt) return -1
    return Math.ceil((value.expiresAt - Date.now()) / 1000)
  }

  async pttl(key: string): Promise<number> {
    const value = this.getValue(key)
    if (!value) return -2
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return -2
    }
    if (!value.expiresAt) return -1
    return value.expiresAt - Date.now()
  }

  async incr(key: string): Promise<number> {
    const value = await this.get(key)
    const num = value ? parseInt(value, 10) : 0
    const newValue = num + 1
    await this.set(key, String(newValue))
    return newValue
  }

  async incrby(key: string, increment: number): Promise<number> {
    const value = await this.get(key)
    const num = value ? parseInt(value, 10) : 0
    const newValue = num + increment
    await this.set(key, String(newValue))
    return newValue
  }

  async incrbyfloat(key: string, increment: number): Promise<string> {
    const value = await this.get(key)
    const num = value ? parseFloat(value) : 0
    const newValue = num + increment
    const result = String(newValue)
    await this.set(key, result)
    return result
  }

  async decr(key: string): Promise<number> {
    const value = await this.get(key)
    const num = value ? parseInt(value, 10) : 0
    const newValue = num - 1
    await this.set(key, String(newValue))
    return newValue
  }

  async decrby(key: string, decrement: number): Promise<number> {
    return this.incrby(key, -decrement)
  }

  async mget(...keys: string[]): Promise<(string | null)[]> {
    return Promise.all(keys.map(key => this.get(key)))
  }

  async mset(...keyValues: (string | number)[]): Promise<string> {
    for (let i = 0; i < keyValues.length; i += 2) {
      const key = String(keyValues[i])
      const value = String(keyValues[i + 1])
      await this.set(key, value)
    }
    return 'OK'
  }

  async hget(key: string, field: string): Promise<string | null> {
    const value = this.getValue(key)
    if (!value || value.type !== 'hash') return null
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return null
    }
    return value.fields.get(field) || null
  }

  async hset(key: string, ...fieldValues: (string | number)[]): Promise<number> {
    let value = this.getValue(key)
    if (!value || value.type !== 'hash') {
      value = { type: 'hash', fields: new Map() }
    }
    if (!this.checkExpiry(value)) {
      value = { type: 'hash', fields: new Map() }
    }

    let count = 0
    for (let i = 0; i < fieldValues.length; i += 2) {
      const field = String(fieldValues[i])
      const fieldValue = String(fieldValues[i + 1])
      if (!value.fields.has(field)) count++
      value.fields.set(field, fieldValue)
    }
    this.setValue(key, value)
    return count
  }

  async hmset(key: string, data: Record<string, string | number>): Promise<string> {
    const entries: (string | number)[] = []
    for (const [field, value] of Object.entries(data)) {
      entries.push(field, value)
    }
    await this.hset(key, ...entries)
    return 'OK'
  }

  async hmget(key: string, ...fields: string[]): Promise<(string | null)[]> {
    return Promise.all(fields.map(field => this.hget(key, field)))
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const value = this.getValue(key)
    if (!value || value.type !== 'hash') return {}
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return {}
    }
    const result: Record<string, string> = {}
    value.fields.forEach((v, k) => {
      result[k] = v
    })
    return result
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    const value = this.getValue(key)
    if (!value || value.type !== 'hash') return 0
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return 0
    }
    let count = 0
    for (const field of fields) {
      if (value.fields.delete(field)) count++
    }
    return count
  }

  async hexists(key: string, field: string): Promise<number> {
    const value = await this.hget(key, field)
    return value !== null ? 1 : 0
  }

  async hlen(key: string): Promise<number> {
    const value = this.getValue(key)
    if (!value || value.type !== 'hash') return 0
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return 0
    }
    return value.fields.size
  }

  async hkeys(key: string): Promise<string[]> {
    const value = this.getValue(key)
    if (!value || value.type !== 'hash') return []
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return []
    }
    return Array.from(value.fields.keys())
  }

  async hvals(key: string): Promise<string[]> {
    const value = this.getValue(key)
    if (!value || value.type !== 'hash') return []
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return []
    }
    return Array.from(value.fields.values())
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    const current = await this.hget(key, field)
    const num = current ? parseInt(current, 10) : 0
    const newValue = num + increment
    await this.hset(key, field, String(newValue))
    return newValue
  }

  async sadd(key: string, ...members: (string | number)[]): Promise<number> {
    let value = this.getValue(key)
    if (!value || value.type !== 'set') {
      value = { type: 'set', members: new Set() }
    }
    if (!this.checkExpiry(value)) {
      value = { type: 'set', members: new Set() }
    }

    let count = 0
    for (const member of members) {
      if (!value.members.has(String(member))) {
        value.members.add(String(member))
        count++
      }
    }
    this.setValue(key, value)
    return count
  }

  async srem(key: string, ...members: (string | number)[]): Promise<number> {
    const value = this.getValue(key)
    if (!value || value.type !== 'set') return 0
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return 0
    }
    let count = 0
    for (const member of members) {
      if (value.members.delete(String(member))) count++
    }
    return count
  }

  async smembers(key: string): Promise<string[]> {
    const value = this.getValue(key)
    if (!value || value.type !== 'set') return []
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return []
    }
    return Array.from(value.members)
  }

  async sismember(key: string, member: string | number): Promise<number> {
    const value = this.getValue(key)
    if (!value || value.type !== 'set') return 0
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return 0
    }
    return value.members.has(String(member)) ? 1 : 0
  }

  async scard(key: string): Promise<number> {
    const value = this.getValue(key)
    if (!value || value.type !== 'set') return 0
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return 0
    }
    return value.members.size
  }

  async lpush(key: string, ...values: (string | number)[]): Promise<number> {
    let value = this.getValue(key)
    if (!value || value.type !== 'list') {
      value = { type: 'list', items: [] }
    }
    if (!this.checkExpiry(value)) {
      value = { type: 'list', items: [] }
    }
    const list = value as ListValue
    for (const v of values) {
      list.items.unshift(String(v))
    }
    this.setValue(key, value)
    return list.items.length
  }

  async rpush(key: string, ...values: (string | number)[]): Promise<number> {
    let value = this.getValue(key)
    if (!value || value.type !== 'list') {
      value = { type: 'list', items: [] }
    }
    if (!this.checkExpiry(value)) {
      value = { type: 'list', items: [] }
    }
    const list = value as ListValue
    for (const v of values) {
      list.items.push(String(v))
    }
    this.setValue(key, value)
    return list.items.length
  }

  async lpop(key: string): Promise<string | null> {
    const value = this.getValue(key)
    if (!value || value.type !== 'list') return null
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return null
    }
    const list = value as ListValue
    return list.items.shift() || null
  }

  async rpop(key: string): Promise<string | null> {
    const value = this.getValue(key)
    if (!value || value.type !== 'list') return null
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return null
    }
    const list = value as ListValue
    return list.items.pop() || null
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const value = this.getValue(key)
    if (!value || value.type !== 'list') return []
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return []
    }
    const list = value as ListValue
    const actualStop = stop === -1 ? list.items.length - 1 : stop
    return list.items.slice(start, actualStop + 1)
  }

  async llen(key: string): Promise<number> {
    const value = this.getValue(key)
    if (!value || value.type !== 'list') return 0
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return 0
    }
    const list = value as ListValue
    return list.items.length
  }

  async zadd(key: string, ...scoreMembers: (string | number)[]): Promise<number> {
    let value = this.getValue(key)
    if (!value || value.type !== 'zset') {
      value = { type: 'zset', members: new Map() }
    }
    if (!this.checkExpiry(value)) {
      value = { type: 'zset', members: new Map() }
    }

    let count = 0
    for (let i = 0; i < scoreMembers.length; i += 2) {
      const score = Number(scoreMembers[i])
      const member = String(scoreMembers[i + 1])
      if (!value.members.has(member)) count++
      value.members.set(member, score)
    }
    this.setValue(key, value)
    return count
  }

  async zscore(key: string, member: string): Promise<string | null> {
    const value = this.getValue(key)
    if (!value || value.type !== 'zset') return null
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return null
    }
    const score = value.members.get(member)
    return score !== undefined ? String(score) : null
  }

  async zrank(key: string, member: string): Promise<number | null> {
    const value = this.getValue(key)
    if (!value || value.type !== 'zset') return null
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return null
    }
    const score = value.members.get(member)
    if (score === undefined) return null

    const sorted = Array.from(value.members.entries()).sort((a, b) => a[1] - b[1])
    return sorted.findIndex(([m]) => m === member)
  }

  async zrevrank(key: string, member: string): Promise<number | null> {
    const value = this.getValue(key)
    if (!value || value.type !== 'zset') return null
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return null
    }
    const score = value.members.get(member)
    if (score === undefined) return null

    const sorted = Array.from(value.members.entries()).sort((a, b) => b[1] - a[1])
    return sorted.findIndex(([m]) => m === member)
  }

  async zcard(key: string): Promise<number> {
    const value = this.getValue(key)
    if (!value || value.type !== 'zset') return 0
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return 0
    }
    return value.members.size
  }

  async zrange(key: string, start: number, stop: number, ...options: string[]): Promise<string[]> {
    const value = this.getValue(key)
    if (!value || value.type !== 'zset') return []
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return []
    }

    const withScores = options.includes('WITHSCORES')
    const sorted = Array.from(value.members.entries()).sort((a, b) => a[1] - b[1])

    const actualStop = stop === -1 ? sorted.length - 1 : stop
    const slice = sorted.slice(start, actualStop + 1)

    if (withScores) {
      const result: string[] = []
      for (const [member, score] of slice) {
        result.push(member, String(score))
      }
      return result
    }

    return slice.map(([member]) => member)
  }

  async zrevrange(
    key: string,
    start: number,
    stop: number,
    ...options: string[]
  ): Promise<string[]> {
    const value = this.getValue(key)
    if (!value || value.type !== 'zset') return []
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return []
    }

    const withScores = options.includes('WITHSCORES')
    const sorted = Array.from(value.members.entries()).sort((a, b) => b[1] - a[1])

    const actualStop = stop === -1 ? sorted.length - 1 : stop
    const slice = sorted.slice(start, actualStop + 1)

    if (withScores) {
      const result: string[] = []
      for (const [member, score] of slice) {
        result.push(member, String(score))
      }
      return result
    }

    return slice.map(([member]) => member)
  }

  async zrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
    ...options: string[]
  ): Promise<string[]> {
    const value = this.getValue(key)
    if (!value || value.type !== 'zset') return []
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return []
    }

    const withScores = options.includes('WITHSCORES')
    const minScore = min === '-inf' ? -Infinity : Number(min)
    const maxScore = max === '+inf' ? Infinity : Number(max)

    const filtered = Array.from(value.members.entries())
      .filter(([_, score]) => score >= minScore && score <= maxScore)
      .sort((a, b) => a[1] - b[1])

    if (withScores) {
      const result: string[] = []
      for (const [member, score] of filtered) {
        result.push(String(score), member)
      }
      return result
    }

    return filtered.map(([member]) => member)
  }

  async zremrangebyscore(key: string, min: number | string, max: number | string): Promise<number> {
    const value = this.getValue(key)
    if (!value || value.type !== 'zset') return 0
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return 0
    }

    const minScore = min === '-inf' ? -Infinity : Number(min)
    const maxScore = max === '+inf' ? Infinity : Number(max)

    let count = 0
    for (const [member, score] of value.members) {
      if (score >= minScore && score <= maxScore) {
        value.members.delete(member)
        count++
      }
    }
    return count
  }

  async zremrangebyrank(key: string, start: number, stop: number): Promise<number> {
    const value = this.getValue(key)
    if (!value || value.type !== 'zset') return 0
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return 0
    }

    const sorted = Array.from(value.members.entries()).sort((a, b) => a[1] - b[1])
    const actualStop = stop === -1 ? sorted.length - 1 : stop

    const toRemove = sorted.slice(start, actualStop + 1)
    for (const [member] of toRemove) {
      value.members.delete(member)
    }
    return toRemove.length
  }

  async zcount(key: string, min: number | string, max: number | string): Promise<number> {
    const value = this.getValue(key)
    if (!value || value.type !== 'zset') return 0
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return 0
    }

    const minScore = min === '-inf' ? -Infinity : Number(min)
    const maxScore = max === '+inf' ? Infinity : Number(max)

    let count = 0
    for (const score of value.members.values()) {
      if (score >= minScore && score <= maxScore) count++
    }
    return count
  }

  async zincrby(key: string, increment: number, member: string): Promise<string> {
    const current = await this.zscore(key, member)
    const currentScore = current ? parseFloat(current) : 0
    const newScore = currentScore + increment
    await this.zadd(key, newScore, member)
    return String(newScore)
  }

  async zpopmin(key: string, count: number = 1): Promise<string[]> {
    const value = this.getValue(key)
    if (!value || value.type !== 'zset') return []
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return []
    }

    const sorted = Array.from(value.members.entries()).sort((a, b) => a[1] - b[1])
    const result: string[] = []

    for (let i = 0; i < Math.min(count, sorted.length); i++) {
      const [member, score] = sorted[i]
      result.push(member, String(score))
      value.members.delete(member)
    }

    return result
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    const value = this.getValue(key)
    if (!value || value.type !== 'zset') return 0
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return 0
    }

    let count = 0
    for (const member of members) {
      if (value.members.delete(member)) count++
    }
    return count
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = this.patternToRegex(pattern)
    const result: string[] = []

    for (const key of this.data.keys()) {
      if (regex.test(key)) {
        result.push(key)
      }
    }
    return result
  }

  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
    return new RegExp(`^${escaped}$`)
  }

  async type(key: string): Promise<string> {
    const value = this.getValue(key)
    if (!value) return 'none'
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return 'none'
    }
    return value.type
  }

  async ltrim(key: string, start: number, stop: number): Promise<string> {
    const value = this.getValue(key)
    if (!value || value.type !== 'list') return 'OK'
    if (!this.checkExpiry(value)) {
      this.deleteKey(key)
      return 'OK'
    }
    const list = value as ListValue
    if (list.items.length === 0) return 'OK'

    let actualStart = start < 0 ? list.items.length + start : start
    let actualStop = stop < 0 ? list.items.length + stop + 1 : stop + 1

    actualStart = Math.max(0, actualStart)
    actualStop = Math.min(list.items.length, actualStop)

    if (actualStart >= actualStop || actualStart >= list.items.length) {
      list.items = []
    } else {
      list.items = list.items.slice(actualStart, actualStop)
    }
    return 'OK'
  }

  async config(operation: string, ...args: (string | number)[]): Promise<string | null> {
    if (operation === 'GET' && args[0] === 'dir') {
      return 'dir /tmp'
    }
    if (operation === 'SET' && args[0] === 'notify-keyspace-events') {
      return 'OK'
    }
    return null
  }

  async bgsave(): Promise<string> {
    return 'Background saving started'
  }

  async bgrewriteaof(): Promise<string> {
    return 'Background append only file rewriting started'
  }

  async shutdown(notify?: string): Promise<void> {
    this.data.clear()
    this.connected = false
    this.ready = false
  }

  async rename(key: string, newKey: string): Promise<string> {
    const value = this.getValue(key)
    if (!value) {
      throw new Error('ERR no such key')
    }
    this.deleteKey(key)
    this.setValue(newKey, value)
    return 'OK'
  }

  async scan(cursor: string, ...args: (string | number)[]): Promise<[string, string[]]> {
    const match = args.indexOf('MATCH')
    const countIndex = args.indexOf('COUNT')
    const count = countIndex !== -1 ? Number(args[countIndex + 1]) : 10

    let pattern: RegExp | null = null
    if (match !== -1 && args[match + 1]) {
      pattern = this.patternToRegex(String(args[match + 1]))
    }

    const keys = Array.from(this.data.keys())
    let position = parseInt(cursor, 10)

    if (pattern) {
      const matched = keys.filter(k => pattern!.test(k))
      return [String(matched.length), matched.slice(position, position + count)]
    }

    return [String(keys.length), keys.slice(position, position + count)]
  }

  async info(section?: string): Promise<string> {
    const sections: string[] = []

    sections.push('# Server')
    sections.push(`redis_version:6.0.0`)
    sections.push(`process_id:${process.pid}`)
    sections.push(`uptime_in_seconds:${Math.floor(process.uptime())}`)

    sections.push('# Memory')
    sections.push(`used_memory:${JSON.stringify(this.data).length * 1000}`)
    sections.push(`used_memory_human:${(JSON.stringify(this.data).length / 1024).toFixed(2)}K`)
    sections.push(`maxmemory:0`)
    sections.push(`maxmemory_human:0B`)

    sections.push('# Clients')
    sections.push(`connected_clients:1`)

    sections.push('# Stats')
    sections.push(`total_commands_processed:0`)
    sections.push(`instantaneous_ops_per_sec:0`)

    return sections.join('\n')
  }

  async publish(channel: string, message: string): Promise<number> {
    let count = 0

    for (const [subChannel, handlers] of this.subscriptions) {
      if (subChannel === channel) {
        handlers.forEach(handler => {
          try {
            handler(channel, message)
            count++
          } catch {
            // Handler error
          }
        })
      }
    }

    for (const [pattern, handlers] of this.patternSubscriptions) {
      const regex = this.patternToRegex(pattern)
      if (regex.test(channel)) {
        handlers.forEach(handler => {
          try {
            handler(channel, message)
            count++
          } catch {
            // Handler error
          }
        })
      }
    }

    return count
  }

  async subscribe(channel: string): Promise<void> {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set())
    }
  }

  async psubscribe(pattern: string): Promise<void> {
    if (!this.patternSubscriptions.has(pattern)) {
      this.patternSubscriptions.set(pattern, new Set())
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    this.subscriptions.delete(channel)
  }

  async punsubscribe(pattern?: string): Promise<void> {
    if (pattern) {
      this.patternSubscriptions.delete(pattern)
    } else {
      this.patternSubscriptions.clear()
    }
  }

  duplicate(): InMemoryRedis {
    return new InMemoryRedis({ keyPrefix: this.keyPrefix })
  }

  xadd(key: string, id: string, ...entries: (string | number)[]): Promise<string> {
    let value = this.getValue(key)
    if (!value || value.type !== 'stream') {
      value = { type: 'stream', entries: new Map(), lastId: 0 }
    }

    const stream = value as StreamValue
    const entryId = id === '*' ? String(Date.now() + '-' + stream.entries.size) : id
    const entry = new Map<string, string>()

    for (let i = 0; i < entries.length; i += 2) {
      entry.set(String(entries[i]), String(entries[i + 1]))
    }

    stream.entries.set(entryId, entry)
    stream.lastId = parseInt(entryId.split('-')[0], 10)
    this.setValue(key, stream)

    return Promise.resolve(entryId)
  }

  xread(...args: (string | number | string[])[]): Promise<[string, [string, string[]][]][] | null> {
    return Promise.resolve(null)
  }

  xreadgroup(
    ...args: (string | number | string[])[]
  ): Promise<[string, [string, string[]][]][] | null> {
    return Promise.resolve(null)
  }

  xgroup(...args: (string | number)[]): Promise<string> {
    return Promise.resolve('OK')
  }

  xack(key: string, group: string, ...ids: string[]): Promise<number> {
    return Promise.resolve(ids.length)
  }

  xpending(key: string, group: string, ...args: (string | number)[]): Promise<unknown> {
    return Promise.resolve([])
  }

  xautoclaim(...args: (string | number)[]): Promise<unknown> {
    return Promise.resolve(null)
  }

  xdel(key: string, ...ids: string[]): Promise<number> {
    const value = this.getValue(key)
    if (!value || value.type !== 'stream') return Promise.resolve(0)

    const stream = value as StreamValue
    let count = 0
    for (const id of ids) {
      if (stream.entries.delete(String(id))) count++
    }
    return Promise.resolve(count)
  }

  xinfo(...args: (string | number)[]): Promise<unknown> {
    return Promise.resolve([])
  }

  xtrim(key: string, ...args: (string | number)[]): Promise<number> {
    return Promise.resolve(0)
  }

  script(...args: (string | number)[]): Promise<string> {
    if (args[0] === 'LOAD') {
      const sha = this.simpleHash(String(args[1]))
      return Promise.resolve(sha)
    }
    return Promise.resolve('')
  }

  evalsha(...args: (string | number)[]): Promise<unknown> {
    return Promise.resolve(null)
  }

  eval(script: string, numKeys: number, ...args: (string | number)[]): Promise<unknown> {
    return Promise.resolve(null)
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i)
      hash = hash & hash
    }
    return Math.abs(hash).toString(16)
  }

  pipeline(): Pipeline {
    return new Pipeline(this)
  }

  multi(): Pipeline {
    return new Pipeline(this)
  }

  watch(...keys: string[]): this {
    return this
  }

  unwatch(): this {
    return this
  }
}

export class Pipeline {
  private client: InMemoryRedis
  private commands: Array<{ command: string; args: unknown[] }> = []

  constructor(client: InMemoryRedis) {
    this.client = client
  }

  get(key: string): this {
    this.commands.push({ command: 'get', args: [key] })
    return this
  }

  set(...args: (string | number)[]): this {
    this.commands.push({ command: 'set', args })
    return this
  }

  setex(key: string, seconds: number, value: string | number): this {
    this.commands.push({ command: 'setex', args: [key, seconds, value] })
    return this
  }

  del(...keys: string[]): this {
    this.commands.push({ command: 'del', args: keys })
    return this
  }

  exists(...keys: string[]): this {
    this.commands.push({ command: 'exists', args: keys })
    return this
  }

  expire(key: string, seconds: number): this {
    this.commands.push({ command: 'expire', args: [key, seconds] })
    return this
  }

  pexpire(key: string, milliseconds: number): this {
    this.commands.push({ command: 'pexpire', args: [key, milliseconds] })
    return this
  }

  hset(key: string, ...fieldValues: (string | number)[]): this {
    this.commands.push({ command: 'hset', args: [key, ...fieldValues] })
    return this
  }

  hdel(key: string, ...fields: string[]): this {
    this.commands.push({ command: 'hdel', args: [key, ...fields] })
    return this
  }

  hget(key: string, field: string): this {
    this.commands.push({ command: 'hget', args: [key, field] })
    return this
  }

  hlen(key: string): this {
    this.commands.push({ command: 'hlen', args: [key] })
    return this
  }

  sadd(key: string, ...members: (string | number)[]): this {
    this.commands.push({ command: 'sadd', args: [key, ...members] })
    return this
  }

  srem(key: string, ...members: (string | number)[]): this {
    this.commands.push({ command: 'srem', args: [key, ...members] })
    return this
  }

  lpush(key: string, ...values: (string | number)[]): this {
    this.commands.push({ command: 'lpush', args: [key, ...values] })
    return this
  }

  rpush(key: string, ...values: (string | number)[]): this {
    this.commands.push({ command: 'rpush', args: [key, ...values] })
    return this
  }

  lpop(key: string): this {
    this.commands.push({ command: 'lpop', args: [key] })
    return this
  }

  rpop(key: string): this {
    this.commands.push({ command: 'rpop', args: [key] })
    return this
  }

  lrange(key: string, start: number, stop: number): this {
    this.commands.push({ command: 'lrange', args: [key, start, stop] })
    return this
  }

  llen(key: string): this {
    this.commands.push({ command: 'llen', args: [key] })
    return this
  }

  ltrim(key: string, start: number, stop: number): this {
    this.commands.push({ command: 'ltrim', args: [key, start, stop] })
    return this
  }

  zadd(key: string, ...scoreMembers: (string | number)[]): this {
    this.commands.push({ command: 'zadd', args: [key, ...scoreMembers] })
    return this
  }

  zrem(key: string, ...members: string[]): this {
    this.commands.push({ command: 'zrem', args: [key, ...members] })
    return this
  }

  zscore(key: string, member: string): this {
    this.commands.push({ command: 'zscore', args: [key, member] })
    return this
  }

  zrank(key: string, member: string): this {
    this.commands.push({ command: 'zrank', args: [key, member] })
    return this
  }

  zrevrank(key: string, member: string): this {
    this.commands.push({ command: 'zrevrank', args: [key, member] })
    return this
  }

  zcard(key: string): this {
    this.commands.push({ command: 'zcard', args: [key] })
    return this
  }

  zrange(key: string, start: number, stop: number, ...options: string[]): this {
    this.commands.push({ command: 'zrange', args: [key, start, stop, ...options] })
    return this
  }

  zrevrange(key: string, start: number, stop: number, ...options: string[]): this {
    this.commands.push({ command: 'zrevrange', args: [key, start, stop, ...options] })
    return this
  }

  zrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
    ...options: string[]
  ): this {
    this.commands.push({ command: 'zrangebyscore', args: [key, min, max, ...options] })
    return this
  }

  zremrangebyscore(key: string, min: number | string, max: number | string): this {
    this.commands.push({ command: 'zremrangebyscore', args: [key, min, max] })
    return this
  }

  zremrangebyrank(key: string, start: number, stop: number): this {
    this.commands.push({ command: 'zremrangebyrank', args: [key, start, stop] })
    return this
  }

  zcount(key: string, min: number | string, max: number | string): this {
    this.commands.push({ command: 'zcount', args: [key, min, max] })
    return this
  }

  zincrby(key: string, increment: number, member: string): this {
    this.commands.push({ command: 'zincrby', args: [key, increment, member] })
    return this
  }

  zpopmin(key: string, count: number = 1): this {
    this.commands.push({ command: 'zpopmin', args: [key, count] })
    return this
  }

  zpopmax(key: string, count: number = 1): this {
    this.commands.push({ command: 'zpopmax', args: [key, count] })
    return this
  }

  mget(...keys: string[]): this {
    this.commands.push({ command: 'mget', args: keys })
    return this
  }

  mset(...keyValues: (string | number)[]): this {
    this.commands.push({ command: 'mset', args: keyValues })
    return this
  }

  incr(key: string): this {
    this.commands.push({ command: 'incr', args: [key] })
    return this
  }

  incrby(key: string, increment: number): this {
    this.commands.push({ command: 'incrby', args: [key, increment] })
    return this
  }

  decr(key: string): this {
    this.commands.push({ command: 'decr', args: [key] })
    return this
  }

  decrby(key: string, decrement: number): this {
    this.commands.push({ command: 'decrby', args: [key, decrement] })
    return this
  }

  incrbyfloat(key: string, increment: number): this {
    this.commands.push({ command: 'incrbyfloat', args: [key, increment] })
    return this
  }

  hmget(key: string, ...fields: string[]): this {
    this.commands.push({ command: 'hmget', args: [key, ...fields] })
    return this
  }

  hmset(key: string, data: Record<string, string | number>): this {
    this.commands.push({ command: 'hmset', args: [key, data] })
    return this
  }

  hincrby(key: string, field: string, increment: number): this {
    this.commands.push({ command: 'hincrby', args: [key, field, increment] })
    return this
  }

  hexists(key: string, field: string): this {
    this.commands.push({ command: 'hexists', args: [key, field] })
    return this
  }

  hkeys(key: string): this {
    this.commands.push({ command: 'hkeys', args: [key] })
    return this
  }

  hvals(key: string): this {
    this.commands.push({ command: 'hvals', args: [key] })
    return this
  }

  hgetall(key: string): this {
    this.commands.push({ command: 'hgetall', args: [key] })
    return this
  }

  smembers(key: string): this {
    this.commands.push({ command: 'smembers', args: [key] })
    return this
  }

  sismember(key: string, member: string | number): this {
    this.commands.push({ command: 'sismember', args: [key, member] })
    return this
  }

  scard(key: string): this {
    this.commands.push({ command: 'scard', args: [key] })
    return this
  }

  ttl(key: string): this {
    this.commands.push({ command: 'ttl', args: [key] })
    return this
  }

  watch(...keys: string[]): this {
    return this
  }

  unwatch(): this {
    return this
  }

  async exec(): Promise<[Error | null, unknown][]> {
    const results: [Error | null, unknown][] = []

    for (const { command, args } of this.commands) {
      try {
        const cmd = command as keyof InMemoryRedis
        const result = await (this.client[cmd] as (...args: unknown[]) => unknown).call(
          this.client,
          ...args
        )
        results.push([null, result])
      } catch (error) {
        results.push([error as Error, null])
      }
    }

    return results
  }

  length(): number {
    return this.commands.length
  }
}

export default InMemoryRedis
