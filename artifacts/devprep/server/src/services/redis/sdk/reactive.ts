/**
 * Redis SDK Reactive/Event System
 * @package @devprep/redis-sdk
 */

import { InMemoryRedis } from '../inmemory/client.js'
import { EventEmitter } from 'events'
import { getConnectionManager } from './connection.js'

export type ObservableEvent =
  | 'key:expired'
  | 'key:evicted'
  | 'key:deleted'
  | 'channel:message'
  | 'pattern:match'
  | 'stream:add'
  | 'stream:trim'
  | 'custom:*'

export interface StreamMessage<T = unknown> {
  id: string
  key: string
  data: T
  timestamp: number
}

export interface Subscription {
  id: string
  pattern: string
  channel: string
  handler: (message: unknown) => void
  active: boolean
}

export interface ReactiveOptions {
  enableKeyspaceNotifications?: boolean
  streamPrefix?: string
  maxStreamLength?: number
}

const DEFAULT_STREAM_LENGTH = 1000

class Observable extends EventEmitter {
  private client: InMemoryRedis
  private subscriptions: Map<string, Subscription> = new Map()
  private streamOptions: Map<string, { maxLength: number }> = new Map()
  private active = false

  constructor(client?: InMemoryRedis) {
    super()
    this.client = client || getConnectionManager().getClient()
  }

  async initialize(_options: ReactiveOptions = {}): Promise<void> {
    if (this.active) return
    this.active = true
  }

  subscribe(channel: string, handler: (message: unknown) => void): () => void {
    const id = `sub:${channel}:${Date.now()}`

    this.subscriptions.set(id, {
      id,
      pattern: '',
      channel,
      handler,
      active: true,
    })

    return () => {
      const sub = this.subscriptions.get(id)
      if (sub) {
        sub.active = false
        this.subscriptions.delete(id)
      }
    }
  }

  psubscribe(pattern: string, handler: (channel: string, message: string) => void): () => void {
    const id = `psub:${pattern}:${Date.now()}`

    this.subscriptions.set(id, {
      id,
      pattern,
      channel: '',
      handler: handler as (message: unknown) => void,
      active: true,
    })

    return () => {
      const sub = this.subscriptions.get(id)
      if (sub) {
        sub.active = false
        this.subscriptions.delete(id)
      }
    }
  }

  async publish(channel: string, message: unknown): Promise<number> {
    const serialized = typeof message === 'string' ? message : JSON.stringify(message)
    let count = 0

    for (const sub of this.subscriptions.values()) {
      if (sub.active) {
        if (sub.channel === channel) {
          sub.handler(serialized)
          count++
        } else if (sub.pattern && this.matchPattern(channel, sub.pattern)) {
          sub.handler({ channel, message: serialized })
          count++
        }
      }
    }

    this.emit('channel:message', { channel, message: serialized, timestamp: Date.now() })
    return count
  }

  private matchPattern(str: string, pattern: string): boolean {
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
    return new RegExp(`^${regexPattern}$`).test(str)
  }

  async streamAdd<T = unknown>(streamKey: string, data: Record<string, T>): Promise<string> {
    const args: (string | number)[] = []

    for (const [field, value] of Object.entries(data)) {
      args.push(field, typeof value === 'string' ? value : JSON.stringify(value))
    }

    const id = await this.client.xadd(streamKey, '*', ...args)

    this.emit('stream:add', { id, key: streamKey, data, timestamp: Date.now() })

    return id || ''
  }

  async streamRead<T = unknown>(
    streamKey: string,
    startId = '0',
    count = 10
  ): Promise<StreamMessage<T>[]> {
    const result = await this.client.xread('COUNT', count, 'STREAMS', streamKey, startId)

    if (!result || result.length === 0) return []

    const messages: StreamMessage<T>[] = []

    for (const [, streamEntries] of result) {
      for (const [id, fields] of streamEntries) {
        const data: Record<string, T> = {}

        for (let i = 0; i < fields.length; i += 2) {
          const key = fields[i]
          const value = fields[i + 1]

          try {
            data[key] = JSON.parse(value) as T
          } catch {
            data[key] = value as unknown as T
          }
        }

        messages.push({
          id,
          key: streamKey,
          data: Object.values(data)[0] as unknown as T,
          timestamp: parseInt(id.split('-')[0], 10),
        })
      }
    }

    return messages
  }

  async streamCreateGroup(streamKey: string, groupName: string, startId = '0'): Promise<boolean> {
    try {
      await this.client.xgroup('CREATE', streamKey, groupName, startId, 'MKSTREAM')
      return true
    } catch {
      return false
    }
  }

  async streamReadGroup<T = unknown>(
    streamKey: string,
    groupName: string,
    consumerName: string,
    count = 10,
    _block = 0
  ): Promise<StreamMessage<T>[]> {
    const streamId = '>'
    const result = await this.client.xreadgroup(
      'GROUP',
      groupName,
      consumerName,
      'COUNT',
      count,
      'STREAMS',
      streamKey,
      streamId
    )

    if (!result || result.length === 0) return []

    const messages: StreamMessage<T>[] = []

    for (const [, streamEntries] of result) {
      for (const [id, fields] of streamEntries) {
        const data: Record<string, T> = {}

        for (let i = 0; i < fields.length; i += 2) {
          const key = fields[i]
          const value = fields[i + 1]

          try {
            data[key] = JSON.parse(value) as T
          } catch {
            data[key] = value as unknown as T
          }
        }

        messages.push({
          id,
          key: streamKey,
          data: Object.values(data)[0] as unknown as T,
          timestamp: parseInt(id.split('-')[0], 10),
        })
      }
    }

    return messages
  }

  async streamAck(streamKey: string, groupName: string, ...messageIds: string[]): Promise<number> {
    return this.client.xack(streamKey, groupName, ...messageIds)
  }

  async streamInfo(streamKey: string): Promise<Record<string, unknown>> {
    const info = (await this.client.xinfo('STREAM', streamKey)) as [string, unknown][]
    const result: Record<string, unknown> = {}

    for (const [key, value] of info) {
      result[key] = value
    }

    return result
  }

  setStreamMaxLength(streamKey: string, maxLength: number): void {
    this.streamOptions.set(streamKey, { maxLength })
  }

  async streamPending(
    streamKey: string,
    groupName: string
  ): Promise<Array<{ id: string; consumer: string; idle: number; delivered: number }>> {
    const pending = (await this.client.xpending(streamKey, groupName)) as
      | [string, number, Array<[string, string, number]>]
      | null

    if (!pending || pending[1] === 0) return []

    const entries = pending[2]

    return entries.map((entry: [string, string, number]) => ({
      id: entry[0],
      consumer: entry[1],
      idle: entry[2],
      delivered: 0,
    }))
  }

  async streamClaim(
    streamKey: string,
    groupName: string,
    consumerName: string,
    minIdleTime: number,
    count = 10
  ): Promise<string[]> {
    const result = await this.client.xautoclaim(
      streamKey,
      groupName,
      consumerName,
      minIdleTime,
      '0-0',
      'COUNT',
      count
    )
    if (!result || !Array.isArray(result)) return []
    return (result[2] as string[]) || []
  }

  getSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values()).filter(s => s.active)
  }

  async unsubscribeAll(): Promise<void> {
    this.subscriptions.clear()
  }

  async destroy(): Promise<void> {
    await this.unsubscribeAll()
    this.active = false
    this.removeAllListeners()
  }
}

export interface Observer<T> {
  next?: (value: T) => void
  error?: (error: Error) => void
  complete?: () => void
}

export interface Subject<T> extends Observer<T> {
  subscribe: (observer: Observer<T>) => () => void
  unsubscribe: (observer: Observer<T>) => void
  observers: Observer<T>[]
}

export class ReactiveSubject<T> implements Subject<T> {
  observers: Observer<T>[] = []
  private completeFlag = false

  subscribe(observer: Observer<T>): () => void {
    this.observers.push(observer)

    return () => {
      this.unsubscribe(observer)
    }
  }

  unsubscribe(observer: Observer<T>): void {
    const index = this.observers.indexOf(observer)
    if (index > -1) {
      this.observers.splice(index, 1)
    }
  }

  next(value: T): void {
    for (const observer of this.observers) {
      observer.next?.(value)
    }
  }

  error(err: Error): void {
    for (const observer of this.observers) {
      observer.error?.(err)
    }
  }

  complete(): void {
    this.completeFlag = true
    for (const observer of this.observers) {
      observer.complete?.()
    }
  }

  isComplete(): boolean {
    return this.completeFlag
  }
}

export class BehaviorSubject<T> extends ReactiveSubject<T> {
  constructor(private currentValue: T) {
    super()
  }

  getValue(): T {
    return this.currentValue
  }

  next(value: T): void {
    this.currentValue = value
    super.next(value)
  }
}

export class ReplaySubject<T> extends ReactiveSubject<T> {
  private buffer: T[] = []
  private bufferSize: number

  constructor(bufferSize = Infinity) {
    super()
    this.bufferSize = bufferSize
  }

  subscribe(observer: Observer<T>): () => void {
    for (const value of this.buffer) {
      observer.next?.(value)
    }

    if (this.isComplete()) {
      observer.complete?.()
    }

    return super.subscribe(observer)
  }

  next(value: T): void {
    if (this.buffer.length >= this.bufferSize) {
      this.buffer.shift()
    }

    this.buffer.push(value)
    super.next(value)
  }
}

let observableInstance: Observable | null = null

export function getObservable(): Observable {
  if (!observableInstance) {
    observableInstance = new Observable()
  }
  return observableInstance
}

export function createObservable(client?: InMemoryRedis): Observable {
  observableInstance = new Observable(client)
  return observableInstance
}

export { Observable }
export default Observable
