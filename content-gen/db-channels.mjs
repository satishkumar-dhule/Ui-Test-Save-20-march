/**
 * Reads channels from the DB (single source of truth).
 * Falls back to a minimal hardcoded list only if the DB has no channels table.
 */

import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const DEFAULT_DB_PATH = path.resolve(__dirname, "../data/devprep.db");

/**
 * Returns channel objects from the DB.
 * Each channel has: { id, name, tags, difficulty, certCode? }
 */
export function loadChannelsFromDb(dbPath = DEFAULT_DB_PATH) {
  try {
    const Database = require("better-sqlite3");
    const db = new Database(dbPath, { readonly: true });

    const hasChannels = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='channels'")
      .get();

    if (!hasChannels) {
      db.close();
      return null;
    }

    const rows = db
      .prepare(
        `SELECT id, name, short_name, tag_filter, cert_code, type
         FROM channels
         WHERE is_active = 1
         ORDER BY type ASC, sort_order ASC, name ASC`
      )
      .all();

    db.close();

    if (!rows.length) return null;

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      shortName: r.short_name || r.name,
      tags: (() => {
        try { return JSON.parse(r.tag_filter || "[]"); } catch { return []; }
      })(),
      certCode: r.cert_code || undefined,
      difficulty: "intermediate",
    }));
  } catch (err) {
    console.warn(`[db-channels] Could not read channels from DB: ${err.message}`);
    return null;
  }
}
