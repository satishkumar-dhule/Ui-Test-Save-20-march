/**
 * DevPrep Diagram Migration Script
 *
 * Retroactively adds diagrams to content missing them and removes duplicates.
 *
 * Usage:
 *   node content-gen/migrate-diagrams.mjs              # dry run
 *   node content-gen/migrate-diagrams.mjs --apply      # apply changes
 *   node content-gen/migrate-diagrams.mjs --dry-run     # explicit dry run
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Database } from "bun:sqlite";
import crypto from "crypto";
import {
  getAllTemplates,
  getTemplateForContent,
} from "./diagram-templates.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH =
  process.env.DB_PATH || path.resolve(__dirname, "../data/devprep.db");
const APPLY = process.argv.includes("--apply") || process.argv.includes("-y");

function openDb() {
  const db = new Database(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  return db;
}

function hashSvg(svgContent) {
  return crypto
    .createHash("sha256")
    .update(svgContent || "")
    .digest("hex")
    .slice(0, 16);
}

function hasDiagram(data) {
  if (!data || !data.sections) return false;
  return data.sections.some(
    (s) =>
      s.type === "diagram" ||
      (s.type === "code" &&
        (s.filename?.includes("diagram") ||
          s.filename?.includes("architecture") ||
          s.filename?.includes("flow") ||
          s.filename?.includes("sequence"))),
  );
}

function getDiagramSvg(data) {
  if (!data || !data.sections) return null;
  for (const s of data.sections) {
    if (s.type === "diagram" && s.svgContent) return s.svgContent;
  }
  return null;
}

function countDuplicatesByHash(db) {
  const rows = db
    .prepare(
      `SELECT data FROM generated_content WHERE content_type = 'question'`,
    )
    .all();

  const hashCounts = {};
  for (const row of rows) {
    try {
      const data = JSON.parse(row.data);
      const svg = getDiagramSvg(data);
      if (svg) {
        const hash = hashSvg(svg);
        hashCounts[hash] = (hashCounts[hash] || 0) + 1;
      }
    } catch {}
  }
  return hashCounts;
}

function findMissingDiagrams(db) {
  const rows = db
    .prepare(
      `SELECT id, channel_id, content_type, data, created_at 
       FROM generated_content 
       WHERE content_type = 'question'
       ORDER BY created_at DESC`,
    )
    .all();

  const missing = [];
  for (const row of rows) {
    try {
      const data = JSON.parse(row.data);
      if (!hasDiagram(data)) {
        missing.push({
          id: row.id,
          channelId: row.channel_id,
          contentType: row.content_type,
          createdAt: row.created_at,
        });
      }
    } catch (e) {
      console.warn(`   ⚠️  Failed to parse ${row.id}: ${e.message}`);
    }
  }
  return missing;
}

function findDuplicateDiagrams(db) {
  const hashCounts = countDuplicatesByHash(db);
  const duplicates = [];

  for (const [hash, count] of Object.entries(hashCounts)) {
    if (count > 1) {
      duplicates.push({ hash, count });
    }
  }
  return duplicates;
}

function migrateMissingDiagrams(db, items, dryRun = true) {
  const results = { success: 0, skipped: 0, failed: 0 };

  for (const item of items) {
    try {
      const template = getTemplateForContent(item.channelId, item.contentType);

      if (dryRun) {
        console.log(
          `   📝 [DRY RUN] Would add ${template.filename} to ${item.id}`,
        );
        results.success++;
      } else {
        const row = db
          .prepare("SELECT data FROM generated_content WHERE id = ?")
          .get(item.id);

        if (!row) {
          console.warn(`   ⚠️  ${item.id} not found`);
          results.skipped++;
          continue;
        }

        const data = JSON.parse(row.data);
        if (!data.sections) data.sections = [];
        data.sections.push(template);

        db.prepare(
          `UPDATE generated_content 
           SET data = ?, updated_at = strftime('%s', 'now')
           WHERE id = ?`,
        ).run(JSON.stringify(data), item.id);

        console.log(`   ✅ Added ${template.filename} to ${item.id}`);
        results.success++;
      }
    } catch (e) {
      console.error(`   ❌ Failed to migrate ${item.id}: ${e.message}`);
      results.failed++;
    }
  }

  return results;
}

function migrateDuplicateDiagrams(db, duplicates, dryRun = true) {
  const results = { removed: 0, kept: 0, failed: 0 };

  for (const dup of duplicates) {
    const rows = db
      .prepare(
        `SELECT id, channel_id, data, created_at 
         FROM generated_content 
         WHERE content_type = 'question'
         ORDER BY created_at DESC`,
      )
      .all();

    const matching = [];
    for (const row of rows) {
      try {
        const data = JSON.parse(row.data);
        const svg = getDiagramSvg(data);
        if (svg && hashSvg(svg) === dup.hash) {
          matching.push({ id: row.id, createdAt: row.created_at });
        }
      } catch {}
    }

    if (matching.length > 1) {
      const [keep, ...remove] = matching;

      if (dryRun) {
        console.log(
          `   📝 [DRY RUN] Would deduplicate hash ${dup.hash}: keep ${keep.id}, remove ${remove.map((r) => r.id).join(", ")}`,
        );
      } else {
        for (const r of remove) {
          try {
            db.prepare("DELETE FROM generated_content WHERE id = ?").run(r.id);
            console.log(`   🗑️  Removed duplicate ${r.id} (hash: ${dup.hash})`);
            results.removed++;
          } catch (e) {
            console.error(`   ❌ Failed to remove ${r.id}: ${e.message}`);
            results.failed++;
          }
        }
      }
      results.kept++;
    }
  }

  return results;
}

function main() {
  console.log("\n🔧 DevPrep Diagram Migration");
  console.log("─".repeat(50));
  console.log(`   Database: ${DB_PATH}`);
  console.log(
    `   Mode:     ${APPLY ? "APPLY (live changes)" : "DRY RUN (preview only)"}`,
  );
  console.log("─".repeat(50));

  if (!APPLY) {
    console.log("\n⚠️  DRY RUN MODE - No changes will be made");
    console.log("   Run with --apply to apply changes\n");
  }

  const db = openDb();

  console.log("\n📊 Phase 1: Analyzing existing content...");
  const missingDiagrams = findMissingDiagrams(db);
  const duplicateDiagrams = findDuplicateDiagrams(db);

  console.log(
    `   • Total questions: ${db.prepare("SELECT COUNT(*) as n FROM generated_content WHERE content_type = 'question'").get().n}`,
  );
  console.log(`   • Missing diagrams: ${missingDiagrams.length}`);
  console.log(`   • Duplicate diagram groups: ${duplicateDiagrams.length}`);

  if (duplicateDiagrams.length > 0) {
    const totalDupes = duplicateDiagrams.reduce((s, d) => s + d.count - 1, 0);
    console.log(`   • Duplicate records to remove: ${totalDupes}`);
  }

  let stats = { success: 0, skipped: 0, failed: 0, removed: 0, kept: 0 };

  if (missingDiagrams.length > 0) {
    console.log("\n📊 Phase 2: Adding missing diagrams...");
    const migrateResult = migrateMissingDiagrams(db, missingDiagrams, !APPLY);
    stats = { ...stats, ...migrateResult };
  }

  if (duplicateDiagrams.length > 0) {
    console.log("\n📊 Phase 3: Deduplicating diagrams...");
    const dedupeResult = migrateDuplicateDiagrams(
      db,
      duplicateDiagrams,
      !APPLY,
    );
    stats = { ...stats, ...dedupeResult };
  }

  db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
  db.close();

  console.log("\n" + "─".repeat(50));
  console.log("📈 Migration Summary:");
  console.log(`   • Diagrams added:  ${stats.success}`);
  console.log(`   • Diagrams removed: ${stats.removed}`);
  console.log(`   • Skipped:         ${stats.skipped}`);
  console.log(`   • Failed:          ${stats.failed}`);

  if (!APPLY) {
    console.log("\n✅ Preview complete. Run with --apply to apply changes.");
  } else {
    console.log("\n✅ Migration complete!");
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
