import { EventEmitter } from 'events'

export interface StreamEntry {
  id: string
  fields: Record<string, string>
  firstDelivery?: number
  deliveryCount?: number
}

export interface ConsumerGroup {
  name: string
  consumers: Map<string, Consumer>
  lastDeliveredId: string
  pending: Map<string, PendingEntry>
  pel: Map<string, string>
}

export interface Consumer {
  name: string
  pending: number
  idle: number
  lastActive: number
}

export interface PendingEntry {
  id: string
  consumer: string
  idle: number
  deliveryTime: number
  deliveryCount: number
}

export interface StreamInfo {
  length: number
  radixTreeNodes: number
  groups: number
  firstEntry: StreamEntry | null
  lastEntry: StreamEntry | null
  maxEntryId: string
  minEntryId: string
}

export interface StreamReadOptions {
  count?: number
  block?: number
}

export interface StreamReadResult {
  stream: string
  entries: StreamEntry[]
}

export interface StreamPendingResult {
  name: string
  pelem: string
  lastDeliveryId: string
  consumers: Consumer[]
}

export class RedisStream extends EventEmitter {
  private entries: Map<string, StreamEntry> = new Map()
  private groups: Map<string, ConsumerGroup> = new Map()
  private idCounter: number = 0
  private maxStreamSize: number = 0

  constructor(maxSize: number = 0) {
    super()
    this.maxStreamSize = maxSize
  }

  async xadd(id: string | '*', fields: Record<string, string>): Promise<string> {
    let entryId: string

    if (id === '*') {
      entryId = this.generateEntryId()
    } else {
      if (!this.isValidEntryId(id)) {
        throw new Error('ERR Invalid entry ID')
      }
      if (this.entries.has(id) && id > this.getLastEntryId()) {
        throw new Error('ERR ID is greater than current maximum entry ID')
      }
      entryId = id
    }

    const entry: StreamEntry = {
      id: entryId,
      fields: { ...fields },
      firstDelivery: Date.now(),
      deliveryCount: 0,
    }

    this.entries.set(entryId, entry)
    this.trim()
    this.emit('entry-added', entryId, fields)

    return entryId
  }

  async xread(
    options: StreamReadOptions,
    ...streams: string[]
  ): Promise<StreamReadResult[] | null> {
    const { count = 1000, block = 0 } = options

    if (streams.length % 2 !== 0) {
      throw new Error('ERR XREAD needs an even number of arguments')
    }

    const results: StreamReadResult[] = []

    for (let i = 0; i < streams.length; i += 2) {
      const streamId = streams[i + 1]
      const entries: StreamEntry[] = []

      for (const [id, entry] of this.entries) {
        if (streamId === '$') {
          continue
        }
        if (id > streamId) {
          entries.push(entry)
          if (entries.length >= count) break
        }
      }

      if (entries.length > 0) {
        results.push({
          stream: streams[i],
          entries,
        })
      }
    }

    if (results.length === 0 && block > 0) {
      return new Promise(resolve => {
        const timeout = setTimeout(() => {
          this.removeListener('entry-added', handler)
          resolve(null)
        }, block)
        const handler = (entryId: string) => {
          const entry = this.entries.get(entryId)
          if (entry) {
            clearTimeout(timeout)
            this.removeListener('entry-added', handler)
            resolve([{ stream: '', entries: [entry] }])
          }
        }
        this.on('entry-added', handler)
      })
    }

    return results.length > 0 ? results : null
  }

  async xreadgroup(
    groupName: string,
    consumerName: string,
    options: StreamReadOptions,
    ...streams: string[]
  ): Promise<StreamReadResult[] | null> {
    const { count = 1000, block = 0 } = options

    if (streams.length % 2 !== 0) {
      throw new Error('ERR XREADGROUP needs an even number of arguments')
    }

    let group = this.groups.get(groupName)
    if (!group) {
      group = {
        name: groupName,
        consumers: new Map(),
        lastDeliveredId: '0-0',
        pending: new Map(),
        pel: new Map(),
      }
      this.groups.set(groupName, group)
    }

    let consumer = group.consumers.get(consumerName)
    if (!consumer) {
      consumer = {
        name: consumerName,
        pending: 0,
        idle: Date.now(),
        lastActive: Date.now(),
      }
      group.consumers.set(consumerName, consumer)
    }

    const results: StreamReadResult[] = []

    for (let i = 0; i < streams.length; i += 2) {
      const streamId = streams[i + 1]
      const entries: StreamEntry[] = []

      for (const [id, entry] of this.entries) {
        if (streamId === '>') {
          if (!group.pel.has(id)) {
            entries.push(entry)
            if (entries.length >= count) break
          }
        } else if (id > streamId && !group.pel.has(id)) {
          entries.push(entry)
          if (entries.length >= count) break
        }
      }

      for (const entry of entries) {
        group.pel.set(entry.id, consumerName)
        consumer.pending++
        group.pending.set(entry.id, {
          id: entry.id,
          consumer: consumerName,
          idle: Date.now() - (entry.firstDelivery || Date.now()),
          deliveryTime: Date.now(),
          deliveryCount: (entry.deliveryCount || 0) + 1,
        })
        entry.firstDelivery = Date.now()
        entry.deliveryCount = (entry.deliveryCount || 0) + 1
      }

      if (entries.length > 0) {
        results.push({
          stream: streams[i],
          entries,
        })
      }
    }

    if (results.length === 0 && block > 0) {
      return new Promise(resolve => {
        const timeout = setTimeout(() => {
          this.removeListener('entry-added', handler)
          resolve(null)
        }, block)
        const handler = (entryId: string) => {
          const entry = this.entries.get(entryId)
          if (entry && !group!.pel.has(entryId)) {
            clearTimeout(timeout)
            this.removeListener('entry-added', handler)
            resolve([{ stream: '', entries: [entry] }])
          }
        }
        this.on('entry-added', handler)
      })
    }

    return results.length > 0 ? results : null
  }

  async xgroupCreate(name: string, id: string = '$', mkstream: boolean = false): Promise<string> {
    if (mkstream && this.entries.size === 0) {
      return 'OK'
    }

    const group: ConsumerGroup = {
      name,
      consumers: new Map(),
      lastDeliveredId: id,
      pending: new Map(),
      pel: new Map(),
    }

    this.groups.set(name, group)
    this.emit('group-created', name, id)

    return 'OK'
  }

  async xgroupSetid(name: string, id: string): Promise<string> {
    const group = this.groups.get(name)
    if (!group) {
      throw new Error('BUSYGROUP Consumer Group name does not exist')
    }
    group.lastDeliveredId = id
    return 'OK'
  }

  async xgroupDestroy(stream: string, group: string): Promise<number> {
    if (this.groups.delete(group)) {
      return 1
    }
    return 0
  }

  async xgroupDelconsumer(stream: string, group: string, consumer: string): Promise<number> {
    const consumerGroup = this.groups.get(group)
    if (!consumerGroup) {
      return 0
    }

    const consumerData = consumerGroup.consumers.get(consumer)
    if (!consumerData) {
      return 0
    }

    let pendingRemoved = 0
    for (const [entryId, pending] of consumerGroup.pending) {
      if (pending.consumer === consumer) {
        pendingRemoved++
      }
    }

    consumerGroup.consumers.delete(consumer)
    return pendingRemoved
  }

  async xack(stream: string, group: string, ...ids: string[]): Promise<number> {
    const consumerGroup = this.groups.get(group)
    if (!consumerGroup) {
      return 0
    }

    let acked = 0
    for (const id of ids) {
      if (consumerGroup.pending.has(id)) {
        consumerGroup.pending.delete(id)
        consumerGroup.pel.delete(id)

        const consumer = consumerGroup.pel.get(id)
        if (consumer) {
          const consumerData = consumerGroup.consumers.get(consumer)
          if (consumerData) {
            consumerData.pending = Math.max(0, consumerData.pending - 1)
          }
        }

        acked++
      }
    }

    return acked
  }

  async xpending(
    stream: string,
    group: string,
    ...args: (string | number)[]
  ): Promise<PendingEntry[] | StreamPendingResult> {
    const consumerGroup = this.groups.get(group)
    if (!consumerGroup) {
      return []
    }

    let start = '-'
    let end = '+'
    let count = 1000
    let consumer: string | undefined

    if (args.length >= 2) {
      start = String(args[0])
      end = String(args[1])
    }
    if (args.length >= 3) {
      count = Number(args[2])
    }
    if (args.length >= 4) {
      consumer = String(args[3])
    }

    if (start === '-' && end === '+' && !consumer) {
      return {
        name: group,
        pelem: consumerGroup.lastDeliveredId,
        lastDeliveryId: consumerGroup.lastDeliveredId,
        consumers: Array.from(consumerGroup.consumers.values()),
      }
    }

    const pending: PendingEntry[] = []
    for (const [id, pendingEntry] of consumerGroup.pending) {
      if (id >= start && id <= end) {
        if (!consumer || pendingEntry.consumer === consumer) {
          pending.push(pendingEntry)
          if (pending.length >= count) break
        }
      }
    }

    return pending
  }

  async xclaim(
    stream: string,
    group: string,
    consumer: string,
    minIdleTime: number,
    ...ids: string[]
  ): Promise<StreamEntry[]> {
    const consumerGroup = this.groups.get(group)
    if (!consumerGroup) {
      throw new Error('BUSYGROUP Consumer Group name does not exist')
    }

    const now = Date.now()
    const entries: StreamEntry[] = []

    for (const id of ids) {
      const pending = consumerGroup.pending.get(id)
      if (!pending) continue

      const idleTime = now - pending.deliveryTime
      if (idleTime < minIdleTime) continue

      const entry = this.entries.get(id)
      if (!entry) continue

      const oldConsumer = pending.consumer
      if (oldConsumer !== consumer) {
        const oldConsumerData = consumerGroup.consumers.get(oldConsumer)
        if (oldConsumerData) {
          oldConsumerData.pending = Math.max(0, oldConsumerData.pending - 1)
        }

        let newConsumer = consumerGroup.consumers.get(consumer)
        if (!newConsumer) {
          newConsumer = {
            name: consumer,
            pending: 0,
            idle: now,
            lastActive: now,
          }
          consumerGroup.consumers.set(consumer, newConsumer)
        }
        newConsumer.pending++
        newConsumer.lastActive = now
      }

      pending.consumer = consumer
      pending.deliveryTime = now
      pending.deliveryCount++
      consumerGroup.pel.set(id, consumer)

      entries.push(entry)
    }

    return entries
  }

  async xautoclaim(
    stream: string,
    group: string,
    consumer: string,
    minIdleTime: number,
    start: string,
    count: number = 100
  ): Promise<[string, StreamEntry[]]> {
    const consumerGroup = this.groups.get(group)
    if (!consumerGroup) {
      throw new Error('BUSYGROUP Consumer Group name does not exist')
    }

    const now = Date.now()
    const entries: StreamEntry[] = []
    let lastId = start

    for (const [id, pending] of consumerGroup.pending) {
      if (id < start) continue

      const idleTime = now - pending.deliveryTime
      if (idleTime < minIdleTime) {
        if (entries.length === 0) {
          lastId = id
        }
        continue
      }

      const entry = this.entries.get(id)
      if (!entry) continue

      const oldConsumer = pending.consumer
      if (oldConsumer !== consumer) {
        const oldConsumerData = consumerGroup.consumers.get(oldConsumer)
        if (oldConsumerData) {
          oldConsumerData.pending = Math.max(0, oldConsumerData.pending - 1)
        }

        let newConsumer = consumerGroup.consumers.get(consumer)
        if (!newConsumer) {
          newConsumer = {
            name: consumer,
            pending: 0,
            idle: now,
            lastActive: now,
          }
          consumerGroup.consumers.set(consumer, newConsumer)
        }
        newConsumer.pending++
        newConsumer.lastActive = now
      }

      pending.consumer = consumer
      pending.deliveryTime = now
      pending.deliveryCount++
      consumerGroup.pel.set(id, consumer)

      entries.push(entry)
      lastId = id

      if (entries.length >= count) break
    }

    return [lastId, entries]
  }

  async xrange(start: string, end: string, count?: number): Promise<StreamEntry[]> {
    const result: StreamEntry[] = []
    for (const [id, entry] of this.entries) {
      if (id >= start && id <= end) {
        result.push(entry)
        if (count && result.length >= count) break
      }
    }
    return result
  }

  async xrevrange(start: string, end: string, count?: number): Promise<StreamEntry[]> {
    const result: StreamEntry[] = []
    const sorted = [...this.entries.entries()].sort((a, b) => b[0].localeCompare(a[0]))

    for (const [id, entry] of sorted) {
      if (id >= start && id <= end) {
        result.push(entry)
        if (count && result.length >= count) break
      }
    }
    return result
  }

  async xlen(): Promise<number> {
    return this.entries.size
  }

  async xreadBlock(blockMs: number, ...streams: string[]): Promise<StreamReadResult[] | null> {
    return this.xread({ count: 1000, block: blockMs }, ...streams)
  }

  async xreadgroupBlock(
    blockMs: number,
    groupName: string,
    consumerName: string,
    ...streams: string[]
  ): Promise<StreamReadResult[] | null> {
    return this.xreadgroup(groupName, consumerName, { count: 1000, block: blockMs }, ...streams)
  }

  async xdel(...ids: string[]): Promise<number> {
    let deleted = 0
    for (const id of ids) {
      if (this.entries.delete(id)) {
        deleted++
        for (const group of this.groups.values()) {
          group.pending.delete(id)
          group.pel.delete(id)
        }
      }
    }
    return deleted
  }

  async xtrim(maxLen: number, approximate: boolean = true): Promise<number> {
    const oldSize = this.entries.size
    const targetSize = maxLen

    if (approximate) {
      const ratio = oldSize / targetSize
      if (ratio <= 1.1) {
        return 0
      }
    }

    const sorted = [...this.entries.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    let removed = 0

    while (this.entries.size > targetSize) {
      const [oldestId] = sorted[removed]
      this.entries.delete(oldestId)
      for (const group of this.groups.values()) {
        group.pending.delete(oldestId)
        group.pel.delete(oldestId)
      }
      removed++
    }

    return removed
  }

  async xinfoStream(): Promise<StreamInfo> {
    const sorted = [...this.entries.entries()].sort((a, b) => a[0].localeCompare(b[0]))

    return {
      length: this.entries.size,
      radixTreeNodes: 1,
      groups: this.groups.size,
      firstEntry: sorted[0]?.[1] || null,
      lastEntry: sorted[sorted.length - 1]?.[1] || null,
      maxEntryId: sorted[sorted.length - 1]?.[0] || '0-0',
      minEntryId: sorted[0]?.[0] || '0-0',
    }
  }

  async xinfoGroups(): Promise<ConsumerGroup[]> {
    return Array.from(this.groups.values())
  }

  async xinfoConsumers(group: string): Promise<Consumer[]> {
    const consumerGroup = this.groups.get(group)
    if (!consumerGroup) {
      return []
    }
    return Array.from(consumerGroup.consumers.values())
  }

  private generateEntryId(): string {
    const now = Date.now()
    this.idCounter++
    return `${now}-${this.idCounter}`
  }

  private isValidEntryId(id: string): boolean {
    return /^\d+-\d+$/.test(id)
  }

  private getLastEntryId(): string {
    let lastId = '0-0'
    for (const id of this.entries.keys()) {
      if (id > lastId) {
        lastId = id
      }
    }
    return lastId
  }

  private trim(): void {
    if (this.maxStreamSize > 0 && this.entries.size > this.maxStreamSize) {
      const sorted = [...this.entries.entries()].sort((a, b) => a[0].localeCompare(b[0]))
      const toRemove = this.entries.size - this.maxStreamSize

      for (let i = 0; i < toRemove; i++) {
        const [oldestId] = sorted[i]
        this.entries.delete(oldestId)
        for (const group of this.groups.values()) {
          group.pending.delete(oldestId)
          group.pel.delete(oldestId)
        }
      }
    }
  }

  setMaxStreamSize(maxSize: number): void {
    this.maxStreamSize = maxSize
    this.trim()
  }

  getMaxStreamSize(): number {
    return this.maxStreamSize
  }

  reset(): void {
    this.entries.clear()
    this.groups.clear()
    this.idCounter = 0
    this.removeAllListeners()
  }
}

export class StreamManager {
  private streams: Map<string, RedisStream> = new Map()

  createStream(name: string, maxSize: number = 0): RedisStream {
    if (this.streams.has(name)) {
      return this.streams.get(name)!
    }
    const stream = new RedisStream(maxSize)
    this.streams.set(name, stream)
    return stream
  }

  getStream(name: string): RedisStream | undefined {
    return this.streams.get(name)
  }

  deleteStream(name: string): boolean {
    const stream = this.streams.get(name)
    if (stream) {
      stream.reset()
      return this.streams.delete(name)
    }
    return false
  }

  getStreamNames(): string[] {
    return Array.from(this.streams.keys())
  }

  getStreamCount(): number {
    return this.streams.size
  }

  reset(): void {
    this.streams.forEach(stream => stream.reset())
    this.streams.clear()
  }
}

export default RedisStream
