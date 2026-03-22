/**
 * Redis SDK Connection Manager
 * @package @devprep/redis-sdk
 */

import { InMemoryRedis, InMemoryRedisOptions } from '../inmemory/client.js'
import { EventEmitter } from 'events'

export type RedisClient = InMemoryRedis

export interface ConnectionConfig {
  keyPrefix?: string
  enableReadyCheck?: boolean
  lazyConnect?: boolean
  maxRetriesPerRequest?: number
}

export interface PoolConfig {
  min?: number
  max?: number
  acquireTimeoutMillis?: number
  idleTimeoutMillis?: number
}

export interface HealthCheckResult {
  healthy: boolean
  latency: number
  memory: RedisMemoryInfo | null
  connectedClients: number
  uptime: number
}

export interface RedisMemoryInfo {
  usedMemory: number
  usedMemoryHuman: string
  usedMemoryPeak: number
  usedMemoryPeakHuman: string
}

export interface ConnectionState {
  connected: boolean
  ready: boolean
  connecting: boolean
  disconnecting: boolean
  error: Error | null
  lastConnected: Date | null
  reconnectionAttempts: number
}

const DEFAULT_CONFIG: Required<ConnectionConfig> = {
  keyPrefix: 'devprep:',
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
}

class ConnectionManager extends EventEmitter {
  private client: InMemoryRedis | null = null
  private pool: InMemoryRedis[] = []
  private poolIndex = 0
  private config: Required<ConnectionConfig>
  private poolConfig: PoolConfig
  private state: ConnectionState = {
    connected: false,
    ready: false,
    connecting: false,
    disconnecting: false,
    error: null,
    lastConnected: null,
    reconnectionAttempts: 0,
  }
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null

  constructor(connectionConfig?: ConnectionConfig, poolCfg?: PoolConfig) {
    super()
    this.config = { ...DEFAULT_CONFIG, ...connectionConfig }
    this.poolConfig = {
      min: poolCfg?.min ?? 1,
      max: poolCfg?.max ?? 10,
      acquireTimeoutMillis: poolCfg?.acquireTimeoutMillis ?? 5000,
      idleTimeoutMillis: poolCfg?.idleTimeoutMillis ?? 30000,
    }
  }

  async connect(): Promise<InMemoryRedis> {
    if (this.client && this.state.connected) {
      return this.client
    }

    this.setState({ connecting: true, error: null })

    try {
      this.client = this.createClient()
      await this.client.connect()

      await this.client.ping()
      this.initializePool()

      this.setState({
        connected: true,
        ready: true,
        connecting: false,
        lastConnected: new Date(),
        reconnectionAttempts: 0,
      })

      this.emit('connected')
      this.startHealthCheck()

      return this.client
    } catch (error) {
      this.setState({
        connecting: false,
        error: error as Error,
      })
      this.emit('error', error)
      throw error
    }
  }

  private createClient(): InMemoryRedis {
    const options: InMemoryRedisOptions = {
      keyPrefix: this.config.keyPrefix,
      enableReadyCheck: this.config.enableReadyCheck,
      lazyConnect: this.config.lazyConnect,
      maxRetriesPerRequest: this.config.maxRetriesPerRequest,
    }

    return new InMemoryRedis(options)
  }

  private initializePool(): void {
    const poolSize = Math.min(this.poolConfig.max ?? 10, 5)

    for (let i = 0; i < poolSize; i++) {
      const poolClient = this.createClient()
      this.pool.push(poolClient)
    }
  }

  getPooledConnection(): InMemoryRedis {
    if (!this.client) {
      throw new Error('Not connected to Redis')
    }

    if (this.pool.length === 0) {
      return this.client
    }

    const pooled = this.pool[this.poolIndex]
    this.poolIndex = (this.poolIndex + 1) % this.pool.length
    return pooled
  }

  getClient(): InMemoryRedis {
    if (!this.client) {
      throw new Error('Not connected to Redis. Call connect() first.')
    }
    return this.client
  }

  isConnected(): boolean {
    return this.state.connected
  }

  isReady(): boolean {
    return this.state.ready || (this.client?.isReady() ?? false)
  }

  getState(): ConnectionState {
    return { ...this.state }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now()

    try {
      if (!this.client || !this.state.connected) {
        return {
          healthy: false,
          latency: -1,
          memory: null,
          connectedClients: 0,
          uptime: 0,
        }
      }

      await this.client.ping()
      const latency = Date.now() - start

      const info = await this.client.info('memory,clients,server')
      const infoMap = this.parseInfo(info)

      return {
        healthy: true,
        latency,
        memory: null,
        connectedClients: parseInt(infoMap.get('connected_clients') || '0', 10),
        uptime: parseInt(infoMap.get('uptime_in_seconds') || '0', 10),
      }
    } catch {
      return {
        healthy: false,
        latency: -1,
        memory: null,
        connectedClients: 0,
        uptime: 0,
      }
    }
  }

  private parseInfo(info: string): Map<string, string> {
    const map = new Map<string, string>()
    const lines = info.split('\r\n')

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':')
        if (key && value) {
          map.set(key, value)
        }
      }
    }

    return map
  }

  private setState(partial: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...partial }
  }

  private startHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.healthCheck()
      } catch {
        // Health check failed
      }
    }, 30000)
  }

  async disconnect(): Promise<void> {
    this.setState({ disconnecting: true })

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }

    for (const poolClient of this.pool) {
      try {
        await poolClient.quit()
      } catch {
        // Ignore errors during cleanup
      }
    }
    this.pool = []

    if (this.client) {
      try {
        await this.client.quit()
      } catch {
        // Ignore errors during cleanup
      }
      this.client = null
    }

    this.setState({
      connected: false,
      ready: false,
      connecting: false,
      disconnecting: false,
    })

    this.emit('disconnected')
  }

  async reconnect(): Promise<InMemoryRedis> {
    await this.disconnect()
    return this.connect()
  }
}

let managerInstance: ConnectionManager | null = null

export function getConnectionManager(): ConnectionManager {
  if (!managerInstance) {
    managerInstance = new ConnectionManager()
  }
  return managerInstance
}

export function createConnectionManager(
  connectionConfig?: ConnectionConfig,
  poolConfig?: PoolConfig
): ConnectionManager {
  managerInstance = new ConnectionManager(connectionConfig, poolConfig)
  return managerInstance
}

export { ConnectionManager }
export default ConnectionManager
