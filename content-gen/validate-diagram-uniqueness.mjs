import { Database } from "bun:sqlite";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH =
  process.env.DB_PATH || path.resolve(__dirname, "../data/devprep.db");

function hashSvg(svg) {
  const normalized = svg.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();
  return crypto.createHash("md5").update(normalized).digest("hex");
}

function extractDiagram(data) {
  try {
    const obj = typeof data === "string" ? JSON.parse(data) : data;
    if (obj.sections) {
      const diagramSection = obj.sections.find(
        (s) => s.type === "diagram" && s.svgContent,
      );
      return diagramSection ? diagramSection.svgContent : null;
    }
  } catch {}
  return null;
}

function openDb() {
  const db = new Database(DB_PATH);
  return db;
}

function findDuplicateDiagrams() {
  const db = openDb();

  const rows = db
    .prepare(
      "SELECT id, channel_id, content_type, data, created_at FROM generated_content WHERE content_type = 'question'",
    )
    .all();

  const hashMap = new Map();
  const duplicates = [];

  for (const row of rows) {
    const svg = extractDiagram(row.data);
    if (!svg) continue;

    const hash = hashSvg(svg);

    if (hashMap.has(hash)) {
      const existing = hashMap.get(hash);
      duplicates.push({
        duplicate: row,
        original: existing,
        hash,
      });
    } else {
      hashMap.set(hash, { ...row, hash });
    }
  }

  db.close();
  return duplicates;
}

function deleteDuplicate(duplicateId) {
  const db = openDb();
  db.prepare("DELETE FROM generated_content WHERE id = ?").run(duplicateId);
  db.close();
  console.log(`  Deleted duplicate: ${duplicateId}`);
}

function main() {
  console.log("🔍 DevPrep Diagram Uniqueness Validator\n");
  console.log(`Database: ${DB_PATH}\n`);

  const duplicates = findDuplicateDiagrams();

  if (duplicates.length === 0) {
    console.log("✅ No duplicate diagrams found!\n");
    return;
  }

  console.log(`⚠️  Found ${duplicates.length} duplicate diagram(s):\n`);

  const toDelete = [];

  for (const dup of duplicates) {
    console.log(`Duplicate pair:`);
    console.log(
      `  Original: ${dup.original.id} (created: ${new Date(dup.original.created_at * 1000).toISOString()})`,
    );
    console.log(
      `  Duplicate: ${dup.duplicate.id} (created: ${new Date(dup.duplicate.created_at * 1000).toISOString()})`,
    );
    console.log(`  Hash: ${dup.hash.slice(0, 16)}...`);
    console.log("");

    toDelete.push(dup.duplicate.id);
  }

  console.log("Auto-deleting duplicates (keeping oldest)...\n");

  for (const id of toDelete) {
    deleteDuplicate(id);
  }

  console.log(`\n✅ Removed ${toDelete.length} duplicate(s).\n`);
}

main();
