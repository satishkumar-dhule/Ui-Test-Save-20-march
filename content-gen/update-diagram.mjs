/**
 * DevPrep Diagram Update Helper
 *
 * Adds a diagram section to an existing question in the DB.
 * Reads the existing question, appends a new section, and saves back.
 *
 * Usage:
 *   node content-gen/update-diagram.mjs --id <question-id> --channel <channel> --diagram '<JSON>'
 *   node content-gen/update-diagram.mjs --id <question-id> --channel <channel> --diagram-file <file.json>
 *
 * Diagram JSON format:
 *   {
 *     "type": "code",
 *     "language": "json",
 *     "filename": "architecture-diagram.json",
 *     "content": "{ ... }"
 *   }
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Database } from "bun:sqlite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH =
  process.env.DB_PATH || path.resolve(__dirname, "../data/devprep.db");
const QUALITY_THRESHOLD = 0.5;

// ── Parse args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

function getFlag(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
}

const questionId = getFlag("id");
const channel = getFlag("channel");
const inlineDiagram = getFlag("diagram");
const diagramFile = getFlag("diagram-file");
const batchFile = getFlag("batch");

if (!questionId && !batchFile) {
  console.error(
    "Usage: update-diagram.mjs --id <question-id> --channel <channel> --diagram '<JSON>'",
  );
  console.error("   OR: update-diagram.mjs --batch <batch-file.json>");
  console.error(
    "\nBatch file format: [{ id, channel, diagram: { type, language, filename, content } }]",
  );
  process.exit(1);
}

// ── Quality Assessment (same as save-content) ─────────────────────────────────
function assessQuality(data, type) {
  const requirements = {
    question: ["id", "title", "sections"],
    flashcard: ["id", "front", "back"],
    exam: ["id", "question", "choices", "correct", "explanation"],
    voice: ["id", "prompt", "keyPoints"],
    coding: ["id", "title", "description", "starterCode"],
  };
  const required = requirements[type] || [];
  let score = required.filter((f) => data[f]).length;
  const str = JSON.stringify(data);
  if (str.length > 300) score++;
  if (str.length > 800) score++;
  if (
    type === "question" &&
    data.sections?.some((s) => s.type === "code" && s.content?.length > 30)
  )
    score++;
  // Bonus for having a diagram
  if (
    data.sections?.some(
      (s) =>
        s.filename?.includes("diagram") ||
        s.filename?.includes("architecture") ||
        s.filename?.includes("flow"),
    )
  )
    score++;
  if (str.includes("REPLACE") || str.includes("TODO")) score--;
  return Math.max(0, Math.min(1, score / (required.length + 5)));
}

// ── Process single update ─────────────────────────────────────────────────────
function updateQuestion(db, id, channelName, diagram) {
  const row = db
    .prepare("SELECT data, channel_id FROM generated_content WHERE id = ?")
    .get(id);
  if (!row) {
    console.error(`❌ Question ${id} not found`);
    return false;
  }

  let data;
  try {
    data = JSON.parse(row.data);
  } catch (e) {
    console.error(`❌ Failed to parse data for ${id}: ${e.message}`);
    return false;
  }

  // Check if diagram already exists
  const existingDiagram = (data.sections || []).find(
    (s) =>
      s.type === "code" &&
      (s.filename?.includes("diagram") ||
        s.filename?.includes("architecture") ||
        s.filename?.includes("flow") ||
        s.filename?.includes("topology") ||
        s.filename?.includes("pipeline")),
  );
  if (existingDiagram) {
    console.log(`⏭️  ${id} already has diagram, skipping`);
    return false;
  }

  // Add diagram section
  if (!data.sections) data.sections = [];
  data.sections.push(diagram);

  // Also update the short/eli5 section to reference the diagram
  const shortSection = data.sections.find((s) => s.type === "short");
  if (shortSection && !shortSection.content.includes("diagram")) {
    shortSection.content +=
      "\n\nRefer to the architecture diagram for the visual representation of this design.";
  }

  const qualityScore = assessQuality(data, "question");
  const status = qualityScore >= QUALITY_THRESHOLD ? "approved" : "pending";
  const actualChannel = channelName || row.channel_id;

  db.prepare(
    `
    INSERT OR REPLACE INTO generated_content
    (id, channel_id, content_type, data, quality_score, created_at, updated_at, status, generated_by)
    VALUES (?, ?, ?, ?, ?, strftime('%s','now'), strftime('%s','now'), ?, ?)
  `,
  ).run(
    id,
    actualChannel,
    "question",
    JSON.stringify(data),
    qualityScore,
    status,
    "diagram-agent",
  );

  console.log(
    `✅ ${id} [${actualChannel}] quality=${(qualityScore * 100).toFixed(0)}%`,
  );
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const db = new Database(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");

let success = 0,
  skipped = 0,
  failed = 0;

if (batchFile) {
  // Batch mode: read array of { id, channel, diagram }
  const batch = JSON.parse(fs.readFileSync(batchFile, "utf8"));
  console.log(`Processing batch of ${batch.length} diagrams...`);

  for (const item of batch) {
    try {
      if (updateQuestion(db, item.id, item.channel, item.diagram)) {
        success++;
      } else {
        skipped++;
      }
    } catch (e) {
      console.error(`❌ Error processing ${item.id}: ${e.message}`);
      failed++;
    }
  }
} else {
  // Single mode
  let diagram;
  if (inlineDiagram) {
    diagram = JSON.parse(inlineDiagram);
  } else if (diagramFile) {
    diagram = JSON.parse(fs.readFileSync(diagramFile, "utf8"));
  } else {
    // Read from stdin
    const stdin = fs.readFileSync("/dev/stdin", "utf8");
    diagram = JSON.parse(stdin);
  }

  if (updateQuestion(db, questionId, channel, diagram)) {
    success++;
  } else {
    skipped++;
  }
}

db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
db.close();

console.log(
  `\n📊 Results: ${success} updated, ${skipped} skipped, ${failed} failed`,
);
