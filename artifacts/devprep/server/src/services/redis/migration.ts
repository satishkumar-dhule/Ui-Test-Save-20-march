import { getRedisClient, isRedisAvailable } from './client.js'

export interface MigrationVersion {
  version: number
  description: string
  appliedAt: number
  duration: number
  success: boolean
  error?: string
}

export interface SchemaVersion {
  current: number
  history: MigrationVersion[]
}

export interface Migration {
  version: number
  description: string
  up: () => Promise<void>
  down?: () => Promise<void>
}

export interface CacheMigrationScript {
  id: string
  name: string
  sourceKeyPattern: string
  targetKeyPattern?: string
  transform: (data: unknown) => unknown
  batchSize: number
}

export interface MigrationResult {
  success: boolean
  version: number
  migrationsRun: number
  duration: number
  errors: string[]
}

const SCHEMA_KEY = 'devprep:schema:version'
const SCHEMA_HISTORY_KEY = 'devprep:schema:history'
const MIGRATION_LOCK_KEY = 'devprep:schema:migration:lock'
const CACHE_VERSION_KEY = 'devprep:cache:version'

const migrations: Migration[] = []
const migrationsByVersion = new Map<number, Migration>()

export function registerMigration(migration: Migration): void {
  migrations.push(migration)
  migrationsByVersion.set(migration.version, migration)
  migrations.sort((a, b) => a.version - b.version)
}

export async function getSchemaVersion(): Promise<SchemaVersion> {
  if (!isRedisAvailable()) {
    return { current: 0, history: [] }
  }
  
  const client = getRedisClient()
  if (!client) {
    return { current: 0, history: [] }
  }
  
  try {
    const currentStr = await client.get(SCHEMA_KEY)
    const current = currentStr ? parseInt(currentStr, 10) : 0
    
    const historyStr = await client.lrange(SCHEMA_HISTORY_KEY, 0, -1)
    const history: MigrationVersion[] = historyStr.map(h => {
      try {
        return JSON.parse(h) as MigrationVersion
      } catch {
        return {
          version: 0,
          description: 'Unknown',
          appliedAt: 0,
          duration: 0,
          success: false,
          error: 'Failed to parse migration record',
        }
      }
    })
    
    return { current, history }
  } catch (error) {
    console.error('[Migration] Failed to get schema version:', error)
    return { current: 0, history: [] }
  }
}

async function setSchemaVersion(version: number): Promise<void> {
  if (!isRedisAvailable()) return
  
  const client = getRedisClient()
  if (!client) return
  
  await client.set(SCHEMA_KEY, version.toString())
}

async function recordMigration(migration: MigrationVersion): Promise<void> {
  if (!isRedisAvailable()) return
  
  const client = getRedisClient()
  if (!client) return
  
  await client.rpush(SCHEMA_HISTORY_KEY, JSON.stringify(migration))
  await client.ltrim(SCHEMA_HISTORY_KEY, -100, -1)
}

async function acquireMigrationLock(timeoutMs = 30000): Promise<boolean> {
  if (!isRedisAvailable()) return false
  
  const client = getRedisClient()
  if (!client) return false
  
  const lockValue = `${process.pid}:${Date.now()}`
  const result = await client.set(MIGRATION_LOCK_KEY, lockValue, 'EX', timeoutMs / 1000, 'NX')
  
  return result === 'OK'
}

async function releaseMigrationLock(): Promise<void> {
  if (!isRedisAvailable()) return
  
  const client = getRedisClient()
  if (!client) return
  
  await client.del(MIGRATION_LOCK_KEY)
}

export async function runMigrations(targetVersion?: number): Promise<MigrationResult> {
  const start = Date.now()
  const errors: string[] = []
  let migrationsRun = 0
  
  if (!isRedisAvailable()) {
    return {
      success: false,
      version: 0,
      migrationsRun: 0,
      duration: Date.now() - start,
      errors: ['Redis not available'],
    }
  }
  
  const locked = await acquireMigrationLock()
  if (!locked) {
    return {
      success: false,
      version: 0,
      migrationsRun: 0,
      duration: Date.now() - start,
      errors: ['Could not acquire migration lock'],
    }
  }
  
  try {
    const { current } = await getSchemaVersion()
    const target = targetVersion ?? migrations[migrations.length - 1]?.version ?? current
    
    for (const migration of migrations) {
      if (migration.version <= current) continue
      if (migration.version > target) break
      
      console.log(`[Migration] Running migration v${migration.version}: ${migration.description}`)
      
      const migrationStart = Date.now()
      
      try {
        await migration.up()
        
        const versionRecord: MigrationVersion = {
          version: migration.version,
          description: migration.description,
          appliedAt: Date.now(),
          duration: Date.now() - migrationStart,
          success: true,
        }
        
        await setSchemaVersion(migration.version)
        await recordMigration(versionRecord)
        
        migrationsRun++
        console.log(`[Migration] Completed v${migration.version} in ${versionRecord.duration}ms`)
      } catch (error) {
        const versionRecord: MigrationVersion = {
          version: migration.version,
          description: migration.description,
          appliedAt: Date.now(),
          duration: Date.now() - migrationStart,
          success: false,
          error: (error as Error).message,
        }
        
        await recordMigration(versionRecord)
        errors.push(`v${migration.version}: ${(error as Error).message}`)
        console.error(`[Migration] Failed v${migration.version}:`, error)
        
        break
      }
    }
    
    return {
      success: errors.length === 0,
      version: current + migrationsRun,
      migrationsRun,
      duration: Date.now() - start,
      errors,
    }
  } finally {
    await releaseMigrationLock()
  }
}

export async function rollbackMigration(targetVersion?: number): Promise<MigrationResult> {
  const start = Date.now()
  const errors: string[] = []
  let migrationsRun = 0
  
  if (!isRedisAvailable()) {
    return {
      success: false,
      version: 0,
      migrationsRun: 0,
      duration: Date.now() - start,
      errors: ['Redis not available'],
    }
  }
  
  const locked = await acquireMigrationLock()
  if (!locked) {
    return {
      success: false,
      version: 0,
      migrationsRun: 0,
      duration: Date.now() - start,
      errors: ['Could not acquire migration lock'],
    }
  }
  
  try {
    const { current } = await getSchemaVersion()
    const target = targetVersion ?? current - 1
    
    const migrationsToRollback = migrations
      .filter(m => m.version > target && m.version <= current)
      .sort((a, b) => b.version - a.version)
    
    for (const migration of migrationsToRollback) {
      if (!migration.down) {
        errors.push(`v${migration.version}: No rollback defined`)
        continue
      }
      
      console.log(`[Migration] Rolling back v${migration.version}: ${migration.description}`)
      
      const migrationStart = Date.now()
      
      try {
        await migration.down()
        
        const versionRecord: MigrationVersion = {
          version: migration.version,
          description: `Rolled back: ${migration.description}`,
          appliedAt: Date.now(),
          duration: Date.now() - migrationStart,
          success: true,
        }
        
        await setSchemaVersion(migration.version - 1)
        await recordMigration(versionRecord)
        
        migrationsRun++
        console.log(`[Migration] Rolled back v${migration.version} in ${versionRecord.duration}ms`)
      } catch (error) {
        const versionRecord: MigrationVersion = {
          version: migration.version,
          description: `Rollback failed: ${migration.description}`,
          appliedAt: Date.now(),
          duration: Date.now() - migrationStart,
          success: false,
          error: (error as Error).message,
        }
        
        await recordMigration(versionRecord)
        errors.push(`v${migration.version}: ${(error as Error).message}`)
        console.error(`[Migration] Rollback failed v${migration.version}:`, error)
        
        break
      }
    }
    
    return {
      success: errors.length === 0,
      version: current - migrationsRun,
      migrationsRun,
      duration: Date.now() - start,
      errors,
    }
  } finally {
    await releaseMigrationLock()
  }
}

export async function getMigrationStatus(): Promise<{
  currentVersion: number
  latestVersion: number
  pendingMigrations: Migration[]
  canRollback: boolean
}> {
  const { current } = await getSchemaVersion()
  const latest = migrations[migrations.length - 1]?.version ?? current
  const pending = migrations.filter(m => m.version > current)
  
  const currentMigration = migrations.find(m => m.version === current)
  const canRollback = currentMigration?.down !== undefined
  
  return {
    currentVersion: current,
    latestVersion: latest,
    pendingMigrations: pending,
    canRollback,
  }
}

const cacheScripts: CacheMigrationScript[] = []

export function registerCacheMigration(script: CacheMigrationScript): void {
  cacheScripts.push(script)
}

export async function migrateCache(scriptId: string): Promise<{
  success: boolean
  processed: number
  errors: string[]
}> {
  const script = cacheScripts.find(s => s.id === scriptId)
  if (!script) {
    return { success: false, processed: 0, errors: ['Script not found'] }
  }
  
  if (!isRedisAvailable()) {
    return { success: false, processed: 0, errors: ['Redis not available'] }
  }
  
  const client = getRedisClient()
  if (!client) {
    return { success: false, processed: 0, errors: ['Redis client not available'] }
  }
  
  const errors: string[] = []
  let processed = 0
  
  try {
    const keys = await client.keys(script.sourceKeyPattern.replace('*', '*'))
    
    for (let i = 0; i < keys.length; i += script.batchSize) {
      const batch = keys.slice(i, i + script.batchSize)
      
      for (const key of batch) {
        try {
          const data = await client.get(key)
          
          if (data) {
            const parsed = JSON.parse(data)
            const transformed = script.transform(parsed)
            
            if (script.targetKeyPattern) {
              const targetKey = key.replace(
                script.sourceKeyPattern.replace('*', ''),
                script.targetKeyPattern.replace('*', '')
              )
              await client.set(targetKey, JSON.stringify(transformed))
              await client.del(key)
            } else {
              await client.set(key, JSON.stringify(transformed))
            }
            
            processed++
          }
        } catch (error) {
          errors.push(`${key}: ${(error as Error).message}`)
        }
      }
    }
    
    return {
      success: errors.length === 0,
      processed,
      errors,
    }
  } catch (error) {
    return {
      success: false,
      processed,
      errors: [(error as Error).message],
    }
  }
}

export async function runAllCacheMigrations(): Promise<Array<{
  scriptId: string
  result: { success: boolean; processed: number; errors: string[] }
}>> {
  const results: Array<{
    scriptId: string
    result: { success: boolean; processed: number; errors: string[] }
  }> = []
  
  for (const script of cacheScripts) {
    const result = await migrateCache(script.id)
    results.push({ scriptId: script.id, result })
  }
  
  return results
}

export async function getCacheVersion(): Promise<number> {
  if (!isRedisAvailable()) return 0
  
  const client = getRedisClient()
  if (!client) return 0
  
  const version = await client.get(CACHE_VERSION_KEY)
  return version ? parseInt(version, 10) : 1
}

export async function setCacheVersion(version: number): Promise<void> {
  if (!isRedisAvailable()) return
  
  const client = getRedisClient()
  if (!client) return
  
  await client.set(CACHE_VERSION_KEY, version.toString())
}

export async function invalidateCacheForMigration(scriptId: string): Promise<number> {
  const script = cacheScripts.find(s => s.id === scriptId)
  if (!script) return 0
  
  if (!isRedisAvailable()) return 0
  
  const client = getRedisClient()
  if (!client) return 0
  
  try {
    const keys = await client.keys(script.sourceKeyPattern)
    if (keys.length > 0) {
      await client.del(...keys)
    }
    return keys.length
  } catch {
    return 0
  }
}

registerMigration({
  version: 1,
  description: 'Add content cache with TTL tracking',
  up: async () => {
    if (!isRedisAvailable()) return
    const client = getRedisClient()
    if (!client) return
    
    await client.set('devprep:meta:cache_version', '2')
    await client.set(CACHE_VERSION_KEY, '2')
  },
  down: async () => {
    if (!isRedisAvailable()) return
    const client = getRedisClient()
    if (!client) return
    
    await client.set(CACHE_VERSION_KEY, '1')
  },
})

registerMigration({
  version: 2,
  description: 'Add user session tracking',
  up: async () => {
    if (!isRedisAvailable()) return
    const client = getRedisClient()
    if (!client) return
    
    await client.hset('devprep:meta:sessions', 'index', 'created')
  },
  down: async () => {
    if (!isRedisAvailable()) return
    const client = getRedisClient()
    if (!client) return
    
    await client.del('devprep:meta:sessions')
  },
})
