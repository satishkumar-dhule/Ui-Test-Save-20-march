import fs from 'fs'
import path from 'path'
import { EventEmitter } from 'events'

export interface DatabaseWatcherOptions {
  dbPath: string
  pollInterval?: number
  onChange?: () => void
}

export class DatabaseWatcher extends EventEmitter {
  private dbPath: string
  private walPath: string
  private pollInterval: number
  private lastMtime: number = 0
  private lastWalMtime: number = 0
  private watcher: ReturnType<typeof fs.watchFile> | null = null
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private isWatching = false

  constructor(options: DatabaseWatcherOptions) {
    super()
    this.dbPath = options.dbPath
    this.walPath = `${options.dbPath}-wal`
    this.pollInterval = options.pollInterval || 2000

    if (options.onChange) {
      this.on('change', options.onChange)
    }
  }

  start(): void {
    if (this.isWatching) return
    this.isWatching = true

    try {
      const stats = fs.statSync(this.dbPath)
      this.lastMtime = stats.mtimeMs
    } catch {
      const dir = path.dirname(this.dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      this.lastMtime = Date.now()
    }

    try {
      if (fs.existsSync(this.walPath)) {
        const walStats = fs.statSync(this.walPath)
        this.lastWalMtime = walStats.mtimeMs
      }
    } catch {
      // WAL file may not exist yet
    }

    this.watcher = fs.watchFile(this.dbPath, { interval: this.pollInterval }, curr => {
      this.lastMtime = curr.mtimeMs
      this.emit('change', { timestamp: curr.mtimeMs })
    })

    this.pollTimer = setInterval(() => {
      this.checkForChanges()
    }, this.pollInterval)
  }

  private checkForChanges(): void {
    try {
      let changed = false
      let changeTime = Date.now()

      if (fs.existsSync(this.dbPath)) {
        const stats = fs.statSync(this.dbPath)
        if (stats.mtimeMs > this.lastMtime) {
          this.lastMtime = stats.mtimeMs
          changeTime = stats.mtimeMs
          changed = true
        }
      }

      if (fs.existsSync(this.walPath)) {
        const walStats = fs.statSync(this.walPath)
        if (walStats.mtimeMs > this.lastWalMtime) {
          this.lastWalMtime = walStats.mtimeMs
          changeTime = walStats.mtimeMs
          changed = true
        }
        const walSize = walStats.size
        if (walSize > 0 && walSize !== this.lastWalMtime) {
          changeTime = walStats.mtimeMs
          changed = true
        }
      }

      if (changed) {
        this.emit('change', { timestamp: changeTime })
      }
    } catch {
      // Ignore errors during polling
    }
  }

  stop(): void {
    if (!this.isWatching) return
    this.isWatching = false

    if (this.watcher) {
      fs.unwatchFile(this.dbPath)
      this.watcher = null
    }

    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }

  getLastMtime(): number {
    return this.lastMtime
  }

  isActive(): boolean {
    return this.isWatching
  }
}

export function createDatabaseWatcher(options: DatabaseWatcherOptions): DatabaseWatcher {
  return new DatabaseWatcher(options)
}
