/**
 * Database API - Re-exports
 *
 * This file provides backward compatibility for imports from @/services/dbApi
 * while pointing to the new consolidated location @/lib/db
 *
 * @deprecated Import directly from @/lib/db for new code
 */

export {
  initDatabase,
  getDatabase,
  getDbState,
  getStats,
  type ContentRecord,
  type ContentQueryOptions,
  type Stats,
  type DbState,
} from '@/lib/db'

// Additional utility re-exports
export {
  isReady,
  subscribeDbState,
  getAllContent,
  getContentByType,
  getContentByChannel,
  getAllContentParsed,
  getContentByTypeParsed,
  getContentByChannelParsed,
  clearDatabase,
  getRecordCount,
} from '@/lib/db'
