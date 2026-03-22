import * as fs from 'fs'
import * as path from 'path'

export interface RedisConfig {
  host: string
  port: number
  password?: string
  db: number
  family?: number
  connectTimeout: number
  retryStrategy: (times: number) => number | null
  maxRetriesPerRequest: number
  enableReadyCheck: boolean
  lazyConnect: boolean
  keepAlive: number
  noDelay: boolean
  tls?: {
    cert?: string
    key?: string
    ca?: string
    rejectUnauthorized?: boolean
  }
}

export interface SentinelConfig {
  sentinels: Array<{ host: string; port: number }>
  name: string
  password?: string
  db?: number
  role?: 'master' | 'slave'
}

export interface ClusterConfig {
  nodes: Array<{ host: string; port: number; password?: string }>
  maxRedirects: number
  enableOfflineQueue: boolean
  redisOptions?: Partial<RedisConfig>
}

export interface ConnectionPoolConfig {
  min: number
  max: number
  acquireTimeout: number
  idleTimeout: number
  evictionInterval: number
}

export interface BackupConfig {
  enabled: boolean
  type: 'rdb' | 'aof' | 'both'
  destination: string
  retentionDays: number
  schedule?: string
}

export interface SecurityConfig {
  requirePass: boolean
  allowedCommands: string[]
  blockedCommands: string[]
  maxMemory?: string
  maxClients?: number
}

export interface MonitoringConfig {
  enabled: boolean
  metricsInterval: number
  healthCheckInterval: number
  logSlowQueries: boolean
  slowQueryThreshold: number
}

export interface RedisEnvironmentConfig {
  development: Partial<RedisConfig>
  test: Partial<RedisConfig>
  production: Partial<RedisConfig>
}

const DEFAULT_CONFIG: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  family: 4,
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
  retryStrategy: (times: number) => {
    if (times > 10) return null
    const delay = Math.min(times * 100, 3000)
    return delay
  },
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
  enableReadyCheck: true,
  lazyConnect: process.env.REDIS_LAZY_CONNECT === 'true',
  keepAlive: parseInt(process.env.REDIS_KEEP_ALIVE || '30000', 10),
  noDelay: process.env.REDIS_NO_DELAY !== 'false',
}

const DEFAULT_SENTINEL_CONFIG: SentinelConfig = {
  sentinels: [
    {
      host: process.env.REDIS_SENTINEL_HOST || 'localhost',
      port: parseInt(process.env.REDIS_SENTINEL_PORT || '26379', 10),
    },
  ],
  name: process.env.REDIS_SENTINEL_NAME || 'mymaster',
  password: process.env.REDIS_SENTINEL_PASSWORD,
  db: parseInt(process.env.REDIS_SENTINEL_DB || '0', 10),
}

const DEFAULT_CLUSTER_CONFIG: ClusterConfig = {
  nodes: (process.env.REDIS_CLUSTER_NODES || 'localhost:7000')
    .split(',')
    .map(node => {
      const [host, port] = node.split(':')
      return { host, port: parseInt(port, 10) }
    }),
  maxRedirects: parseInt(process.env.REDIS_CLUSTER_MAX_REDIRECTS || '3', 10),
  enableOfflineQueue: process.env.REDIS_CLUSTER_OFFLINE_QUEUE !== 'false',
}

const DEFAULT_POOL_CONFIG: ConnectionPoolConfig = {
  min: parseInt(process.env.REDIS_POOL_MIN || '2', 10),
  max: parseInt(process.env.REDIS_POOL_MAX || '10', 10),
  acquireTimeout: parseInt(process.env.REDIS_POOL_ACQUIRE_TIMEOUT || '10000', 10),
  idleTimeout: parseInt(process.env.REDIS_POOL_IDLE_TIMEOUT || '30000', 10),
  evictionInterval: parseInt(process.env.REDIS_POOL_EVICTION_INTERVAL || '60000', 10),
}

const DEFAULT_BACKUP_CONFIG: BackupConfig = {
  enabled: process.env.REDIS_BACKUP_ENABLED === 'true',
  type: (process.env.REDIS_BACKUP_TYPE as 'rdb' | 'aof' | 'both') || 'both',
  destination: process.env.REDIS_BACKUP_DIR || './backups',
  retentionDays: parseInt(process.env.REDIS_BACKUP_RETENTION || '7', 10),
  schedule: process.env.REDIS_BACKUP_SCHEDULE,
}

const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  enabled: process.env.REDIS_MONITORING_ENABLED !== 'false',
  metricsInterval: parseInt(process.env.REDIS_METRICS_INTERVAL || '60000', 10),
  healthCheckInterval: parseInt(process.env.REDIS_HEALTH_INTERVAL || '30000', 10),
  logSlowQueries: process.env.REDIS_LOG_SLOW_QUERIES === 'true',
  slowQueryThreshold: parseInt(process.env.REDIS_SLOW_QUERY_THRESHOLD || '100', 10),
}

function mergeConfig<T extends object>(base: T, overrides: Partial<T>): T {
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) }
  
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) {
      result[key] = value
    }
  }
  
  return result as T
}

function getEnv(): 'development' | 'test' | 'production' {
  const env = process.env.NODE_ENV || 'development'
  if (env === 'production') return 'production'
  if (env === 'test') return 'test'
  return 'development'
}

export function getConfig(): RedisConfig {
  const env = getEnv()
  
  const envConfig: RedisEnvironmentConfig = {
    development: {
      host: 'localhost',
      port: 6379,
      connectTimeout: 10000,
      lazyConnect: false,
    },
    test: {
      host: 'localhost',
      port: 6379,
      db: 1,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    },
    production: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '5000', 10),
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      keepAlive: 60000,
    },
  }
  
  return mergeConfig(DEFAULT_CONFIG, envConfig[env])
}

export function getSentinelConfig(): SentinelConfig {
  return { ...DEFAULT_SENTINEL_CONFIG }
}

export function getClusterConfig(): ClusterConfig {
  return { ...DEFAULT_CLUSTER_CONFIG }
}

export function getPoolConfig(): ConnectionPoolConfig {
  return { ...DEFAULT_POOL_CONFIG }
}

export function getBackupConfig(): BackupConfig {
  return { ...DEFAULT_BACKUP_CONFIG }
}

export function getMonitoringConfig(): MonitoringConfig {
  return { ...DEFAULT_MONITORING_CONFIG }
}

export function getSecurityConfig(): SecurityConfig {
  return {
    requirePass: Boolean(process.env.REDIS_REQUIRE_PASS),
    allowedCommands: process.env.REDIS_ALLOWED_COMMANDS
      ? process.env.REDIS_ALLOWED_COMMANDS.split(',')
      : ['PING', 'GET', 'SET', 'DEL', 'EXISTS', 'KEYS', 'INFO'],
    blockedCommands: process.env.REDIS_BLOCKED_COMMANDS
      ? process.env.REDIS_BLOCKED_COMMANDS.split(',')
      : ['FLUSHALL', 'FLUSHDB', 'DEBUG', 'CONFIG'],
    maxMemory: process.env.REDIS_MAX_MEMORY,
    maxClients: parseInt(process.env.REDIS_MAX_CLIENTS || '10000', 10),
  }
}

export function isProduction(): boolean {
  return getEnv() === 'production'
}

export function isTest(): boolean {
  return getEnv() === 'test'
}

export function isDevelopment(): boolean {
  return getEnv() === 'development'
}

export interface SecretsProvider {
  getSecret: (key: string) => Promise<string | undefined>
}

class EnvSecretsProvider implements SecretsProvider {
  async getSecret(key: string): Promise<string | undefined> {
    return process.env[key]
  }
}

class FileSecretsProvider implements SecretsProvider {
  private secrets: Map<string, string> = new Map()
  
  constructor(secretsPath: string) {
    try {
      if (fs.existsSync(secretsPath)) {
        const content = fs.readFileSync(secretsPath, 'utf-8')
        const lines = content.split('\n')
        for (const line of lines) {
          const [key, ...valueParts] = line.split('=')
          if (key && valueParts.length > 0) {
            this.secrets.set(key.trim(), valueParts.join('=').trim())
          }
        }
      }
    } catch (error) {
      console.warn('[Config] Failed to load secrets file:', error)
    }
  }
  
  async getSecret(key: string): Promise<string | undefined> {
    return this.secrets.get(key)
  }
}

class AwsSecretsProvider implements SecretsProvider {
  private secretId: string
  
  constructor(secretId: string) {
    this.secretId = secretId
  }
  
  async getSecret(key: string): Promise<string | undefined> {
    try {
      const response = await fetch(`http://localhost:2773/secretsmanager/get?secretId=${this.secretId}`, {
        headers: { 'X-Aws-Parameters-Secrets-Token': process.env.AWS_SESSION_TOKEN || '' },
      })
      if (response.ok) {
        const data = await response.json() as { secretString?: string }
        if (data.secretString) {
          const secrets = JSON.parse(data.secretString)
          return secrets[key]
        }
      }
    } catch {
      // AWS Secrets Manager not available
    }
    return undefined
  }
}

class VaultSecretsProvider implements SecretsProvider {
  private address: string
  private token: string
  private path: string
  
  constructor(address: string, token: string, path: string) {
    this.address = address
    this.token = token
    this.path = path
  }
  
  async getSecret(key: string): Promise<string | undefined> {
    try {
      const response = await fetch(`${this.address}/v1/${this.path}`, {
        headers: { 'X-Vault-Token': this.token },
      })
      if (response.ok) {
        const data = await response.json() as { data?: { data?: Record<string, string> } }
        return data.data?.data?.[key]
      }
    } catch {
      // Vault not available
    }
    return undefined
  }
}

let secretsProvider: SecretsProvider = new EnvSecretsProvider()

export function initSecretsProvider(type: 'env' | 'file' | 'aws' | 'vault', options?: Record<string, string>): void {
  switch (type) {
    case 'file':
      secretsProvider = new FileSecretsProvider(options?.path || '/run/secrets/redis')
      break
    case 'aws':
      secretsProvider = new AwsSecretsProvider(options?.secretId || 'redis')
      break
    case 'vault':
      secretsProvider = new VaultSecretsProvider(
        options?.address || 'http://localhost:8200',
        options?.token || '',
        options?.path || 'secret/devprep/redis'
      )
      break
    default:
      secretsProvider = new EnvSecretsProvider()
  }
}

export async function getSecret(key: string): Promise<string | undefined> {
  return secretsProvider.getSecret(key)
}

export async function getRedisPassword(): Promise<string | undefined> {
  const envPassword = process.env.REDIS_PASSWORD
  if (envPassword) return envPassword
  
  const secretPassword = await getSecret('REDIS_PASSWORD')
  if (secretPassword) return secretPassword
  
  return undefined
}

export function validateConfig(): Array<{ field: string; warning?: string; error?: string }> {
  const issues: Array<{ field: string; warning?: string; error?: string }> = []
  const config = getConfig()
  const env = getEnv()
  
  if (env === 'production') {
    if (!process.env.REDIS_PASSWORD && !process.env.REDIS_HOST?.startsWith('redis://')) {
      issues.push({
        field: 'password',
        warning: 'Redis password not set in production',
      })
    }
    
    if (config.connectTimeout > 10000) {
      issues.push({
        field: 'connectTimeout',
        warning: 'Connection timeout may be too high for production',
      })
    }
    
    if (config.lazyConnect) {
      issues.push({
        field: 'lazyConnect',
        warning: 'Lazy connect enabled in production',
      })
    }
  }
  
  if (config.port < 1 || config.port > 65535) {
    issues.push({
      field: 'port',
      error: `Invalid port: ${config.port}`,
    })
  }
  
  if (config.db < 0 || config.db > 15) {
    issues.push({
      field: 'db',
      error: `Invalid database number: ${config.db}`,
    })
  }
  
  return issues
}

export function getConnectionString(): string {
  const config = getConfig()
  let url = `redis://`
  
  if (config.password) {
    url += `:${config.password}@`
  }
  
  url += `${config.host}:${config.port}`
  
  if (config.db !== 0) {
    url += `/${config.db}`
  }
  
  return url
}

export interface TlsConfig {
  enabled: boolean
  cert?: Buffer
  key?: Buffer
  ca?: Buffer
  rejectUnauthorized: boolean
}

export async function getTlsConfig(): Promise<TlsConfig> {
  const enabled = process.env.REDIS_TLS_ENABLED === 'true'
  
  if (!enabled) {
    return { enabled: false, rejectUnauthorized: false }
  }
  
  const certPath = process.env.REDIS_TLS_CERT
  const keyPath = process.env.REDIS_TLS_KEY
  const caPath = process.env.REDIS_TLS_CA
  
  let cert: Buffer | undefined
  let key: Buffer | undefined
  let ca: Buffer | undefined
  
  try {
    if (certPath && fs.existsSync(certPath)) {
      cert = fs.readFileSync(certPath)
    }
    if (keyPath && fs.existsSync(keyPath)) {
      key = fs.readFileSync(keyPath)
    }
    if (caPath && fs.existsSync(caPath)) {
      ca = fs.readFileSync(caPath)
    }
  } catch (error) {
    console.warn('[Config] Failed to load TLS certificates:', error)
  }
  
  return {
    enabled: true,
    cert,
    key,
    ca,
    rejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== 'false',
  }
}

export function getConfigSummary(): Record<string, unknown> {
  const config = getConfig()
  const env = getEnv()
  
  return {
    environment: env,
    host: config.host,
    port: config.port,
    db: config.db,
    passwordSet: Boolean(config.password),
    connectTimeout: config.connectTimeout,
    maxRetriesPerRequest: config.maxRetriesPerRequest,
    lazyConnect: config.lazyConnect,
    sentinelEnabled: Boolean(process.env.REDIS_SENTINEL_NAME),
    clusterEnabled: Boolean(process.env.REDIS_CLUSTER_NODES),
    tlsEnabled: process.env.REDIS_TLS_ENABLED === 'true',
    backupEnabled: process.env.REDIS_BACKUP_ENABLED === 'true',
    monitoringEnabled: process.env.REDIS_MONITORING_ENABLED !== 'false',
  }
}
