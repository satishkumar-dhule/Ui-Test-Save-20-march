import { getRedisClient, isRedisAvailable } from './singleton.js'

const SESSION_PREFIX = 'devprep:session:'
const BLACKLIST_PREFIX = 'devprep:blacklist:'
const SESSION_TTL = 86400

export interface SessionData {
  userId: string
  email?: string
  createdAt: number
  lastActive: number
  metadata?: Record<string, unknown>
}

export async function createSession(sessionId: string, data: SessionData): Promise<boolean> {
  if (!isRedisAvailable()) return false
  const client = getRedisClient()
  if (!client) return false

  try {
    const key = `${SESSION_PREFIX}${sessionId}`
    await client.setex(
      key,
      SESSION_TTL,
      JSON.stringify({
        ...data,
        lastActive: Date.now(),
      })
    )
    return true
  } catch (error) {
    console.error('[Sessions] Error creating session:', (error as Error).message)
    return false
  }
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  if (!isRedisAvailable()) return null
  const client = getRedisClient()
  if (!client) return null

  try {
    const key = `${SESSION_PREFIX}${sessionId}`
    const data = await client.get(key)
    if (!data) return null

    const session: SessionData = JSON.parse(data)
    session.lastActive = Date.now()
    await client.setex(key, SESSION_TTL, JSON.stringify(session))
    return session
  } catch (error) {
    console.error('[Sessions] Error getting session:', (error as Error).message)
    return null
  }
}

export async function updateSession(
  sessionId: string,
  updates: Partial<SessionData>
): Promise<boolean> {
  if (!isRedisAvailable()) return false
  const client = getRedisClient()
  if (!client) return false

  try {
    const key = `${SESSION_PREFIX}${sessionId}`
    const existing = await client.get(key)
    if (!existing) return false

    const session: SessionData = JSON.parse(existing)
    const updated = { ...session, ...updates, lastActive: Date.now() }
    await client.setex(key, SESSION_TTL, JSON.stringify(updated))
    return true
  } catch (error) {
    console.error('[Sessions] Error updating session:', (error as Error).message)
    return false
  }
}

export async function destroySession(sessionId: string): Promise<boolean> {
  if (!isRedisAvailable()) return false
  const client = getRedisClient()
  if (!client) return false

  try {
    const key = `${SESSION_PREFIX}${sessionId}`
    await client.del(key)
    return true
  } catch (error) {
    console.error('[Sessions] Error destroying session:', (error as Error).message)
    return false
  }
}

export async function refreshSession(sessionId: string): Promise<boolean> {
  if (!isRedisAvailable()) return false
  const client = getRedisClient()
  if (!client) return false

  try {
    const key = `${SESSION_PREFIX}${sessionId}`
    const exists = await client.exists(key)
    if (!exists) return false

    await client.expire(key, SESSION_TTL)
    return true
  } catch (error) {
    console.error('[Sessions] Error refreshing session:', (error as Error).message)
    return false
  }
}

export async function getAllUserSessions(userId: string): Promise<string[]> {
  if (!isRedisAvailable()) return []
  const client = getRedisClient()
  if (!client) return []

  try {
    const pattern = `${SESSION_PREFIX}*`
    const keys = await client.keys(pattern)
    const userSessions: string[] = []

    for (const key of keys) {
      const data = await client.get(key)
      if (data) {
        const session: SessionData = JSON.parse(data)
        if (session.userId === userId) {
          userSessions.push(key.replace(SESSION_PREFIX, ''))
        }
      }
    }

    return userSessions
  } catch (error) {
    console.error('[Sessions] Error getting user sessions:', (error as Error).message)
    return []
  }
}

export async function destroyAllUserSessions(userId: string): Promise<number> {
  if (!isRedisAvailable()) return 0
  const client = getRedisClient()
  if (!client) return 0

  try {
    const sessions = await getAllUserSessions(userId)
    if (sessions.length === 0) return 0

    const keys = sessions.map(s => `${SESSION_PREFIX}${s}`)
    const deleted = await client.del(...keys)
    return deleted
  } catch (error) {
    console.error('[Sessions] Error destroying all user sessions:', (error as Error).message)
    return 0
  }
}

export async function blacklistToken(tokenId: string, expiresIn: number): Promise<boolean> {
  if (!isRedisAvailable()) return false
  const client = getRedisClient()
  if (!client) return false

  try {
    const key = `${BLACKLIST_PREFIX}${tokenId}`
    await client.setex(key, expiresIn, '1')
    return true
  } catch (error) {
    console.error('[Sessions] Error blacklisting token:', (error as Error).message)
    return false
  }
}

export async function isTokenBlacklisted(tokenId: string): Promise<boolean> {
  if (!isRedisAvailable()) return false
  const client = getRedisClient()
  if (!client) return false

  try {
    const key = `${BLACKLIST_PREFIX}${tokenId}`
    const exists = await client.exists(key)
    return exists === 1
  } catch (error) {
    console.error('[Sessions] Error checking token blacklist:', (error as Error).message)
    return false
  }
}

export async function removeFromBlacklist(tokenId: string): Promise<boolean> {
  if (!isRedisAvailable()) return false
  const client = getRedisClient()
  if (!client) return false

  try {
    const key = `${BLACKLIST_PREFIX}${tokenId}`
    await client.del(key)
    return true
  } catch (error) {
    console.error('[Sessions] Error removing from blacklist:', (error as Error).message)
    return false
  }
}

export async function getSessionCount(): Promise<number> {
  if (!isRedisAvailable()) return 0
  const client = getRedisClient()
  if (!client) return 0

  try {
    const pattern = `${SESSION_PREFIX}*`
    const keys = await client.keys(pattern)
    return keys.length
  } catch (error) {
    console.error('[Sessions] Error getting session count:', (error as Error).message)
    return 0
  }
}
