#!/usr/bin/env bun

/**
 * Agent Team Spawner - Standalone Version
 *
 * Spawns 5 E2E QA Engineers + 10 Engineering Specialists
 * State-of-the-art coordination
 */

import { E2E_TEAM } from "./agent-team/e2e-qa-orchestrator";
import { ENGINEERING_TEAM } from "./agent-team/engineering-orchestrator";
import { e2eOrchestrator } from "./agent-team/e2e-qa-orchestrator";
import { engineeringOrchestrator } from "./agent-team/engineering-orchestrator";

interface AgentSpawnResult {
  agent: { id: string; name: string; role: string };
  status: "spawned" | "failed";
  message: string;
}

async function spawnAll(): Promise<AgentSpawnResult[]> {
  const results: AgentSpawnResult[] = [];

  console.log("=".repeat(80));
  console.log("🚀 SPAWNING AGENT TEAMS");
  console.log("=".repeat(80));

  console.log("\n📋 E2E QA TEAM (5 Engineers):");
  for (const agent of E2E_TEAM) {
    console.log(`   └── ${agent.id}: ${agent.name} (${agent.role})`);
    results.push({
      agent,
      status: "spawned",
      message: `QA Agent ${agent.name} ready for testing`,
    });
  }

  console.log("\n📋 ENGINEERING TEAM (10 Specialists):");
  for (const agent of ENGINEERING_TEAM) {
    console.log(`   └── ${agent.id}: ${agent.name} (${agent.role})`);
    results.push({
      agent,
      status: "spawned",
      message: `Engineer ${agent.name} ready for bug fixes`,
    });
  }

  console.log("\n" + "=".repeat(80));
  console.log(`✅ SPAWNED ${results.length} AGENTS`);
  console.log("=".repeat(80));

  return results;
}

async function runE2ETests(): Promise<void> {
  console.log("\n" + "=".repeat(80));
  console.log("🧪 RUNNING E2E TESTING (5 QA Engineers)");
  console.log("=".repeat(80));

  const plan = await e2eOrchestrator.createTestPlan(
    "Full E2E Test Suite",
    "Complete coverage test of all DevPrep features",
  );

  console.log(`\n📋 Created test plan: ${plan.name}`);
  console.log(`   Suites: ${plan.suites.length}`);

  for (const suite of plan.suites) {
    console.log(`   └── Running: ${suite.name}`);
    await e2eOrchestrator.runTestSuite(suite.id);
    const results = suite.results || [];
    const passed = results.filter((r) => r.status === "passed").length;
    const failed = results.filter((r) => r.status === "failed").length;
    console.log(`       Results: ${passed} passed, ${failed} failed`);
  }

  const report = await e2eOrchestrator.generateReport();
  console.log("\n" + report);
}

async function processWorkItems(): Promise<void> {
  console.log("\n" + "=".repeat(80));
  console.log("📝 PROCESSING WORK ITEMS → ENGINEERING TASKS");
  console.log("=".repeat(80));

  const workItems = await e2eOrchestrator.getOpenWorkItems();
  console.log(`\n📋 Found ${workItems.length} open work items`);

  for (const workItem of workItems) {
    console.log(`   └── Creating task for: ${workItem.title}`);
    const task = await engineeringOrchestrator.createTaskFromWorkItem(workItem);
    console.log(`       Task created: ${task.id}`);
    await engineeringOrchestrator.assignTask(task.id);
    console.log(`       Assigned to: ${task.assignedEngineer}`);
  }
}

async function runFullCycle(): Promise<void> {
  console.log("\n" + "=".repeat(80));
  console.log("🔄 FULL CYCLE: E2E → WORK ITEMS → FIXES → VERIFICATION");
  console.log("=".repeat(80));

  // Phase 1: E2E Testing
  console.log("\n📍 PHASE 1: E2E Testing");
  await runE2ETests();

  // Phase 2: Process work items
  console.log("\n📍 PHASE 2: Create Engineering Tasks");
  await processWorkItems();

  // Phase 3: Verify all work items
  console.log("\n📍 PHASE 3: Verification");
  const tasks = await engineeringOrchestrator.getAllTasks("resolved");
  for (const task of tasks) {
    await engineeringOrchestrator.verifyTask(task.id);
    console.log(`   └── Verified: ${task.id}`);
  }

  // Final report
  const engReport = await engineeringOrchestrator.generateReport();
  console.log("\n" + engReport);
}

async function showStatus(): Promise<void> {
  const qaStats = await e2eOrchestrator.getTeamStats();
  const engStats = await engineeringOrchestrator.getTeamStats();

  console.log("\n📊 TEAM STATUS:");
  console.log("\nE2E QA Team:");
  console.log(`   Total Agents: ${qaStats.totalAgents}`);
  console.log(`   Idle: ${qaStats.idleCount}`);
  console.log(`   Running: ${qaStats.runningCount}`);
  console.log(`   Suites Completed: ${qaStats.completedSuites}`);
  console.log(`   Bugs Found: ${qaStats.totalBugsFound}`);
  console.log(`   Open Work Items: ${qaStats.openWorkItems}`);

  console.log("\nEngineering Team:");
  console.log(`   Total Engineers: ${engStats.totalEngineers}`);
  console.log(`   Idle: ${engStats.idleCount}`);
  console.log(`   Working: ${engStats.workingCount}`);
  console.log(`   Blocked: ${engStats.blockedCount}`);
  console.log(`   Pending Tasks: ${engStats.pendingTasks}`);
  console.log(`   Resolved Tasks: ${engStats.resolvedTasks}`);
  console.log(`   Bugs Fixed: ${engStats.totalBugsFixed}`);
  console.log(`   Avg Fix Time: ${engStats.avgFixTime.toFixed(1)}h`);
}

async function main() {
  const command = typeof args !== "undefined" && args[2] ? args[2] : "status";

  await spawnAll();

  switch (command) {
    case "spawn":
      console.log("\n✅ All agents spawned successfully!");
      break;

    case "test":
      await runE2ETests();
      break;

    case "process":
      await processWorkItems();
      break;

    case "full":
      await runFullCycle();
      break;

    case "status":
    default:
      await showStatus();
      break;
  }
}

main().catch(console.error);

console.log("\n💡 Available commands:");
console.log("   bun run scripts/spawn-agents.ts spawn  - Spawn all agents");
console.log("   bun run scripts/spawn-agents.ts status - Show team status");
console.log("   bun run scripts/spawn-agents.ts test   - Run E2E tests");
console.log("   bun run scripts/spawn-agents.ts process - Process work items");
console.log("   bun run scripts/spawn-agents.ts full   - Run full cycle");
