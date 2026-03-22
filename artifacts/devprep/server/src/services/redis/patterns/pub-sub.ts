import { InMemoryRedis } from '../inmemory/client.js'
import { getRedisClient, isRedisAvailable } from '../singleton.js'

export type RedisClient = InMemoryRedis

export interface PubSubMessage<T = unknown> {
  channel: string
  message: T
  timestamp: number
}

export interface PubSubHandler<T = unknown> {
  (message: PubSubMessage<T>): void | Promise<void>
}

type SubscriptionMap = Map<string, Set<PubSubHandler>>

const CHANNEL_PREFIX = 'devprep:pubsub:'
const subscriptions: SubscriptionMap = new Map()
let subscriberClient: InMemoryRedis | null = null
let isSubscribing = false

export async function publish<T = unknown>(channel: string, message: T): Promise<number> {
  if (!isRedisAvailable()) return 0
  const client = getRedisClient()
  if (!client) return 0

  try {
    const pubSubChannel = `${CHANNEL_PREFIX}${channel}`
    const payload: PubSubMessage<T> = {
      channel,
      message,
      timestamp: Date.now(),
    }
    return await client.publish(pubSubChannel, JSON.stringify(payload))
  } catch (error) {
    console.error('[PubSub] Error publishing message:', (error as Error).message)
    return 0
  }
}

export async function subscribe<T = unknown>(
  channel: string,
  handler: PubSubHandler<T>
): Promise<boolean> {
  const pubSubChannel = `${CHANNEL_PREFIX}${channel}`

  if (!subscriptions.has(pubSubChannel)) {
    subscriptions.set(pubSubChannel, new Set())

    if (!isSubscribing) {
      await initializeSubscriber()
    }

    try {
      if (subscriberClient) {
        await subscriberClient.subscribe(pubSubChannel)
      }
    } catch (error) {
      console.error('[PubSub] Error subscribing to channel:', (error as Error).message)
      subscriptions.delete(pubSubChannel)
      return false
    }
  }

  subscriptions.get(pubSubChannel)?.add(handler as PubSubHandler)
  return true
}

export async function unsubscribe(channel: string, handler?: PubSubHandler): Promise<void> {
  const pubSubChannel = `${CHANNEL_PREFIX}${channel}`

  if (handler) {
    subscriptions.get(pubSubChannel)?.delete(handler)
    if (subscriptions.get(pubSubChannel)?.size === 0) {
      subscriptions.delete(pubSubChannel)
    }
  } else {
    subscriptions.delete(pubSubChannel)
  }

  try {
    if (subscriberClient && !subscriptions.has(pubSubChannel)) {
      await subscriberClient.unsubscribe(pubSubChannel)
    }
  } catch (error) {
    console.error('[PubSub] Error unsubscribing from channel:', (error as Error).message)
  }
}

async function initializeSubscriber(): Promise<void> {
  if (isSubscribing || !isRedisAvailable()) return

  const mainClient = getRedisClient()
  if (!mainClient) return

  subscriberClient = mainClient.duplicate()

  subscriberClient.on('message', ((ch: string, message: string) => {
    const handlers = subscriptions.get(ch)
    if (!handlers) return

    try {
      const parsed: PubSubMessage = JSON.parse(message)
      handlers.forEach(handler => {
        try {
          handler(parsed)
        } catch (error) {
          console.error('[PubSub] Handler error:', (error as Error).message)
        }
      })
    } catch (error) {
      console.error('[PubSub] Error parsing message:', (error as Error).message)
    }
  }) as (...args: unknown[]) => void)

  subscriberClient.on('error', ((error: Error) => {
    console.error('[PubSub] Subscriber error:', error.message)
  }) as (...args: unknown[]) => void)

  isSubscribing = true
}

export async function psubscribe<T = unknown>(
  pattern: string,
  handler: PubSubHandler<T>
): Promise<boolean> {
  const fullPattern = `${CHANNEL_PREFIX}${pattern}`

  if (!subscriptions.has(fullPattern)) {
    subscriptions.set(fullPattern, new Set())

    if (!isSubscribing) {
      await initializeSubscriber()
    }

    try {
      if (subscriberClient) {
        await subscriberClient.psubscribe(fullPattern)
      }
    } catch (error) {
      console.error('[PubSub] Error pattern subscribing:', (error as Error).message)
      subscriptions.delete(fullPattern)
      return false
    }
  }

  subscriptions.get(fullPattern)?.add(handler as PubSubHandler)
  return true
}

export async function closePubSub(): Promise<void> {
  if (subscriberClient) {
    try {
      await subscriberClient.quit()
    } catch {
      // Ignore shutdown errors
    }
    subscriberClient = null
    isSubscribing = false
    subscriptions.clear()
  }
}

export const CHANNELS = {
  CONTENT_UPDATED: 'content:updated',
  CONTENT_DELETED: 'content:deleted',
  USER_PROGRESS: 'user:progress',
  SESSION_EXPIRED: 'session:expired',
  RATE_LIMIT_EXCEEDED: 'rate:limit:exceeded',
  GENERATION_COMPLETE: 'generation:complete',
  GENERATION_FAILED: 'generation:failed',
} as const
