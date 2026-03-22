type DbWorkerMessage =
  | { type: 'INIT'; payload: { wasmUrl: string; dbUrl: string }; id: string }
  | { type: 'QUERY'; payload: { sql: string; params?: unknown[] }; id: string }
  | { type: 'QUERY_ALL'; payload: { sql: string; params?: unknown[] }; id: string }
  | { type: 'CLOSE'; id: string }

type DbWorkerResponse =
  | { type: 'INIT_COMPLETE'; id: string; payload?: { error?: string } }
  | { type: 'READY'; id: string }
  | { type: 'QUERY_RESULT'; id: string; payload: { columns: string[]; values: unknown[][] } }
  | { type: 'QUERY_ALL_RESULT'; id: string; payload: unknown[] }
  | { type: 'ERROR'; id: string; payload: { message: string } }

export interface QueryCacheEntry {
  result: unknown
  timestamp: number
}

export interface DbLoaderOptions {
  wasmUrl?: string
  dbUrl?: string
  cacheQueries?: boolean
  cacheTtlMs?: number
  useWorker?: boolean
}

export interface DbLoaderState {
  isReady: boolean
  isLoading: boolean
  error: Error | null
}

type StateListener = (state: DbLoaderState) => void

export class DbLoader {
  private worker: Worker | null = null
  private pendingRequests: Map<
    string,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  > = new Map()
  private isReady = false
  private isLoading = false
  private error: Error | null = null
  private listeners: Set<StateListener> = new Set()
  private queryCache: Map<string, QueryCacheEntry> = new Map()
  private options: Required<DbLoaderOptions>
  private retryCount = 0
  private maxRetries = 3
  private fallbackDb: unknown = null

  constructor(options: DbLoaderOptions = {}) {
    this.options = {
      wasmUrl: options.wasmUrl ?? '/sql-wasm.wasm',
      dbUrl: options.dbUrl ?? '/devprep.db',
      cacheQueries: options.cacheQueries ?? true,
      cacheTtlMs: options.cacheTtlMs ?? 60000,
      useWorker: options.useWorker ?? true,
    }
  }

  private generateId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  private notifyListeners(): void {
    const state: DbLoaderState = {
      isReady: this.isReady,
      isLoading: this.isLoading,
      error: this.error,
    }
    this.listeners.forEach(listener => listener(state))
  }

  onStateChange(listener: StateListener): () => void {
    this.listeners.add(listener)
    listener(this.getState())
    return () => this.listeners.delete(listener)
  }

  getState(): DbLoaderState {
    return {
      isReady: this.isReady,
      isLoading: this.isLoading,
      error: this.error,
    }
  }

  private clearExpiredCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.queryCache.entries()) {
      if (now - entry.timestamp > this.options.cacheTtlMs) {
        this.queryCache.delete(key)
      }
    }
  }

  private getCacheKey(sql: string, params?: unknown[]): string {
    return `${sql}:${JSON.stringify(params || [])}`
  }

  async initialize(): Promise<void> {
    if (this.isReady || this.isLoading) return

    this.isLoading = true
    this.error = null
    this.notifyListeners()

    try {
      if (this.options.useWorker && typeof Worker !== 'undefined') {
        await this.initializeWorker()
      } else {
        await this.initializeFallback()
      }
      this.isReady = true
      this.isLoading = false
      this.retryCount = 0
      this.notifyListeners()
    } catch (error) {
      this.isLoading = false
      this.error = error instanceof Error ? error : new Error(String(error))
      this.notifyListeners()

      if (this.retryCount < this.maxRetries) {
        this.retryCount++
        await this.delay(1000 * this.retryCount)
        return this.initialize()
      }

      if (!this.options.useWorker) {
        await this.initializeFallback()
        this.isReady = true
        this.error = null
        this.notifyListeners()
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async initializeWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker(new URL('../workers/db.worker.ts', import.meta.url), {
          type: 'module',
        })

        this.worker.onmessage = (
          event: MessageEvent<DbWorkerResponse | { type: 'READY'; id: string }>
        ) => {
          const data = event.data

          if (data.type === 'READY') {
            const id = this.generateId()
            const message: DbWorkerMessage = {
              type: 'INIT',
              payload: {
                wasmUrl: this.options.wasmUrl,
                dbUrl: this.options.dbUrl,
              },
              id,
            }
            this.worker!.postMessage(message)
            this.pendingRequests.set(id, {
              resolve: () => resolve(),
              reject: (err: Error) => reject(err),
            })
          } else if (data.type === 'INIT_COMPLETE') {
            const pending = this.pendingRequests.get(data.id)
            if (pending) {
              this.pendingRequests.delete(data.id)
              if (data.payload?.error) {
                pending.reject(new Error(data.payload.error))
              } else {
                pending.resolve(undefined)
              }
            }
          } else if (data.type === 'ERROR') {
            const pending = this.pendingRequests.get(data.id)
            if (pending) {
              this.pendingRequests.delete(data.id)
              pending.reject(new Error(data.payload.message))
            }
          } else if (data.type === 'QUERY_RESULT' || data.type === 'QUERY_ALL_RESULT') {
            const pending = this.pendingRequests.get(data.id)
            if (pending) {
              this.pendingRequests.delete(data.id)
              pending.resolve(data.payload)
            }
          }
        }

        this.worker.onerror = error => {
          console.error('[DbLoader] Worker error:', error)
          this.isReady = false
          this.error = new Error('Web Worker failed')
          this.notifyListeners()
          reject(this.error)
        }
      } catch (error) {
        console.warn('[DbLoader] Worker initialization failed, using fallback:', error)
        reject(error)
      }
    })
  }

  private async initializeFallback(): Promise<void> {
    const { default: initSqlJs } = await import('sql.js')
    const SQL = await initSqlJs({ locateFile: () => this.options.wasmUrl })
    this.fallbackDb = { SQL, db: null }

    try {
      const response = await fetch(this.options.dbUrl)
      if (response.ok) {
        const buffer = await response.arrayBuffer()
        if (buffer.byteLength > 0) {
          ;(this.fallbackDb as { db: unknown }).db = new SQL.Database(new Uint8Array(buffer))
          return
        }
      }
    } catch {
      console.warn('[DbLoader] Could not load database, using in-memory')
    }

    ;(this.fallbackDb as { db: unknown }).db = new SQL.Database()
  }

  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T> {
    if (!this.isReady) {
      await this.initialize()
    }

    const cacheKey = this.getCacheKey(sql, params)
    if (this.options.cacheQueries) {
      this.clearExpiredCache()
      const cached = this.queryCache.get(cacheKey)
      if (cached) {
        return cached.result as T
      }
    }

    if (this.worker) {
      return this.queryViaWorker<T>(sql, params, cacheKey)
    } else {
      return this.queryDirect<T>(sql, params, cacheKey)
    }
  }

  private async queryViaWorker<T>(
    sql: string,
    params: unknown[] | undefined,
    cacheKey: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = this.generateId()
      const message: DbWorkerMessage = { type: 'QUERY_ALL', payload: { sql, params }, id }

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id)
        reject(new Error('Query timeout'))
      }, 30000)

      this.pendingRequests.set(id, {
        resolve: (value: unknown) => {
          clearTimeout(timeout)
          if (this.options.cacheQueries) {
            this.queryCache.set(cacheKey, { result: value, timestamp: Date.now() })
          }
          resolve(value as T)
        },
        reject: (error: Error) => {
          clearTimeout(timeout)
          reject(error)
        },
      })

      this.worker?.postMessage(message)
    })
  }

  private async queryDirect<T>(
    sql: string,
    params: unknown[] | undefined,
    cacheKey: string
  ): Promise<T> {
    type SqlJsDatabase = {
      exec(sql: string): { columns: string[]; values: unknown[][] }[]
      prepare(sql: string): {
        bind(params?: unknown[]): boolean
        step(): boolean
        getAsObject(): Record<string, unknown>
        free(): void
      }
    }
    type FallbackDb = {
      SQL: { Database: new (data?: ArrayLike<number>) => SqlJsDatabase }
      db: SqlJsDatabase | null
    }

    const fb = this.fallbackDb as FallbackDb | null

    if (!fb || !fb.db) {
      throw new Error('Database not initialized')
    }

    const stmt = fb.db.prepare(sql)
    if (params && params.length > 0) {
      stmt.bind(params)
    }
    const results: unknown[] = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()

    if (this.options.cacheQueries) {
      this.queryCache.set(cacheKey, { result: results, timestamp: Date.now() })
    }

    return results as T
  }

  clearCache(): void {
    this.queryCache.clear()
  }

  async close(): Promise<void> {
    if (this.worker) {
      const id = this.generateId()
      this.worker.postMessage({ type: 'CLOSE', id } as DbWorkerMessage)
      await new Promise<void>(resolve => setTimeout(resolve, 100))
      this.worker.terminate()
      this.worker = null
    }
    this.isReady = false
    this.notifyListeners()
  }
}

let globalLoader: DbLoader | null = null

export function getDbLoader(options?: DbLoaderOptions): DbLoader {
  if (!globalLoader) {
    globalLoader = new DbLoader(options)
  }
  return globalLoader
}

export async function initializeDbLoader(options?: DbLoaderOptions): Promise<DbLoader> {
  const loader = getDbLoader(options)
  await loader.initialize()
  return loader
}
