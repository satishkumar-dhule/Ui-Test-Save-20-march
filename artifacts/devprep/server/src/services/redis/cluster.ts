/**
 * Redis Cluster Support for InMemoryRedis
 * Note: InMemoryRedis is a single-node solution.
 * This module provides cluster-like functionality for future expansion.
 */

import { getRedisInstance } from './singleton.js'
import { InMemoryRedis } from './inmemory/client.js'

export interface ClusterNode {
  host: string
  port: number
  password?: string
}

export interface ClusterConfig {
  nodes: ClusterNode[]
  maxRetriesPerRequest?: number
  retryDelayOnFailover?: number
  retryDelayOnClusterDown?: number
  enableReadyCheck?: boolean
  slotsRefreshTimeout?: number
  slotsRefreshInterval?: number
}

export interface ClusterHealth {
  healthy: boolean
  nodeCount: number
  connectedNodes: number
  totalMemory: number
  hitRate: number
}

let clusterMode = false
let clusterConfig: ClusterConfig | null = null

export function getClusterClient(): InMemoryRedis | null {
  if (clusterMode) {
    return getRedisInstance()
  }
  return null
}

export function isClusterMode(): boolean {
  return clusterMode
}

export async function initializeCluster(config: ClusterConfig): Promise<boolean> {
  try {
    clusterConfig = config
    clusterMode = true

    console.log('[Redis] Cluster mode initialized (single-node InMemoryRedis)')
    console.log(`[Redis] Configured with ${config.nodes.length} node(s)`)

    return true
  } catch (error) {
    console.error('[Redis Cluster] Failed to initialize:', (error as Error).message)
    return false
  }
}

export async function closeCluster(): Promise<void> {
  clusterMode = false
  clusterConfig = null
}

export function getBestNode(): InMemoryRedis | null {
  if (clusterMode) {
    return getRedisInstance()
  }
  return getRedisInstance()
}

export async function executeOnNode<T = unknown>(
  nodeRole: 'master' | 'slave',
  fn: (node: InMemoryRedis) => Promise<T>
): Promise<T | null> {
  try {
    const client = getBestNode()
    if (!client) return null

    if (nodeRole === 'slave') {
      console.warn('[Redis Cluster] InMemoryRedis does not support replicas, using master')
    }

    return await fn(client)
  } catch (error) {
    console.error('[Redis Cluster] Node execution error:', (error as Error).message)
    return null
  }
}

export async function getClusterHealth(): Promise<ClusterHealth> {
  const defaultHealth: ClusterHealth = {
    healthy: true,
    nodeCount: 1,
    connectedNodes: 1,
    totalMemory: 0,
    hitRate: 100,
  }

  try {
    const client = getRedisInstance()
    if (!client) {
      return { ...defaultHealth, healthy: false, connectedNodes: 0 }
    }

    const info = await client.info()
    const infoMap = parseInfoResponse(info)

    const usedMemory = (parseInfoResponse(info).get('used_memory_human') as string) || '0'

    return {
      healthy: true,
      nodeCount: clusterConfig?.nodes.length || 1,
      connectedNodes: 1,
      totalMemory: parseInt(usedMemory.replace(/[^\d]/g, '')) || 0,
      hitRate: 100,
    }
  } catch (error) {
    console.error('[Redis Cluster] Health check error:', (error as Error).message)
    return { ...defaultHealth, healthy: false, connectedNodes: 0 }
  }
}

function parseInfoResponse(info: string): Map<string, string> {
  const map = new Map<string, string>()
  const lines = info.split('\n')

  for (const line of lines) {
    if (line.includes(':') && !line.startsWith('#')) {
      const [key, value] = line.split(':')
      if (key && value) {
        map.set(key, value.trim())
      }
    }
  }

  return map
}

export class ClusterAwareCache {
  private prefix: string

  constructor(prefix = 'devprep:cache:') {
    this.prefix = prefix
  }

  async get<T>(key: string): Promise<T | null> {
    const client = getBestNode()
    if (!client) return null

    try {
      const data = await client.get(`${this.prefix}${key}`)
      return data ? (JSON.parse(data) as T) : null
    } catch {
      return null
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    const client = getBestNode()
    if (!client) return false

    try {
      const serialized = JSON.stringify(value)
      if (ttlSeconds) {
        await client.setex(`${this.prefix}${key}`, ttlSeconds, serialized)
      } else {
        await client.set(`${this.prefix}${key}`, serialized)
      }
      return true
    } catch {
      return false
    }
  }

  async delete(key: string): Promise<boolean> {
    const client = getBestNode()
    if (!client) return false

    try {
      await client.del(`${this.prefix}${key}`)
      return true
    } catch {
      return false
    }
  }
}

export async function withClusterRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 100
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}
