#!/usr/bin/env bun

/**
 * Agent Team Spawner - E2E QA + Engineering Teams
 *
 * This script spawns:
 * - 5 E2E QA Engineers for testing
 * - 10 Engineering Specialists for bug fixes
 *
 * State-of-the-art coordination via CoordinationHub
 */

import {
  coordinationHub,
  E2E_TEAM,
  ENGINEERING_TEAM,
  TeamStatus,
  UnifiedReport,
} from "../agent-team/index";
import { e2eOrchestrator } from "../agent-team/e2e-qa-orchestrator";
import { engineeringOrchestrator } from "../agent-team/engineering-orchestrator";

interface AgentSpawnResult {
  agent: { id: string; name: string; role: string };
  status: "spawned" | "failed";
  message: string;
}

class AgentTeamSpawner {
  private spawnedAgents: AgentSpawnResult[] = [];
  private isRunning = false;

  async spawnAll(): Promise<AgentSpawnResult[]> {
    console.log("=".repeat(80));
    console.log("🚀 SPAWNING AGENT TEAMS");
    console.log("=".repeat(80));

    console.log("\n📋 E2E QA TEAM (5 Engineers):");
    for (const agent of E2E_TEAM) {
      await this.spawnQAAgent(agent);
    }

    console.log("\n📋 ENGINEERING TEAM (10 Specialists):");
    for (const agent of ENGINEERING_TEAM) {
      await this.spawnEngineer(agent);
    }

    this.setupCoordinationListeners();

    console.log("\n" + "=".repeat(80));
    console.log(`✅ SPAWNED ${this.spawnedAgents.length} AGENTS`);
    console.log("=".repeat(80));

    return this.spawnedAgents;
  }

  private async spawnQAAgent(agent: {
    id: string;
    name: string;
    role: string;
  }): Promise<void> {
    console.log(`   └── ${agent.id}: ${agent.name} (${agent.role})`);
    this.spawnedAgents.push({
      agent,
      status: "spawned",
      message: `QA Agent ${agent.name} ready for testing`,
    });
  }

  private async spawnEngineer(agent: {
    id: string;
    name: string;
    role: string;
  }): Promise<void> {
    console.log(`   └── ${agent.id}: ${agent.name} (${agent.role})`);
    this.spawnedAgents.push({
      agent,
      status: "spawned",
      message: `Engineer ${agent.name} ready for bug fixes`,
    });
  }

  private setupCoordinationListeners(): void {
    coordinationHub.on("team-status", (data) => {
      const status = data as TeamStatus;
      console.log("\n📊 TEAM STATUS UPDATE:");
      console.log(
        `   QA: ${status.qaTeam.runningCount} running, ${status.qaTeam.idleCount} idle`,
      );
      console.log(
        `   Eng: ${status.engineeringTeam.workingCount} working, ${status.engineeringTeam.idleCount} idle`,
      );
    });

    coordinationHub.on("work-item-created", (data) => {
      const { workItem, task } = data as { workItem: unknown; task: unknown };
      console.log(`\n🐛 WORK ITEM CREATED: ${(workItem as { id: string }).id}`);
      console.log(`   └── TASK: ${(task as { id: string }).id}`);
    });

    coordinationHub.on("task-assigned", (data) => {
      const { task, engineer } = data as {
        task: { id: string; title: string };
        engineer: { id: string; name: string };
      };
      console.log(`\n📌 TASK ASSIGNED: ${task.id}`);
      console.log(`   └── ${engineer.name} (${engineer.id})`);
      console.log(`   └── "${task.title}"`);
    });

    coordinationHub.on("task-resolved", (data) => {
      const task = data as {
        id: string;
        workItemId: string;
        assignedEngineer?: string;
      };
      console.log(`\n✅ TASK RESOLVED: ${task.id}`);
      console.log(`   └── Fixed by ${task.assignedEngineer}`);
    });
  }

  async runE2ETests(): Promise<void> {
    console.log("\n" + "=".repeat(80));
    console.log("🧪 RUNNING E2E TESTING (5 QA Engineers)");
    console.log("=".repeat(80));

    await coordinationHub.startE2ETesting();

    const status = await coordinationHub.getStatus();
    this.printStatus(status);
  }

  async processWorkItems(): Promise<void> {
    console.log("\n" + "=".repeat(80));
    console.log("📝 PROCESSING WORK ITEMS → ENGINEERING TASKS");
    console.log("=".repeat(80));

    await coordinationHub.autoAssignWorkItems();

    const status = await coordinationHub.getStatus();
    this.printStatus(status);
  }

  async runVerificationCycle(): Promise<void> {
    console.log("\n" + "=".repeat(80));
    console.log("✓ RUNNING VERIFICATION CYCLE");
    console.log("=".repeat(80));

    await coordinationHub.runVerificationCycle();

    const report = await coordinationHub.generateUnifiedReport();
    this.printReport(report);
  }

  async fullCycle(): Promise<void> {
    this.isRunning = true;
    console.log("\n" + "=".repeat(80));
    console.log("🔄 FULL CYCLE: E2E → WORK ITEMS → FIXES → VERIFICATION");
    console.log("=".repeat(80));

    // Phase 1: E2E Testing
    console.log("\n📍 PHASE 1: E2E Testing");
    await coordinationHub.startE2ETesting();

    // Phase 2: Process work items
    console.log("\n📍 PHASE 2: Create Engineering Tasks");
    await coordinationHub.autoAssignWorkItems();

    // Phase 3: Simulate work (in real scenario, engineers would work)
    console.log("\n📍 PHASE 3: Engineers Working...");

    // Phase 4: Verification
    console.log("\n📍 PHASE 4: Verification");
    await coordinationHub.runVerificationCycle();

    this.isRunning = false;
    const report = await coordinationHub.generateUnifiedReport();
    this.printReport(report);
  }

  printStatus(status: TeamStatus): void {
    console.log("\n📊 CURRENT STATUS:");
    console.log(`   E2E QA Team: ${status.qaTeam.totalAgents} agents`);
    console.log(`      - Running: ${status.qaTeam.runningCount}`);
    console.log(`      - Idle: ${status.qaTeam.idleCount}`);
    console.log(`      - Bugs Found: ${status.qaTeam.totalBugsFound}`);
    console.log(`      - Open Work Items: ${status.qaTeam.openWorkItems}`);
    console.log(
      `   Engineering Team: ${status.engineeringTeam.totalEngineers} engineers`,
    );
    console.log(`      - Working: ${status.engineeringTeam.workingCount}`);
    console.log(`      - Idle: ${status.engineeringTeam.idleCount}`);
    console.log(`      - Bugs Fixed: ${status.engineeringTeam.totalBugsFixed}`);
    console.log(`   Pipeline:`);
    console.log(`      - In Progress: ${status.pipeline.inProgressTasks}`);
    console.log(`      - In Review: ${status.pipeline.inReviewTasks}`);
    console.log(`      - Resolved Today: ${status.pipeline.resolvedToday}`);
  }

  private printReport(report: UnifiedReport): void {
    console.log("\n" + "=".repeat(80));
    console.log("📋 UNIFIED REPORT");
    console.log("=".repeat(80));
    console.log(`Generated: ${report.generatedAt.toISOString()}`);
    console.log("\n📈 SUMMARY:");
    console.log(`   Bugs Found: ${report.summary.totalBugsFound}`);
    console.log(`   Bugs Fixed: ${report.summary.totalBugsFixed}`);
    console.log(`   Critical Open: ${report.summary.criticalOpen}`);
    console.log(`   High Priority Open: ${report.summary.highOpen}`);
    console.log(`   Pass Rate: ${report.summary.passRate.toFixed(1)}%`);
  }

  async getStatus(): Promise<TeamStatus> {
    return coordinationHub.getStatus();
  }

  async getReport(): Promise<UnifiedReport> {
    return coordinationHub.generateUnifiedReport();
  }

  getSpawnedAgents(): AgentSpawnResult[] {
    return this.spawnedAgents;
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

export const agentTeamSpawner = new AgentTeamSpawner();

// CLI interface - uses global args
declare const args: string[];
const command = typeof args !== "undefined" && args[2] ? args[2] : "status";

async function main() {
  const spawner = agentTeamSpawner;

  switch (command) {
    case "spawn":
      await spawner.spawnAll();
      break;

    case "test":
      await spawner.spawnAll();
      await spawner.runE2ETests();
      break;

    case "process":
      await spawner.spawnAll();
      await spawner.processWorkItems();
      break;

    case "verify":
      await spawner.spawnAll();
      await spawner.runVerificationCycle();
      break;

    case "full":
      await spawner.spawnAll();
      await spawner.fullCycle();
      break;

    case "status":
    default:
      await spawner.spawnAll();
      const status = await spawner.getStatus();
      spawner.printStatus(status);
      break;
  }
}

main().catch(console.error);

console.log("\n💡 Available commands:");
console.log("   bun run agent-team-spawner.ts spawn   - Spawn all agents");
console.log("   bun run agent-team-spawner.ts status  - Show team status");
console.log("   bun run agent-team-spawner.ts test    - Run E2E tests");
console.log("   bun run agent-team-spawner.ts process - Process work items");
console.log("   bun run agent-team-spawner.ts verify  - Run verification");
console.log("   bun run agent-team-spawner.ts full    - Run full cycle");
