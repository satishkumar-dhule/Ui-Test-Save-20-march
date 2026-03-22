import { InMemoryRedis } from '../inmemory/client.js'
import { getRedisClient, isRedisAvailable } from '../singleton.js'

export type RedisClient = InMemoryRedis

export interface LuaScript {
  name: string
  script: string
  keys: number
}

export interface ScriptResult {
  success: boolean
  result: unknown
  error?: string
}

const registeredScripts: Map<string, LuaScript> = new Map()
const scriptCache: Map<string, string> = new Map()

export function registerScript(name: string, script: string, keys = 0): LuaScript {
  const luaScript: LuaScript = { name, script, keys }
  registeredScripts.set(name, luaScript)
  return luaScript
}

export async function loadScript(name: string): Promise<string | null> {
  if (!isRedisAvailable()) return null
  const client = getRedisClient()
  if (!client) return null

  const cached = scriptCache.get(name)
  if (cached) {
    return cached
  }

  const scriptDef = registeredScripts.get(name)
  if (!scriptDef) {
    console.warn(`[LuaScripts] Script "${name}" not registered`)
    return null
  }

  try {
    const sha = (await client.script('LOAD', scriptDef.script)) as string
    scriptCache.set(name, sha)
    return sha
  } catch (error) {
    console.error('[LuaScripts] Error loading script:', (error as Error).message)
    return null
  }
}

export async function executeScript<T = unknown>(
  name: string,
  args: (string | number)[] = []
): Promise<ScriptResult> {
  if (!isRedisAvailable()) {
    return { success: false, result: null, error: 'Redis not available' }
  }

  const client = getRedisClient()
  if (!client) {
    return { success: false, result: null, error: 'No Redis client' }
  }

  const scriptDef = registeredScripts.get(name)
  if (!scriptDef) {
    return { success: false, result: null, error: `Script "${name}" not registered` }
  }

  try {
    let sha = scriptCache.get(name)

    if (!sha) {
      sha = (await client.script('LOAD', scriptDef.script)) as string
      scriptCache.set(name, sha)
    }

    const safeArgs = (args as (string | number)[]).map(a => String(a))
    const result = (await client.evalsha(sha, scriptDef.keys, ...safeArgs)) as T
    return { success: true, result }
  } catch (error) {
    const err = error as Error

    if (err.message.includes('NOSCRIPT')) {
      scriptCache.delete(name)

      try {
        const newSha = (await client.script('LOAD', scriptDef.script)) as string
        scriptCache.set(name, newSha)
        const safeArgs = (args as (string | number)[]).map(a => String(a))
        const result = (await client.evalsha(newSha, scriptDef.keys, ...safeArgs)) as T
        return { success: true, result }
      } catch (retryError) {
        return {
          success: false,
          result: null,
          error: (retryError as Error).message,
        }
      }
    }

    return {
      success: false,
      result: null,
      error: err.message,
    }
  }
}

export async function executeRawScript(
  script: string,
  numKeys: number,
  ...args: (string | number)[]
): Promise<ScriptResult> {
  if (!isRedisAvailable()) {
    return { success: false, result: null, error: 'Redis not available' }
  }

  const client = getRedisClient()
  if (!client) {
    return { success: false, result: null, error: 'No Redis client' }
  }

  try {
    const result = await client.eval(script, numKeys, ...args)
    return { success: true, result }
  } catch (error) {
    return {
      success: false,
      result: null,
      error: (error as Error).message,
    }
  }
}

export function clearScriptCache(): void {
  scriptCache.clear()
}

export async function refreshScriptCache(): Promise<void> {
  clearScriptCache()

  for (const [name] of registeredScripts) {
    await loadScript(name)
  }
}

export const SCRIPTS = {
  RATE_LIMIT_SLIDING: registerScript(
    'rate_limit_sliding',
    `
      local key = KEYS[1]
      local window = tonumber(ARGV[1])
      local limit = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])

      local window_start = now - window
      redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)
      local count = redis.call('ZCARD', key)

      if count < limit then
        redis.call('ZADD', key, now, now .. '-' .. count)
        redis.call('PEXPIRE', key, window)
        return {1, limit - count - 1}
      else
        return {0, 0}
      end
    `,
    1
  ),

  SET_IF_NOT_EXISTS: registerScript(
    'set_if_not_exists',
    `
      local key = KEYS[1]
      local value = ARGV[1]
      local ttl = tonumber(ARGV[2])

      local existing = redis.call('GET', key)
      if existing then
        return 0
      end

      redis.call('SET', key, value)
      if ttl > 0 then
        redis.call('PEXPIRE', key, ttl)
      end
      return 1
    `,
    1
  ),

  INCREMENT_WITH_LIMIT: registerScript(
    'increment_with_limit',
    `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local ttl = tonumber(ARGV[2])

      local current = redis.call('INCR', key)
      if current == 1 then
        redis.call('PEXPIRE', key, ttl)
      end

      if current > limit then
        return {0, current, limit}
      else
        return {1, current, limit}
      end
    `,
    1
  ),

  HASH_SCAN_MATCH: registerScript(
    'hash_scan_match',
    `
      local key = KEYS[1]
      local pattern = ARGV[1]
      local cursor = tonumber(ARGV[2])
      local count = tonumber(ARGV[3])

      local data = redis.call('HGETALL', key)
      local results = {}
      local match_count = 0

      for i = 1, #data, 2 do
        local field = data[i]
        local value = data[i + 1]

        if string.match(field, pattern) then
          table.insert(results, field)
          table.insert(results, value)
          match_count = match_count + 1
        end

        if match_count >= count then
          break
        end
      end

      return results
    `,
    1
  ),

  SAFE_DELETE: registerScript(
    'safe_delete',
    `
      local key = KEYS[1]
      local token = ARGV[1]

      local current = redis.call('GET', key)
      if current == token then
        return redis.call('DEL', key)
      end
      return 0
    `,
    1
  ),

  BATCH_SET_EXPIRE: registerScript(
    'batch_set_expire',
    `
      local count = tonumber(ARGV[1])
      local ttl = tonumber(ARGV[2])

      for i = 3, #ARGV, 2 do
        local key = ARGV[i]
        local value = ARGV[i + 1]
        redis.call('SET', key, value)
        if ttl > 0 then
          redis.call('PEXPIRE', key, ttl)
        end
      end

      return count
    `,
    0
  ),

  FANSET_INTERSECTION: registerScript(
    'fanset_intersection',
    `
      local sets = {}
      local min_size = nil
      local result_key = KEYS[1]

      for i = 1, #KEYS do
        local size = redis.call('ZCARD', KEYS[i])
        if not min_size or size < min_size then
          min_size = size
        end
        table.insert(sets, KEYS[i])
      end

      if min_size == 0 then
        return {}
      end

      local result = redis.call('ZINTERSTORE', result_key, #KEYS, unpack(KEYS))
      local members = redis.call('ZRANGE', result_key, 0, -1)
      redis.call('DEL', result_key)

      return members
    `,
    -1
  ),
} as const

export type RegisteredScripts = typeof SCRIPTS
