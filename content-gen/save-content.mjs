/**
 * DevPrep Content Save Helper
 *
 * Called by opencode subagents to persist generated content to SQLite.
 * Reads a JSON file path as first argument, with --channel and --type flags.
 *
 * Usage:
 *   node content-gen/save-content.mjs <json-file> --channel javascript --type question
 *   node content-gen/save-content.mjs --channel react --type flashcard --json '{"id":"..."}'
 */

import { Database } from "bun:sqlite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { getTemplateForContent, hashDiagram } from "./diagram-templates.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH =
  process.env.DB_PATH || path.resolve(__dirname, "../data/devprep.db");
const QUALITY_THRESHOLD = 0.5;
const ENABLE_DIAGRAM_CHECK = true;

// ── Parse args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

function getFlag(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
}

const channel = getFlag("channel");
const type = getFlag("type");
const inlineJson = getFlag("json");
const agentId = getFlag("agent") || "opencode-agent";

// JSON file is the first positional arg (if not --json flag)
const jsonFile = args.find((a) => !a.startsWith("--") && a.endsWith(".json"));

if (!channel || !type) {
  console.error(
    "Usage: save-content.mjs <file.json|--json '{...}'> --channel <id> --type <type>",
  );
  process.exit(1);
}

// ── Load JSON ─────────────────────────────────────────────────────────────────
let rawJson;
if (inlineJson) {
  rawJson = inlineJson;
} else if (jsonFile) {
  rawJson = fs.readFileSync(jsonFile, "utf8");
} else {
  // Read from stdin as fallback
  rawJson = fs.readFileSync("/dev/stdin", "utf8");
}

// Try to extract JSON from markdown code fences if needed
function extractJson(raw) {
  // Handle triple-backtick markdown with or without language specifier
  const fenceRe = /```(?:json|javascript|python|yaml|hcl)?\s*\n?([\s\S]*?)```/;
  const m = raw.match(fenceRe);
  if (m) return m[1].trim();

  // Handle single backticks with JSON
  const singleBacktick = /`({[\s\S]*?})`/;
  const m2 = raw.match(singleBacktick);
  if (m2) return m2[1].trim();

  // Find first { and try to parse to closing }
  const start = raw.indexOf("{");
  if (start !== -1) {
    let depth = 0,
      inStr = false,
      esc = false;
    for (let i = start; i < raw.length; i++) {
      const c = raw[i];
      if (esc) {
        esc = false;
        continue;
      }
      if (c === "\\" && inStr) {
        esc = true;
        continue;
      }
      if (c === '"') {
        inStr = !inStr;
        continue;
      }
      if (inStr) continue;
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) return raw.slice(start, i + 1).trim();
      }
    }
  }
  return raw.trim();
}

function tryParse(str) {
  try {
    return JSON.parse(str);
  } catch {}
  // Handle trailing commas
  try {
    return JSON.parse(str.replace(/,(\s*[}\]])/g, "$1"));
  } catch {}
  // Handle missing quotes around keys
  try {
    const fixed = str.replace(
      /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g,
      '$1"$2":',
    );
    return JSON.parse(fixed);
  } catch {}
  // Handle single quotes
  try {
    return JSON.parse(str.replace(/'/g, '"'));
  } catch {}
  return null;
}

const jsonStr = extractJson(rawJson);
const data = tryParse(jsonStr);

if (!data || typeof data !== "object") {
  // Log failure for debugging
  const logPath = "/tmp/save-failure-" + Date.now() + ".log";
  fs.writeFileSync(
    logPath,
    JSON.stringify(
      {
        channel,
        type,
        rawLength: rawJson.length,
        rawPreview: rawJson.slice(0, 500),
        jsonStrPreview: jsonStr ? jsonStr.slice(0, 500) : "empty",
      },
      null,
      2,
    ),
  );
  console.error(
    `❌ Failed to parse JSON for ${channel}/${type}. Debug info saved to ${logPath}`,
  );
  console.error("Raw (first 300):", rawJson.slice(0, 300));
  process.exit(1);
}

// ── Diagram Validation ────────────────────────────────────────────────────────
function hasDiagram(data) {
  if (!data.sections) return false;
  return data.sections.some(
    (s) =>
      s.type === "diagram" ||
      (s.type === "code" &&
        (s.filename?.includes("diagram") ||
          s.filename?.includes("architecture") ||
          s.filename?.includes("flow") ||
          s.filename?.includes("sequence") ||
          s.filename?.includes("topology") ||
          s.filename?.includes("pipeline"))),
  );
}

function addFallbackDiagram(data, channelId) {
  const template = getTemplateForContent(
    channelId,
    data.content_type || "question",
  );
  if (!data.sections) data.sections = [];
  data.sections.push(template);
  return template;
}

function checkDiagramUniqueness(db, svgContent) {
  const hash = hashDiagram(svgContent);
  const existing = db
    .prepare(
      `SELECT id, channel_id FROM generated_content 
       WHERE data LIKE '%' || ? || '%' LIMIT 10`,
    )
    .all(hash);
  return { hash, duplicates: existing };
}

function validateDiagramUniqueness(db, data, channelId, type) {
  if (!ENABLE_DIAGRAM_CHECK || type !== "question") return { valid: true };

  const diagrams = (data.sections || []).filter(
    (s) => s.type === "diagram" && s.svgContent,
  );

  for (const diagram of diagrams) {
    const { hash, duplicates } = checkDiagramUniqueness(db, diagram.svgContent);
    if (duplicates.length > 0) {
      return {
        valid: false,
        error: `Duplicate diagram detected (hash: ${hash}). ${duplicates.length} existing record(s) with identical diagram.`,
        duplicates,
      };
    }
  }

  return { valid: true };
}

// ── Quality Assessment ────────────────────────────────────────────────────────
// Flashcard quality constraints
const FLASHCARD_FRONT_MAX = 120; // characters
const FLASHCARD_BACK_MAX = 600; // characters (allows code blocks)

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

  if (type === "flashcard") {
    const front = data.front || "";
    const back = data.back || "";
    // Reward concise front
    if (front.length > 0 && front.length <= FLASHCARD_FRONT_MAX) score++;
    // Reward structured back (bullet lists or numbered lists)
    const hasBullets = /^[-*]\s/m.test(back) || /^\d+\.\s/m.test(back);
    if (hasBullets) score += 2;
    // Reward code examples (either inline backtick or fenced block in back)
    if (/`/.test(back)) score++;
    // Penalize long unstructured prose (no newlines, > 300 chars)
    if (back.length > 300 && !hasBullets && !back.includes("\n")) score -= 2;
    // Penalize over-length back
    if (back.length > FLASHCARD_BACK_MAX) score--;
    // Bonus for mnemonic
    if (data.mnemonic) score++;
  }

  if (type === "coding" && data.starterCode) {
    if (data.starterCode?.javascript?.length > 30) score++;
    if (data.starterCode?.python?.length > 30) score++;
    if (data.solution) score++;
  }
  if (
    type === "question" &&
    data.sections?.some((s) => s.type === "code" && s.content?.length > 30)
  )
    score++;
  if (hasDiagram(data)) score++;
  if (str.includes("REPLACE") || str.includes("TODO")) score--;
  return Math.max(0, Math.min(1, score / (required.length + 5)));
}

// ── Ensure ID ─────────────────────────────────────────────────────────────────
if (!data.id) {
  data.id = `${type.slice(0, 3)}-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;
}

// ── Save ──────────────────────────────────────────────────────────────────────
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS generated_content (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    content_type TEXT NOT NULL,
    data TEXT NOT NULL,
    quality_score REAL DEFAULT 0,
    embedding_id TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    status TEXT DEFAULT 'pending',
    generated_by TEXT,
    generation_time_ms INTEGER,
    UNIQUE(id)
  );
  CREATE TABLE IF NOT EXISTS generation_logs (
    id TEXT PRIMARY KEY,
    channel_id TEXT,
    content_type TEXT,
    success INTEGER,
    error_message TEXT,
    duration_ms INTEGER,
    model TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );
  CREATE INDEX IF NOT EXISTS idx_type ON generated_content(content_type);
  CREATE INDEX IF NOT EXISTS idx_channel ON generated_content(channel_id);
`);

if (!hasDiagram(data)) {
  console.log(`   📊 No diagram found, adding fallback...`);
  const template = addFallbackDiagram(data, channel);
  console.log(`   ✅ Added fallback diagram: ${template.filename}`);
}

const uniquenessCheck = validateDiagramUniqueness(db, data, channel, type);
if (!uniquenessCheck.valid) {
  console.error(`❌ Diagram validation failed: ${uniquenessCheck.error}`);
  console.error(
    `   Duplicates: ${uniquenessCheck.duplicates.map((d) => d.id).join(", ")}`,
  );
  db.close();
  process.exit(1);
}

const qualityScore = assessQuality(data, type);
const status = qualityScore >= QUALITY_THRESHOLD ? "approved" : "pending";

db.prepare(
  `
  INSERT OR REPLACE INTO generated_content
  (id, channel_id, content_type, data, quality_score, created_at, updated_at, status, generated_by)
  VALUES (?, ?, ?, ?, ?, strftime('%s','now'), strftime('%s','now'), ?, ?)
`,
).run(
  data.id,
  channel,
  type,
  JSON.stringify(data),
  qualityScore,
  status,
  agentId,
);

db.prepare(
  `
  INSERT INTO generation_logs (id, channel_id, content_type, success, duration_ms, model)
  VALUES (?, ?, ?, 1, 0, ?)
`,
).run(
  `log-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
  channel,
  type,
  agentId,
);

// Flush WAL into main .db file so the browser's sql.js can see new data
db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
db.close();

console.log(
  `✅ Saved ${type} [${data.id}] for "${channel}" quality=${(qualityScore * 100).toFixed(0)}% status=${status}`,
);
