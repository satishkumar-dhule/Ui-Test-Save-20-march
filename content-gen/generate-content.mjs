/**
 * DevPrep Content Generator — powered by opencode-ai
 *
 * Generates realistic, structured DevPrep content (questions, flashcards,
 * exams, voice prompts, coding challenges) and saves each item as a JSON row
 * in a local SQLite database (data/devprep.db).
 *
 * The api-server reads from this DB and exposes content at /api/content.
 * The DevPrep frontend merges static + dynamic data at runtime.
 *
 * Usage:
 *   node generate-content.mjs                              # auto: 1 item per type for lowest channel
 *   TARGET_CHANNEL=javascript CONTENT_TYPE=question node generate-content.mjs
 *   TARGET_CHANNEL=javascript CONTENT_TYPE=all COUNT=2 node generate-content.mjs
 */

import { spawn } from "child_process";
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, "../data/devprep.db");
const require = createRequire(import.meta.url);

// ── Config ────────────────────────────────────────────────────────────────────
const TARGET_CHANNEL = process.env.TARGET_CHANNEL || "";
// CONTENT_TYPE: "auto" | "all" | "question" | "flashcard" | "exam" | "voice" | "coding"
// "auto" = 1 item for the lowest-count channel per type
// "all"  = COUNT items per type for TARGET_CHANNEL (or auto-detect per type)
const CONTENT_TYPE = process.env.CONTENT_TYPE || "auto";
const COUNT = parseInt(process.env.COUNT || "1", 10);
const LOW_THRESHOLD = 5;

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
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
    CREATE INDEX IF NOT EXISTS idx_type ON generated_content(content_type);
    CREATE INDEX IF NOT EXISTS idx_channel ON generated_content(channel_id);
  `);
  return db;
}

// ── Channels ──────────────────────────────────────────────────────────────────
const CHANNELS = [
  {
    id: "javascript",
    name: "JavaScript",
    tags: ["javascript", "async", "closures", "prototype"],
  },
  {
    id: "react",
    name: "React",
    tags: ["react", "hooks", "state", "performance"],
  },
  {
    id: "algorithms",
    name: "Algorithms",
    tags: ["algorithms", "sorting", "big-o", "dynamic-programming"],
  },
  {
    id: "devops",
    name: "DevOps",
    tags: ["devops", "docker", "ci-cd", "linux"],
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    tags: ["kubernetes", "k8s", "containers"],
  },
  {
    id: "networking",
    name: "Networking",
    tags: ["networking", "http", "rest", "dns"],
  },
  {
    id: "system-design",
    name: "System Design",
    tags: ["cs", "distributed", "concurrency", "oop"],
  },
  { id: "aws-saa", name: "AWS Solutions Architect", tags: ["aws", "cloud"] },
  { id: "aws-dev", name: "AWS Developer", tags: ["aws", "serverless"] },
  {
    id: "cka",
    name: "Certified Kubernetes Admin",
    tags: ["kubernetes", "k8s"],
  },
  { id: "terraform", name: "HashiCorp Terraform", tags: ["terraform", "iac"] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeId(prefix) {
  return `${prefix}-gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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

function saveToDb(db, id, channelId, type, dataObj) {
  db.prepare(
    `
    INSERT OR REPLACE INTO generated_content (id, channel_id, content_type, data, created_at)
    VALUES (?, ?, ?, ?, strftime('%s', 'now'))
  `,
  ).run(id, channelId, type, JSON.stringify(dataObj));
  console.log(`   ✅ Saved ${type} [${id}] for channel "${channelId}"`);
}

// ── opencode runner ───────────────────────────────────────────────────────────
function runOpencode(prompt) {
  return new Promise((resolve, reject) => {
    const binPath = path.resolve(__dirname, "node_modules/.bin/opencode");
    const bin = fs.existsSync(binPath) ? binPath : "opencode";
    const workDir = "/tmp/opencode-content-gen";
    fs.mkdirSync(workDir, { recursive: true });

    const child = spawn(bin, ["run", "--dir", workDir, prompt], {
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`opencode exited ${code}: ${stderr.slice(0, 300)}`));
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

// ── JSON fixer ────────────────────────────────────────────────────────────────
function tryParseJson(str) {
  try {
    return JSON.parse(str);
  } catch {}

  const fix1 = str.replace(/,(\s*[}\]])/g, "$1");
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

// ── Prompts ───────────────────────────────────────────────────────────────────
function makePrompt(type, channel, id) {
  switch (type) {
    case "question":
      return `
You are creating technical interview prep content. Generate ONE question about ${channel.name}.

Return ONLY a valid JSON object inside a json code fence. No other text.

\`\`\`json
{
  "id": "${id}",
  "number": ${1000 + Math.floor(Math.random() * 9000)},
  "title": "REPLACE: a specific, non-trivial interview question about ${channel.name}",
  "tags": ${JSON.stringify(channel.tags.slice(0, 3))},
  "difficulty": "intermediate",
  "votes": ${Math.floor(Math.random() * 500) + 50},
  "views": "${Math.floor(Math.random() * 10) + 1}k",
  "askedBy": "devprep-ai",
  "askedAt": "2026-03-19",
  "sections": [
    {
      "type": "short",
      "content": "REPLACE: 2-3 paragraph markdown answer with **bold** key terms and \`inline code\`"
    },
    {
      "type": "code",
      "language": "javascript",
      "content": "REPLACE: a complete, runnable code example demonstrating the concept",
      "filename": "example.js"
    },
    {
      "type": "eli5",
      "content": "REPLACE: a simple real-world analogy that a beginner would understand"
    }
  ]
}
\`\`\`

Replace all REPLACE placeholders with real, educational content about ${channel.name}. The question must NOT be about basics — pick a specific, advanced concept.`;

    case "flashcard":
      return `
Generate ONE flashcard for studying ${channel.name}. Return ONLY a valid JSON object in a json code fence.

\`\`\`json
{
  "id": "${id}",
  "front": "REPLACE: a concise question about a specific ${channel.name} concept",
  "back": "REPLACE: a clear, accurate answer (use bullet points with \\n• for lists)",
  "hint": "REPLACE: a one-line hint that guides without giving away the answer",
  "tags": ${JSON.stringify(channel.tags.slice(0, 2))},
  "difficulty": "intermediate",
  "category": "${channel.name}",
  "codeExample": {
    "language": "javascript",
    "code": "REPLACE: a short (5-15 line) code snippet illustrating the concept"
  }
}
\`\`\`

Replace all REPLACE placeholders. Pick a concept specific to ${channel.name} that is commonly tested in interviews.`;

    case "exam":
      return `
Generate ONE multiple-choice exam question for the ${channel.name} exam. Return ONLY a valid JSON object in a json code fence.

\`\`\`json
{
  "id": "${id}",
  "channelId": "${channel.id}",
  "domain": "REPLACE: exam domain e.g. Security, Networking, Compute",
  "question": "REPLACE: a realistic scenario-based question as found in the actual ${channel.name} exam",
  "choices": [
    { "id": "A", "text": "REPLACE: a plausible option" },
    { "id": "B", "text": "REPLACE: the correct answer" },
    { "id": "C", "text": "REPLACE: a plausible distractor" },
    { "id": "D", "text": "REPLACE: a plausible distractor" }
  ],
  "correct": "B",
  "explanation": "REPLACE: 2-3 sentences explaining why B is correct and why the others are wrong",
  "difficulty": "medium"
}
\`\`\`

Replace all REPLACE placeholders. The question must be scenario-based, not a simple definition question. Distractors must be plausible.`;

    case "voice":
      return `
Generate ONE voice practice prompt for ${channel.name} interview prep. Return ONLY a valid JSON object in a json code fence.

\`\`\`json
{
  "id": "${id}",
  "channelId": "${channel.id}",
  "prompt": "REPLACE: an interview question to answer out loud, 1-2 sentences",
  "type": "technical",
  "timeLimit": 120,
  "difficulty": "intermediate",
  "domain": "${channel.name}",
  "keyPoints": [
    "REPLACE: key point 1 the answer must cover",
    "REPLACE: key point 2",
    "REPLACE: key point 3",
    "REPLACE: key point 4"
  ],
  "followUp": "REPLACE: a natural follow-up question an interviewer might ask"
}
\`\`\`

Replace all REPLACE placeholders. The prompt should be a realistic technical interview question for ${channel.name}.`;

    case "coding":
      return `
Generate ONE coding challenge for ${channel.name}. Return ONLY a valid JSON object in a json code fence.

\`\`\`json
{
  "id": "${id}",
  "channelId": "${channel.id}",
  "title": "REPLACE: challenge title",
  "slug": "REPLACE: kebab-case-slug",
  "difficulty": "medium",
  "tags": ${JSON.stringify(channel.tags.slice(0, 3))},
  "category": "${channel.name}",
  "timeEstimate": 20,
  "description": "REPLACE: 2-3 sentence description of the problem with context",
  "constraints": ["REPLACE: constraint 1", "REPLACE: constraint 2"],
  "examples": [
    { "input": "REPLACE", "output": "REPLACE", "explanation": "REPLACE" },
    { "input": "REPLACE", "output": "REPLACE" }
  ],
  "starterCode": {
    "javascript": "// REPLACE: function signature with JSDoc\\nfunction solution(input) {\\n  // your code here\\n}\\n\\nconsole.log(solution(REPLACE));",
    "typescript": "function solution(input: REPLACE): REPLACE {\\n  // your code here\\n}",
    "python": "def solution(input):\\n    # your code here\\n    pass"
  },
  "solution": {
    "javascript": "REPLACE: complete optimal JS solution with inline comments",
    "typescript": "REPLACE: complete optimal TS solution",
    "python": "REPLACE: complete optimal Python solution"
  },
  "hints": [
    "REPLACE: hint 1 — general approach",
    "REPLACE: hint 2 — data structure or algorithm to use",
    "REPLACE: hint 3 — near the solution"
  ],
  "testCases": [
    { "input": "REPLACE", "expected": "REPLACE", "description": "REPLACE: what this tests" },
    { "input": "REPLACE edge case", "expected": "REPLACE", "description": "edge case" }
  ],
  "eli5": "REPLACE: real-world analogy for the problem",
  "approach": "REPLACE: step-by-step markdown approach",
  "complexity": { "time": "O(n)", "space": "O(1)", "explanation": "REPLACE" },
  "relatedConcepts": ["REPLACE: concept 1", "REPLACE: concept 2"]
}
\`\`\`

Replace ALL REPLACE placeholders with real content. The code must be syntactically correct and the solution must be optimal.`;

    default:
      throw new Error(`Unknown type: ${type}`);
  }
}

// ── Generate one item ─────────────────────────────────────────────────────────
async function generateOne(db, type, channel) {
  const id = makeId(type.slice(0, 2));
  const prompt = makePrompt(type, channel, id);

  console.log(`\n🤖 Calling opencode for ${type} [${channel.name}]...`);

  const raw = await runOpencode(prompt);
  console.log(`   Raw output: ${raw.length} chars`);

  const jsonStr = extractJson(raw);

  const parsed = tryParseJson(jsonStr);
  if (!parsed) {
    console.error(`   ❌ JSON parse failed after all attempts`);
    console.error(`   Snippet: ${jsonStr.slice(0, 300)}`);
    return false;
  }

  if (!parsed || typeof parsed !== "object") {
    console.error(`   ❌ Result is not an object`);
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

  saveToDb(db, parsed.id, channel.id, type, parsed);
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 DevPrep Content Generator — powered by opencode-ai");
  console.log(`   DB:           ${DB_PATH}`);
  console.log(`   Content type: ${CONTENT_TYPE}`);
  console.log(
    `   Channel:      ${TARGET_CHANNEL || "auto-detect (lowest per type)"}`,
  );
  console.log(`   Count:        ${COUNT}`);

  const db = openDb();

  const ALL_TYPES = ["question", "flashcard", "exam", "voice", "coding"];
  let typeKeys;

  if (CONTENT_TYPE === "auto" || CONTENT_TYPE === "all") {
    typeKeys = ALL_TYPES;
  } else {
    typeKeys = [CONTENT_TYPE];
  }

  let totalGenerated = 0;
  let totalFailed = 0;

  for (const typeKey of typeKeys) {
    const itemsForType = CONTENT_TYPE === "auto" ? 1 : COUNT;

    for (let i = 0; i < itemsForType; i++) {
      let channel;
      if (TARGET_CHANNEL) {
        channel = CHANNELS.find((c) => c.id === TARGET_CHANNEL);
        if (!channel) {
          console.error(`❌ Unknown channel: ${TARGET_CHANNEL}`);
          process.exit(1);
        }
      } else {
        const lowest = findLowestChannel(db, typeKey);
        if (!lowest) {
          console.log(
            `✓ ${typeKey}: all channels already have ≥${LOW_THRESHOLD} items — skipping`,
          );
          break;
        }
        channel = lowest.channel;
        console.log(
          `\n📊 ${typeKey}: lowest is "${channel.name}" (${lowest.count} items)`,
        );
      }

      try {
        const ok = await generateOne(db, typeKey, channel);
        if (ok) totalGenerated++;
        else totalFailed++;
      } catch (err) {
        console.error(`\n❌ ${typeKey} for ${channel.name}:`, err.message);
        totalFailed++;
      }
    }
  }

  db.close();

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ Generated: ${totalGenerated} item(s)`);
  if (totalFailed > 0) console.log(`⚠️  Failed:    ${totalFailed} item(s)`);
  console.log(`📁 DB:        ${DB_PATH}`);
  console.log(
    `   The DevPrep API server will serve this content at /api/content`,
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
