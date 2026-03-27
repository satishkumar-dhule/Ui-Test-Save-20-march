/**
 * Database Module Re-exports
 *
 * This file provides backward compatibility for imports from @/services/dbClient
 * while pointing to the new consolidated location @/lib/db
 *
 * @deprecated Import directly from @/lib/db for new code
 */

export {
  initDatabase,
  getDatabase,
  isReady,
  closeDatabase,
  getDbState,
  subscribeDbState,
  getAllContent,
  getContentByType,
  getContentByChannel,
  insertContent,
  getAllContentParsed,
  getContentByTypeParsed,
  getContentByChannelParsed,
  getStats,
  clearDatabase,
  getRecordCount,
  resetDatabase,
  type SqlJsDatabase,
  type ContentRecord,
  type ParsedContentRecord,
  type ContentQueryOptions,
  type Stats,
  type DbState,
} from '@/lib/db'

// Legacy re-exports for backward compatibility
export { SCHEMA_VERSION, CREATE_TABLES_SQL, CONTENT_TYPES } from '@/lib/db'
export type { ContentType } from '@/lib/db'
