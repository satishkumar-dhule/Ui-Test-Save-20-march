import { betterAuth } from 'better-auth'
import { Database } from 'bun:sqlite'
import path from 'path'
import fs from 'fs'

const DB_PATH =
  process.env.DB_PATH || path.resolve(import.meta.dirname, '../../../../data/devprep.db')

function createDatabase(): Database {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  const db = new Database(DB_PATH)
  db.exec('PRAGMA journal_mode = WAL')
  return db
}

const db = createDatabase()

// Run Better Auth migrations directly
function runMigrations(db: Database): void {
  console.log('[Auth] Running Better Auth migrations...')

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS "user" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "email_verified" INTEGER NOT NULL DEFAULT 0,
      "image" TEXT,
      "created_at" INTEGER NOT NULL,
      "updated_at" INTEGER NOT NULL
    )
  `)

  // Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS "session" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "expires_at" INTEGER,
      "token" TEXT NOT NULL UNIQUE,
      "created_at" INTEGER NOT NULL,
      "updated_at" INTEGER NOT NULL,
      "ip_address" TEXT,
      "user_agent" TEXT,
      "user_id" TEXT NOT NULL,
      FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE
    )
  `)
  db.exec(`CREATE INDEX IF NOT EXISTS "session_token_idx" ON "session" ("token")`)
  db.exec(`CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" ("user_id")`)

  // Accounts table (for OAuth)
  db.exec(`
    CREATE TABLE IF NOT EXISTS "account" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "account_id" TEXT NOT NULL,
      "provider_id" TEXT NOT NULL,
      "user_id" TEXT NOT NULL,
      "access_token" TEXT,
      "refresh_token" TEXT,
      "id_token" TEXT,
      "access_token_expires_at" INTEGER,
      "refresh_token_expires_at" INTEGER,
      "scope" TEXT,
      "password" TEXT,
      "created_at" INTEGER NOT NULL,
      "updated_at" INTEGER NOT NULL,
      FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE
    )
  `)
  db.exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS "account_provider_id_idx" ON "account" ("provider_id", "account_id")`
  )
  db.exec(`CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account" ("user_id")`)

  // Verification table (for email verification)
  db.exec(`
    CREATE TABLE IF NOT EXISTS "verification" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "identifier" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      "expires_at" INTEGER NOT NULL,
      "created_at" INTEGER
    )
  `)
  db.exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier")`
  )

  console.log('[Auth] Better Auth tables created successfully!')
}

runMigrations(db)

export const auth = betterAuth({
  appName: 'DevPrep',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5173',
  secret: process.env.BETTER_AUTH_SECRET || '+IwJ1Q3cmiFKMb4Gm5U507ZqQekHS7QpWIuy+azDGRk=',
  database: {
    type: 'sqlite',
    db: db,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  trustedOrigins: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://devprep.app',
  ],
  rateLimit: {
    enabled: true,
    window: 15 * 60, // 15 minutes
    max: 100,
  },
})
