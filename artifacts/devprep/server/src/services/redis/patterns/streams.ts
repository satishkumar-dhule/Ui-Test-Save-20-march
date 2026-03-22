import { getRedisClient, isRedisAvailable } from '../singleton.js'

export interface StreamEvent {
  id?: string
  [key: string]: string | undefined
}

export interface StreamConsumer {
  name: string
  group: string
}

export interface StreamReadResult {
  messages: StreamEvent[]
  stream: string
}

export interface StreamPendingResult {
  messages: StreamEvent[]
  total: number
}

const STREAM_PREFIX = 'devprep:stream:'
const CONSUMER_GROUP_PREFIX = 'devprep:group:'

function buildStreamKey(name: string): string {
  return `${STREAM_PREFIX}${name}`
}

export async function addToStream(
  stream: string,
  data: Record<string, string>
): Promise<string | null> {
  if (!isRedisAvailable()) return null
  const client = getRedisClient()
  if (!client) return null

  try {
    const key = buildStreamKey(stream)
    const entries = Object.entries(data).flatMap(([k, v]) => [k, v])
    return await client.xadd(key, '*', ...entries)
  } catch (error) {
    console.error('[Streams] Error adding to stream:', (error as Error).message)
    return null
  }
}

export async function readFromStream(
  stream: string,
  count = 10,
  blockMs = 0
): Promise<StreamReadResult> {
  if (!isRedisAvailable()) return { messages: [], stream }
  const client = getRedisClient()
  if (!client) return { messages: [], stream }

  try {
    const key = buildStreamKey(stream)
    let result

    if (blockMs > 0) {
      result = await client.xread('COUNT', count, 'BLOCK', blockMs, 'STREAMS', key, '$')
    } else {
      result = await client.xread('COUNT', count, 'STREAMS', key, '$')
    }

    if (!result) return { messages: [], stream }

    const [, entries] = result[0] as [string, [string, string[]][]]
    const messages: StreamEvent[] = entries.map(([id, fields]) => {
      const event: StreamEvent = { id }
      for (let i = 0; i < fields.length; i += 2) {
        event[fields[i]] = fields[i + 1]
      }
      return event
    })

    return { messages, stream }
  } catch (error) {
    console.error('[Streams] Error reading from stream:', (error as Error).message)
    return { messages: [], stream }
  }
}

export async function readFromConsumerGroup(
  stream: string,
  group: string,
  consumer: string,
  count = 10,
  blockMs = 0,
  startId = '>'
): Promise<StreamReadResult> {
  if (!isRedisAvailable()) return { messages: [], stream }
  const client = getRedisClient()
  if (!client) return { messages: [], stream }

  try {
    const key = buildStreamKey(stream)

    await ensureConsumerGroup(stream, group)

    let result
    if (blockMs > 0) {
      result = await client.xreadgroup(
        'GROUP',
        group,
        consumer,
        'COUNT',
        count,
        'BLOCK',
        blockMs,
        'STREAMS',
        key,
        startId
      )
    } else {
      result = await client.xreadgroup(
        'GROUP',
        group,
        consumer,
        'COUNT',
        count,
        'STREAMS',
        key,
        startId
      )
    }

    if (!result) return { messages: [], stream }

    const [, entries] = result[0] as [string, [string, string[]][]]
    const messages: StreamEvent[] = entries.map(([id, fields]) => {
      const event: StreamEvent = { id }
      for (let i = 0; i < fields.length; i += 2) {
        event[fields[i]] = fields[i + 1]
      }
      return event
    })

    return { messages, stream }
  } catch (error) {
    console.error('[Streams] Error reading from consumer group:', (error as Error).message)
    return { messages: [], stream }
  }
}

export async function ensureConsumerGroup(
  stream: string,
  group: string,
  startId = '0'
): Promise<boolean> {
  if (!isRedisAvailable()) return false
  const client = getRedisClient()
  if (!client) return false

  try {
    const key = buildStreamKey(stream)
    await client.xgroup('CREATE', key, group, startId, 'MKSTREAM')
    return true
  } catch (error) {
    if ((error as Error).message.includes('BUSYGROUP')) {
      return true
    }
    console.error('[Streams] Error creating consumer group:', (error as Error).message)
    return false
  }
}

export async function acknowledgeMessage(
  stream: string,
  group: string,
  messageId: string
): Promise<number> {
  if (!isRedisAvailable()) return 0
  const client = getRedisClient()
  if (!client) return 0

  try {
    const key = buildStreamKey(stream)
    return await client.xack(key, group, messageId)
  } catch (error) {
    console.error('[Streams] Error acknowledging message:', (error as Error).message)
    return 0
  }
}

export async function getPendingMessages(
  stream: string,
  group: string,
  count = 10
): Promise<StreamPendingResult> {
  if (!isRedisAvailable()) return { messages: [], total: 0 }
  const client = getRedisClient()
  if (!client) return { messages: [], total: 0 }

  try {
    const key = buildStreamKey(stream)
    const result = (await client.xpending(key, group, '-', '+', count)) as unknown[]

    if (!result || result.length === 0) {
      return { messages: [], total: 0 }
    }

    const [total, entries] = result as [number, [string, string, number, number, string[]][]]

    const messages: StreamEvent[] = entries.map(([id, , , ,]) => ({ id }))
    return { messages, total }
  } catch (error) {
    console.error('[Streams] Error getting pending messages:', (error as Error).message)
    return { messages: [], total: 0 }
  }
}

export async function claimPendingMessages(
  stream: string,
  group: string,
  consumer: string,
  minIdleTime: number,
  count = 10
): Promise<StreamReadResult> {
  if (!isRedisAvailable()) return { messages: [], stream }
  const client = getRedisClient()
  if (!client) return { messages: [], stream }

  try {
    const key = buildStreamKey(stream)
    const result = await client.xautoclaim(key, group, consumer, minIdleTime, '0-0', 'COUNT', count)

    if (!result) return { messages: [], stream }

    const [, entries] = result as [string, [string, string[]][]]

    if (!entries || entries.length === 0) {
      return { messages: [], stream }
    }

    const messages: StreamEvent[] = entries.map(([id, fields]) => {
      const event: StreamEvent = { id }
      for (let i = 0; i < fields.length; i += 2) {
        event[fields[i]] = fields[i + 1]
      }
      return event
    })

    return { messages, stream }
  } catch (error) {
    console.error('[Streams] Error claiming pending messages:', (error as Error).message)
    return { messages: [], stream }
  }
}

export async function deleteFromStream(stream: string, messageIds: string[]): Promise<number> {
  if (!isRedisAvailable()) return 0
  const client = getRedisClient()
  if (!client) return 0

  if (messageIds.length === 0) return 0

  try {
    const key = buildStreamKey(stream)
    return await client.xdel(key, ...messageIds)
  } catch (error) {
    console.error('[Streams] Error deleting from stream:', (error as Error).message)
    return 0
  }
}

export async function getStreamInfo(stream: string): Promise<{
  length: number
  firstEntry: string | null
  lastEntry: string | null
} | null> {
  if (!isRedisAvailable()) return null
  const client = getRedisClient()
  if (!client) return null

  try {
    const key = buildStreamKey(stream)
    const info = await client.xinfo('STREAM', key)

    if (!info) return null

    const infoMap = new Map<string, unknown>(info as [string, unknown][])
    return {
      length: (infoMap.get('length') as number) || 0,
      firstEntry: (infoMap.get('first-entry') as string) || null,
      lastEntry: (infoMap.get('last-entry') as string) || null,
    }
  } catch (error) {
    console.error('[Streams] Error getting stream info:', (error as Error).message)
    return null
  }
}

export async function trimStream(
  stream: string,
  maxLength: number,
  approximate = true
): Promise<number> {
  if (!isRedisAvailable()) return 0
  const client = getRedisClient()
  if (!client) return 0

  try {
    const key = buildStreamKey(stream)
    if (approximate) {
      return await client.xtrim(key, 'MAXLEN', '~', maxLength)
    } else {
      return await client.xtrim(key, 'MAXLEN', '=', maxLength)
    }
  } catch (error) {
    console.error('[Streams] Error trimming stream:', (error as Error).message)
    return 0
  }
}

export const STREAMS = {
  CONTENT_EVENTS: 'content:events',
  GENERATION_QUEUE: 'generation:queue',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOG: 'audit:log',
  SESSION_EVENTS: 'session:events',
} as const
