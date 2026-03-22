import { getRedisClient, isRedisAvailable } from './singleton.js'

const CACHE_PREFIX = process.env.CACHE_PREFIX || 'devprep:'

interface BloomFilterOptions {
  name: string
  expectedElements?: number
  falsePositiveRate?: number
}

interface BloomFilterStats {
  name: string
  size: number
  expectedElements: number
  insertedElements: number
  falsePositiveRate: number
  bitArraySize: number
  hashFunctions: number
}

class BloomFilter {
  private name: string
  private expectedElements: number
  private falsePositiveRate: number
  private bitArraySize: number
  private hashCount: number
  private key: string

  constructor(options: BloomFilterOptions) {
    this.name = options.name
    this.expectedElements = options.expectedElements || 1000
    this.falsePositiveRate = options.falsePositiveRate || 0.01
    this.key = `${CACHE_PREFIX}bloom:${this.name}`

    this.bitArraySize = this.calculateBitArraySize()
    this.hashCount = this.calculateHashCount()
  }

  private calculateBitArraySize(): number {
    const m =
      (-1 * (this.expectedElements * Math.log(this.falsePositiveRate))) / Math.pow(Math.log(2), 2)
    return Math.ceil(m)
  }

  private calculateHashCount(): number {
    return Math.ceil((this.bitArraySize / this.expectedElements) * Math.log(2))
  }

  private async getBitArray(): Promise<Set<number>> {
    if (!isRedisAvailable()) return new Set()
    const client = getRedisClient()
    if (!client) return new Set()

    try {
      const data = await client.get(`${this.key}:bits`)
      if (data) {
        return new Set(JSON.parse(data) as number[])
      }
    } catch (error) {
      console.warn('[BloomFilter] Error getting bit array:', (error as Error).message)
    }
    return new Set()
  }

  private async setBitArray(bits: Set<number>): Promise<void> {
    if (!isRedisAvailable()) return
    const client = getRedisClient()
    if (!client) return

    try {
      await client.set(`${this.key}:bits`, JSON.stringify([...bits]))
      await client.set(
        `${this.key}:meta`,
        JSON.stringify({
          inserted: this.expectedElements,
          expected: this.expectedElements,
          fpr: this.falsePositiveRate,
        })
      )
    } catch (error) {
      console.warn('[BloomFilter] Error setting bit array:', (error as Error).message)
    }
  }

  private hash1(value: string): number {
    let hash = 5381
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) + hash + value.charCodeAt(i)
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  private hash2(value: string): number {
    let hash = 0
    for (let i = 0; i < value.length; i++) {
      hash = hash * 31 + value.charCodeAt(i)
    }
    return Math.abs(hash)
  }

  private getHashes(value: string): number[] {
    const h1 = this.hash1(value)
    const h2 = this.hash2(value)
    const hashes: number[] = []

    for (let i = 0; i < this.hashCount; i++) {
      hashes.push((h1 + i * h2) % this.bitArraySize)
    }

    return hashes
  }

  async add(value: string): Promise<void> {
    const bits = await this.getBitArray()
    const hashes = this.getHashes(value)

    for (const bit of hashes) {
      bits.add(bit)
    }

    await this.setBitArray(bits)

    if (isRedisAvailable()) {
      const client = getRedisClient()
      if (client) {
        await client.incr(`${this.key}:count`)
      }
    }
  }

  async addMany(values: string[]): Promise<void> {
    const bits = await this.getBitArray()
    let addedCount = 0

    for (const value of values) {
      const hashes = this.getHashes(value)
      let isNew = false

      for (const bit of hashes) {
        if (!bits.has(bit)) {
          bits.add(bit)
          isNew = true
        }
      }

      if (isNew) addedCount++
    }

    await this.setBitArray(bits)

    if (isRedisAvailable()) {
      const client = getRedisClient()
      if (client) {
        await client.incrby(`${this.key}:count`, addedCount)
      }
    }
  }

  async mightContain(value: string): Promise<boolean> {
    const bits = await this.getBitArray()
    const hashes = this.getHashes(value)

    for (const bit of hashes) {
      if (!bits.has(bit)) {
        return false
      }
    }

    return true
  }

  async mightContainBatch(values: string[]): Promise<Map<string, boolean>> {
    const bits = await this.getBitArray()
    const results = new Map<string, boolean>()

    for (const value of values) {
      let contains = true
      const hashes = this.getHashes(value)

      for (const bit of hashes) {
        if (!bits.has(bit)) {
          contains = false
          break
        }
      }

      results.set(value, contains)
    }

    return results
  }

  async getStats(): Promise<BloomFilterStats> {
    let insertedElements = 0

    if (isRedisAvailable()) {
      const client = getRedisClient()
      if (client) {
        const count = await client.get(`${this.key}:count`)
        insertedElements = count ? parseInt(count, 10) : 0
      }
    }

    return {
      name: this.name,
      size: this.bitArraySize,
      expectedElements: this.expectedElements,
      insertedElements,
      falsePositiveRate: this.falsePositiveRate,
      bitArraySize: this.bitArraySize,
      hashFunctions: this.hashCount,
    }
  }

  async reset(): Promise<void> {
    if (!isRedisAvailable()) return
    const client = getRedisClient()
    if (!client) return

    try {
      await client.del(`${this.key}:bits`, `${this.key}:count`, `${this.key}:meta`)
    } catch (error) {
      console.warn('[BloomFilter] Error resetting:', (error as Error).message)
    }
  }

  async delete(): Promise<void> {
    await this.reset()
  }
}

interface ScalableBloomFilterOptions {
  name: string
  initialCapacity?: number
  errorRate?: number
  scaleThreshold?: number
}

class ScalableBloomFilter {
  private name: string
  private filters: BloomFilter[]
  private currentScale: number
  private initialCapacity: number
  private errorRate: number
  private scaleThreshold: number
  private key: string

  constructor(options: ScalableBloomFilterOptions) {
    this.name = options.name
    this.initialCapacity = options.initialCapacity || 1000
    this.errorRate = options.errorRate || 0.01
    this.scaleThreshold = options.scaleThreshold || 0.8
    this.filters = []
    this.currentScale = 0
    this.key = `${CACHE_PREFIX}sbloom:${this.name}`

    this.addNewFilter()
  }

  private addNewFilter(): void {
    const filter = new BloomFilter({
      name: `${this.name}-scale-${this.currentScale}`,
      expectedElements: this.initialCapacity * Math.pow(2, this.currentScale),
      falsePositiveRate: this.errorRate / 2,
    })
    this.filters.push(filter)
  }

  async add(value: string): Promise<void> {
    await this.filters[this.currentScale].add(value)

    const stats = await this.filters[this.currentScale].getStats()
    if (stats.insertedElements / stats.expectedElements > this.scaleThreshold) {
      this.currentScale++
      this.addNewFilter()
    }
  }

  async mightContain(value: string): Promise<boolean> {
    for (const filter of this.filters) {
      if (await filter.mightContain(value)) {
        return true
      }
    }
    return false
  }

  async getStats(): Promise<BloomFilterStats[]> {
    return Promise.all(this.filters.map(f => f.getStats()))
  }

  async reset(): Promise<void> {
    for (const filter of this.filters) {
      await filter.reset()
    }
    this.filters = []
    this.currentScale = 0
    this.addNewFilter()
  }
}

interface CountingBloomFilterOptions {
  name: string
  expectedElements?: number
  falsePositiveRate?: number
}

class CountingBloomFilter {
  private name: string
  private expectedElements: number
  private falsePositiveRate: number
  private bitArraySize: number
  private hashCount: number
  private key: string

  constructor(options: CountingBloomFilterOptions) {
    this.name = options.name
    this.expectedElements = options.expectedElements || 1000
    this.falsePositiveRate = options.falsePositiveRate || 0.01
    this.key = `${CACHE_PREFIX}cbloom:${this.name}`

    this.bitArraySize = Math.ceil(
      (-1 * (this.expectedElements * Math.log(this.falsePositiveRate))) / Math.pow(Math.log(2), 2)
    )
    this.hashCount = Math.ceil((this.bitArraySize / this.expectedElements) * Math.log(2))
  }

  private hash1(value: string): number {
    let hash = 5381
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) + hash + value.charCodeAt(i)
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  private hash2(value: string): number {
    let hash = 0
    for (let i = 0; i < value.length; i++) {
      hash = hash * 31 + value.charCodeAt(i)
    }
    return Math.abs(hash)
  }

  private getHashes(value: string): number[] {
    const h1 = this.hash1(value)
    const h2 = this.hash2(value)
    const hashes: number[] = []

    for (let i = 0; i < this.hashCount; i++) {
      hashes.push((h1 + i * h2) % this.bitArraySize)
    }

    return hashes
  }

  async add(value: string): Promise<void> {
    if (!isRedisAvailable()) return
    const client = getRedisClient()
    if (!client) return

    const hashes = this.getHashes(value)

    try {
      const pipeline = client.pipeline()
      for (const bit of hashes) {
        pipeline.hincrby(`${this.key}:counters`, bit.toString(), 1)
      }
      pipeline.hincrby(`${this.key}:meta`, 'inserted', 1)
      await pipeline.exec()
    } catch (error) {
      console.warn('[CountingBloomFilter] Error adding:', (error as Error).message)
    }
  }

  async remove(value: string): Promise<void> {
    if (!isRedisAvailable()) return
    const client = getRedisClient()
    if (!client) return

    const hashes = this.getHashes(value)

    try {
      const pipeline = client.pipeline()
      for (const bit of hashes) {
        pipeline.hincrby(`${this.key}:counters`, bit.toString(), -1)
      }
      await pipeline.exec()
    } catch (error) {
      console.warn('[CountingBloomFilter] Error removing:', (error as Error).message)
    }
  }

  async mightContain(value: string): Promise<boolean> {
    if (!isRedisAvailable()) return false
    const client = getRedisClient()
    if (!client) return false

    const hashes = this.getHashes(value)

    try {
      const counts = await client.hmget(`${this.key}:counters`, ...hashes.map(h => h.toString()))
      return counts.every(count => count !== null && parseInt(count, 10) > 0)
    } catch (error) {
      console.warn('[CountingBloomFilter] Error checking:', (error as Error).message)
      return false
    }
  }

  async getCount(value: string): Promise<number> {
    if (!isRedisAvailable()) return 0
    const client = getRedisClient()
    if (!client) return 0

    const hashes = this.getHashes(value)

    try {
      const counts = await client.hmget(`${this.key}:counters`, ...hashes.map(h => h.toString()))
      return Math.min(...counts.map(c => (c ? parseInt(c, 10) : 0)))
    } catch (error) {
      console.warn('[CountingBloomFilter] Error getting count:', (error as Error).message)
      return 0
    }
  }

  async reset(): Promise<void> {
    if (!isRedisAvailable()) return
    const client = getRedisClient()
    if (!client) return

    try {
      await client.del(`${this.key}:counters`, `${this.key}:meta`)
    } catch (error) {
      console.warn('[CountingBloomFilter] Error resetting:', (error as Error).message)
    }
  }
}

function createBloomFilter(options: BloomFilterOptions): BloomFilter {
  return new BloomFilter(options)
}

function createScalableBloomFilter(options: ScalableBloomFilterOptions): ScalableBloomFilter {
  return new ScalableBloomFilter(options)
}

function createCountingBloomFilter(options: CountingBloomFilterOptions): CountingBloomFilter {
  return new CountingBloomFilter(options)
}

const ContentExistenceFilter = createBloomFilter({
  name: 'content-existence',
  expectedElements: 10000,
  falsePositiveRate: 0.001,
})

const UserActivityFilter = createScalableBloomFilter({
  name: 'user-activity',
  initialCapacity: 1000,
  errorRate: 0.01,
})

export {
  BloomFilter,
  ScalableBloomFilter,
  CountingBloomFilter,
  type BloomFilterOptions,
  type BloomFilterStats,
  type ScalableBloomFilterOptions,
  type CountingBloomFilterOptions,
  createBloomFilter,
  createScalableBloomFilter,
  createCountingBloomFilter,
  ContentExistenceFilter,
  UserActivityFilter,
}
