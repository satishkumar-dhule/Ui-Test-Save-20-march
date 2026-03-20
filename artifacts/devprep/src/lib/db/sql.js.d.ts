declare module 'sql.js' {
  export interface Database {
    run(sql: string, params?: any[]): void
    exec(sql: string, params?: any[]): QueryExecResult[]
    prepare(sql: string): Statement
    export(): Uint8Array
    close(): void
  }

  export interface Statement {
    bind(params?: any[]): boolean
    step(): boolean
    getAsObject(params?: object): any
    get(params?: any[]): any[]
    free(): boolean
    reset(): void
  }

  export interface QueryExecResult {
    columns: string[]
    values: any[][]
  }

  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database
  }

  export interface InitSqlJsOptions {
    locateFile?: (file: string) => string
  }

  export default function initSqlJs(options?: InitSqlJsOptions): Promise<SqlJsStatic>
}
