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
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { loadChannelsFromDb } from "./db-channels.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH =
  process.env.DB_PATH || path.resolve(__dirname, "../data/devprep.db");
const VECTOR_DIR =
  process.env.VECTOR_DIR || path.resolve(__dirname, "../data/vectors");
const require = createRequire(import.meta.url);

// ── Config ────────────────────────────────────────────────────────────────────
const TARGET_CHANNEL = process.env.TARGET_CHANNEL || "";
const CONTENT_TYPE = process.env.CONTENT_TYPE || "auto";
const COUNT = parseInt(process.env.COUNT || "1", 10);
const LOW_THRESHOLD = 5;
const ENABLE_VECTOR_DB = process.env.ENABLE_VECTOR_DB !== "false";
const QUALITY_THRESHOLD = 0.5;

// ── SQLite setup ──────────────────────────────────────────────────────────────
const Database = require("better-sqlite3");

function openDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
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
  `);
  return db;
}

// ── Channels — loaded from DB (single source of truth) ────────────────────────
const CHANNELS = (() => {
  const ch = loadChannelsFromDb(DB_PATH);
  if (!ch || ch.length === 0) {
    console.error("❌ No channels found in DB. Make sure data/devprep.db has a populated 'channels' table.");
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

  if (type === "coding") {
    const starterCode = data.starterCode;
    if (starterCode && typeof starterCode === "object") {
      if (starterCode.javascript && starterCode.javascript.length > 30)
        score += 1;
      if (starterCode.python && starterCode.python.length > 30) score += 1;
    }
    if (data.solution) score += 1;
  } else if (type === "question" && data.sections) {
    const hasCode = data.sections.some(
      (s) => s.type === "code" && s.content && s.content.length > 30,
    );
    if (hasCode) score += 1;
  } else if (type === "flashcard" && data.codeExample) {
    score += 1;
  }

  if (dataStr.includes("REPLACE") || dataStr.includes("TODO")) {
    score -= 1;
  }

  const maxScore = required.length + 5;
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

CRITICAL REQUIREMENTS:
- Front: specific concept (not generic), 1-2 sentences
- Back: clear answer with bullet points using • separator
- Hint: guides without giving away the answer
- Code example: 5-15 lines, syntactically correct
- Use **bold** for emphasis

Return ONLY a valid JSON object in a json code fence.

\`\`\`json
{
  "id": "${id}",
  "front": "Specific ${domain} concept question (be precise)",
  "back": "Clear answer:\n• Key point 1\n• Key point 2\n• Key point 3",
  "hint": "A subtle clue that guides thinking",
  "tags": ["${channel.tags.slice(0, 2).join('", "')}"],
  "difficulty": "${difficulty}",
  "category": "${domain}",
  "codeExample": {
    "language": "${getLanguageForChannel(channel.id)}",
    "code": "Short code snippet (5-15 lines) demonstrating the concept with comments"
  },
  "mnemonic": "Optional memory aid",
  "commonConfusion": "Why this concept confuses people"
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
  "timeEstimate": 90
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
  "commonMistakes": ["mistake 1", "mistake 2"]
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
  "commonErrors": ["error 1", "error 2"]
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
  const validTypes = new Set(["question", "flashcard", "exam", "voice", "coding"]);
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
    CONTENT_TYPE === "auto" || CONTENT_TYPE === "all" ? ALL_TYPES : [CONTENT_TYPE];

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
      console.error(`   ❌ Agent failed: ${result.reason?.message || result.reason}`);
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
