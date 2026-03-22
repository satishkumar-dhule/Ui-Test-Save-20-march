import { getRedisClient, isRedisAvailable } from './singleton.js'

export interface RedisInfo {
  server: Record<string, string | number>
  clients: Record<string, string | number>
  memory: Record<string, string | number>
  persistence: Record<string, string | number>
  stats: Record<string, string | number>
  replication: Record<string, string | number>
  cpu: Record<string, string | number>
  commandstats: Record<string, string | number>
  cluster: Record<string, string | number>
  keyspace: Record<string, string | number>
}

export interface MemoryMetrics {
  usedMemory: number
  usedMemoryHuman: string
  usedMemoryPeak: number
  usedMemoryPeakHuman: string
  usedMemoryRss: number
  usedMemoryRssHuman: string
  usedMemoryDataset: number
  usedMemoryDatasetPercent: number
  totalSystemMemory: number
  totalSystemMemoryHuman: string
  memFragmentationRatio: number
  allocatorAllocated: number
  allocatorResident: number
  maxmemory: number
  maxmemoryHuman: string
  maxmemoryPolicy: string
}

export interface ConnectionMetrics {
  connectedClients: number
  rejectedConnections: number
  blockedClients: number
  trackingClients: number
  clusterConnections: number
  maxclients: number
}

export interface LatencyMetrics {
  avgLatency: number
  minLatency: number
  maxLatency: number
  p50Latency: number
  p95Latency: number
  p99Latency: number
  lastLatency: number
}

export interface CommandMetrics {
  totalCalls: number
  usecPerCall: number
  usecPerCallAvg: number
  commandsProcessed: number
  commandsFailed: number
}

let latencyHistory: number[] = []
const LATENCY_HISTORY_SIZE = 1000

function parseInfoSection(info: string): Record<string, string | number> {
  const result: Record<string, string | number> = {}
  const lines = info.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('>>>')) continue

    const colonIndex = trimmed.indexOf(':')
    if (colonIndex === -1) continue

    const key = trimmed.substring(0, colonIndex)
    const value = trimmed.substring(colonIndex + 1)

    const numValue = Number(value)
    result[key] = isNaN(numValue) ? value : numValue
  }

  return result
}

export function parseRedisInfo(info: string): RedisInfo {
  const sections = info.split(/(?:#\s*\n)/)
  const result: RedisInfo = {
    server: {},
    clients: {},
    memory: {},
    persistence: {},
    stats: {},
    replication: {},
    cpu: {},
    commandstats: {},
    cluster: {},
    keyspace: {},
  }

  for (const section of sections) {
    const lines = section.trim().split('\n')
    if (lines.length === 0) continue

    const header = lines[0].replace('#', '').trim().toLowerCase()
    const content = lines.slice(1).join('\n')
    const parsed = parseInfoSection(content)

    switch (header) {
      case 'server':
        result.server = parsed
        break
      case 'clients':
        result.clients = parsed
        break
      case 'memory':
        result.memory = parsed
        break
      case 'persistence':
        result.persistence = parsed
        break
      case 'stats':
        result.stats = parsed
        break
      case 'replication':
        result.replication = parsed
        break
      case 'cpu':
        result.cpu = parsed
        break
      case 'commandstats':
        result.commandstats = parsed
        break
      case 'cluster':
        result.cluster = parsed
        break
      case 'keyspace':
        result.keyspace = parsed
        break
    }
  }

  return result
}

export async function getRedisInfo(): Promise<RedisInfo | null> {
  if (!isRedisAvailable()) return null

  const client = getRedisClient()
  if (!client) return null

  try {
    const info = (await client.info()) as string
    return parseRedisInfo(info)
  } catch (error) {
    console.error('[Metrics] Failed to get Redis info:', (error as Error).message)
    return null
  }
}

export async function getMemoryMetrics(): Promise<MemoryMetrics | null> {
  const info = await getRedisInfo()
  if (!info) return null

  const mem = info.memory
  return {
    usedMemory: Number(mem.used_memory) || 0,
    usedMemoryHuman: String(mem.used_memory_human || '0B'),
    usedMemoryPeak: Number(mem.used_memory_peak) || 0,
    usedMemoryPeakHuman: String(mem.used_memory_peak_human || '0B'),
    usedMemoryRss: Number(mem.used_memory_rss) || 0,
    usedMemoryRssHuman: String(mem.used_memory_rss_human || '0B'),
    usedMemoryDataset: Number(mem.used_memory_dataset) || 0,
    usedMemoryDatasetPercent: Number(mem.used_memory_dataset_perc) || 0,
    totalSystemMemory: Number(mem.total_system_memory) || 0,
    totalSystemMemoryHuman: String(mem.total_system_memory_human || '0B'),
    memFragmentationRatio: Number(mem.mem_fragmentation_ratio) || 0,
    allocatorAllocated: Number(mem.allocator_allocated) || 0,
    allocatorResident: Number(mem.allocator_resident) || 0,
    maxmemory: Number(mem.maxmemory) || 0,
    maxmemoryHuman: String(mem.maxmemory_human || '0B'),
    maxmemoryPolicy: String(mem.maxmemory_policy || 'noeviction'),
  }
}

export async function getConnectionMetrics(): Promise<ConnectionMetrics | null> {
  const info = await getRedisInfo()
  if (!info) return null

  const clients = info.clients
  return {
    connectedClients: Number(clients.connected_clients) || 0,
    rejectedConnections: Number(clients.rejected_connections) || 0,
    blockedClients: Number(clients.blocked_clients) || 0,
    trackingClients: Number(clients.tracking_clients) || 0,
    clusterConnections: Number(clients.cluster_connections) || 0,
    maxclients: Number(clients.maxclients) || 10000,
  }
}

export async function getCommandMetrics(): Promise<CommandMetrics | null> {
  const info = await getRedisInfo()
  if (!info) return null

  const stats = info.stats
  return {
    totalCalls: Number(stats.total_commands_processed) || 0,
    usecPerCall: Number(stats.instructions_per_second) || 0,
    usecPerCallAvg: Number(stats.instantaneous_ops_per_sec) || 0,
    commandsProcessed: Number(stats.total_commands_processed) || 0,
    commandsFailed: Number(stats.instantaneous_ops_per_sec) || 0,
  }
}

export async function trackLatency(command: string, durationMs: number): Promise<void> {
  latencyHistory.push(durationMs)

  if (latencyHistory.length > LATENCY_HISTORY_SIZE) {
    latencyHistory = latencyHistory.slice(-LATENCY_HISTORY_SIZE)
  }
}

export async function getLatencyMetrics(): Promise<LatencyMetrics | null> {
  if (!isRedisAvailable()) return null

  const client = getRedisClient()
  if (!client) return null

  try {
    // ioredis doesn't expose detailed latency stats via standard commands
    // Use history-based calculation instead
    return calculateLatencyFromHistory()
  } catch {
    return calculateLatencyFromHistory()
  }
}

function calculateLatencyFromHistory(): LatencyMetrics | null {
  if (latencyHistory.length === 0) return null

  const sorted = [...latencyHistory].sort((a, b) => a - b)
  return {
    avgLatency: latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length,
    minLatency: sorted[0],
    maxLatency: sorted[sorted.length - 1],
    p50Latency: percentile(sorted, 0.5),
    p95Latency: percentile(sorted, 0.95),
    p99Latency: percentile(sorted, 0.99),
    lastLatency: sorted[sorted.length - 1],
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const index = Math.ceil(sorted.length * p) - 1
  return sorted[Math.max(0, index)]
}

export async function measureCommandLatency<T>(
  command: () => Promise<T>
): Promise<{ result: T; latencyMs: number }> {
  const start = performance.now()
  const result = await command()
  const latencyMs = performance.now() - start

  await trackLatency('unknown', latencyMs)

  return { result, latencyMs }
}

export async function getThroughputMetrics(): Promise<{
  opsPerSecond: number
  totalOps: number
  instantaneousBpsIn: number
  instantaneousBpsOut: number
} | null> {
  const info = await getRedisInfo()
  if (!info) return null

  const stats = info.stats
  return {
    opsPerSecond: Number(stats.instantaneous_ops_per_sec) || 0,
    totalOps: Number(stats.total_commands_processed) || 0,
    instantaneousBpsIn: Number(stats.instantaneous_input_kbps) || 0,
    instantaneousBpsOut: Number(stats.instantaneous_output_kbps) || 0,
  }
}

export interface KeyspaceMetrics {
  totalKeys: number
  expiresKeys: number
  persistentKeys: number
  avgTtl: number
  databases: Record<string, { keys: number; expires: number; avgTtl: number }>
}

export async function getKeyspaceMetrics(): Promise<KeyspaceMetrics | null> {
  const info = await getRedisInfo()
  if (!info) return null

  const keyspace = info.keyspace
  const databases: Record<string, { keys: number; expires: number; avgTtl: number }> = {}
  let totalKeys = 0
  let expiresKeys = 0
  let totalTtl = 0
  let ttlCount = 0

  for (const [key, value] of Object.entries(keyspace)) {
    if (typeof value === 'object' && value !== null) {
      const dbInfo = value as Record<string, string | number>
      const keys = Number(dbInfo.keys) || 0
      const expires = Number(dbInfo.expires) || 0
      const avgTtl = Number(dbInfo.avg_ttl) || 0

      databases[key] = { keys, expires, avgTtl }
      totalKeys += keys
      expiresKeys += expires
      if (avgTtl > 0) {
        totalTtl += avgTtl * keys
        ttlCount += keys
      }
    }
  }

  return {
    totalKeys,
    expiresKeys,
    persistentKeys: totalKeys - expiresKeys,
    avgTtl: ttlCount > 0 ? totalTtl / ttlCount : 0,
    databases,
  }
}

export async function getReplicationMetrics(): Promise<{
  role: string
  connectedSlaves: number
  masterLinkStatus: string
  slaveReadOnly: boolean
  replicationBacklogActive: boolean
  backlogHistoryLength: number
} | null> {
  const info = await getRedisInfo()
  if (!info) return null

  const repl = info.replication
  const server = info.server

  return {
    role: String(server.role || 'unknown'),
    connectedSlaves: Number(repl.connected_slaves) || 0,
    masterLinkStatus: String(repl.master_link_status || 'down'),
    slaveReadOnly: repl.slave_read_only === '1',
    replicationBacklogActive: repl.repl_backlog_active === '1',
    backlogHistoryLength: Number(repl.repl_backlog_histlen) || 0,
  }
}

export interface FullMetrics {
  memory: MemoryMetrics | null
  connections: ConnectionMetrics | null
  latency: LatencyMetrics | null
  throughput: {
    opsPerSecond: number
    totalOps: number
    instantaneousBpsIn: number
    instantaneousBpsOut: number
  } | null
  keyspace: KeyspaceMetrics | null
  replication: {
    role: string
    connectedSlaves: number
    masterLinkStatus: string
    slaveReadOnly: boolean
    replicationBacklogActive: boolean
    backlogHistoryLength: number
  } | null
  commands: CommandMetrics | null
  isAvailable: boolean
  timestamp: number
}

export async function getFullMetrics(): Promise<FullMetrics> {
  const available = isRedisAvailable()

  const [memory, connections, latency, throughput, keyspace, replication, commands] =
    await Promise.all([
      available ? getMemoryMetrics() : null,
      available ? getConnectionMetrics() : null,
      available ? getLatencyMetrics() : null,
      available ? getThroughputMetrics() : null,
      available ? getKeyspaceMetrics() : null,
      available ? getReplicationMetrics() : null,
      available ? getCommandMetrics() : null,
    ])

  return {
    memory,
    connections,
    latency,
    throughput,
    keyspace,
    replication,
    commands,
    isAvailable: available,
    timestamp: Date.now(),
  }
}
