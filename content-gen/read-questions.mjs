/**
 * Read questions from DB for diagram generation
 * Outputs full question data as JSON
 */
import path from "path";
import { fileURLToPath } from "url";
import { Database } from "bun:sqlite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH =
  process.env.DB_PATH || path.resolve(__dirname, "../data/devprep.db");

const args = process.argv.slice(2);
const idsFile = args.find((a) => a.endsWith(".json"));
const allFlag = args.includes("--all");

const db = new Database(DB_PATH, { readonly: true });

let questions;
if (idsFile) {
  const fs = await import("fs");
  const items = JSON.parse(fs.readFileSync(idsFile, "utf8"));
  const ids = items.map((i) => i.id);
  const placeholders = ids.map(() => "?").join(",");
  questions = db
    .prepare(
      `SELECT id, channel_id, data FROM generated_content WHERE id IN (${placeholders})`,
    )
    .all(...ids);
} else if (allFlag) {
  questions = db
    .prepare(
      `SELECT id, channel_id, data FROM generated_content WHERE content_type = 'question' AND data NOT LIKE '%test%' ORDER BY channel_id`,
    )
    .all();
} else {
  console.error("Usage: read-questions.mjs <batch.json> OR --all");
  process.exit(1);
}

const results = [];
for (const row of questions) {
  try {
    const data = JSON.parse(row.data);
    results.push({
      id: row.id,
      channel: row.channel_id,
      title: data.title || "No title",
      sectionCount: (data.sections || []).length,
      sections: (data.sections || []).map((s) => ({
        type: s.type,
        language: s.language,
        filename: s.filename,
        contentPreview: (s.content || "").substring(0, 200),
      })),
      fullSections: data.sections,
    });
  } catch (e) {
    results.push({ id: row.id, channel: row.channel_id, error: e.message });
  }
}

db.close();
console.log(JSON.stringify(results, null, 2));
