export { InMemoryRedis, default } from './client.js'
export type { InMemoryRedisOptions } from './client.js'
export { PubSub, PubSubManager } from './pubsub.js'
export type { PubSubChannel, PubSubPattern, PubSubMessage, SubscriptionCounts } from './pubsub.js'
export { RedisStream, StreamManager } from './streams.js'
export type {
  StreamEntry,
  ConsumerGroup,
  Consumer,
  PendingEntry,
  StreamInfo,
  StreamReadOptions,
  StreamReadResult,
  StreamPendingResult,
} from './streams.js'

import { InMemoryRedis, InMemoryRedisOptions } from './client.js'

let globalClient: InMemoryRedis | null = null

export function getInMemoryRedis(options?: InMemoryRedisOptions): InMemoryRedis {
  if (!globalClient) {
    globalClient = new InMemoryRedis(options)
  }
  return globalClient
}

export async function closeInMemoryRedis(): Promise<void> {
  if (globalClient) {
    await globalClient.quit()
    globalClient = null
  }
}

export function isInMemoryRedisAvailable(): boolean {
  return globalClient?.isReady() ?? false
}
