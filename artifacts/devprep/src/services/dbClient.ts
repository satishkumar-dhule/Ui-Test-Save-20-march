// sql.js loaded dynamically from CDN - no npm install needed
type SqlJsDatabase = {
  run(sql: string, params?: unknown[]): void
  exec(sql: string): Array<{ columns: string[]; values: unknown[][] }>
  prepare(sql: string): {
    bind(params?: unknown[]): boolean
    step(): boolean
    getAsObject(): Record<string, unknown>
    free(): void
  }
  close(): void
}

let db: SqlJsDatabase | null = null
let initPromise: Promise<SqlJsDatabase> | null = null
let isInitialized = false
let initError: Error | null = null

export interface DbState {
  isReady: boolean
  isLoading: boolean
  error: Error | null
  db: SqlJsDatabase | null
}

const listeners: Set<(state: DbState) => void> = new Set()

function notifyListeners() {
  const state = getDbState()
  listeners.forEach(listener => listener(state))
}

export function getDbState(): DbState {
  return {
    isReady: isInitialized && db !== null && initError === null,
    isLoading: initPromise !== null && !isInitialized,
    error: initError,
    db,
  }
}

export function subscribeDbState(listener: (state: DbState) => void): () => void {
  listeners.add(listener)
  listener(getDbState())
  return () => listeners.delete(listener)
}

async function loadSqlJs(): Promise<{
  Database: new (data?: ArrayLike<number>) => SqlJsDatabase
}> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.min.js'
    script.onload = () => {
      const SQL = (
        window as unknown as { SQL: { Database: new (data?: ArrayLike<number>) => SqlJsDatabase } }
      ).SQL
      if (SQL) {
        resolve(SQL)
      } else {
        reject(new Error('sql.js failed to load'))
      }
    }
    script.onerror = () => reject(new Error('Failed to load sql.js from CDN'))
    document.head.appendChild(script)
  })
}

export async function initDatabase(): Promise<SqlJsDatabase> {
  if (db && isInitialized) return db
  if (initPromise) return initPromise

  initPromise = doInit()
  return initPromise
}

async function doInit(): Promise<SqlJsDatabase> {
  try {
    const SQL = await loadSqlJs()

    let loaded = false
    try {
      const base = import.meta.env.BASE_URL ?? '/'
      const url = base.endsWith('/') ? `${base}devprep.db` : `${base}/devprep.db`
      const response = await fetch(url)
      if (response.ok) {
        const buffer = await response.arrayBuffer()
        if (buffer.byteLength > 0) {
          db = new SQL.Database(new Uint8Array(buffer))
          loaded = true
        }
      }
    } catch {
      console.warn('[DevPrep] Could not load devprep.db from server, falling back to seed data')
    }

    if (!loaded) {
      db = new SQL.Database()
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
      await seedDatabase(db)
    }

    isInitialized = true
    initError = null
    notifyListeners()
    return db!
  } catch (error) {
    initError = error instanceof Error ? error : new Error(String(error))
    notifyListeners()
    throw initError
  }
}

async function seedDatabase(database: SqlJsDatabase): Promise<void> {
  const result = database.exec('SELECT COUNT(*) as count FROM generated_content')
  const count = (result[0]?.values[0]?.[0] as number) || 0

  if (count > 0) return

  const seedData = getSeedData()
  const now = Math.floor(Date.now() / 1000)

  for (const record of seedData) {
    database.run(
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
      id: 'vc-js-001',
      channel_id: 'javascript',
      content_type: 'voice',
      data: {
        id: 'vc-js-001',
        topic: 'Explain async/await',
        duration: 120,
        transcript: 'Async/await is syntactic sugar for Promises...',
      },
      quality_score: 0.85,
      status: 'published',
    },
    {
      id: 'cd-js-001',
      channel_id: 'javascript',
      content_type: 'coding',
      data: {
        id: 'cd-js-001',
        title: 'Implement a debounce function',
        language: 'javascript',
        starterCode: 'function debounce(fn, delay) {\n  // your code\n}',
        solution:
          'function debounce(fn, delay) {\n  let timeoutId;\n  return function(...args) {\n    clearTimeout(timeoutId);\n    timeoutId = setTimeout(() => fn.apply(this, args), delay);\n  };\n}',
      },
      quality_score: 0.9,
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
        back: 'Only once after the initial render (componentDidMount equivalent)',
        tags: ['react', 'hooks', 'useEffect'],
      },
      quality_score: 0.87,
      status: 'published',
    },
    {
      id: 'q-algo-001',
      channel_id: 'algorithms',
      content_type: 'question',
      data: {
        id: 'q-algo-001',
        title: 'Explain Big O notation and common complexities',
        tags: ['algorithms', 'big-o', 'complexity'],
        difficulty: 'beginner',
        sections: [],
      },
      quality_score: 0.91,
      status: 'published',
    },
    {
      id: 'fc-algo-001',
      channel_id: 'algorithms',
      content_type: 'flashcard',
      data: {
        id: 'fc-algo-001',
        front: 'What is the time complexity of binary search?',
        back: 'O(log n) - halves the search space each iteration',
        tags: ['algorithms', 'search', 'big-o'],
      },
      quality_score: 0.89,
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
        title: 'Docker and Containerization Assessment',
        questions: ['docker-basics', 'dockerfile', 'docker-compose'],
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
      id: 'q-k8s-002',
      channel_id: 'kubernetes',
      content_type: 'question',
      data: {
        id: 'q-k8s-002',
        title: 'What is a Kubernetes Deployment and how does it manage replicas?',
        tags: ['kubernetes', 'k8s', 'deployment', 'orchestration'],
        difficulty: 'intermediate',
        sections: [],
      },
      quality_score: 0.92,
      status: 'published',
    },
    {
      id: 'fc-k8s-001',
      channel_id: 'kubernetes',
      content_type: 'flashcard',
      data: {
        id: 'fc-k8s-001',
        front: 'What is the difference between a Pod and a Deployment in Kubernetes?',
        back: 'A Pod is the smallest deployable unit that represents a single instance of a running process. A Deployment manages Pods and provides declarative updates, replica management, and rolling upgrades.',
        tags: ['kubernetes', 'k8s', 'pods', 'deployment'],
      },
      quality_score: 0.88,
      status: 'published',
    },
    {
      id: 'fc-k8s-002',
      channel_id: 'kubernetes',
      content_type: 'flashcard',
      data: {
        id: 'fc-k8s-002',
        front: 'What is a Kubernetes Service and why do we need it?',
        back: 'A Service provides stable networking and load balancing for Pods. Since Pods are ephemeral and get new IPs, Services provide a stable IP and DNS name to access the Pods.',
        tags: ['kubernetes', 'k8s', 'services', 'networking'],
      },
      quality_score: 0.86,
      status: 'published',
    },
    {
      id: 'ex-k8s-001',
      channel_id: 'kubernetes',
      content_type: 'exam',
      data: {
        id: 'ex-k8s-001',
        title: 'Kubernetes Core Concepts Assessment',
        questions: ['pods', 'services', 'deployments', 'namespaces'],
      },
      quality_score: 0.9,
      status: 'published',
    },
  ]
}

export function getDatabase(): SqlJsDatabase | null {
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
    isInitialized = false
    initPromise = null
    initError = null
    notifyListeners()
  }
}

export interface ContentRecord {
  id: string
  channel_id: string
  content_type: string
  data: unknown
  quality_score: number
  embedding_id: string | null
  created_at: number
  updated_at: number
  status: string
  generated_by: string | null
  generation_time_ms: number | null
}

function parseRecord(row: Record<string, unknown>): ContentRecord {
  let parsedData: unknown = row.data
  if (typeof row.data === 'string') {
    try {
      parsedData = JSON.parse(row.data)
    } catch {
      parsedData = { raw: row.data }
    }
  }
  return {
    id: row.id as string,
    channel_id: row.channel_id as string,
    content_type: row.content_type as string,
    data: parsedData,
    quality_score: row.quality_score as number,
    embedding_id: row.embedding_id as string | null,
    created_at: row.created_at as number,
    updated_at: row.updated_at as number,
    status: row.status as string,
    generated_by: row.generated_by as string | null,
    generation_time_ms: row.generation_time_ms as number | null,
  }
}

export function getContentByType(type: string): ContentRecord[] {
  if (!db) return []
  const stmt = db.prepare('SELECT * FROM generated_content WHERE content_type = ? AND status = ?')
  stmt.bind([type, 'published'])
  const results: ContentRecord[] = []
  while (stmt.step()) {
    results.push(parseRecord(stmt.getAsObject()))
  }
  stmt.free()
  return results
}

export function getContentByChannel(channelId: string): ContentRecord[] {
  if (!db) return []
  const stmt = db.prepare('SELECT * FROM generated_content WHERE channel_id = ? AND status = ?')
  stmt.bind([channelId, 'published'])
  const results: ContentRecord[] = []
  while (stmt.step()) {
    results.push(parseRecord(stmt.getAsObject()))
  }
  stmt.free()
  return results
}

export function getContentByTags(tags: string[]): ContentRecord[] {
  if (!db || tags.length === 0) return []
  const stmt = db.prepare('SELECT * FROM generated_content WHERE status = ?')
  stmt.bind(['published'])
  const results: ContentRecord[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    let dataTags: string[] = []
    try {
      const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
      dataTags = (data?.tags as string[]) || []
    } catch {
      continue
    }
    if (tags.some(tag => dataTags.includes(tag))) {
      results.push(parseRecord(row))
    }
  }
  stmt.free()
  return results
}

export function searchContent(query: string): ContentRecord[] {
  if (!db || !query.trim()) return []
  const lowerQuery = query.toLowerCase()
  const stmt = db.prepare('SELECT * FROM generated_content WHERE status = ?')
  stmt.bind(['published'])
  const results: ContentRecord[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    try {
      const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
      const searchableText = JSON.stringify(data).toLowerCase()
      if (searchableText.includes(lowerQuery)) {
        results.push(parseRecord(row))
      }
    } catch {
      continue
    }
  }
  stmt.free()
  return results
}

export function getAllContent(): ContentRecord[] {
  if (!db) return []
  const stmt = db.prepare(
    'SELECT * FROM generated_content WHERE status = ? ORDER BY created_at DESC'
  )
  stmt.bind(['published'])
  const results: ContentRecord[] = []
  while (stmt.step()) {
    results.push(parseRecord(stmt.getAsObject()))
  }
  stmt.free()
  return results
}
