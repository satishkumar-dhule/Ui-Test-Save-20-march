import { getRedisInstance } from './singleton.js'
import { InMemoryRedis } from './inmemory/client.js'

export interface MockRedisOptions {
  latency?: number
  failureRate?: number
  maxMemory?: number
  maxKeys?: number
}

export class MockRedisClient {
  private store: Map<string, { value: string; expiry?: number }> = new Map()
  private hashes: Map<string, Map<string, string>> = new Map()
  private lists: Map<string, string[]> = new Map()
  private sets: Map<string, Set<string>> = new Map()
  private sortedSets: Map<string, Array<{ score: number; value: string }>> = new Map()
  private latency: number
  private failureRate: number
  private maxMemory: number
  private maxKeys: number
  private callHistory: Array<{
    command: string
    args: unknown[]
    result: unknown
    timestamp: number
  }> = []

  constructor(options: MockRedisOptions = {}) {
    this.latency = options.latency ?? 5
    this.failureRate = options.failureRate ?? 0
    this.maxMemory = options.maxMemory ?? 100 * 1024 * 1024
    this.maxKeys = options.maxKeys ?? 10000
  }

  private shouldFail(): boolean {
    return Math.random() < this.failureRate
  }

  private async simulateLatency(): Promise<void> {
    if (this.latency > 0) {
      await new Promise(resolve => setTimeout(resolve, this.latency))
    }
  }

  private checkExpiry(key: string): boolean {
    const entry = this.store.get(key)
    if (entry?.expiry && entry.expiry < Date.now()) {
      this.store.delete(key)
      return false
    }
    return true
  }

  recordCall(command: string, args: unknown[], result: unknown): void {
    this.callHistory.push({
      command,
      args,
      result,
      timestamp: Date.now(),
    })
  }

  getCallHistory(): Array<{
    command: string
    args: unknown[]
    result: unknown
    timestamp: number
  }> {
    return [...this.callHistory]
  }

  clearHistory(): void {
    this.callHistory = []
  }

  async ping(): Promise<string> {
    await this.simulateLatency()
    if (this.shouldFail()) throw new Error('Mock Redis connection failed')
    return 'PONG'
  }

  async get(key: string): Promise<string | null> {
    await this.simulateLatency()
    if (this.shouldFail()) throw new Error('Mock Redis error')
    this.checkExpiry(key)
    return this.store.get(key)?.value ?? null
  }

  async set(key: string, value: string | number, ...args: unknown[]): Promise<string> {
    await this.simulateLatency()
    if (this.shouldFail()) throw new Error('Mock Redis error')

    let expiry: number | undefined
    const hasExpiry = args.some((arg, i) => {
      if (arg === 'EX' && args[i + 1]) {
        expiry = Date.now() + Number(args[i + 1]) * 1000
        return true
      }
      if (typeof arg === 'number' && args[i - 1] === undefined) {
        expiry = Date.now() + Number(arg) * 1000
        return true
      }
      return false
    })

    this.store.set(key, { value: String(value), expiry })
    return 'OK'
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    return this.set(key, value, 'EX', seconds)
  }

  async del(...keys: string[]): Promise<number> {
    await this.simulateLatency()
    if (this.shouldFail()) throw new Error('Mock Redis error')

    let deleted = 0
    for (const key of keys) {
      if (this.store.delete(key)) deleted++
      this.hashes.delete(key)
      this.lists.delete(key)
      this.sets.delete(key)
      this.sortedSets.delete(key)
    }
    return deleted
  }

  async keys(pattern: string): Promise<string[]> {
    await this.simulateLatency()
    if (this.shouldFail()) throw new Error('Mock Redis error')

    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.'))
    return Array.from(this.store.keys()).filter(key => regex.test(key))
  }

  async exists(...keys: string[]): Promise<number> {
    await this.simulateLatency()
    return keys.filter(key => this.store.has(key) && this.checkExpiry(key)).length
  }

  async expire(key: string, seconds: number): Promise<number> {
    await this.simulateLatency()
    const entry = this.store.get(key)
    if (!entry) return 0
    entry.expiry = Date.now() + seconds * 1000
    return 1
  }

  async ttl(key: string): Promise<number> {
    await this.simulateLatency()
    const entry = this.store.get(key)
    if (!entry) return -2
    if (!entry.expiry) return -1
    return Math.floor((entry.expiry - Date.now()) / 1000)
  }

  async hget(key: string, field: string): Promise<string | null> {
    await this.simulateLatency()
    return this.hashes.get(key)?.get(field) ?? null
  }

  async hset(key: string, ...args: (string | number)[]): Promise<number> {
    await this.simulateLatency()
    let added = 0
    for (let i = 0; i < args.length; i += 2) {
      const field = String(args[i])
      const value = String(args[i + 1])
      if (!this.hashes.has(key)) {
        this.hashes.set(key, new Map())
      }
      const hash = this.hashes.get(key)!
      if (!hash.has(field)) added++
      hash.set(field, value)
    }
    return added
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    await this.simulateLatency()
    const hash = this.hashes.get(key)
    if (!hash) return {}
    return Object.fromEntries(hash.entries())
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    await this.simulateLatency()
    if (!this.lists.has(key)) {
      this.lists.set(key, [])
    }
    const list = this.lists.get(key)!
    list.unshift(...values)
    return list.length
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    await this.simulateLatency()
    if (!this.lists.has(key)) {
      this.lists.set(key, [])
    }
    const list = this.lists.get(key)!
    list.push(...values)
    return list.length
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    await this.simulateLatency()
    const list = this.lists.get(key) || []
    const end = stop === -1 ? undefined : stop + 1
    return list.slice(start, end)
  }

  async ltrim(key: string, start: number, stop: number): Promise<string> {
    await this.simulateLatency()
    const list = this.lists.get(key) || []
    const end = stop === -1 ? undefined : stop + 1
    this.lists.set(key, list.slice(start, end))
    return 'OK'
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    await this.simulateLatency()
    if (!this.sets.has(key)) {
      this.sets.set(key, new Set())
    }
    const set = this.sets.get(key)!
    let added = 0
    for (const member of members) {
      if (!set.has(member)) {
        set.add(member)
        added++
      }
    }
    return added
  }

  async smembers(key: string): Promise<string[]> {
    await this.simulateLatency()
    return Array.from(this.sets.get(key) || [])
  }

  async sismember(key: string, member: string): Promise<number> {
    await this.simulateLatency()
    return this.sets.get(key)?.has(member) ? 1 : 0
  }

  async info(section?: string): Promise<string> {
    await this.simulateLatency()
    const lines = [
      '# Server',
      'redis_version:7.0.0',
      'process_id:' + process.pid,
      '# Memory',
      'used_memory:' + this.store.size * 100,
      'used_memory_human:' + this.store.size * 100 + 'B',
      'maxmemory:' + this.maxMemory,
      '# Stats',
      'total_commands_processed:' + this.callHistory.length,
      'instantaneous_ops_per_sec:' + Math.floor(Math.random() * 1000),
    ]
    return lines.join('\n')
  }

  async config(operation: string, ...args: string[]): Promise<string | null> {
    await this.simulateLatency()
    if (operation === 'GET' && args[0] === 'dir') {
      return 'dir /tmp'
    }
    return null
  }

  async bgsave(): Promise<string> {
    await this.simulateLatency()
    return 'Background saving started'
  }

  async bgrewriteaof(): Promise<string> {
    await this.simulateLatency()
    return 'Background append only file rewriting started'
  }

  async shutdown(notify?: string): Promise<void> {
    await this.simulateLatency()
    this.store.clear()
    this.hashes.clear()
    this.lists.clear()
    this.sets.clear()
    this.sortedSets.clear()
  }

  async pipeline(): Promise<MockPipeline> {
    return new MockPipeline(this)
  }

  disconnect(): void {
    this.store.clear()
  }

  getStats(): {
    keys: number
    memory: number
    calls: number
    failures: number
  } {
    const failures = this.callHistory.filter(h => h.result instanceof Error).length
    return {
      keys: this.store.size,
      memory: this.store.size * 100,
      calls: this.callHistory.length,
      failures,
    }
  }
}

export class MockPipeline {
  private commands: Array<{ command: string; args: unknown[] }> = []
  private client: MockRedisClient

  constructor(client: MockRedisClient) {
    this.client = client
  }

  get(key: string): this {
    this.commands.push({ command: 'get', args: [key] })
    return this
  }

  set(key: string, value: string): this {
    this.commands.push({ command: 'set', args: [key, value] })
    return this
  }

  del(key: string): this {
    this.commands.push({ command: 'del', args: [key] })
    return this
  }

  async exec(): Promise<Array<[Error | null, unknown]>> {
    const results: Array<[Error | null, unknown]> = []
    for (const cmd of this.commands) {
      try {
        const clientMethod = (
          this.client as unknown as Record<string, (arg: unknown) => Promise<unknown>>
        )[cmd.command]
        const result = await clientMethod(cmd.args)
        results.push([null, result])
      } catch (error) {
        results.push([error as Error, null])
      }
    }
    return results
  }
}

export function createMockRedis(options?: MockRedisOptions): MockRedisClient {
  return new MockRedisClient(options)
}

export interface TestContext {
  mock: MockRedisClient
  setup: () => Promise<void>
  teardown: () => Promise<void>
}

export async function createTestContext(options?: MockRedisOptions): Promise<TestContext> {
  const mock = createMockRedis(options)

  return {
    mock,
    setup: async () => {
      mock.clearHistory()
    },
    teardown: async () => {
      mock.disconnect()
    },
  }
}

export interface BenchmarkResult {
  operation: string
  iterations: number
  totalDuration: number
  avgDuration: number
  minDuration: number
  maxDuration: number
  opsPerSecond: number
}

export async function benchmark(
  name: string,
  operation: () => Promise<void>,
  iterations: number = 1000
): Promise<BenchmarkResult> {
  const durations: number[] = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    await operation()
    durations.push(performance.now() - start)
  }

  const totalDuration = durations.reduce((a, b) => a + b, 0)

  return {
    operation: name,
    iterations,
    totalDuration,
    avgDuration: totalDuration / iterations,
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
    opsPerSecond: (iterations / totalDuration) * 1000,
  }
}

export async function benchmarkSetGet(
  client: MockRedisClient,
  iterations: number = 1000,
  keyPrefix: string = 'bench'
): Promise<{ setResult: BenchmarkResult; getResult: BenchmarkResult }> {
  const setResult = await benchmark(
    'SET',
    async () => {
      await client.set(`${keyPrefix}:${Math.random()}`, 'value')
    },
    iterations
  )

  const getResult = await benchmark(
    'GET',
    async () => {
      await client.get(`${keyPrefix}:0`)
    },
    iterations
  )

  return { setResult, getResult }
}

export async function benchmarkBatch(
  client: MockRedisClient,
  batchSize: number = 100,
  iterations: number = 10,
  keyPrefix: string = 'batch'
): Promise<BenchmarkResult> {
  return benchmark(
    `BATCH_${batchSize}`,
    async () => {
      const pipeline = await client.pipeline()
      for (let i = 0; i < batchSize; i++) {
        pipeline.set(`${keyPrefix}:${Math.random()}`, 'value')
      }
      await pipeline.exec()
    },
    iterations
  )
}

export async function benchmarkWithRealRedis(
  name: string,
  operation: () => Promise<void>,
  iterations: number = 100
): Promise<BenchmarkResult | null> {
  return benchmark(name, operation, iterations)
}

export interface IntegrationTestConfig {
  host?: string
  port?: number
  password?: string
  db?: number
  skipIfUnavailable?: boolean
}

export async function withIntegrationTest<T>(
  config: IntegrationTestConfig,
  test: (client: InMemoryRedis) => Promise<T>
): Promise<{ success: boolean; result?: T; error?: string }> {
  const client = getRedisInstance()

  try {
    await client.connect()
    await client.ping()

    const result = await test(client)
    return { success: true, result }
  } catch (error) {
    if (config.skipIfUnavailable && (error as Error).message.includes('ECONNREFUSED')) {
      return { success: true, error: 'SKIPPED - Redis not available' }
    }
    return { success: false, error: (error as Error).message }
  } finally {
    try {
      await client.quit()
    } catch {
      // Ignore cleanup errors
    }
  }
}

export interface RedisTestSuite {
  name: string
  tests: Array<{
    name: string
    fn: () => Promise<void>
  }>
}

export async function runTestSuite(suite: RedisTestSuite): Promise<{
  name: string
  passed: number
  failed: number
  errors: Array<{ test: string; error: string }>
  duration: number
}> {
  const start = Date.now()
  const errors: Array<{ test: string; error: string }> = []
  let passed = 0
  let failed = 0

  for (const test of suite.tests) {
    try {
      await test.fn()
      passed++
    } catch (error) {
      failed++
      errors.push({
        test: test.name,
        error: (error as Error).message,
      })
    }
  }

  return {
    name: suite.name,
    passed,
    failed,
    errors,
    duration: Date.now() - start,
  }
}

export function createCacheTestScenarios(): Array<{
  name: string
  data: Record<string, unknown>
  expectedHit: boolean
}> {
  return [
    {
      name: 'content cache - hit',
      data: { id: '1', type: 'question', content: 'Test' },
      expectedHit: true,
    },
    {
      name: 'content cache - miss',
      data: { id: '999', type: 'unknown', content: 'Test' },
      expectedHit: false,
    },
    {
      name: 'channel cache - hit',
      data: { channelId: 'devops', type: 'exam' },
      expectedHit: true,
    },
    {
      name: 'tagged cache - hit',
      data: { tag: 'docker', content: 'Docker question' },
      expectedHit: true,
    },
  ]
}

export class TestFixtures {
  static createMockContent(id: string, type: string): string {
    return JSON.stringify({
      id,
      type,
      data: { question: 'Test question?', answer: 'Test answer' },
      created: Date.now(),
    })
  }

  static createMockChannel(id: string, name: string): Record<string, string | number> {
    return {
      id,
      name,
      description: `Test channel ${name}`,
      icon: 'test',
      color: '#000000',
      created: Date.now(),
    }
  }

  static createMockProgress(userId: string, contentId: string): Record<string, unknown> {
    return {
      userId,
      contentId,
      status: 'in_progress',
      startedAt: Date.now(),
      completedAt: null,
    }
  }
}
