/**
 * DevPrep Content Generator — powered by opencode-ai
 *
 * Generates high-quality study content with:
 * - Local SQLite database storage
 * - Vector DB embedding generation
 * - Quality scoring
 * - Comprehensive content types
 *
 * Usage:
 *   node generate-content.mjs                              # auto-detect
 *   TARGET_CHANNEL=javascript CONTENT_TYPE=question node generate-content.mjs
 *   TARGET_CHANNEL=javascript CONTENT_TYPE=all COUNT=2 node generate-content.mjs
 */

import { spawn } from "child_process";
import { Database } from "bun:sqlite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { loadChannelsFromDb } from "./db-channels.mjs";
import {
  generateDiagramSync,
  initDiagramDb,
  diagramExists,
  saveDiagram,
} from "./generate-diagrams.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH =
  process.env.DB_PATH || path.resolve(__dirname, "../data/devprep.db");
const VECTOR_DIR =
  process.env.VECTOR_DIR || path.resolve(__dirname, "../data/vectors");

// ── Config ────────────────────────────────────────────────────────────────────
const TARGET_CHANNEL = process.env.TARGET_CHANNEL || "";
const CONTENT_TYPE = process.env.CONTENT_TYPE || "auto";
const COUNT = parseInt(process.env.COUNT || "1", 10);
const LOW_THRESHOLD = 5;
const ENABLE_VECTOR_DB = process.env.ENABLE_VECTOR_DB !== "false";
const QUALITY_THRESHOLD = 0.5;

function openDb() {
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

    CREATE TABLE IF NOT EXISTS quality_feedback (
      id TEXT PRIMARY KEY,
      content_id TEXT NOT NULL,
      feedback_type TEXT NOT NULL,
      user_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (content_id) REFERENCES generated_content(id)
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
    CREATE INDEX IF NOT EXISTS idx_status ON generated_content(status);
    CREATE INDEX IF NOT EXISTS idx_quality ON generated_content(quality_score);

    CREATE TABLE IF NOT EXISTS generated_diagrams (
      id TEXT PRIMARY KEY,
      hash TEXT UNIQUE NOT NULL,
      svg_content TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      question_id TEXT,
      content_hash TEXT,
      diagram_type TEXT,
      keywords TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_diag_hash ON generated_diagrams(hash);
    CREATE INDEX IF NOT EXISTS idx_diag_channel ON generated_diagrams(channel_id);
    CREATE INDEX IF NOT EXISTS idx_diag_question ON generated_diagrams(question_id);
  `);
  return db;
}

// ── Channels — loaded from DB (single source of truth) ────────────────────────
const CHANNELS = (() => {
  const ch = loadChannelsFromDb(DB_PATH);
  if (!ch || ch.length === 0) {
    console.error(
      "❌ No channels found in DB. Make sure data/devprep.db has a populated 'channels' table.",
    );
    process.exit(1);
  }
  return ch;
})();

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;
}

function countGenerated(db, type) {
  const rows = db
    .prepare(
      "SELECT channel_id, COUNT(*) as n FROM generated_content WHERE content_type = ? GROUP BY channel_id",
    )
    .all(type);
  const map = {};
  for (const r of rows) map[r.channel_id] = r.n;
  return map;
}

function findLowestChannel(db, type) {
  const counts = countGenerated(db, type);
  const sorted = CHANNELS.map((ch) => ({
    channel: ch,
    count: counts[ch.id] || 0,
  }))
    .filter((x) => x.count < LOW_THRESHOLD)
    .sort((a, b) => a.count - b.count);
  return sorted.length > 0 ? sorted[0] : null;
}

function saveToDb(db, id, channelId, type, dataObj, generationTime, model) {
  const qualityScore = assessQuality(dataObj, type);
  const embeddingId = ENABLE_VECTOR_DB ? `${type}s/${id}` : null;

  db.prepare(
    `
    INSERT OR REPLACE INTO generated_content 
    (id, channel_id, content_type, data, quality_score, embedding_id, created_at, updated_at, status, generated_by, generation_time_ms)
    VALUES (?, ?, ?, ?, ?, ?, strftime('%s', 'now'), strftime('%s', 'now'), ?, ?, ?)
  `,
  ).run(
    id,
    channelId,
    type,
    JSON.stringify(dataObj),
    qualityScore,
    embeddingId,
    qualityScore >= QUALITY_THRESHOLD ? "approved" : "pending",
    model || "opencode-default",
    generationTime || 0,
  );

  logGeneration(db, channelId, type, true, null, generationTime, model);
  console.log(
    `   ✅ Saved ${type} [${id}] for "${channelId}" (quality: ${(qualityScore * 100).toFixed(0)}%)`,
  );

  return qualityScore;
}

function logGeneration(
  db,
  channelId,
  type,
  success,
  errorMsg,
  durationMs,
  model,
) {
  const logId = makeId("log");
  db.prepare(
    `
    INSERT INTO generation_logs (id, channel_id, content_type, success, error_message, duration_ms, model)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(logId, channelId, type, success ? 1 : 0, errorMsg, durationMs, model);
}

const FLASHCARD_FRONT_MAX = 120;
const FLASHCARD_BACK_MAX = 600;

const sessionDiagramHashes = new Set();

function hashSvg(svg) {
  const normalized = svg.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();
  return crypto.createHash("md5").update(normalized).digest("hex");
}

function extractDiagram(data, type) {
  if (type === "question" && data.sections) {
    const diagramSection = data.sections.find(
      (s) => s.type === "diagram" && s.svgContent,
    );
    return diagramSection ? diagramSection.svgContent : null;
  }
  return null;
}

function validateDiagramQuality(svgContent) {
  if (!svgContent || typeof svgContent !== "string")
    return { valid: false, reason: "missing", score: -3 };
  const trimmed = svgContent.trim();
  if (trimmed.length < 50)
    return { valid: false, reason: "empty_too_small", score: -3 };
  if (!trimmed.includes('viewBox="'))
    return { valid: false, reason: "no_viewbox", score: -3 };
  const genericPatterns = [
    "TODO",
    "placeholder",
    "REPLACE THIS",
    "example diagram",
    "sample diagram",
  ];
  const lowerSvg = trimmed.toLowerCase();
  for (const pattern of genericPatterns) {
    if (lowerSvg.includes(pattern.toLowerCase()))
      return { valid: false, reason: "generic_placeholder", score: -3 };
  }
  return { valid: true, reason: "valid", score: 2 };
}

function assessQuality(data, type) {
  let score = 0;
  const requirements = {
    question: ["id", "title", "sections"],
    flashcard: ["id", "front", "back"],
    exam: ["id", "question", "choices", "correct", "explanation"],
    voice: ["id", "prompt", "keyPoints"],
    coding: ["id", "title", "description", "starterCode"],
  };

  const required = requirements[type] || [];
  for (const field of required) {
    if (data[field]) score += 1;
  }

  const dataStr = JSON.stringify(data);
  if (dataStr.length > 300) score += 1;
  if (dataStr.length > 800) score += 1;

  if (type === "flashcard") {
    const front = data.front || "";
    const back = data.back || "";
    if (front.length > 0 && front.length <= FLASHCARD_FRONT_MAX) score += 1;
    const hasBullets = /^[-*]\s/m.test(back) || /^\d+\.\s/m.test(back);
    if (hasBullets) score += 2;
    if (/`/.test(back)) score += 1;
    if (back.length > 300 && !hasBullets && !back.includes("\n")) score -= 2;
    if (back.length > FLASHCARD_BACK_MAX) score -= 1;
    if (data.mnemonic) score += 1;

    const svgContent = data.diagram?.svgContent || null;
    const diagramResult = validateDiagramQuality(svgContent);
    score += diagramResult.score;
    if (diagramResult.valid) {
      const svgHash = hashSvg(svgContent);
      if (sessionDiagramHashes.has(svgHash)) {
        score -= 2;
      } else {
        sessionDiagramHashes.add(svgHash);
      }
    }
  } else if (type === "coding") {
    const starterCode = data.starterCode;
    if (starterCode && typeof starterCode === "object") {
      if (starterCode.javascript && starterCode.javascript.length > 30)
        score += 1;
      if (starterCode.python && starterCode.python.length > 30) score += 1;
    }
    if (data.solution) score += 1;

    const svgContent = data.diagram?.svgContent || null;
    const diagramResult = validateDiagramQuality(svgContent);
    score += diagramResult.score;
    if (diagramResult.valid) {
      const svgHash = hashSvg(svgContent);
      if (sessionDiagramHashes.has(svgHash)) {
        score -= 2;
      } else {
        sessionDiagramHashes.add(svgHash);
      }
    }
  } else if (type === "exam") {
    const svgContent = data.diagram?.svgContent || null;
    const diagramResult = validateDiagramQuality(svgContent);
    score += diagramResult.score;
    if (diagramResult.valid) {
      const svgHash = hashSvg(svgContent);
      if (sessionDiagramHashes.has(svgHash)) {
        score -= 2;
      } else {
        sessionDiagramHashes.add(svgHash);
      }
    }
  } else if (type === "voice") {
    const svgContent = data.diagram?.svgContent || null;
    const diagramResult = validateDiagramQuality(svgContent);
    score += diagramResult.score;
    if (diagramResult.valid) {
      const svgHash = hashSvg(svgContent);
      if (sessionDiagramHashes.has(svgHash)) {
        score -= 2;
      } else {
        sessionDiagramHashes.add(svgHash);
      }
    }
  } else if (type === "question" && data.sections) {
    const hasCode = data.sections.some(
      (s) => s.type === "code" && s.content && s.content.length > 30,
    );
    if (hasCode) score += 1;

    const svgContent = extractDiagram(data, type);
    const diagramResult = validateDiagramQuality(svgContent);
    score += diagramResult.score;

    if (diagramResult.valid) {
      const svgHash = hashSvg(svgContent);
      if (sessionDiagramHashes.has(svgHash)) {
        score -= 2;
      } else {
        sessionDiagramHashes.add(svgHash);
      }
    }
  }

  if (dataStr.includes("REPLACE") || dataStr.includes("TODO")) {
    score -= 1;
  }

  const maxScore = required.length + 8;
  return Math.max(0, Math.min(1, score / maxScore));
}

// ── opencode runner ───────────────────────────────────────────────────────────
function runOpencode(prompt, modelOverride) {
  return new Promise((resolve, reject) => {
    const binPath = path.resolve(__dirname, "node_modules/.bin/opencode");
    const bin = fs.existsSync(binPath) ? binPath : "opencode";
    const workDir = "/tmp/opencode-content-gen";
    fs.mkdirSync(workDir, { recursive: true });

    const args = ["run", "--dir", workDir];
    if (modelOverride) {
      args.push("--model", modelOverride);
    }
    args.push(prompt);

    const child = spawn(bin, args, {
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`opencode exited ${code}: ${stderr.slice(0, 500)}`));
      } else {
        resolve(stdout);
      }
    });

    child.on("error", (err) => {
      reject(new Error(`Cannot start opencode: ${err.message}`));
    });
  });
}

// ── JSON extractor ────────────────────────────────────────────────────────────
function extractJson(raw) {
  const fenceRe = /```(?:json|typescript|ts|js|javascript)?\s*\n([\s\S]*?)```/g;
  let bestFence = null;
  let m;
  while ((m = fenceRe.exec(raw)) !== null) {
    if (!bestFence || m[1].length > bestFence.length) bestFence = m[1];
  }
  if (bestFence) return bestFence.trim();

  const anyFence = raw.match(/```\s*\n([\s\S]*?)```/);
  if (anyFence) return anyFence[1].trim();

  const start = raw.indexOf("{");
  if (start !== -1) {
    let depth = 0;
    let inString = false;
    let escape = false;
    let end = -1;
    for (let i = start; i < raw.length; i++) {
      const c = raw[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\" && inString) {
        escape = true;
        continue;
      }
      if (c === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end !== -1) return raw.slice(start, end + 1).trim();
  }
  return raw.trim();
}

function tryParseJson(str) {
  try {
    return JSON.parse(str);
  } catch {}

  let fix1 = str.replace(/,(\s*[}\]])/g, "$1");
  try {
    return JSON.parse(fix1);
  } catch {}

  const fix2 = fix1.replace(/(?<!\\)\n(?=[^"]*")/g, "\\n");
  try {
    return JSON.parse(fix2);
  } catch {}

  const lastBrace = str.lastIndexOf("}");
  if (lastBrace !== -1) {
    const trimmed = str.slice(0, lastBrace + 1);
    const fix3 = trimmed.replace(/,(\s*[}\]])/g, "$1");
    try {
      return JSON.parse(fix3);
    } catch {}
  }

  return null;
}

// ── Enhanced Prompts ───────────────────────────────────────────────────────────
function makePrompt(type, channel, id) {
  const difficulty = channel.difficulty || "intermediate";
  const domain = channel.name;

  switch (type) {
    case "question":
      return `
You are creating expert-level technical interview questions for ${domain}. Generate ONE comprehensive question.

CRITICAL REQUIREMENTS:
- Question must be ADVANCED (not basic/beginner level)
- Include real-world context and complexity
- Code examples MUST be runnable and complete
- Use proper markdown with **bold** for key terms
- Tags must be from: ${JSON.stringify(channel.tags)}

DIAGRAM REQUIREMENT (MANDATORY):
- Generate a UNIQUE, TOPIC-SPECIFIC SVG diagram that visually explains the concept
- Diagram must be relevant to THIS specific question (not generic)
- Include specific values, labels, or concepts from the question content
- SVG must use dark theme with colors: #56d364 (green), #388bfd (blue), #d2a8ff (purple), #ffa657 (orange), #e3b341 (yellow), #21262d/#161b22 (backgrounds)
- SVG viewBox should be appropriate size (e.g., 600x400 or 600x350)

QUALITY CHECK: If no diagram section is present, the content is INVALID.

Return ONLY a valid JSON object in a json code fence. No other text.

\`\`\`json
{
  "id": "${id}",
  "number": ${1000 + Math.floor(Math.random() * 9000)},
  "title": "A specific, advanced ${domain} interview question (be specific, not generic)",
  "tags": ["${channel.tags.slice(0, 2).join('", "')}"],
  "difficulty": "${difficulty}",
  "votes": ${Math.floor(Math.random() * 500) + 100},
  "views": "${Math.floor(Math.random() * 15) + 2}k",
  "askedBy": "devprep-ai",
  "askedAt": "${new Date().toISOString().split("T")[0]}",
  "sections": [
    {
      "type": "short",
      "content": "Comprehensive 2-3 paragraph explanation with **bold key terms** and \`inline code\`. Address common misconceptions."
    },
    {
      "type": "diagram",
      "title": "Topic-Specific Diagram Title",
      "description": "Brief description of what the diagram illustrates",
      "svgContent": "<svg viewBox=\"0 0 600 400\" xmlns=\"http://www.w3.org/2000/svg\" font-family=\"system-ui, sans-serif\"><rect x=\"10\" y=\"10\" width=\"580\" height=\"380\" rx=\"8\" fill=\"#21262d\" stroke=\"#30363d\" stroke-width=\"1.5\"/><text x=\"300\" y=\"35\" text-anchor=\"middle\" fill=\"#e3b341\" font-size=\"14\" font-weight=\"700\">DIAGRAM TITLE</text><!-- Add specific diagram elements here --></svg>"
    },
    {
      "type": "code",
      "language": "${getLanguageForChannel(channel.id)}",
      "content": "COMPLETE runnable code demonstrating the concept. Include comments explaining each step.",
      "filename": "example.${getExtension(channel.id)}"
    },
    {
      "type": "eli5",
      "content": "A simple analogy a beginner would understand. Use everyday objects or situations."
    }
  ],
  "relatedQuestions": ["concept 1", "concept 2"],
  "commonMistakes": ["mistake 1", "mistake 2"]
}
\`\`\``;

    case "flashcard":
      return `
Generate ONE high-quality flashcard for ${domain} interview preparation.

STRICT FORMAT REQUIREMENTS:
- front: concise question, MAX 100 characters
- back: MUST use markdown bullet lists (- item) or numbered lists (1. item).
  NO long prose paragraphs. 3-6 bullets, max 400 characters total.
  Optional: fenced code block using \`\`\`lang ... \`\`\` syntax inside the back field.
- hint: one sentence (max 80 chars), guides without revealing the answer
- mnemonic: short memory trick (max 80 chars) — optional
- commonConfusion: one sentence misconception (max 100 chars) — optional
- Use **bold** for key terms; use \`backtick\` for inline code/commands

DIAGRAM REQUIREMENT (MANDATORY):
- Generate a UNIQUE, TOPIC-SPECIFIC SVG diagram that visually explains the flashcard concept
- Diagram must illustrate the KEY CONCEPT from the front/back (not generic)
- Consider: flowcharts for processes, state diagrams for concepts, comparison tables for alternatives, or annotated code blocks
- SVG must use dark theme with colors: #56d364 (green), #388bfd (blue), #d2a8ff (purple), #ffa657 (orange), #e3b341 (yellow)
- Keep diagrams minimal but informative (600x300 or similar)

QUALITY CHECK: If no diagram section is present, the content is INVALID.

BAD back (do NOT write prose paragraphs):
"MVCC works by creating new row versions instead of locking. This allows readers to never block writers..."

GOOD back (use bullet list format):
"- **MVCC** creates a new row version on UPDATE instead of locking\n- Readers never block writers; writers never block readers\n- Dead tuples cleaned by \`VACUUM\`"

Return ONLY valid JSON in a json code fence.

\`\`\`json
{
  "id": "${id}",
  "front": "Concise ${domain} concept question (max 100 chars)",
  "back": "- **Key concept**: brief explanation\\n- Second point with \`code\` example\\n- Third point",
  "hint": "One-line clue (max 80 chars)",
  "tags": ["${channel.tags.slice(0, 2).join('", "')}"],
  "difficulty": "${difficulty}",
  "category": "${domain}",
  "mnemonic": "Short memory aid (optional)",
  "commonConfusion": "Common misconception (optional, max 100 chars)",
  "diagram": {
    "title": "Flashcard Concept Diagram",
    "description": "What the diagram illustrates",
    "svgContent": "<svg viewBox=\"0 0 600 300\" xmlns=\"http://www.w3.org/2000/svg\" font-family=\"system-ui, sans-serif\"><rect x=\"10\" y=\"10\" width=\"580\" height=\"280\" rx=\"8\" fill=\"#21262d\" stroke=\"#30363d\" stroke-width=\"1.5\"/><text x=\"300\" y=\"35\" text-anchor=\"middle\" fill=\"#e3b341\" font-size=\"14\" font-weight=\"700\">CONCEPT DIAGRAM</text><!-- Add specific diagram elements --></svg>"
  }
}
\`\`\``;

    case "exam":
      return `
Generate ONE realistic ${domain} certification exam question (${channel.certCode || "generic"}).

CRITICAL REQUIREMENTS:
- Scenario-based question (not simple definition)
- 4 options: 1 correct + 3 plausible distractors
- Distractors must be realistic (not obviously wrong)
- 2-3 sentence explanation of why correct answer is right
- Mention why each distractor is wrong
- Include domain/topic classification

DIAGRAM REQUIREMENT (MANDATORY):
- Generate a UNIQUE, TOPIC-SPECIFIC SVG diagram that illustrates the exam scenario
- For scenarios: show the architecture, flow, or setup described
- For comparisons: show side-by-side or comparison matrix
- For processes: show step-by-step flow with decision points
- SVG must use dark theme with colors: #56d364 (green), #388bfd (blue), #d2a8ff (purple), #ffa657 (orange), #e3b341 (yellow)
- Diagrams should help visualize the exam scenario (600x350 recommended)

QUALITY CHECK: If no diagram section is present, the content is INVALID.

Return ONLY a valid JSON object in a json code fence.

\`\`\`json
{
  "id": "${id}",
  "channelId": "${channel.id}",
  "certCode": "${channel.certCode || ""}",
  "domain": "Specific exam domain (e.g., Security, Networking, Compute)",
  "topic": "Specific topic within domain",
  "question": "Realistic scenario-based question with specific details",
  "choices": [
    { "id": "A", "text": "Correct answer" },
    { "id": "B", "text": "Plausible distractor 1" },
    { "id": "C", "text": "Plausible distractor 2" },
    { "id": "D", "text": "Plausible distractor 3" }
  ],
  "correct": "A",
  "explanation": "Why A is correct. Why B is wrong (common misconception). Why C is wrong (partial understanding). Why D is wrong (overgeneralization).",
  "difficulty": "${difficulty}",
  "points": 1,
  "timeEstimate": 90,
  "diagram": {
    "title": "Scenario/Concept Diagram",
    "description": "Visual representation of the exam scenario or concept",
    "svgContent": "<svg viewBox=\"0 0 600 350\" xmlns=\"http://www.w3.org/2000/svg\" font-family=\"system-ui, sans-serif\"><rect x=\"10\" y=\"10\" width=\"580\" height=\"330\" rx=\"8\" fill=\"#21262d\" stroke=\"#30363d\" stroke-width=\"1.5\"/><text x=\"300\" y=\"35\" text-anchor=\"middle\" fill=\"#e3b341\" font-size=\"14\" font-weight=\"700\">SCENARIO DIAGRAM</text><!-- Add scenario-specific elements --></svg>"
  }
}
\`\`\``;

    case "voice":
      return `
Generate ONE voice practice prompt for ${domain} technical interviews.

CRITICAL REQUIREMENTS:
- Prompt: 1-2 sentence interview question
- 4-6 key points the answer must cover
- Natural follow-up question
- Difficulty: ${difficulty}

DIAGRAM REQUIREMENT (MANDATORY):
- Generate a UNIQUE, TOPIC-SPECIFIC SVG diagram that helps visualize the concept to explain
- For processes: show the workflow or steps visually
- For comparisons: show pros/cons or feature comparison
- For architectures: show component relationships
- For concepts: show the key idea visually with annotations
- SVG must use dark theme with colors: #56d364 (green), #388bfd (blue), #d2a8ff (purple), #ffa657 (orange), #e3b341 (yellow)
- This diagram serves as a visual aid for the speaker to reference (600x320 recommended)

QUALITY CHECK: If no diagram section is present, the content is INVALID.

Return ONLY a valid JSON object in a json code fence.

\`\`\`json
{
  "id": "${id}",
  "channelId": "${channel.id}",
  "prompt": "1-2 sentence interview question to answer out loud",
  "type": "technical",
  "timeLimit": 120,
  "difficulty": "${difficulty}",
  "domain": "${domain}",
  "keyPoints": [
    "Key point 1 - must be mentioned in answer",
    "Key point 2 - critical concept",
    "Key point 3 - practical example",
    "Key point 4 - edge cases or gotchas"
  ],
  "followUp": "Natural follow-up question an interviewer might ask",
  "structure": {
    "introduction": "How to start",
    "body": "Main points to cover",
    "conclusion": "How to wrap up"
  },
  "commonMistakes": ["mistake 1", "mistake 2"],
  "diagram": {
    "title": "Concept Visual Aid",
    "description": "Visual representation to help structure the verbal explanation",
    "svgContent": "<svg viewBox=\"0 0 600 320\" xmlns=\"http://www.w3.org/2000/svg\" font-family=\"system-ui, sans-serif\"><rect x=\"10\" y=\"10\" width=\"580\" height=\"300\" rx=\"8\" fill=\"#21262d\" stroke=\"#30363d\" stroke-width=\"1.5\"/><text x=\"300\" y=\"35\" text-anchor=\"middle\" fill=\"#e3b341\" font-size=\"14\" font-weight=\"700\">CONCEPT VISUAL</text><!-- Add visual elements for speaking points --></svg>"
  }
}
\`\`\``;

    case "coding":
      return `
Generate ONE comprehensive coding challenge for ${domain}.

CRITICAL REQUIREMENTS:
- Complete runnable solution in JS, Python, and TypeScript
- Test cases covering normal, edge, and boundary cases
- Time/space complexity analysis
- Step-by-step approach explanation
- Real-world analogy (ELI5)

DIAGRAM REQUIREMENT (MANDATORY):
- Generate a UNIQUE, TOPIC-SPECIFIC SVG diagram that illustrates the problem
- For data structure problems: show the structure with annotations
- For algorithm problems: show the algorithm steps/flow
- For graph/tree problems: show example input/output with transformations
- Include sample input/output values in the diagram
- SVG must use dark theme with colors: #56d364 (green), #388bfd (blue), #d2a8ff (purple), #ffa657 (orange), #e3b341 (yellow)
- Diagrams should show before/after states for transformations (600x380 recommended)

QUALITY CHECK: If no diagram section is present, the content is INVALID.

Return ONLY a valid JSON object in a json code fence.

\`\`\`json
{
  "id": "${id}",
  "channelId": "${channel.id}",
  "title": "Descriptive Challenge Title",
  "slug": "kebab-case-slug",
  "difficulty": "${difficulty}",
  "tags": ["${channel.tags.slice(0, 3).join('", "')}"],
  "category": "${domain}",
  "timeEstimate": ${20 + Math.floor(Math.random() * 20)},
  "description": "2-3 sentence problem description with context and motivation",
  "constraints": [
    "Constraint 1 (e.g., 1 <= n <= 10^5)",
    "Constraint 2 (e.g., all values are positive)"
  ],
  "examples": [
    {
      "input": "Example input",
      "output": "Expected output",
      "explanation": "Walk through the example"
    }
  ],
  "starterCode": {
    "javascript": "// JavaScript solution skeleton\nfunction solution(input) {\n  // your code\n}\n\nconsole.log(solution(input));",
    "typescript": "// TypeScript solution skeleton\nfunction solution(input: string): number {\n  // your code\n}\n\nconsole.log(solution(input));",
    "python": "# Python solution skeleton\ndef solution(input):\n    # your code\n    pass\n\nprint(solution(input))"
  },
  "solution": {
    "javascript": "// Complete optimal JavaScript solution with detailed comments",
    "typescript": "// Complete optimal TypeScript solution",
    "python": "# Complete optimal Python solution"
  },
  "hints": [
    "Hint 1: Think about the data structure",
    "Hint 2: Consider edge cases",
    "Hint 3: Algorithm to use"
  ],
  "testCases": [
    { "input": "Normal case", "expected": "Expected output", "description": "Tests basic functionality" },
    { "input": "Edge case", "expected": "Edge output", "description": "Tests boundary conditions" }
  ],
  "eli5": "Real-world analogy for this problem",
  "approach": "## Step-by-Step Approach\n\n1. Step one\n2. Step two\n3. Step three",
  "complexity": {
    "time": "O(n log n)",
    "space": "O(n)",
    "explanation": "Why this is the optimal complexity"
  },
  "relatedConcepts": ["concept 1", "concept 2", "concept 3"],
  "commonErrors": ["error 1", "error 2"],
  "diagram": {
    "title": "Problem Visualization",
    "description": "Visual representation of input, transformation, and expected output",
    "svgContent": "<svg viewBox=\"0 0 600 380\" xmlns=\"http://www.w3.org/2000/svg\" font-family=\"system-ui, sans-serif\"><rect x=\"10\" y=\"10\" width=\"580\" height=\"360\" rx=\"8\" fill=\"#21262d\" stroke=\"#30363d\" stroke-width=\"1.5\"/><text x=\"300\" y=\"35\" text-anchor=\"middle\" fill=\"#e3b341\" font-size=\"14\" font-weight=\"700\">PROBLEM VISUALIZATION</text><!-- Show input state, transformation, output state --></svg>"
  }
}
\`\`\``;

    default:
      throw new Error(`Unknown type: ${type}`);
  }
}

function getLanguageForChannel(channelId) {
  const langs = {
    javascript: "javascript",
    react: "javascript",
    algorithms: "python",
    devops: "bash",
    kubernetes: "yaml",
    networking: "python",
    "system-design": "markdown",
    "aws-saa": "json",
    "aws-dev": "javascript",
    cka: "bash",
    terraform: "hcl",
  };
  return langs[channelId] || "javascript";
}

function getExtension(channelId) {
  const exts = {
    javascript: "js",
    react: "jsx",
    algorithms: "py",
    devops: "sh",
    kubernetes: "yaml",
    networking: "py",
    "system-design": "md",
    "aws-saa": "json",
    "aws-dev": "js",
    cka: "sh",
    terraform: "tf",
  };
  return exts[channelId] || "js";
}

// ── Generate one item ─────────────────────────────────────────────────────────
async function generateOne(db, type, channel) {
  const id = makeId(type.slice(0, 3));
  const prompt = makePrompt(type, channel, id);
  const model = process.env.OPENCODE_MODEL || "";
  const startTime = Date.now();

  console.log(`\n🤖 Calling opencode for ${type} [${channel.name}]...`);

  let raw;
  try {
    raw = await runOpencode(prompt, model);
  } catch (err) {
    logGeneration(
      db,
      channel.id,
      type,
      false,
      err.message,
      Date.now() - startTime,
      model,
    );
    throw err;
  }

  const generationTime = Date.now() - startTime;
  console.log(`   Raw output: ${raw.length} chars (${generationTime}ms)`);

  const jsonStr = extractJson(raw);
  const parsed = tryParseJson(jsonStr);

  if (!parsed || typeof parsed !== "object") {
    console.error(`   ❌ JSON parse failed`);
    console.error(`   Snippet: ${jsonStr.slice(0, 200)}`);
    logGeneration(
      db,
      channel.id,
      type,
      false,
      "JSON parse failed",
      generationTime,
      model,
    );
    return false;
  }

  parsed.id = parsed.id || id;
  if (type === "question" || type === "flashcard") {
    parsed.tags = Array.isArray(parsed.tags)
      ? parsed.tags
      : channel.tags.slice(0, 2);
  } else {
    parsed.channelId = parsed.channelId || channel.id;
  }

  await injectUniqueDiagram(db, parsed, type, channel);

  const qualityScore = saveToDb(
    db,
    id,
    channel.id,
    type,
    parsed,
    generationTime,
    model,
  );
  return qualityScore >= QUALITY_THRESHOLD;
}

async function injectUniqueDiagram(db, parsed, type, channel) {
  const diagramTypes = ["question", "flashcard", "exam", "voice", "coding"];
  if (!diagramTypes.includes(type)) return;

  try {
    const diagramInfo = generateDiagramSync(parsed, channel.id);

    if (diagramInfo && diagramInfo.svgContent) {
      const existingHash = await diagramExists(db, diagramInfo.hash);

      if (!existingHash) {
        await saveDiagram(
          db,
          diagramInfo.hash,
          diagramInfo.svgContent,
          channel.id,
          parsed.id,
          diagramInfo,
        );
      }

      if (type === "question" && parsed.sections) {
        const diagramSection = parsed.sections.find(
          (s) => s.type === "diagram" && s.svgContent,
        );
        if (!diagramSection || diagramSection.svgContent.length < 100) {
          const idx = parsed.sections.findIndex((s) => s.type === "short");
          if (idx !== -1) {
            parsed.sections.splice(idx + 1, 0, {
              type: "diagram",
              title: `${parsed.title || "Concept"} Diagram`,
              description: `Unique visual for ${channel.name} topic`,
              svgContent: diagramInfo.svgContent,
            });
          } else {
            parsed.sections.push({
              type: "diagram",
              title: `${parsed.title || "Concept"} Diagram`,
              description: `Unique visual for ${channel.name} topic`,
              svgContent: diagramInfo.svgContent,
            });
          }
        } else {
          diagramSection.svgContent = diagramInfo.svgContent;
        }
      } else if (
        type === "flashcard" ||
        type === "exam" ||
        type === "voice" ||
        type === "coding"
      ) {
        if (!parsed.diagram) {
          parsed.diagram = {};
        }
        if (
          !parsed.diagram.svgContent ||
          parsed.diagram.svgContent.length < 100
        ) {
          parsed.diagram.title = `${parsed.title || parsed.prompt || "Concept"} Visual`;
          parsed.diagram.description = `Unique diagram for ${channel.name}`;
          parsed.diagram.svgContent = diagramInfo.svgContent;
        } else {
          parsed.diagram.svgContent = diagramInfo.svgContent;
        }
      }
    }
  } catch (err) {
    console.warn(`   ⚠️  Diagram injection warning: ${err.message}`);
  }
}

// ── Strategy Agent ────────────────────────────────────────────────────────────
/**
 * Calls opencode with a strategy prompt that includes the current DB state.
 * The agent consciously decides which channels and content types to prioritize
 * based on gaps, balance, and learning value.
 *
 * Returns an array of generation tasks: [{ channelId, type, count }]
 */
async function runStrategyAgent(db) {
  const ALL_TYPES = ["question", "flashcard", "exam", "voice", "coding"];

  // Build a comprehensive state snapshot for the strategy agent
  const rows = db
    .prepare(
      `SELECT channel_id, content_type, COUNT(*) as n, AVG(quality_score) as avg_quality
       FROM generated_content
       WHERE status IN ('approved','published')
       GROUP BY channel_id, content_type`,
    )
    .all();

  const state = {};
  for (const ch of CHANNELS) {
    state[ch.id] = {
      name: ch.name,
      type: ch.type || "tech",
      certCode: ch.certCode || null,
      difficulty: ch.difficulty,
      counts: {},
      avgQuality: {},
    };
    for (const t of ALL_TYPES) {
      state[ch.id].counts[t] = 0;
      state[ch.id].avgQuality[t] = 0;
    }
  }
  for (const row of rows) {
    if (state[row.channel_id]) {
      state[row.channel_id].counts[row.content_type] = row.n;
      state[row.channel_id].avgQuality[row.content_type] = +(
        row.avg_quality || 0
      ).toFixed(2);
    }
  }

  const stateJson = JSON.stringify(state, null, 2);
  const totalCount = COUNT;

  const strategyPrompt = `You are the Strategy Agent for DevPrep, an AI-powered developer interview prep platform.

Your job is to analyze the current content database and decide exactly what content to generate next.

## Current Database State
${stateJson}

## Channels Available
${CHANNELS.map((c) => `- ${c.id} (${c.name}, ${c.type || "tech"}, ${c.difficulty}${c.certCode ? ", cert: " + c.certCode : ""})`).join("\n")}

## Content Types
- question: Technical interview Q&A with code examples
- flashcard: Quick concept review cards
- exam: Multiple-choice certification practice questions
- voice: Interview prompts for verbal practice
- coding: Coding challenges with starter code and solutions

## Your Task
Decide which ${totalCount} content item(s) to generate. Consider:
1. Channels with the fewest items get priority (fill gaps first)
2. Balance content types — don't over-index on one type
3. Certification channels (aws-saa, aws-dev, cka, terraform) benefit most from exam questions
4. Tech channels (javascript, react, algorithms, devops, kubernetes, networking, system-design) benefit from coding challenges and questions
5. Aim for diversity across channels and types

Return ONLY a valid JSON array in a json code fence. No other text.

\`\`\`json
[
  { "channelId": "channel-id", "type": "content-type", "count": 1 }
]
\`\`\`

Important: The total count across all items must equal ${totalCount}. Each item count must be >= 1.`;

  console.log(
    "\n🧠 Strategy Agent: Analyzing database and selecting targets...",
  );
  const startTime = Date.now();

  let raw;
  try {
    raw = await runOpencode(strategyPrompt);
  } catch (err) {
    console.warn(
      `   ⚠️  Strategy agent failed (${err.message}), falling back to auto-detect`,
    );
    return null;
  }

  const elapsed = Date.now() - startTime;
  console.log(
    `   Strategy response: ${raw.length} chars (${(elapsed / 1000).toFixed(1)}s)`,
  );

  const jsonStr = extractJson(raw);
  const parsed = tryParseJson(jsonStr);

  if (!Array.isArray(parsed) || parsed.length === 0) {
    console.warn(`   ⚠️  Strategy agent returned invalid plan, falling back`);
    return null;
  }

  // Validate each task
  const validTypes = new Set([
    "question",
    "flashcard",
    "exam",
    "voice",
    "coding",
  ]);
  const validChannels = new Set(CHANNELS.map((c) => c.id));
  const tasks = parsed
    .filter(
      (t) =>
        t &&
        typeof t.channelId === "string" &&
        validChannels.has(t.channelId) &&
        typeof t.type === "string" &&
        validTypes.has(t.type) &&
        typeof t.count === "number" &&
        t.count >= 1,
    )
    .map((t) => ({
      channelId: t.channelId,
      type: t.type,
      count: Math.min(Math.max(1, Math.floor(t.count)), 5),
    }));

  if (tasks.length === 0) {
    console.warn(`   ⚠️  No valid tasks in strategy plan, falling back`);
    return null;
  }

  console.log(`   ✅ Strategy plan (${tasks.length} task group(s)):`);
  for (const t of tasks) {
    console.log(
      `      • ${t.type} × ${t.count} → ${CHANNELS.find((c) => c.id === t.channelId)?.name || t.channelId}`,
    );
  }

  return tasks;
}

// ── Auto-detect fallback plan ─────────────────────────────────────────────────
function buildFallbackPlan(db) {
  const ALL_TYPES = ["question", "flashcard", "exam", "voice", "coding"];
  const tasks = [];

  if (TARGET_CHANNEL && CONTENT_TYPE !== "auto" && CONTENT_TYPE !== "all") {
    const channel = CHANNELS.find((c) => c.id === TARGET_CHANNEL);
    if (channel) {
      tasks.push({ channelId: channel.id, type: CONTENT_TYPE, count: COUNT });
    }
    return tasks;
  }

  const typeKeys =
    CONTENT_TYPE === "auto" || CONTENT_TYPE === "all"
      ? ALL_TYPES
      : [CONTENT_TYPE];

  for (const typeKey of typeKeys) {
    let channel;
    if (TARGET_CHANNEL) {
      channel = CHANNELS.find((c) => c.id === TARGET_CHANNEL);
    } else {
      const lowest = findLowestChannel(db, typeKey);
      if (!lowest) continue;
      channel = lowest.channel;
    }
    if (channel) {
      tasks.push({
        channelId: channel.id,
        type: typeKey,
        count: CONTENT_TYPE === "auto" ? 1 : COUNT,
      });
    }
  }

  return tasks;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 DevPrep Content Generator — opencode Agent Team");
  console.log(`   DB Path:        ${DB_PATH}`);
  console.log(`   Vector Dir:     ${VECTOR_DIR}`);
  console.log(`   Content Type:   ${CONTENT_TYPE}`);
  console.log(
    `   Channel:        ${TARGET_CHANNEL || "strategy-agent (auto)"}`,
  );
  console.log(`   Count:         ${COUNT}`);
  console.log(
    `   Vector DB:      ${ENABLE_VECTOR_DB ? "enabled" : "disabled"}`,
  );
  console.log(`   Quality Threshold: ${(QUALITY_THRESHOLD * 100).toFixed(0)}%`);

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  if (ENABLE_VECTOR_DB) {
    fs.mkdirSync(VECTOR_DIR, { recursive: true });
  }

  const db = openDb();

  // ── Phase 1: Strategy Agent decides what to generate ───────────────────────
  let plan;
  if (CONTENT_TYPE === "auto" && !TARGET_CHANNEL) {
    // Let the strategy agent make the conscious decision
    plan = await runStrategyAgent(db);
  }

  if (!plan || plan.length === 0) {
    // Fall back to deterministic auto-detect
    console.log("\n📊 Using auto-detect to build generation plan...");
    plan = buildFallbackPlan(db);
  }

  if (plan.length === 0) {
    console.log("✓ All channels already have sufficient content.");
    db.close();
    return;
  }

  // ── Phase 2: Generation Agent Team runs in parallel ─────────────────────────
  console.log(
    `\n🤖 Generation Agent Team: Spawning ${plan.reduce((s, t) => s + t.count, 0)} agent(s) in parallel...`,
  );

  // Expand plan into individual tasks for parallel execution
  const individualTasks = [];
  for (const task of plan) {
    const channel = CHANNELS.find((c) => c.id === task.channelId);
    if (!channel) continue;
    for (let i = 0; i < task.count; i++) {
      individualTasks.push({ channel, type: task.type, index: i });
    }
  }

  // Run all generation tasks in parallel
  const results = await Promise.allSettled(
    individualTasks.map(async ({ channel, type, index }) => {
      const agentId = `${type}-${channel.id}-${index + 1}`;
      console.log(
        `   🔧 Agent [${agentId}]: generating ${type} for "${channel.name}"`,
      );
      const ok = await generateOne(db, type, channel);
      return { agentId, type, channel: channel.name, ok };
    }),
  );

  // ── Phase 3: Summary ────────────────────────────────────────────────────────
  let totalGenerated = 0;
  let totalLowQuality = 0;
  let totalFailed = 0;

  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value.ok) {
        totalGenerated++;
      } else {
        totalLowQuality++;
        console.log(
          `   ⚠️  [${result.value.agentId}] Low quality (pending review)`,
        );
      }
    } else {
      totalFailed++;
      console.error(
        `   ❌ Agent failed: ${result.reason?.message || result.reason}`,
      );
    }
  }

  db.close();

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ Generated:     ${totalGenerated} item(s)`);
  if (totalLowQuality > 0)
    console.log(`⚠️  Low Quality:  ${totalLowQuality} item(s)`);
  if (totalFailed > 0) console.log(`❌ Failed:        ${totalFailed} item(s)`);
  console.log(`📁 Database:     ${DB_PATH}`);
  console.log(`🔢 Vector Dir:   ${VECTOR_DIR}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
