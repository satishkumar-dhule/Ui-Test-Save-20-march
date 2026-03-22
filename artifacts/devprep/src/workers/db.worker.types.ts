export type WorkerMessageType = 'INIT' | 'QUERY' | 'EXEC' | 'CLOSE' | 'PING'

export interface WorkerMessage {
  type: WorkerMessageType
  payload?: unknown
  id: string
}

export interface InitPayload {
  dbUrl: string
  wasmUrl?: string
}

export interface QueryPayload {
  sql: string
  params?: unknown[]
}

export interface ExecPayload {
  sql: string
}

export interface QueryResult {
  columns: string[]
  values: unknown[][]
}

export interface WorkerResponse {
  type: 'INIT_COMPLETE' | 'QUERY_RESULT' | 'EXEC_RESULT' | 'ERROR' | 'PONG'
  payload?: unknown
  id: string
  duration?: number
}

export interface InitCompletePayload {
  success: boolean
  rowCount?: number
  error?: string
}

export interface QueryResultPayload {
  results: QueryResult[]
  rowCount: number
}

export interface ExecResultPayload {
  changes: number
  lastInsertRowid?: number
}

export interface ErrorPayload {
  message: string
  code?: string
}

export function createWorkerMessage(type: WorkerMessageType, payload?: unknown): WorkerMessage {
  return {
    type,
    payload,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  }
}
