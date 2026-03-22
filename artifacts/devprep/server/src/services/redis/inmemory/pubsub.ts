import { EventEmitter } from 'events'

export interface PubSubChannel {
  name: string
  subscribers: Set<(message: string) => void>
}

export interface PubSubPattern {
  pattern: string
  regex: RegExp
  callbacks: Set<(message: string, channel: string) => void>
}

export interface PubSubMessage {
  type: 'message' | 'pmessage'
  channel: string
  pattern?: string
  message: string
}

export interface SubscriptionCounts {
  channels: number
  patterns: number
  total: number
}

export class PubSub extends EventEmitter {
  private channels: Map<string, Set<(message: string) => void>> = new Map()
  private patterns: Map<
    string,
    { regex: RegExp; callbacks: Set<(message: string, channel: string) => void> }
  > = new Map()
  private messageHistory: PubSubMessage[] = []
  private maxHistorySize: number = 1000

  constructor() {
    super()
  }

  subscribe(channel: string, callback: (message: string) => void): void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set())
    }
    this.channels.get(channel)!.add(callback)
    this.emit('subscribe', channel, this.getSubscriptionCounts())
  }

  unsubscribe(channel: string, callback?: (message: string) => void): void {
    const subscribers = this.channels.get(channel)
    if (!subscribers) return

    if (callback) {
      subscribers.delete(callback)
      if (subscribers.size === 0) {
        this.channels.delete(channel)
      }
    } else {
      this.channels.delete(channel)
    }
    this.emit('unsubscribe', channel, this.getSubscriptionCounts())
  }

  psubscribe(pattern: string, callback: (message: string, channel: string) => void): void {
    if (!this.patterns.has(pattern)) {
      const regex = this.patternToRegex(pattern)
      this.patterns.set(pattern, { regex, callbacks: new Set() })
    }
    this.patterns.get(pattern)!.callbacks.add(callback)
    this.emit('psubscribe', pattern, this.getSubscriptionCounts())
  }

  punsubscribe(pattern?: string, callback?: (message: string, channel: string) => void): void {
    if (pattern) {
      const psub = this.patterns.get(pattern)
      if (psub) {
        if (callback) {
          psub.callbacks.delete(callback)
          if (psub.callbacks.size === 0) {
            this.patterns.delete(pattern)
          }
        } else {
          this.patterns.delete(pattern)
        }
      }
      this.emit('punsubscribe', pattern, this.getSubscriptionCounts())
    } else {
      this.patterns.clear()
      this.emit('punsubscribe', null, this.getSubscriptionCounts())
    }
  }

  publish(channel: string, message: string): number {
    let delivered = 0

    const directSubscribers = this.channels.get(channel)
    if (directSubscribers) {
      directSubscribers.forEach(callback => {
        try {
          callback(message)
          delivered++
        } catch (error) {
          this.emit('error', error)
        }
      })
    }

    this.patterns.forEach(({ regex, callbacks }) => {
      if (regex.test(channel)) {
        callbacks.forEach(callback => {
          try {
            callback(message, channel)
            delivered++
          } catch (error) {
            this.emit('error', error)
          }
        })
      }
    })

    const pubsubMessage: PubSubMessage = {
      type: 'message',
      channel,
      message,
    }
    this.addToHistory(pubsubMessage)
    this.emit('message', channel, message)

    return delivered
  }

  ppublish(channel: string, message: string, pattern?: string): number {
    let delivered = 0

    this.patterns.forEach(({ regex, callbacks }) => {
      if (regex.test(channel)) {
        callbacks.forEach(callback => {
          try {
            callback(message, channel)
            delivered++
          } catch (error) {
            this.emit('error', error)
          }
        })
      }
    })

    const pubsubMessage: PubSubMessage = {
      type: 'pmessage',
      channel,
      pattern,
      message,
    }
    this.addToHistory(pubsubMessage)
    this.emit('pmessage', channel, message, pattern)

    return delivered
  }

  getSubscriptionCounts(): SubscriptionCounts {
    let channelCount = 0
    this.channels.forEach(subscribers => {
      channelCount += subscribers.size
    })

    let patternCount = 0
    this.patterns.forEach(({ callbacks }) => {
      patternCount += callbacks.size
    })

    return {
      channels: this.channels.size,
      patterns: this.patterns.size,
      total: channelCount + patternCount,
    }
  }

  getChannels(): string[] {
    return Array.from(this.channels.keys())
  }

  getPatterns(): string[] {
    return Array.from(this.patterns.keys())
  }

  getChannelSubscribers(channel: string): number {
    return this.channels.get(channel)?.size || 0
  }

  getPatternCallbacks(pattern: string): number {
    return this.patterns.get(pattern)?.callbacks.size || 0
  }

  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
    return new RegExp(`^${escaped}$`)
  }

  private addToHistory(message: PubSubMessage): void {
    this.messageHistory.push(message)
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift()
    }
  }

  getHistory(limit?: number): PubSubMessage[] {
    if (limit) {
      return this.messageHistory.slice(-limit)
    }
    return [...this.messageHistory]
  }

  clearHistory(): void {
    this.messageHistory = []
  }

  setMaxHistorySize(size: number): void {
    this.maxHistorySize = size
    while (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift()
    }
  }

  duplicate(): PubSub {
    const newPubSub = new PubSub()
    newPubSub.setMaxHistorySize(this.maxHistorySize)
    return newPubSub
  }

  reset(): void {
    this.channels.clear()
    this.patterns.clear()
    this.messageHistory = []
    this.removeAllListeners()
  }
}

export class PubSubManager {
  private instances: Map<string, PubSub> = new Map()

  createClient(id?: string): PubSub {
    const clientId = id || `pubsub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const client = new PubSub()
    this.instances.set(clientId, client)
    return client
  }

  getClient(id: string): PubSub | undefined {
    return this.instances.get(id)
  }

  removeClient(id: string): boolean {
    const client = this.instances.get(id)
    if (client) {
      client.reset()
      return this.instances.delete(id)
    }
    return false
  }

  getClientCount(): number {
    return this.instances.size
  }

  getAllChannels(): string[] {
    const channels = new Set<string>()
    this.instances.forEach(client => {
      client.getChannels().forEach(ch => channels.add(ch))
    })
    return Array.from(channels)
  }

  getAllPatterns(): string[] {
    const patterns = new Set<string>()
    this.instances.forEach(client => {
      client.getPatterns().forEach(p => patterns.add(p))
    })
    return Array.from(patterns)
  }

  broadcast(channel: string, message: string): number {
    let totalDelivered = 0
    this.instances.forEach(client => {
      totalDelivered += client.publish(channel, message)
    })
    return totalDelivered
  }

  reset(): void {
    this.instances.forEach(client => client.reset())
    this.instances.clear()
  }
}

export default PubSub
