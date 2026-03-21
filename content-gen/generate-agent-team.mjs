/**
 * DevPrep Agent Team Content Generator
 *
 * Uses opencode's native agent team feature to generate study content.
 * A coordinator agent deploys 5 parallel specialist agents — one per content
 * type — each using its own LLM session to generate content across all channels.
 *
 * Agent team (registered in .opencode/agents/):
 *   devprep-coordinator      (primary)   — orchestrates the whole run
 *   devprep-question-expert  (subagent)  — technical interview questions
 *   devprep-flashcard-expert (subagent)  — spaced-repetition flashcards
 *   devprep-exam-expert      (subagent)  — certification exam questions
 *   devprep-voice-expert     (subagent)  — verbal practice prompts
 *   devprep-coding-expert    (subagent)  — coding challenges + solutions
 *
 * Usage:
 *   node content-gen/generate-agent-team.mjs
 *   COUNT=2 node content-gen/generate-agent-team.mjs       # 2 items per channel/type
 *   DIRECT=true node content-gen/generate-agent-team.mjs   # skip coordinator, run 5 agents directly in parallel
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const WORKSPACE = path.resolve(__dirname, "..");
const AGENTS_DIR = path.join(WORKSPACE, ".opencode", "agents");
const SAVE_HELPER = path.join(__dirname, "save-content.mjs");
const DB_PATH = process.env.DB_PATH || path.join(WORKSPACE, "data", "devprep.db");
const COUNT = parseInt(process.env.COUNT || "1", 10);
const DIRECT = process.env.DIRECT === "true";

const CHANNELS = [
  "javascript", "react", "algorithms", "devops", "kubernetes",
  "networking", "system-design", "aws-saa", "aws-dev", "cka", "terraform",
];

const CONTENT_TYPES = ["question", "flashcard", "exam", "voice", "coding"];

const AGENT_MAP = {
  question:  "devprep-question-expert",
  flashcard: "devprep-flashcard-expert",
  exam:      "devprep-exam-expert",
  voice:     "devprep-voice-expert",
  coding:    "devprep-coding-expert",
};

// ── Ensure agents are synced to .opencode/agents/ ────────────────────────────
function syncAgents() {
  const src = path.join(__dirname, "agents");
  fs.mkdirSync(AGENTS_DIR, { recursive: true });

  const files = fs.readdirSync(src).filter((f) => f.endsWith(".agent.md"));
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(AGENTS_DIR, file);
    let content = fs.readFileSync(srcPath, "utf8");

    // Strip tools: arrays (opencode 1.2.27 expects record format, not array)
    content = content.replace(/^tools:\n(  - .+\n)*/gm, "");

    fs.writeFileSync(destPath, content);
  }

  console.log(`  Synced ${files.length} agent files to .opencode/agents/`);
}

// ── Get current DB stats ──────────────────────────────────────────────────────
function getDbStats() {
  try {
    const Database = require("better-sqlite3");
    const db = new Database(DB_PATH, { readonly: true });
    const rows = db
      .prepare(
        "SELECT channel_id, content_type, COUNT(*) as n FROM generated_content GROUP BY channel_id, content_type",
      )
      .all();
    db.close();
    const totals = {};
    for (const r of rows) {
      if (!totals[r.channel_id]) totals[r.channel_id] = {};
      totals[r.channel_id][r.content_type] = r.n;
    }
    return totals;
  } catch {
    return {};
  }
}

function printStats(label, stats) {
  const total = Object.values(stats)
    .flatMap((t) => Object.values(t))
    .reduce((s, n) => s + n, 0);
  console.log(`  ${label}: ${total} total items`);
  for (const ch of CHANNELS) {
    const types = stats[ch] || {};
    const bar = CONTENT_TYPES.map((t) => (types[t] ? `${t[0]}:${types[t]}` : `${t[0]}:0`)).join("  ");
    console.log(`    ${ch.padEnd(16)} ${bar}`);
  }
}

// ── Run opencode with a given agent and message ───────────────────────────────
function runAgent(agentName, message, label) {
  return new Promise((resolve, reject) => {
    const opencode = path.resolve(WORKSPACE, "node_modules/.bin/opencode");
    const args = [
      "run",
      "--agent", agentName,
      "--dir", WORKSPACE,
      message,
    ];

    console.log(`\n  🚀 Starting agent: ${agentName} (${label})`);

    const child = spawn(opencode, args, {
      env: {
        ...process.env,
        DB_PATH,
        SAVE_HELPER,
        CHANNELS: CHANNELS.join(","),
        COUNT: String(COUNT),
      },
      stdio: ["ignore", "pipe", "pipe"],
      cwd: WORKSPACE,
    });

    let output = "";
    child.stdout.on("data", (d) => {
      const chunk = d.toString();
      output += chunk;
      // Stream useful lines to console
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.includes("✅") || line.includes("❌") || line.includes("Saved") || line.includes("Error")) {
          console.log(`  [${agentName}] ${line.trim()}`);
        }
      }
    });
    child.stderr.on("data", (d) => {
      const chunk = d.toString();
      output += chunk;
    });

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`  ✅ Agent ${agentName} completed`);
        resolve({ agent: agentName, label, output });
      } else {
        console.error(`  ❌ Agent ${agentName} exited with code ${code}`);
        reject(new Error(`${agentName} failed (exit ${code})`));
      }
    });

    child.on("error", (err) => {
      reject(new Error(`Cannot start ${agentName}: ${err.message}`));
    });
  });
}

// ── Build specialist message ──────────────────────────────────────────────────
function buildSpecialistMessage(type) {
  const channelList = CHANNELS.join(", ");
  return `Generate ${COUNT} ${type} item(s) for EACH of these channels: ${channelList}.

For each channel:
1. Generate a complete, high-quality ${type} JSON object following your expert format
2. Write the JSON to /tmp/${type}-<channel>.json using the write tool
3. Run this bash command to save it:
   node ${SAVE_HELPER} /tmp/${type}-<channel>.json --channel <channel-id> --type ${type} --agent ${AGENT_MAP[type]}
4. Confirm success and move to the next channel

Work through all ${CHANNELS.length} channels. Save each one before moving to the next.
DB path: ${DB_PATH}`;
}

// ── Build coordinator message ─────────────────────────────────────────────────
function buildCoordinatorMessage() {
  const channelList = CHANNELS.join(", ");
  return `You are the DevPrep Content Generation Coordinator. Deploy all 5 specialist agents simultaneously using the task tool.

Your channels: ${channelList}
Items per channel per type: ${COUNT}
Save helper: ${SAVE_HELPER}
DB: ${DB_PATH}

STEP 1 - Check current DB state with bash:
node -e "
const {createRequire}=require('module');
const r=createRequire('file:///x.js');
const DB=r('better-sqlite3');
try{const db=new DB('${DB_PATH}',{readonly:true});const rows=db.prepare('SELECT channel_id,content_type,COUNT(*) as n FROM generated_content GROUP BY channel_id,content_type').all();console.log(JSON.stringify(rows));db.close();}catch(e){console.log('[]');}
"

STEP 2 - Use the task tool to launch ALL 5 specialist agents in parallel (do not wait for one before starting the others):

Task 1 - question expert: "Generate ${COUNT} interview question(s) for each of these channels: ${channelList}. For each channel: generate complete JSON, write to /tmp/question-<channel>.json, run: node ${SAVE_HELPER} /tmp/question-<channel>.json --channel <channel-id> --type question --agent devprep-question-expert"

Task 2 - flashcard expert: "Generate ${COUNT} flashcard(s) for each of these channels: ${channelList}. For each channel: generate complete JSON, write to /tmp/flashcard-<channel>.json, run: node ${SAVE_HELPER} /tmp/flashcard-<channel>.json --channel <channel-id> --type flashcard --agent devprep-flashcard-expert"

Task 3 - exam expert: "Generate ${COUNT} exam question(s) for each of these channels: ${channelList}. For each channel: generate complete JSON, write to /tmp/exam-<channel>.json, run: node ${SAVE_HELPER} /tmp/exam-<channel>.json --channel <channel-id> --type exam --agent devprep-exam-expert"

Task 4 - voice expert: "Generate ${COUNT} voice practice prompt(s) for each of these channels: ${channelList}. For each channel: generate complete JSON, write to /tmp/voice-<channel>.json, run: node ${SAVE_HELPER} /tmp/voice-<channel>.json --channel <channel-id> --type voice --agent devprep-voice-expert"

Task 5 - coding expert: "Generate ${COUNT} coding challenge(s) for each of these channels: ${channelList}. For each channel: generate complete JSON with complete solutions, write to /tmp/coding-<channel>.json, run: node ${SAVE_HELPER} /tmp/coding-<channel>.json --channel <channel-id> --type coding --agent devprep-coding-expert"

STEP 3 - After all 5 tasks complete, check the DB again and report total items generated per channel and type.`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${"═".repeat(64)}`);
  console.log("  DevPrep Agent Team Content Generator");
  console.log(`${"─".repeat(64)}`);
  console.log(`  Mode         : ${DIRECT ? "Direct (5 parallel agents)" : "Coordinator → 5 specialists"}`);
  console.log(`  Channels     : ${CHANNELS.length} (${CHANNELS.join(", ")})`);
  console.log(`  Content types: ${CONTENT_TYPES.join(", ")}`);
  console.log(`  Items/pair   : ${COUNT}`);
  console.log(`  Save helper  : ${SAVE_HELPER}`);
  console.log(`  DB           : ${DB_PATH}`);
  console.log(`${"═".repeat(64)}\n`);

  // Sync agent files
  syncAgents();

  // Show pre-run stats
  const before = getDbStats();
  printStats("Before", before);
  console.log();

  const startTime = Date.now();

  if (DIRECT) {
    // Launch all 5 specialists in parallel without a coordinator
    console.log("  Launching 5 specialist agents in parallel...\n");
    const jobs = CONTENT_TYPES.map((type) =>
      runAgent(AGENT_MAP[type], buildSpecialistMessage(type), `${type} for all channels`)
        .catch((err) => ({ agent: AGENT_MAP[type], error: err.message }))
    );

    const results = await Promise.all(jobs);
    const failed = results.filter((r) => r.error);

    if (failed.length > 0) {
      console.log(`\n  ⚠️  ${failed.length} agent(s) failed:`);
      for (const f of failed) console.log(`    ❌ ${f.agent}: ${f.error}`);
    }
  } else {
    // Run coordinator which spawns subagents via the task tool
    console.log("  Launching coordinator agent...\n");
    try {
      await runAgent("devprep-coordinator", buildCoordinatorMessage(), "coordinator");
    } catch (err) {
      console.error(`\n  ❌ Coordinator failed: ${err.message}`);
      console.log("\n  Falling back to direct mode...");
      const jobs = CONTENT_TYPES.map((type) =>
        runAgent(AGENT_MAP[type], buildSpecialistMessage(type), `${type} for all channels`)
          .catch((err) => ({ agent: AGENT_MAP[type], error: err.message }))
      );
      await Promise.all(jobs);
    }
  }

  const elapsed = ((Date.now() - startTime) / 60000).toFixed(1);

  // Show post-run stats
  console.log(`\n${"─".repeat(64)}`);
  const after = getDbStats();
  printStats("After", after);

  // Delta
  const totalBefore = Object.values(before)
    .flatMap((t) => Object.values(t))
    .reduce((s, n) => s + n, 0);
  const totalAfter = Object.values(after)
    .flatMap((t) => Object.values(t))
    .reduce((s, n) => s + n, 0);

  console.log(`\n  Generated    : +${totalAfter - totalBefore} new items`);
  console.log(`  Wall time    : ${elapsed} minutes`);
  console.log(`${"═".repeat(64)}\n`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
