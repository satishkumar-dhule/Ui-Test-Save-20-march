/**
 * DevPrep Parallel Multi-Agent Content Generator
 *
 * Spawns a dedicated agent team to generate content across ALL channels and
 * content types simultaneously. Each agent handles one channel+type task and
 * delegates actual generation to generate-content.mjs (unchanged).
 *
 * Usage:
 *   node content-gen/generate-all-parallel.mjs
 *   COUNT=2 node content-gen/generate-all-parallel.mjs          # 2 items per task
 *   CONCURRENCY=8 node content-gen/generate-all-parallel.mjs    # 8 parallel workers
 *   DRY_RUN=true node content-gen/generate-all-parallel.mjs     # preview tasks only
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { loadChannelsFromDb } from "./db-channels.mjs";
import { Database } from "bun:sqlite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────
const CONCURRENCY = parseInt(process.env.CONCURRENCY || "15", 10);
const COUNT = parseInt(process.env.COUNT || "1", 10);
const DRY_RUN = process.env.DRY_RUN === "true";
const GENERATOR = path.resolve(__dirname, "generate-content.mjs");
const DB_PATH =
  process.env.DB_PATH || path.resolve(__dirname, "../data/devprep.db");

// ── Channels — loaded from DB (single source of truth) ────────────────────────
const dbChannels = loadChannelsFromDb(DB_PATH);
if (!dbChannels) {
  console.error(
    "❌ Could not load channels from DB. Make sure data/devprep.db exists and has a 'channels' table.",
  );
  process.exit(1);
}
const CHANNELS = dbChannels;

const CONTENT_TYPES = ["question", "flashcard", "exam", "voice", "coding"];

// ── Named Agent Pool ──────────────────────────────────────────────────────────
const AGENT_POOL = [
  // Copy 1
  { id: "A01", name: "Alex Chen", emoji: "🔵" },
  { id: "A02", name: "Maya Patel", emoji: "🟢" },
  { id: "A03", name: "Jordan Kim", emoji: "🟡" },
  { id: "A04", name: "Sam Rivera", emoji: "🟠" },
  { id: "A05", name: "Casey Morgan", emoji: "🔴" },
  { id: "A06", name: "Taylor Brooks", emoji: "🟣" },
  { id: "A07", name: "Riley Scott", emoji: "⚪" },
  { id: "A08", name: "Drew Hassan", emoji: "🟤" },
  { id: "A09", name: "Quinn Nakamura", emoji: "🔶" },
  { id: "A10", name: "Blake Osei", emoji: "🔷" },
  // Copy 2
  { id: "A11", name: "Alex Chen II", emoji: "🔵" },
  { id: "A12", name: "Maya Patel II", emoji: "🟢" },
  { id: "A13", name: "Jordan Kim II", emoji: "🟡" },
  { id: "A14", name: "Sam Rivera II", emoji: "🟠" },
  { id: "A15", name: "Casey Morgan II", emoji: "🔴" },
  { id: "A16", name: "Taylor Brooks II", emoji: "🟣" },
  { id: "A17", name: "Riley Scott II", emoji: "⚪" },
  { id: "A18", name: "Drew Hassan II", emoji: "🟤" },
  { id: "A19", name: "Quinn Nakamura II", emoji: "🔶" },
  { id: "A20", name: "Blake Osei II", emoji: "🔷" },
  // Copy 3
  { id: "A21", name: "Alex Chen III", emoji: "🔵" },
  { id: "A22", name: "Maya Patel III", emoji: "🟢" },
  { id: "A23", name: "Jordan Kim III", emoji: "🟡" },
  { id: "A24", name: "Sam Rivera III", emoji: "🟠" },
  { id: "A25", name: "Casey Morgan III", emoji: "🔴" },
  { id: "A26", name: "Taylor Brooks III", emoji: "🟣" },
  { id: "A27", name: "Riley Scott III", emoji: "⚪" },
  { id: "A28", name: "Drew Hassan III", emoji: "🟤" },
  { id: "A29", name: "Quinn Nakamura III", emoji: "🔶" },
  { id: "A30", name: "Blake Osei III", emoji: "🔷" },
];

// ── Task ─────────────────────────────────────────────────────────────────────
/** @typedef {{ channel: typeof CHANNELS[0], type: string }} Task */

function buildTaskList() {
  const tasks = [];
  for (const channel of CHANNELS) {
    for (const type of CONTENT_TYPES) {
      tasks.push({ channel, type });
    }
  }
  return tasks;
}

// ── Progress Tracking ─────────────────────────────────────────────────────────
const state = {
  total: 0,
  done: 0,
  failed: 0,
  inFlight: new Map(), // taskKey -> { agent, channel, type, startMs }
  results: [], // { channel, type, success, durationMs, error? }
};

function taskKey(channel, type) {
  return `${channel.id}:${type}`;
}

function renderDashboard() {
  const now = Date.now();
  const lines = [
    `\n${"═".repeat(64)}`,
    `  DevPrep Multi-Agent Content Generator`,
    `  Progress: ${state.done + state.failed}/${state.total}  ✅ ${state.done}  ❌ ${state.failed}  🔄 ${state.inFlight.size}`,
    `${"─".repeat(64)}`,
  ];

  if (state.inFlight.size > 0) {
    lines.push("  Active agents:");
    for (const [key, job] of state.inFlight) {
      const elapsed = ((now - job.startMs) / 1000).toFixed(0);
      lines.push(
        `    ${job.agent.emoji} ${job.agent.name.padEnd(16)} ${job.channel.name.padEnd(26)} ${job.type.padEnd(10)} ${elapsed}s`,
      );
    }
  }

  lines.push(`${"═".repeat(64)}`);
  process.stdout.write("\x1B[2J\x1B[H"); // clear screen
  process.stdout.write(lines.join("\n") + "\n");
}

// ── Worker: run one task via generate-content.mjs ────────────────────────────
function runWorker(channel, type, agent) {
  return new Promise((resolve, reject) => {
    const key = taskKey(channel, type);
    const startMs = Date.now();
    state.inFlight.set(key, { agent, channel, type, startMs });
    renderDashboard();

    const env = {
      ...process.env,
      TARGET_CHANNEL: channel.id,
      CONTENT_TYPE: type,
      COUNT: String(COUNT),
      ENABLE_VECTOR_DB: "false",
      DB_PATH,
    };

    const child = spawn(process.execPath, [GENERATOR], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("close", (code) => {
      const durationMs = Date.now() - startMs;
      state.inFlight.delete(key);

      const success = code === 0;
      state.results.push({
        channel,
        type,
        success,
        durationMs,
        stdout,
        stderr,
      });

      if (success) {
        state.done++;
      } else {
        state.failed++;
        const errLine =
          (stderr + stdout)
            .split("\n")
            .find((l) => l.includes("Error") || l.includes("❌")) || "";
        state.results[state.results.length - 1].error = errLine.trim();
      }

      renderDashboard();
      success
        ? resolve({ channel, type, durationMs })
        : reject(new Error(`Worker exited ${code} for ${channel.id}:${type}`));
    });

    child.on("error", (err) => {
      state.inFlight.delete(key);
      state.failed++;
      renderDashboard();
      reject(err);
    });
  });
}

// ── Concurrency Pool ──────────────────────────────────────────────────────────
async function runWithConcurrency(tasks, concurrency) {
  const queue = [...tasks];
  const agentPool = AGENT_POOL.slice(0, Math.max(concurrency, 1));
  const freeAgents = [...agentPool];
  const busySlots = new Set();

  return new Promise((resolve) => {
    const settled = [];

    function dispatch() {
      while (queue.length > 0 && freeAgents.length > 0) {
        const task = queue.shift();
        const agent = freeAgents.shift();
        busySlots.add(agent.id);

        runWorker(task.channel, task.type, agent).then(
          (result) => {
            settled.push({ status: "fulfilled", value: result });
            freeAgents.push(agent);
            busySlots.delete(agent.id);
            dispatch();
            if (settled.length === tasks.length) resolve(settled);
          },
          (err) => {
            settled.push({ status: "rejected", reason: err });
            freeAgents.push(agent);
            busySlots.delete(agent.id);
            dispatch();
            if (settled.length === tasks.length) resolve(settled);
          },
        );
      }

      if (
        queue.length === 0 &&
        busySlots.size === 0 &&
        settled.length === tasks.length
      ) {
        resolve(settled);
      }
    }

    dispatch();
  });
}

// ── Summary ───────────────────────────────────────────────────────────────────
function printSummary() {
  console.log(`\n${"═".repeat(64)}`);
  console.log(`  FINAL REPORT`);
  console.log(`${"─".repeat(64)}`);
  console.log(`  Total tasks : ${state.total}`);
  console.log(`  Succeeded   : ${state.done}`);
  console.log(`  Failed      : ${state.failed}`);
  console.log(`${"─".repeat(64)}`);

  if (state.failed > 0) {
    console.log("  Failed tasks:");
    for (const r of state.results) {
      if (!r.success) {
        console.log(
          `    ❌ ${r.channel.name.padEnd(28)} ${r.type.padEnd(10)} ${r.error || "unknown error"}`,
        );
      }
    }
    console.log(`${"─".repeat(64)}`);
  }

  // Per-channel summary
  console.log("  Results by channel:");
  for (const channel of CHANNELS) {
    const channelResults = state.results.filter(
      (r) => r.channel.id === channel.id,
    );
    const ok = channelResults.filter((r) => r.success).length;
    const total = channelResults.length;
    const bar = CONTENT_TYPES.map((t) => {
      const r = channelResults.find((x) => x.type === t);
      return r ? (r.success ? "✅" : "❌") : "⏸";
    }).join(" ");
    console.log(`    ${channel.name.padEnd(28)} ${bar}  (${ok}/${total})`);
  }

  console.log(`${"─".repeat(64)}`);
  console.log(`  Content types: ${CONTENT_TYPES.join("  ")}`);
  console.log(`  Database     : ${DB_PATH}`);
  console.log(`${"═".repeat(64)}\n`);
}

// ── DB Count Helper ───────────────────────────────────────────────────────────
function getDbCounts() {
  try {
    const db = new Database(DB_PATH, { readonly: true });
    const rows = db
      .prepare(
        "SELECT channel_id, content_type, COUNT(*) as n FROM generated_content GROUP BY channel_id, content_type",
      )
      .all();
    db.close();
    return rows;
  } catch {
    return [];
  }
}

function printDbStats(label) {
  const rows = getDbCounts();
  if (rows.length === 0) return;
  const total = rows.reduce((s, r) => s + r.n, 0);
  console.log(
    `  ${label}: ${total} items across ${rows.length} channel/type pairs`,
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const tasks = buildTaskList();
  state.total = tasks.length;

  const effectiveConcurrency = Math.min(CONCURRENCY, AGENT_POOL.length);

  console.log(`\n${"═".repeat(64)}`);
  console.log("  DevPrep Multi-Agent Content Generator");
  console.log(`${"─".repeat(64)}`);
  console.log(`  Channels     : ${CHANNELS.length}`);
  console.log(`  Content types: ${CONTENT_TYPES.join(", ")}`);
  console.log(
    `  Tasks        : ${tasks.length} (${CHANNELS.length} × ${CONTENT_TYPES.length})`,
  );
  console.log(`  Count/task   : ${COUNT}`);
  console.log(`  Concurrency  : ${effectiveConcurrency} parallel agents`);
  console.log(`  Generator    : ${GENERATOR}`);
  console.log(`${"═".repeat(64)}\n`);

  if (DRY_RUN) {
    console.log("DRY RUN — tasks that would be executed:\n");
    for (const t of tasks) {
      console.log(`  ${t.channel.name.padEnd(28)} ${t.type}`);
    }
    console.log(`\nTotal: ${tasks.length} tasks`);
    return;
  }

  console.log("Before generation:");
  printDbStats("DB");
  console.log();

  const startTime = Date.now();
  await runWithConcurrency(tasks, effectiveConcurrency);
  const totalMs = Date.now() - startTime;

  printSummary();

  console.log("After generation:");
  printDbStats("DB");

  const mins = (totalMs / 60000).toFixed(1);
  console.log(`  Wall time    : ${mins} minutes\n`);

  if (state.failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
