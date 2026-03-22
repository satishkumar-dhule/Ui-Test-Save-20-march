export {
  getRedisInstance,
  initializeRedis,
  closeRedis,
  isRedisAvailable,
  InMemoryRedis,
} from './client.js'
export { getInMemoryRedis, closeInMemoryRedis, isInMemoryRedisAvailable } from './inmemory/index.js'
export type { InMemoryRedisOptions } from './inmemory/index.js'
export { PubSub, PubSubManager } from './inmemory/index.js'
export { RedisStream, StreamManager } from './inmemory/index.js'
export {
  getClusterClient,
  isClusterMode,
  initializeCluster,
  closeCluster,
  ClusterAwareCache,
} from './cluster.js'

export {
  getCachedContent,
  setCachedContent,
  getCachedChannelContent,
  setCachedChannelContent,
  getCachedTaggedContent,
  setCachedTaggedContent,
  getCachedStats,
  setCachedStats,
  invalidateContentCache,
  invalidateChannelCache,
  invalidateTaggedCache,
  invalidateAllCache,
} from './cache.js'

export {
  publish,
  subscribe,
  unsubscribe,
  psubscribe,
  closePubSub,
  CHANNELS,
  type PubSubMessage,
  type PubSubHandler,
} from './patterns/pub-sub.js'

export {
  addToStream,
  readFromStream,
  readFromConsumerGroup,
  ensureConsumerGroup,
  acknowledgeMessage,
  getPendingMessages,
  claimPendingMessages,
  deleteFromStream,
  getStreamInfo,
  trimStream,
  STREAMS,
  type StreamEvent,
  type StreamConsumer,
  type StreamReadResult,
  type StreamPendingResult,
} from './patterns/streams.js'

export {
  executeTransaction,
  executeBatch,
  watchAndExecute,
  AtomicCounter,
  DistributedLock,
  withLock,
  type TransactionResult,
  type PipelineCommand,
} from './patterns/transactions.js'

export {
  registerScript,
  loadScript,
  executeScript,
  executeRawScript,
  clearScriptCache,
  refreshScriptCache,
  SCRIPTS,
  type LuaScript,
  type ScriptResult,
} from './patterns/lua-scripts.js'

export {
  checkRateLimit,
  checkRateLimitSliding,
  getRateLimitInfo,
  resetRateLimit,
  RateLimiter,
  TokenBucketRateLimiter,
  RATE_LIMITS,
  type RateLimitConfig,
  type RateLimitResult,
  type RateLimitInfo,
} from './patterns/rate-limiter.js'
