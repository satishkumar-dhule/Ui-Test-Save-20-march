/**
 * DevPrep Content Generator — powered by Pollinations.ai
 *
 * Generates high-quality study content using Pollinations AI with:
 * - Local SQLite database storage
 * - Specialized agent team integration
 * - Streaming responses
 * - Quality scoring
 *
 * Usage:
 *   node generate-pollination-content.mjs                              # auto-detect
 *   TARGET_CHANNEL=javascript CONTENT_TYPE=question node generate-pollination-content.mjs
 *   TARGET_CHANNEL=javascript CONTENT_TYPE=all COUNT=2 node generate-pollination-content.mjs
 *   PARALLEL=true COUNT=5 node generate-pollination-content.mjs       # parallel generation
 */

import { Database } from "bun:sqlite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import https from "https";

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
const PARALLEL = process.env.PARALLEL === "true";
const MAX_PARALLEL = parseInt(process.env.MAX_PARALLEL || "3", 10);

// ── Agent Team Tracking ────────────────────────────────────────────────────────
const AGENT_LOG_FILE = path.resolve(__dirname, "../agent-team/agents.md");

const AGENT_TEAM = {
  coordinator: {
    id: "coordinator-001",
    name: "Content Coordinator",
    role: "orchestration",
    task: "Orchestrating content generation pipeline",
    status: "idle",
  },
  generators: [
    {
      id: "gen-question-001",
      name: "Question Generator Agent",
      role: "question-generator",
      task: "Generating interview questions",
      specialization: "technical-interviews",
      status: "idle",
    },
    {
      id: "gen-flashcard-001",
      name: "Flashcard Generator Agent",
      role: "flashcard-generator",
      task: "Generating study flashcards",
      specialization: "spaced-repetition",
      status: "idle",
    },
    {
      id: "gen-exam-001",
      name: "Exam Generator Agent",
      role: "exam-generator",
      task: "Generating certification exam questions",
      specialization: "certification-prep",
      status: "idle",
    },
    {
      id: "gen-voice-001",
      name: "Voice Practice Generator Agent",
      role: "voice-generator",
      task: "Generating voice practice prompts",
      specialization: "verbal-communication",
      status: "idle",
    },
    {
      id: "gen-coding-001",
      name: "Coding Challenge Generator Agent",
      role: "coding-generator",
      task: "Generating coding challenges",
      specialization: "algorithms",
      status: "idle",
    },
  ],
};

// ── Pollinations API ──────────────────────────────────────────────────────────
const POLLINATIONS_BASE_URL = "text.pollinations.ai";

// Use native fetch (Node.js 18+)
async function* streamPollinationsAI(messages, model = "openai") {
  const data = JSON.stringify({
    messages,
    model,
    stream: true,
  });

  const response = await fetch(`https://${POLLINATIONS_BASE_URL}/openai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: data,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
        try {
          const json = trimmed.slice(6);
          const parsed = JSON.parse(json);
          const delta = parsed.choices?.[0]?.delta;
          const content = delta?.content || delta?.reasoning_content || "";
          if (content) {
            yield content;
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }
  }
}

async function pollinationsChat(messages, model = "openai") {
  let fullContent = "";
  for await (const chunk of streamPollinationsAI(messages, model)) {
    fullContent += chunk;
    process.stdout.write(chunk);
  }
  return fullContent;
}

// ── SQLite setup ──────────────────────────────────────────────────────────────

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
  `);
  return db;
}

// ── Channels ──────────────────────────────────────────────────────────────────
const CHANNELS = [
  {
    id: "javascript",
    name: "JavaScript",
    tags: [
      "javascript",
      "async",
      "closures",
      "prototype",
      "types",
      "generators",
    ],
    difficulty: "intermediate",
  },
  {
    id: "react",
    name: "React",
    tags: ["react", "hooks", "state", "performance", "reconciliation"],
    difficulty: "intermediate",
  },
  {
    id: "algorithms",
    name: "Algorithms",
    tags: [
      "algorithms",
      "sorting",
      "big-o",
      "dynamic-programming",
      "trees",
      "graphs",
    ],
    difficulty: "advanced",
  },
  {
    id: "devops",
    name: "DevOps",
    tags: ["devops", "docker", "ci-cd", "linux", "containers"],
    difficulty: "intermediate",
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    tags: ["kubernetes", "k8s", "containers", "orchestration", "helm"],
    difficulty: "advanced",
  },
  {
    id: "networking",
    name: "Networking",
    tags: ["networking", "http", "rest", "dns", "tcp-ip", "https"],
    difficulty: "intermediate",
  },
  {
    id: "system-design",
    name: "System Design",
    tags: ["cs", "distributed", "concurrency", "scalability", "caching"],
    difficulty: "advanced",
  },
  {
    id: "aws-saa",
    name: "AWS Solutions Architect",
    tags: ["aws", "cloud", "ec2", "s3", "vpc", "iam"],
    difficulty: "intermediate",
    certCode: "SAA-C03",
  },
  {
    id: "aws-dev",
    name: "AWS Developer",
    tags: ["aws", "cloud", "serverless", "lambda", "api-gateway"],
    difficulty: "intermediate",
    certCode: "DVA-C02",
  },
  {
    id: "cka",
    name: "Certified Kubernetes Admin",
    tags: ["kubernetes", "k8s", "cluster", "pods", "services"],
    difficulty: "advanced",
    certCode: "CKA",
  },
  {
    id: "terraform",
    name: "HashiCorp Terraform",
    tags: ["terraform", "iac", "modules", "state", "providers"],
    difficulty: "intermediate",
    certCode: "TA-002-P",
  },
];

// ── Agent Logging ──────────────────────────────────────────────────────────────
function updateAgentStatus(agentId, status, task = null) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] Agent ${agentId}: ${status}${task ? ` - ${task}` : ""}`;
  console.log(`\n📋 ${logEntry}`);

  // Update agent status in memory
  const generator = AGENT_TEAM.generators.find((g) => g.id === agentId);
  if (generator) {
    generator.status = status;
    generator.currentTask = task;
  }
}

function logAgentProgress(agentId, progress, details = "") {
  const bar =
    "█".repeat(Math.floor(progress / 5)) +
    "░".repeat(20 - Math.floor(progress / 5));
  console.log(`\r   [${bar}] ${progress}%${details ? ` - ${details}` : ""}`);
}

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

function saveToDb(
  db,
  id,
  channelId,
  type,
  dataObj,
  generationTime,
  model,
  agentId,
) {
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
    agentId || model,
    generationTime || 0,
  );

  logGeneration(
    db,
    channelId,
    type,
    true,
    null,
    generationTime,
    model,
    agentId,
  );
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
  agentId,
) {
  const logId = makeId("log");
  db.prepare(
    `INSERT INTO generation_logs (id, channel_id, content_type, success, error_message, duration_ms, model) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    logId,
    channelId,
    type,
    success ? 1 : 0,
    errorMsg,
    durationMs,
    model || agentId,
  );
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

  if (type === "coding" && data.starterCode) {
    if (data.starterCode.javascript && data.starterCode.javascript.length > 30)
      score += 1;
    if (data.starterCode.python && data.starterCode.python.length > 30)
      score += 1;
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
    let depth = 0,
      inString = false,
      escape = false,
      end = -1;
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

// ── Enhanced Prompts ───────────────────────────────────────────────────────────
function makePrompt(type, channel, id) {
  const difficulty = channel.difficulty || "intermediate";
  const domain = channel.name;

  switch (type) {
    case "question":
      return [
        {
          role: "system",
          content:
            "You are an expert technical interview question generator. Generate valid JSON only, no other text.",
        },
        {
          role: "user",
          content: `Generate ONE advanced ${domain} interview question. Return ONLY this JSON (no text before/after):

\`\`\`json
{
  "id": "${id}",
  "number": ${1000 + Math.floor(Math.random() * 9000)},
  "title": "Specific advanced ${domain} question (be precise, not generic)",
  "tags": ["${channel.tags.slice(0, 2).join('", "')}"],
  "difficulty": "${difficulty}",
  "votes": ${Math.floor(Math.random() * 500) + 100},
  "views": "${Math.floor(Math.random() * 15) + 2}k",
  "askedBy": "devprep-pollination",
  "askedAt": "${new Date().toISOString().split("T")[0]}",
  "sections": [
    { "type": "short", "content": "2-3 paragraph explanation with **bold key terms** addressing common misconceptions." },
    { "type": "code", "language": "${getLanguageForChannel(channel.id)}", "content": "Complete runnable code with comments.", "filename": "example.${getExtension(channel.id)}" },
    { "type": "eli5", "content": "Simple analogy for beginners." }
  ],
  "relatedQuestions": ["concept 1", "concept 2"],
  "commonMistakes": ["mistake 1", "mistake 2"]
}
\`\`\``,
        },
      ];

    case "flashcard":
      return [
        {
          role: "system",
          content:
            "You are an expert flashcard generator. Generate valid JSON only.",
        },
        {
          role: "user",
          content: `Generate ONE ${domain} flashcard. Return ONLY this JSON:

\`\`\`json
{
  "id": "${id}",
  "front": "Specific ${domain} concept question (be precise)",
  "back": "Clear answer with bullet points:\n• Key point 1\n• Key point 2\n• Key point 3",
  "hint": "Subtle clue that guides thinking",
  "tags": ["${channel.tags.slice(0, 2).join('", "')}"],
  "difficulty": "${difficulty}",
  "category": "${domain}",
  "codeExample": { "language": "${getLanguageForChannel(channel.id)}", "code": "5-15 lines with comments" },
  "mnemonic": "Memory aid if helpful",
  "commonConfusion": "Why this confuses people"
}
\`\`\``,
        },
      ];

    case "exam":
      return [
        {
          role: "system",
          content:
            "You are an expert certification exam question generator. Generate valid JSON only.",
        },
        {
          role: "user",
          content: `Generate ONE ${domain} exam question (${channel.certCode || "generic"}). Return ONLY this JSON:

\`\`\`json
{
  "id": "${id}",
  "channelId": "${channel.id}",
  "certCode": "${channel.certCode || ""}",
  "domain": "Specific exam domain",
  "topic": "Specific topic",
  "question": "Realistic scenario-based question",
  "choices": [
    { "id": "A", "text": "Correct answer" },
    { "id": "B", "text": "Plausible distractor 1" },
    { "id": "C", "text": "Plausible distractor 2" },
    { "id": "D", "text": "Plausible distractor 3" }
  ],
  "correct": "A",
  "explanation": "Why A is correct. Why B,C,D are wrong.",
  "difficulty": "${difficulty}",
  "points": 1,
  "timeEstimate": 90
}
\`\`\``,
        },
      ];

    case "voice":
      return [
        {
          role: "system",
          content:
            "You are an expert voice practice prompt generator. Generate valid JSON only.",
        },
        {
          role: "user",
          content: `Generate ONE ${domain} voice practice prompt. Return ONLY this JSON:

\`\`\`json
{
  "id": "${id}",
  "channelId": "${channel.id}",
  "prompt": "1-2 sentence interview question",
  "type": "technical",
  "timeLimit": 120,
  "difficulty": "${difficulty}",
  "domain": "${domain}",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4"],
  "followUp": "Natural follow-up question",
  "structure": { "introduction": "How to start", "body": "Main points", "conclusion": "How to wrap up" },
  "commonMistakes": ["mistake 1", "mistake 2"]
}
\`\`\``,
        },
      ];

    case "coding":
      return [
        {
          role: "system",
          content:
            "You are an expert coding challenge generator. Generate valid JSON only.",
        },
        {
          role: "user",
          content: `Generate ONE ${domain} coding challenge. Return ONLY this JSON:

\`\`\`json
{
  "id": "${id}",
  "channelId": "${channel.id}",
  "title": "Challenge Title",
  "slug": "kebab-case-slug",
  "difficulty": "${difficulty}",
  "tags": ["${channel.tags.slice(0, 3).join('", "')}"],
  "category": "${domain}",
  "timeEstimate": ${20 + Math.floor(Math.random() * 20)},
  "description": "2-3 sentence problem description",
  "constraints": ["Constraint 1", "Constraint 2"],
  "examples": [{ "input": "input", "output": "output", "explanation": "walkthrough" }],
  "starterCode": {
    "javascript": "// JavaScript skeleton",
    "typescript": "// TypeScript skeleton",
    "python": "# Python skeleton"
  },
  "solution": {
    "javascript": "// Optimal solution",
    "typescript": "// Optimal solution",
    "python": "# Optimal solution"
  },
  "hints": ["Hint 1", "Hint 2", "Hint 3"],
  "testCases": [{ "input": "test", "expected": "result", "description": "description" }],
  "eli5": "Real-world analogy",
  "approach": "## Step-by-Step\n1. Step\n2. Step",
  "complexity": { "time": "O(n log n)", "space": "O(n)", "explanation": "Why optimal" },
  "relatedConcepts": ["concept 1", "concept 2"],
  "commonErrors": ["error 1", "error 2"]
}
\`\`\``,
        },
      ];

    default:
      throw new Error(`Unknown type: ${type}`);
  }
}

// ── Generate one item ─────────────────────────────────────────────────────────
async function generateOne(db, type, channel, agentId) {
  const id = makeId(type.slice(0, 3));
  const messages = makePrompt(type, channel, id);
  const startTime = Date.now();

  console.log(`\n🤖 [${agentId}] Generating ${type} for ${channel.name}...`);
  updateAgentStatus(agentId, "working", `${type}: ${channel.name}`);

  let raw;
  try {
    console.log(`   Streaming response...`);
    raw = await pollinationsChat(messages, "openai");
  } catch (err) {
    console.error(`   ❌ API Error: ${err.message}`);
    logGeneration(
      db,
      channel.id,
      type,
      false,
      err.message,
      Date.now() - startTime,
      "pollinations",
      agentId,
    );
    updateAgentStatus(agentId, "failed", err.message);
    throw err;
  }

  const generationTime = Date.now() - startTime;
  console.log(`\n   Raw output: ${raw.length} chars (${generationTime}ms)`);

  const jsonStr = extractJson(raw);
  const parsed = tryParseJson(jsonStr);

  if (!parsed || typeof parsed !== "object") {
    console.error(`   ❌ JSON parse failed`);
    logGeneration(
      db,
      channel.id,
      type,
      false,
      "JSON parse failed",
      generationTime,
      "pollinations",
      agentId,
    );
    updateAgentStatus(agentId, "failed", "JSON parse failed");
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
    "pollinations",
    agentId,
  );
  updateAgentStatus(agentId, "idle");
  return qualityScore >= QUALITY_THRESHOLD;
}

// ── Parallel Generation ────────────────────────────────────────────────────────
async function generateParallel(db, type, channel, agentId) {
  return generateOne(db, type, channel, agentId);
}

async function runParallelGeneration(db, typeKeys, itemsPerType) {
  console.log(
    `\n🚀 Starting PARALLEL generation (max ${MAX_PARALLEL} concurrent)`,
  );

  const tasks = [];
  for (const typeKey of typeKeys) {
    for (let i = 0; i < itemsPerType; i++) {
      let channel;
      if (TARGET_CHANNEL) {
        channel = CHANNELS.find((c) => c.id === TARGET_CHANNEL);
      } else {
        const lowest = findLowestChannel(db, typeKey);
        if (!lowest) continue;
        channel = lowest.channel;
      }
      tasks.push({ type: typeKey, channel, index: i });
    }
  }

  console.log(`📋 Total tasks: ${tasks.length}`);

  // Process in batches
  const results = [];
  for (let i = 0; i < tasks.length; i += MAX_PARALLEL) {
    const batch = tasks.slice(i, i + MAX_PARALLEL);
    const agentIndex = i % AGENT_TEAM.generators.length;
    const agent = AGENT_TEAM.generators[agentIndex];

    console.log(`\n${"─".repeat(50)}`);
    console.log(
      `Batch ${Math.floor(i / MAX_PARALLEL) + 1}: Processing ${batch.length} items with ${agent.name}`,
    );

    const batchResults = await Promise.allSettled(
      batch.map((task) => generateOne(db, task.type, task.channel, agent.id)),
    );

    batchResults.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        results.push({ success: result.value, task: batch[idx] });
      } else {
        results.push({
          success: false,
          error: result.reason?.message,
          task: batch[idx],
        });
      }
    });

    console.log(`\n✅ Batch ${Math.floor(i / MAX_PARALLEL) + 1} complete`);
  }

  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(
    "🚀 DevPrep Content Generator — powered by Pollinations.ai + Agent Team",
  );
  console.log(`   DB Path:        ${DB_PATH}`);
  console.log(`   Content Type:   ${CONTENT_TYPE}`);
  console.log(`   Channel:        ${TARGET_CHANNEL || "auto-detect"}`);
  console.log(`   Count:          ${COUNT}`);
  console.log(
    `   Parallel:       ${PARALLEL ? "enabled" : "disabled"} (max: ${MAX_PARALLEL})`,
  );
  console.log(`   Quality Threshold: ${(QUALITY_THRESHOLD * 100).toFixed(0)}%`);
  console.log(`\n👥 Agent Team:`);
  console.log(`   Coordinator: ${AGENT_TEAM.coordinator.name}`);
  AGENT_TEAM.generators.forEach((g) => {
    console.log(`   - ${g.name} (${g.specialization})`);
  });

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  if (ENABLE_VECTOR_DB) fs.mkdirSync(VECTOR_DIR, { recursive: true });

  updateAgentStatus(
    AGENT_TEAM.coordinator.id,
    "working",
    "Starting content generation",
  );
  const db = openDb();

  const ALL_TYPES = ["question", "flashcard", "exam", "voice", "coding"];
  const typeKeys =
    CONTENT_TYPE === "auto" || CONTENT_TYPE === "all"
      ? ALL_TYPES
      : [CONTENT_TYPE];

  let totalGenerated = 0;
  let totalFailed = 0;
  let totalLowQuality = 0;

  try {
    if (PARALLEL) {
      const results = await runParallelGeneration(db, typeKeys, COUNT);
      results.forEach((r) => {
        if (r.success) totalGenerated++;
        else if (r.success === false) totalFailed++;
        else totalLowQuality++;
      });
    } else {
      for (const typeKey of typeKeys) {
        const itemsForType = CONTENT_TYPE === "auto" ? 1 : COUNT;
        const agent = AGENT_TEAM.generators.find(
          (g) => g.role === `${typeKey}-generator`,
        );

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
              console.log(`✓ ${typeKey}: all channels at capacity`);
              break;
            }
            channel = lowest.channel;
          }

          console.log(
            `\n📊 ${typeKey}: "${channel.name}" (${i + 1}/${itemsForType})`,
          );
          try {
            const ok = await generateOne(
              db,
              typeKey,
              channel,
              agent?.id || "gen-question-001",
            );
            if (ok) totalGenerated++;
            else {
              totalLowQuality++;
              console.log(`   ⚠️  Low quality content`);
            }
          } catch (err) {
            console.error(`\n❌ ${typeKey} for ${channel.name}:`, err.message);
            totalFailed++;
          }
        }
      }
    }
  } finally {
    db.close();
    updateAgentStatus(AGENT_TEAM.coordinator.id, "idle", "Generation complete");
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ Generated:     ${totalGenerated} item(s)`);
  if (totalLowQuality > 0)
    console.log(`⚠️  Low Quality:  ${totalLowQuality} item(s)`);
  if (totalFailed > 0) console.log(`❌ Failed:        ${totalFailed} item(s)`);
  console.log(`📁 Database:     ${DB_PATH}`);
  console.log(`\n🎯 Agent Team Summary:`);
  AGENT_TEAM.generators.forEach((g) => {
    console.log(`   ${g.name}: ${g.status}`);
  });

  if (totalGenerated > 0) {
    console.log(`\nNext steps:`);
    console.log(`  1. Review generated content in the database`);
    console.log(`  2. Run: node scripts/build-vector-index.py`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
