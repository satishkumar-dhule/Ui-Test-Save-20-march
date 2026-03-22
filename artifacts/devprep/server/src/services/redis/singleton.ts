import { InMemoryRedis } from './inmemory/client.js'

let instance: InMemoryRedis | null = null

export function getRedisInstance(): InMemoryRedis {
  if (!instance) {
    instance = new InMemoryRedis({
      keyPrefix: 'devprep:',
      enableReadyCheck: true,
    })
  }
  return instance
}

export function getRedisClient(): InMemoryRedis | null {
  return instance
}

export async function initializeRedis(): Promise<boolean> {
  const redis = getRedisInstance()
  try {
    await redis.connect()
    return true
  } catch (error) {
    console.warn('[InMemoryRedis] Failed to initialize:', (error as Error).message)
    return false
  }
}

export async function closeRedis(): Promise<void> {
  if (instance) {
    await instance.quit()
    instance = null
  }
}

export function isRedisAvailable(): boolean {
  return (
    instance !== null &&
    instance !== undefined &&
    typeof instance.isReady === 'function' &&
    instance.isReady()
  )
}

export { InMemoryRedis }
