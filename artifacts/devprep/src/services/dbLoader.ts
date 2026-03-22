export interface SqlJsDatabase {
  run(sql: string, params?: unknown[]): void
  exec(sql: string): Array<{ columns: string[]; values: unknown[][] }>
  prepare(sql: string): {
    bind(params?: unknown[]): boolean
    step(): boolean
    getAsObject(): Record<string, unknown>
    free(): void
  }
  export(): Uint8Array
  close(): void
}

export interface DbLoaderConfig {
  wasmUrl?: string
  dbUrl?: string
  useWorker?: boolean
  lazy?: boolean
}

export interface DbState {
  isReady: boolean
  isLoading: boolean
  isLazy: boolean
  error: Error | null
  db: SqlJsDatabase | null
  worker: Worker | null
  initStartTime: number | null
  loadTimeMs: number | null
}

type StateChangeListener = (state: DbState) => void

const DEFAULT_CONFIG: Required<Omit<DbLoaderConfig, 'lazy'>> = {
  wasmUrl: '/sql-wasm.wasm',
  dbUrl: '/devprep.db',
  useWorker: false,
}

const state: DbState = {
  isReady: false,
  isLoading: false,
  isLazy: true,
  error: null,
  db: null,
  worker: null,
  initStartTime: null,
  loadTimeMs: null,
}

let config: DbLoaderConfig = { lazy: true }
let initPromise: Promise<SqlJsDatabase> | null = null
const listeners: Set<StateChangeListener> = new Set()
let sqlJsModule: { Database: new (data?: ArrayLike<number>) => SqlJsDatabase } | null = null

function notifyListeners(): void {
  const currentState = getState()
  listeners.forEach(listener => listener(currentState))
}

function getState(): DbState {
  return { ...state }
}

export function subscribe(listener: StateChangeListener): () => void {
  listeners.add(listener)
  listener(getState())
  return () => listeners.delete(listener)
}

export function isDbReady(): boolean {
  return state.isReady && state.db !== null
}

export function isDbLoading(): boolean {
  return state.isLoading
}

export function getDbLoadTime(): number | null {
  return state.loadTimeMs
}

async function loadSqlJsModule(): Promise<{
  Database: new (data?: ArrayLike<number>) => SqlJsDatabase
}> {
  if (sqlJsModule) return sqlJsModule

  const base = import.meta.env.BASE_URL ?? '/'
  const wasmUrl = config.wasmUrl
    ? `${base}${config.wasmUrl}`.replace(/\/+/g, '/')
    : `${base}sql-wasm.wasm`

  const { default: initSqlJs } = await import('sql.js')
  sqlJsModule = (await initSqlJs({ locateFile: () => wasmUrl })) as {
    Database: new (data?: ArrayLike<number>) => SqlJsDatabase
  }

  return sqlJsModule
}

async function loadExistingDb(): Promise<SqlJsDatabase | null> {
  const base = import.meta.env.BASE_URL ?? '/'
  const dbUrl = config.dbUrl ? `${base}${config.dbUrl}`.replace(/\/+/g, '/') : `${base}devprep.db`

  try {
    const response = await fetch(dbUrl)
    if (response.ok) {
      const buffer = await response.arrayBuffer()
      if (buffer.byteLength > 0) {
        const SQL = await loadSqlJsModule()
        return new SQL.Database(new Uint8Array(buffer))
      }
    }
  } catch (e) {
    console.debug('[dbLoader] Could not load existing db:', e)
  }
  return null
}

function createNewDb(): SqlJsDatabase {
  const SQL = sqlJsModule!
  const db = new SQL.Database()

  db.run(`
    CREATE TABLE IF NOT EXISTS generated_content (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      content_type TEXT NOT NULL,
      data TEXT NOT NULL,
      quality_score REAL DEFAULT 0,
      embedding_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      status TEXT DEFAULT 'pending',
      generated_by TEXT,
      generation_time_ms INTEGER
    )
  `)

  db.run(`CREATE INDEX IF NOT EXISTS idx_type ON generated_content(content_type)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_channel ON generated_content(channel_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_status ON generated_content(status)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_quality ON generated_content(quality_score)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON generated_content(created_at)`)

  return db
}

async function seedDatabase(db: SqlJsDatabase): Promise<void> {
  const result = db.exec('SELECT COUNT(*) as count FROM generated_content')
  const count = (result[0]?.values[0]?.[0] as number) || 0
  if (count > 0) return

  const now = Math.floor(Date.now() / 1000)
  const seedData = getSeedData()

  for (const record of seedData) {
    db.run(
      `INSERT OR REPLACE INTO generated_content 
       (id, channel_id, content_type, data, quality_score, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.channel_id,
        record.content_type,
        JSON.stringify(record.data),
        record.quality_score,
        record.status,
        now - Math.floor(Math.random() * 86400 * 30),
        now,
      ]
    )
  }
}

function getSeedData(): Array<{
  id: string
  channel_id: string
  content_type: string
  data: unknown
  quality_score: number
  status: string
}> {
  return [
    {
      id: 'q-js-001',
      channel_id: 'javascript',
      content_type: 'question',
      data: {
        id: 'q-js-001',
        title: 'Explain JavaScript closures and their use cases',
        tags: ['javascript', 'closures', 'scope'],
        difficulty: 'intermediate',
        sections: [],
      },
      quality_score: 0.95,
      status: 'published',
    },
    {
      id: 'fc-js-001',
      channel_id: 'javascript',
      content_type: 'flashcard',
      data: {
        id: 'fc-js-001',
        front: 'What is the difference between == and ===?',
        back: '=== checks type and value, == performs type coercion before comparison',
        tags: ['javascript', 'types'],
      },
      quality_score: 0.88,
      status: 'published',
    },
    {
      id: 'ex-js-001',
      channel_id: 'javascript',
      content_type: 'exam',
      data: {
        id: 'ex-js-001',
        title: 'JavaScript Fundamentals Assessment',
        questions: ['closure', 'hoisting', 'promises'],
      },
      quality_score: 0.92,
      status: 'published',
    },
    {
      id: 'q-react-001',
      channel_id: 'react',
      content_type: 'question',
      data: {
        id: 'q-react-001',
        title: 'How do React hooks work under the hood?',
        tags: ['react', 'hooks', 'useState'],
        difficulty: 'advanced',
        sections: [],
      },
      quality_score: 0.93,
      status: 'published',
    },
    {
      id: 'fc-react-001',
      channel_id: 'react',
      content_type: 'flashcard',
      data: {
        id: 'fc-react-001',
        front: 'When does useEffect run with empty dependency array?',
        back: 'Only once after the initial render',
        tags: ['react', 'hooks', 'useEffect'],
      },
      quality_score: 0.87,
      status: 'published',
    },
    {
      id: 'q-devops-001',
      channel_id: 'devops',
      content_type: 'question',
      data: {
        id: 'q-devops-001',
        title: 'What is Docker and how does containerization work?',
        tags: ['devops', 'docker', 'containers'],
        difficulty: 'intermediate',
        sections: [],
      },
      quality_score: 0.94,
      status: 'published',
    },
    {
      id: 'fc-devops-001',
      channel_id: 'devops',
      content_type: 'flashcard',
      data: {
        id: 'fc-devops-001',
        front: 'What is the difference between ADD and COPY in Dockerfile?',
        back: 'COPY copies files, ADD can also extract from tar or fetch from URLs',
        tags: ['devops', 'docker', 'dockerfile'],
      },
      quality_score: 0.86,
      status: 'published',
    },
    {
      id: 'ex-devops-001',
      channel_id: 'devops',
      content_type: 'exam',
      data: {
        id: 'ex-devops-001',
        channelId: 'devops',
        domain: 'Containers',
        question: 'What is the difference between ADD and COPY instructions in a Dockerfile?',
        choices: [
          { id: 'A', text: 'COPY is faster than ADD' },
          { id: 'B', text: 'ADD can extract tar files and fetch URLs, COPY only copies files' },
          { id: 'C', text: 'They are identical' },
          { id: 'D', text: 'ADD is deprecated' },
        ],
        correct: 'B',
        explanation: 'ADD can extract compressed files and fetch URLs',
        difficulty: 'easy',
      },
      quality_score: 0.9,
      status: 'published',
    },
    {
      id: 'q-k8s-001',
      channel_id: 'kubernetes',
      content_type: 'question',
      data: {
        id: 'q-k8s-001',
        title: 'Explain Kubernetes Pods and their lifecycle',
        tags: ['kubernetes', 'k8s', 'pods'],
        difficulty: 'intermediate',
        sections: [],
      },
      quality_score: 0.94,
      status: 'published',
    },
    {
      id: 'fc-k8s-001',
      channel_id: 'kubernetes',
      content_type: 'flashcard',
      data: {
        id: 'fc-k8s-001',
        front: 'What is the difference between a Pod and a Deployment?',
        back: 'A Pod is the smallest deployable unit. A Deployment manages Pods and provides declarative updates.',
        tags: ['kubernetes', 'k8s', 'pods', 'deployment'],
      },
      quality_score: 0.88,
      status: 'published',
    },
  ]
}

async function doInitialize(): Promise<SqlJsDatabase> {
  state.isLoading = true
  state.initStartTime = Date.now()
  state.error = null
  notifyListeners()

  try {
    const db = await loadExistingDb()

    if (db) {
      state.db = db
    } else {
      const newDb = createNewDb()
      await seedDatabase(newDb)
      state.db = newDb
    }

    state.isReady = true
    state.loadTimeMs = Date.now() - (state.initStartTime ?? Date.now())
    state.isLoading = false
    notifyListeners()

    return state.db
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    state.error = err
    state.isLoading = false
    notifyListeners()
    throw err
  }
}

export async function lazyInitDb(customConfig?: DbLoaderConfig): Promise<SqlJsDatabase> {
  if (customConfig) {
    config = { ...config, ...customConfig }
  }

  if (state.db && state.isReady) {
    return state.db
  }

  if (initPromise) {
    return initPromise
  }

  initPromise = doInitialize()

  try {
    return await initPromise
  } finally {
    initPromise = null
  }
}

export async function preloadDb(): Promise<void> {
  if (!state.isLoading && !state.isReady) {
    lazyInitDb()
  }
}

export function getDatabase(): SqlJsDatabase | null {
  return state.db
}

export async function closeDatabase(): Promise<void> {
  if (state.db) {
    try {
      state.db.close()
    } catch (e) {
      console.debug('[dbLoader] Error closing db:', e)
    }
    state.db = null
  }

  if (state.worker) {
    state.worker.terminate()
    state.worker = null
  }

  state.isReady = false
  state.isLoading = false
  state.error = null
  state.initStartTime = null
  state.loadTimeMs = null
  sqlJsModule = null

  notifyListeners()
}

export async function exportDatabase(): Promise<Uint8Array | null> {
  if (!state.db) return null
  return state.db.export()
}

export function resetDatabase(): void {
  closeDatabase()
}

export class DbWorkerHandler {
  private worker: Worker | null = null
  private messageQueue: Array<{
    resolve: (value: unknown) => void
    reject: (reason?: unknown) => void
  }> = []
  private isProcessing = false

  async init(customConfig?: DbLoaderConfig): Promise<void> {
    if (typeof Worker === 'undefined') {
      console.warn('[dbLoader] Web Workers not supported, using main thread')
      return
    }

    config = { ...config, ...customConfig, useWorker: true }

    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker(new URL('./dbWorker.ts', import.meta.url), { type: 'module' })

        this.worker.onmessage = async e => {
          const { id, result, error } = e.data
          const pending = this.messageQueue.find(m => (m as { id?: number }).id === id)

          if (pending) {
            if (error) {
              pending.reject(error)
            } else {
              pending.resolve(result)
            }
            this.messageQueue = this.messageQueue.filter(m => (m as { id?: number }).id !== id)
          }

          if (!this.isProcessing && this.messageQueue.length > 0) {
            this.processQueue()
          }
        }

        this.worker.onerror = e => {
          reject(new Error(`Worker error: ${e.message}`))
        }

        state.worker = this.worker

        this.worker.postMessage({ type: 'init', config: { ...config, useWorker: false } })

        this.worker.onmessage = e => {
          if (e.data.type === 'ready') {
            resolve()
          } else if (e.data.type === 'error') {
            reject(e.data.error)
          }
        }
      } catch (e) {
        reject(e)
      }
    })
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.messageQueue.length === 0) return

    this.isProcessing = true
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue[0]
      if (this.worker) {
        this.worker.postMessage(msg)
      }
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    this.isProcessing = false
  }

  async exec(sql: string, params?: unknown[]): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = Date.now() + Math.random()
      this.messageQueue.push({
        id,
        resolve: resolve as (value: unknown) => void,
        reject,
      } as { id?: number; resolve: (value: unknown) => void; reject: (reason?: unknown) => void })

      if (!this.isProcessing) {
        this.processQueue()
      }
    })
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.messageQueue = []
    state.worker = null
  }
}

export const dbLoader = {
  lazyInitDb,
  preloadDb,
  isDbReady,
  isDbLoading,
  getDbLoadTime,
  getDatabase,
  closeDatabase,
  exportDatabase,
  resetDatabase,
  subscribe,
  getState,
}

export default dbLoader
