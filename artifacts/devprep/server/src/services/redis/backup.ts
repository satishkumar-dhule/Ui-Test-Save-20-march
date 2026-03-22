import { getRedisClient, isRedisAvailable } from './client.js'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

const execAsync = promisify(exec)

export interface BackupConfig {
  type: 'rdb' | 'aof' | 'both'
  destination: string
  compression: boolean
  retention: number
  schedule?: string
}

export interface BackupResult {
  success: boolean
  type: 'rdb' | 'aof'
  filePath?: string
  fileSize?: number
  timestamp: number
  duration: number
  error?: string
}

export interface RestoreResult {
  success: boolean
  sourceFile: string
  timestamp: number
  duration: number
  error?: string
}

export interface BackupSchedule {
  id: string
  name: string
  config: BackupConfig
  lastRun?: number
  nextRun?: number
  enabled: boolean
}

export interface PointInTimeRecovery {
  timestamp: number
  method: 'aof' | 'rdb'
  available: boolean
  filePath?: string
}

const BACKUP_DIR = process.env.REDIS_BACKUP_DIR || './backups'
const scheduledBackups: Map<string, BackupSchedule> = new Map()
let schedulerInterval: NodeJS.Timeout | null = null

export function parseAofRewriteConfig(): Record<string, string | number> | null {
  const defaultConfig: Record<string, string | number> = {
    'auto-aof-rewrite-min-size': 67108864,
    'auto-aof-rewrite-percentage': 100,
  }
  
  return defaultConfig
}

export async function getPersistenceInfo(): Promise<{
  aofEnabled: boolean
  rdbEnabled: boolean
  aofCurrentSize: number
  aofBaseSize: number
  rdbChangesSinceLastSave: number
  lastSaveTime: number
}> {
  if (!isRedisAvailable()) {
    throw new Error('Redis not available')
  }
  
  const client = getRedisClient()
  if (!client) {
    throw new Error('Redis client not available')
  }
  
  const info = await client.info('persistence') as string
  const data: Record<string, string> = {}
  
  for (const line of info.split('\n')) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim()
      const value = line.substring(colonIndex + 1).trim()
      data[key] = value
    }
  }
  
  return {
    aofEnabled: data['aof_enabled'] === '1',
    rdbEnabled: data['rdb_saveing'] !== '1' && data['rdb_save_in_progress'] !== '1',
    aofCurrentSize: parseInt(data['aof_current_size'] || '0', 10),
    aofBaseSize: parseInt(data['aof_base_size'] || '0', 10),
    rdbChangesSinceLastSave: parseInt(data['rdb_changes_since_last_save'] || '0', 10),
    lastSaveTime: parseInt(data['last_save_time'] || '0', 10),
  }
}

async function getRDBPath(): Promise<string> {
  const client = getRedisClient()
  if (!client) return '/var/lib/redis/dump.rdb'
  
  const config = await client.config('GET', 'dir')
  const match = String(config).match(/dir\s+(.+)/)
  const dir = match ? match[1] : '/var/lib/redis'
  return path.join(dir, 'dump.rdb')
}

export async function triggerRdbSave(): Promise<boolean> {
  if (!isRedisAvailable()) {
    throw new Error('Redis not available')
  }
  
  const client = getRedisClient()
  if (!client) {
    throw new Error('Redis client not available')
  }
  
  try {
    await client.bgsave()
    await waitForBgSave()
    return true
  } catch {
    return false
  }
}

export async function triggerAofRewrite(): Promise<boolean> {
  if (!isRedisAvailable()) {
    throw new Error('Redis not available')
  }
  
  const client = getRedisClient()
  if (!client) {
    throw new Error('Redis client not available')
  }
  
  try {
    await client.bgrewriteaof()
    return true
  } catch (error) {
    console.error('[Backup] AOF rewrite failed:', error)
    return false
  }
}

export async function createRdbBackup(destination?: string): Promise<BackupResult> {
  const start = Date.now()
  const destPath = destination || path.join(BACKUP_DIR, `dump-${Date.now()}.rdb`)
  
  try {
    await fs.promises.mkdir(BACKUP_DIR, { recursive: true })
    
    if (!isRedisAvailable()) {
      throw new Error('Redis not available')
    }
    
    const client = getRedisClient()
    if (!client) {
      throw new Error('Redis client not available')
    }
    
    await client.bgsave()
    
    await waitForBgSave()
    
    const rdbPath = await getRDBPath()
    const destDir = path.dirname(destPath)
    await fs.promises.mkdir(destDir, { recursive: true })
    
    try {
      await fs.promises.copyFile(rdbPath, destPath)
    } catch (copyError) {
      console.warn('[Backup] RDB copy failed:', (copyError as Error).message)
    }
    
    const stats = await fs.promises.stat(destPath)
    
    return {
      success: true,
      type: 'rdb',
      filePath: destPath,
      fileSize: stats.size,
      timestamp: Date.now(),
      duration: Date.now() - start,
    }
  } catch (error) {
    return {
      success: false,
      type: 'rdb',
      timestamp: Date.now(),
      duration: Date.now() - start,
      error: (error as Error).message,
    }
  }
}

async function waitForBgSave(timeoutMs = 30000): Promise<boolean> {
  const start = Date.now()
  
  while (Date.now() - start < timeoutMs) {
    const client = getRedisClient()
    if (!client) break
    
    const info = await client.info('persistence') as string
    const rdbSaving = info.includes('rdb_save_in_progress:1')
    
    if (!rdbSaving) {
      return true
    }
    
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return false
}

export async function createAofBackup(destination?: string): Promise<BackupResult> {
  const start = Date.now()
  const destPath = destination || path.join(BACKUP_DIR, `dump-${Date.now()}.aof`)
  
  try {
    await fs.promises.mkdir(BACKUP_DIR, { recursive: true })
    
    if (!isRedisAvailable()) {
      throw new Error('Redis not available')
    }
    
    const client = getRedisClient()
    if (!client) {
      throw new Error('Redis client not available')
    }
    
    const config = await client.config('GET', 'dir').then(info => {
      const match = String(info).match(/dir\s+(.+)/)
      return match ? match[1] : '/var/lib/redis'
    })
    
    const aofPath = path.join(config, 'appendonly.aof')
    
    const destDir = path.dirname(destPath)
    await fs.promises.mkdir(destDir, { recursive: true })
    
    try {
      await fs.promises.copyFile(aofPath, destPath)
      const stats = await fs.promises.stat(destPath)
      
      return {
        success: true,
        type: 'aof',
        filePath: destPath,
        fileSize: stats.size,
        timestamp: Date.now(),
        duration: Date.now() - start,
      }
    } catch {
      console.warn('[Backup] AOF file not found, triggering rewrite')
      await triggerAofRewrite()
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      try {
        await fs.promises.copyFile(aofPath, destPath)
        const stats = await fs.promises.stat(destPath)
        
        return {
          success: true,
          type: 'aof',
          filePath: destPath,
          fileSize: stats.size,
          timestamp: Date.now(),
          duration: Date.now() - start,
        }
      } catch (copyError) {
        throw new Error(`Failed to copy AOF file: ${(copyError as Error).message}`)
      }
    }
  } catch (error) {
    return {
      success: false,
      type: 'aof',
      timestamp: Date.now(),
      duration: Date.now() - start,
      error: (error as Error).message,
    }
  }
}

export async function createFullBackup(config: BackupConfig): Promise<BackupResult[]> {
  const results: BackupResult[] = []
  
  if (config.type === 'rdb' || config.type === 'both') {
    const rdbDest = config.destination.includes('.rdb') 
      ? config.destination 
      : path.join(config.destination, `dump-${Date.now()}.rdb`)
    results.push(await createRdbBackup(rdbDest))
  }
  
  if (config.type === 'aof' || config.type === 'both') {
    const aofDest = config.destination.includes('.aof')
      ? config.destination
      : path.join(config.destination, `dump-${Date.now()}.aof`)
    results.push(await createAofBackup(aofDest))
  }
  
  return results
}

export async function restoreFromRdb(filePath: string): Promise<RestoreResult> {
  const start = Date.now()
  
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file not found: ${filePath}`)
    }
    
    if (isRedisAvailable()) {
      const client = getRedisClient()
      if (client) {
        await client.config('SET', 'dir', path.dirname(filePath))
        await client.config('SET', 'dbfilename', path.basename(filePath))
        await client.shutdown('NOSAVE')
      }
    }
    
    return {
      success: true,
      sourceFile: filePath,
      timestamp: Date.now(),
      duration: Date.now() - start,
    }
  } catch (error) {
    return {
      success: false,
      sourceFile: filePath,
      timestamp: Date.now(),
      duration: Date.now() - start,
      error: (error as Error).message,
    }
  }
}

export async function restoreFromAof(filePath: string): Promise<RestoreResult> {
  const start = Date.now()
  
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file not found: ${filePath}`)
    }
    
    if (isRedisAvailable()) {
      const client = getRedisClient()
      if (client) {
        await client.config('SET', 'dir', path.dirname(filePath))
        await client.config('SET', 'appendfilename', path.basename(filePath))
        await client.config('SET', 'appendonly', 'yes')
        await client.shutdown('NOSAVE')
      }
    }
    
    return {
      success: true,
      sourceFile: filePath,
      timestamp: Date.now(),
      duration: Date.now() - start,
    }
  } catch (error) {
    return {
      success: false,
      sourceFile: filePath,
      timestamp: Date.now(),
      duration: Date.now() - start,
      error: (error as Error).message,
    }
  }
}

export async function listBackups(): Promise<Array<{
  path: string
  type: 'rdb' | 'aof'
  size: number
  created: number
}>> {
  const backups: Array<{
    path: string
    type: 'rdb' | 'aof'
    size: number
    created: number
  }> = []
  
  try {
    await fs.promises.mkdir(BACKUP_DIR, { recursive: true })
    const files = await fs.promises.readdir(BACKUP_DIR)
    
    for (const file of files) {
      const filePath = path.join(BACKUP_DIR, file)
      const stats = await fs.promises.stat(filePath)
      
      const type = file.endsWith('.rdb') ? 'rdb' : file.endsWith('.aof') ? 'aof' : null
      
      if (type) {
        backups.push({
          path: filePath,
          type,
          size: stats.size,
          created: stats.birthtimeMs,
        })
      }
    }
  } catch (error) {
    console.error('[Backup] Failed to list backups:', error)
  }
  
  return backups.sort((a, b) => b.created - a.created)
}

export async function deleteBackup(filePath: string): Promise<boolean> {
  try {
    await fs.promises.unlink(filePath)
    return true
  } catch (error) {
    console.error('[Backup] Failed to delete backup:', error)
    return false
  }
}

export async function cleanupOldBackups(retention: number): Promise<number> {
  const backups = await listBackups()
  const cutoff = Date.now() - (retention * 24 * 60 * 60 * 1000)
  
  let deleted = 0
  
  for (const backup of backups) {
    if (backup.created < cutoff) {
      if (await deleteBackup(backup.path)) {
        deleted++
      }
    }
  }
  
  return deleted
}

function parseCronExpression(cron: string): { next: number; interval: number } | null {
  const parts = cron.split(' ')
  if (parts.length < 5) return null
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
  
  const now = new Date()
  const next = new Date(now)
  
  if (minute !== '*') {
    next.setMinutes(parseInt(minute, 10) || 0)
  }
  if (hour !== '*') {
    next.setHours(parseInt(hour, 10) || 0)
  }
  if (dayOfMonth !== '*') {
    next.setDate(parseInt(dayOfMonth, 10) || 1)
  }
  
  if (next <= now) {
    next.setDate(next.getDate() + 1)
  }
  
  const interval = next.getTime() - now.getTime()
  
  return { next: next.getTime(), interval }
}

export function scheduleBackup(id: string, name: string, config: BackupConfig): void {
  const schedule: BackupSchedule = {
    id,
    name,
    config,
    enabled: true,
  }
  
  if (config.schedule) {
    const parsed = parseCronExpression(config.schedule)
    if (parsed) {
      schedule.nextRun = parsed.next
    }
  }
  
  scheduledBackups.set(id, schedule)
  
  if (!schedulerInterval) {
    startScheduler()
  }
}

export function unscheduleBackup(id: string): void {
  scheduledBackups.delete(id)
  
  if (scheduledBackups.size === 0 && schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
  }
}

export function getScheduledBackups(): BackupSchedule[] {
  return Array.from(scheduledBackups.values())
}

function startScheduler(): void {
  schedulerInterval = setInterval(async () => {
    const now = Date.now()
    
    for (const [id, schedule] of Array.from(scheduledBackups.entries())) {
      if (!schedule.enabled) continue
      if (schedule.nextRun && schedule.nextRun <= now) {
        console.log(`[Backup] Running scheduled backup: ${schedule.name}`)
        
        const results = await createFullBackup(schedule.config)
        const allSuccess = results.every(r => r.success)
        
        schedule.lastRun = now
        
        if (schedule.config.schedule) {
          const parsed = parseCronExpression(schedule.config.schedule)
          if (parsed) {
            schedule.nextRun = parsed.next
          }
        }
        
        console.log(`[Backup] Scheduled backup ${allSuccess ? 'completed' : 'failed'}:`, results)
      }
    }
  }, 60000)
}

export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
  }
}

export async function enableAof(): Promise<boolean> {
  if (!isRedisAvailable()) return false
  
  const client = getRedisClient()
  if (!client) return false
  
  try {
    await client.config('SET', 'appendonly', 'yes')
    await client.config('SET', 'appendfsync', 'everysec')
    return true
  } catch (error) {
    console.error('[Backup] Failed to enable AOF:', error)
    return false
  }
}

export async function disableAof(): Promise<boolean> {
  if (!isRedisAvailable()) return false
  
  const client = getRedisClient()
  if (!client) return false
  
  try {
    await client.config('SET', 'appendonly', 'no')
    return true
  } catch (error) {
    console.error('[Backup] Failed to disable AOF:', error)
    return false
  }
}

export async function getAofRewriteStatus(): Promise<{
  inProgress: boolean
  progress?: number
}> {
  if (!isRedisAvailable()) {
    return { inProgress: false }
  }
  
  const client = getRedisClient()
  if (!client) {
    return { inProgress: false }
  }
  
  const info = await client.info('persistence') as string
  const aofRewrite = info.match(/aof_rewrite_in_progress:(\d+)/)
  
  return {
    inProgress: aofRewrite ? parseInt(aofRewrite[1], 10) === 1 : false,
  }
}

export async function waitForAofRewrite(timeoutMs = 60000): Promise<boolean> {
  const start = Date.now()
  
  while (Date.now() - start < timeoutMs) {
    const status = await getAofRewriteStatus()
    if (!status.inProgress) {
      return true
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  return false
}
