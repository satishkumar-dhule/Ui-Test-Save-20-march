import { getRedisClient, isRedisAvailable } from './singleton.js'
import {
  getMemoryMetrics,
  getConnectionMetrics,
  getReplicationMetrics,
  getKeyspaceMetrics,
} from './metrics.js'

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: number
  checks: HealthCheck[]
  details: Record<string, unknown>
}

export interface HealthCheck {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  duration: number
  timestamp: number
}

export interface ReadinessState {
  ready: boolean
  reason: string
  lastCheck: number
}

export interface LivenessState {
  alive: boolean
  restartRecommended: boolean
  reason: string
  lastCheck: number
}

export interface FailoverEvent {
  type: 'promotion' | 'demotion' | 'connection_lost' | 'connection_restored'
  timestamp: number
  details: Record<string, unknown>
}

const healthChecks: Map<string, HealthCheck> = new Map()
let lastFailoverCheck = 0
let failoverEvents: FailoverEvent[] = []
let previousRole: string | null = null

async function runHealthCheck(
  name: string,
  fn: () => Promise<{ status: 'pass' | 'fail' | 'warn'; message: string }>
): Promise<HealthCheck> {
  const start = performance.now()

  try {
    const result = await fn()
    const duration = performance.now() - start

    const check: HealthCheck = {
      name,
      status: result.status,
      message: result.message,
      duration,
      timestamp: Date.now(),
    }

    healthChecks.set(name, check)
    return check
  } catch (error) {
    const duration = performance.now() - start

    const check: HealthCheck = {
      name,
      status: 'fail',
      message: (error as Error).message,
      duration,
      timestamp: Date.now(),
    }

    healthChecks.set(name, check)
    return check
  }
}

export async function checkConnectivity(): Promise<HealthCheck> {
  return runHealthCheck('connectivity', async () => {
    if (!isRedisAvailable()) {
      return { status: 'fail', message: 'Redis client not available' }
    }

    const client = getRedisClient()
    if (!client) {
      return { status: 'fail', message: 'Redis client is null' }
    }

    try {
      const pong = await client.ping()
      if (pong === 'PONG') {
        return { status: 'pass', message: 'PING successful' }
      }
      return { status: 'fail', message: `Unexpected PING response: ${pong}` }
    } catch (error) {
      return { status: 'fail', message: `PING failed: ${(error as Error).message}` }
    }
  })
}

export async function checkMemoryUsage(): Promise<HealthCheck> {
  return runHealthCheck('memory', async () => {
    const metrics = await getMemoryMetrics()

    if (!metrics) {
      return { status: 'fail', message: 'Could not retrieve memory metrics' }
    }

    const usagePercent =
      metrics.maxmemory > 0
        ? (metrics.usedMemory / metrics.maxmemory) * 100
        : metrics.totalSystemMemory > 0
          ? (metrics.usedMemory / metrics.totalSystemMemory) * 100
          : 0

    if (usagePercent > 90) {
      return { status: 'fail', message: `Memory usage critical: ${usagePercent.toFixed(1)}%` }
    }
    if (usagePercent > 75) {
      return { status: 'warn', message: `Memory usage high: ${usagePercent.toFixed(1)}%` }
    }

    return { status: 'pass', message: `Memory usage: ${usagePercent.toFixed(1)}%` }
  })
}

export async function checkConnections(): Promise<HealthCheck> {
  return runHealthCheck('connections', async () => {
    const metrics = await getConnectionMetrics()

    if (!metrics) {
      return { status: 'fail', message: 'Could not retrieve connection metrics' }
    }

    const usagePercent = (metrics.connectedClients / metrics.maxclients) * 100

    if (usagePercent > 90) {
      return { status: 'fail', message: `Connection limit critical: ${usagePercent.toFixed(1)}%` }
    }
    if (usagePercent > 75) {
      return { status: 'warn', message: `Connection usage high: ${usagePercent.toFixed(1)}%` }
    }

    if (metrics.rejectedConnections > 0) {
      return { status: 'warn', message: `${metrics.rejectedConnections} rejected connections` }
    }

    return {
      status: 'pass',
      message: `Connections: ${metrics.connectedClients}/${metrics.maxclients}`,
    }
  })
}

export async function checkPersistence(): Promise<HealthCheck> {
  return runHealthCheck('persistence', async () => {
    const client = getRedisClient()
    if (!client) {
      return { status: 'fail', message: 'Redis client not available' }
    }

    try {
      const info = (await client.info('persistence')) as string
      const lines = info.split('\n')
      const data: Record<string, string> = {}

      for (const line of lines) {
        const [key, ...valueParts] = line.split(':')
        if (key && valueParts.length > 0) {
          data[key.trim()] = valueParts.join(':').trim()
        }
      }

      if (data.loading === '1') {
        return { status: 'fail', message: 'Redis is loading from disk' }
      }

      if (data.rdb_changes_since_last_save && parseInt(data.rdb_changes_since_last_save) > 10000) {
        return { status: 'warn', message: 'Many unsaved changes' }
      }

      return { status: 'pass', message: 'Persistence OK' }
    } catch (error) {
      return { status: 'fail', message: `Persistence check failed: ${(error as Error).message}` }
    }
  })
}

export async function checkReplication(): Promise<HealthCheck> {
  return runHealthCheck('replication', async () => {
    const metrics = await getReplicationMetrics()

    if (!metrics) {
      return { status: 'fail', message: 'Could not retrieve replication metrics' }
    }

    if (metrics.role === 'master' && metrics.connectedSlaves === 0) {
      return { status: 'warn', message: 'No slaves connected' }
    }

    if (metrics.role === 'slave' && metrics.masterLinkStatus !== 'up') {
      return { status: 'fail', message: 'Master connection lost' }
    }

    return { status: 'pass', message: `Replication OK (role: ${metrics.role})` }
  })
}

export async function checkKeyspace(): Promise<HealthCheck> {
  return runHealthCheck('keyspace', async () => {
    const metrics = await getKeyspaceMetrics()

    if (!metrics) {
      return { status: 'warn', message: 'Could not retrieve keyspace metrics' }
    }

    if (metrics.totalKeys === 0) {
      return { status: 'pass', message: 'Keyspace empty' }
    }

    const expiresPercent = (metrics.expiresKeys / metrics.totalKeys) * 100

    if (expiresPercent < 10 && metrics.totalKeys > 1000) {
      return { status: 'warn', message: 'Few keys have TTL set' }
    }

    return {
      status: 'pass',
      message: `Keys: ${metrics.totalKeys} (${metrics.expiresKeys} with TTL)`,
    }
  })
}

export async function checkFragmentation(): Promise<HealthCheck> {
  return runHealthCheck('fragmentation', async () => {
    const metrics = await getMemoryMetrics()

    if (!metrics) {
      return { status: 'fail', message: 'Could not retrieve memory metrics' }
    }

    const ratio = metrics.memFragmentationRatio

    if (ratio > 3) {
      return { status: 'fail', message: `Memory fragmentation critical: ${ratio.toFixed(2)}` }
    }
    if (ratio > 1.5) {
      return { status: 'warn', message: `Memory fragmentation high: ${ratio.toFixed(2)}` }
    }

    return { status: 'pass', message: `Fragmentation ratio: ${ratio.toFixed(2)}` }
  })
}

export async function runAllHealthChecks(): Promise<HealthStatus> {
  const checks = await Promise.all([
    checkConnectivity(),
    checkMemoryUsage(),
    checkConnections(),
    checkPersistence(),
    checkReplication(),
    checkKeyspace(),
    checkFragmentation(),
  ])

  const failedCount = checks.filter(c => c.status === 'fail').length
  const warnedCount = checks.filter(c => c.status === 'warn').length

  let status: 'healthy' | 'degraded' | 'unhealthy'
  if (failedCount > 0) {
    status = 'unhealthy'
  } else if (warnedCount > 0) {
    status = 'degraded'
  } else {
    status = 'healthy'
  }

  const details: Record<string, unknown> = {}
  for (const check of checks) {
    details[check.name] = {
      status: check.status,
      message: check.message,
      duration: check.duration.toFixed(2) + 'ms',
    }
  }

  return {
    status,
    timestamp: Date.now(),
    checks,
    details,
  }
}

let readinessState: ReadinessState = {
  ready: false,
  reason: 'Not initialized',
  lastCheck: 0,
}

let livenessState: LivenessState = {
  alive: false,
  restartRecommended: false,
  reason: 'Not initialized',
  lastCheck: 0,
}

export async function checkReadiness(): Promise<ReadinessState> {
  const connectivity = await checkConnectivity()
  const persistence = await checkPersistence()

  const isReady = connectivity.status !== 'fail' && persistence.status !== 'fail'

  readinessState = {
    ready: isReady,
    reason: isReady ? 'Ready to serve traffic' : connectivity.message || persistence.message,
    lastCheck: Date.now(),
  }

  return readinessState
}

export async function checkLiveness(): Promise<LivenessState> {
  const connectivity = await checkConnectivity()
  const memory = await checkMemoryUsage()
  const fragmentation = await checkFragmentation()

  const isAlive = connectivity.status !== 'fail'
  const shouldRestart =
    memory.status === 'fail' || fragmentation.status === 'fail' || connectivity.status === 'fail'

  livenessState = {
    alive: isAlive,
    restartRecommended: shouldRestart,
    reason: isAlive
      ? shouldRestart
        ? 'Restart recommended due to issues'
        : 'Healthy'
      : connectivity.message,
    lastCheck: Date.now(),
  }

  return livenessState
}

export function getReadinessState(): ReadinessState {
  return readinessState
}

export function getLivenessState(): LivenessState {
  return livenessState
}

export async function detectFailover(): Promise<FailoverEvent[]> {
  const metrics = await getReplicationMetrics()

  if (!metrics) {
    return []
  }

  const now = Date.now()
  if (now - lastFailoverCheck < 5000) {
    return []
  }

  lastFailoverCheck = now
  const events: FailoverEvent[] = []

  if (previousRole === null) {
    previousRole = metrics.role
    return []
  }

  if (previousRole !== metrics.role) {
    const event: FailoverEvent = {
      type: previousRole === 'master' ? 'demotion' : 'promotion',
      timestamp: now,
      details: {
        previousRole,
        currentRole: metrics.role,
      },
    }
    events.push(event)
    failoverEvents.push(event)
    previousRole = metrics.role
  }

  if (metrics.role === 'slave' && metrics.masterLinkStatus === 'down') {
    const event: FailoverEvent = {
      type: 'connection_lost',
      timestamp: now,
      details: {
        role: metrics.role,
        masterLinkStatus: metrics.masterLinkStatus,
      },
    }
    events.push(event)
    failoverEvents.push(event)
  }

  if (
    metrics.role === 'slave' &&
    metrics.masterLinkStatus === 'up' &&
    failoverEvents.some(e => e.type === 'connection_lost' && e.timestamp > now - 60000)
  ) {
    const event: FailoverEvent = {
      type: 'connection_restored',
      timestamp: now,
      details: {
        role: metrics.role,
        masterLinkStatus: metrics.masterLinkStatus,
      },
    }
    events.push(event)
    failoverEvents.push(event)
  }

  failoverEvents = failoverEvents.filter(e => e.timestamp > now - 3600000)

  return events
}

export function getFailoverHistory(): FailoverEvent[] {
  return [...failoverEvents]
}

export function clearFailoverHistory(): void {
  failoverEvents = []
}

export interface ProbeResponse {
  status: number
  body: HealthStatus | ReadinessState | LivenessState
}

export async function livenessProbe(): Promise<ProbeResponse> {
  const state = await checkLiveness()

  return {
    status: state.alive ? 200 : 503,
    body: state,
  }
}

export async function readinessProbe(): Promise<ProbeResponse> {
  const state = await checkReadiness()

  return {
    status: state.ready ? 200 : 503,
    body: state,
  }
}

export async function healthProbe(): Promise<ProbeResponse> {
  const health = await runAllHealthChecks()

  return {
    status: health.status === 'unhealthy' ? 503 : 200,
    body: health,
  }
}

export function getHealthChecks(): HealthCheck[] {
  return Array.from(healthChecks.values())
}
