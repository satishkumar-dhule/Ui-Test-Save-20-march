import {
  agentTeam,
  agentRegistry,
  delegationTracker,
  taskOrchestrator,
} from "./src/agents";

console.log("=".repeat(60));
console.log("AGENT TEAM HIERARCHY - 3 LEVELS");
console.log("=".repeat(60));
console.log("\nLEVEL 1 - ARCHITECTS (Strategic)");
console.log("-".repeat(40));

const architects = agentRegistry.getAgentsByLevel("architect");
for (const a of architects) {
  console.log("  " + a.name + " (" + a.role + ")");
  console.log("      Skills: " + a.capabilities.skills.join(", "));
}

console.log("\nLEVEL 2 - MANAGERS (Tactical)");
console.log("-".repeat(40));

const managers = agentRegistry.getAgentsByLevel("manager");
for (const m of managers) {
  console.log("  " + m.name + " (" + m.role + ")");
}

console.log("\nLEVEL 3 - SPECIALISTS (Ground/Execution)");
console.log("-".repeat(40));

const ground = agentRegistry
  .getAgentsByLevel("specialist")
  .concat(agentRegistry.getAgentsByLevel("ground"));
for (const g of ground) {
  console.log("  " + g.name + " (" + g.role + ")");
}

console.log("\n" + "=".repeat(60));
console.log("DELEGATION FLOW DEMO");
console.log("=".repeat(60));

const demoTasks = [
  {
    title: "Design Auth System",
    description: "Create authentication architecture",
    priority: "critical" as const,
  },
  {
    title: "Build REST API",
    description: "Implement API endpoints",
    priority: "high" as const,
  },
  {
    title: "Write Documentation",
    description: "Document the system",
    priority: "medium" as const,
  },
];

const creator = architects[0];
console.log("\nCreating tasks from: " + creator.name);

for (const task of demoTasks) {
  const created = taskOrchestrator.createAndOrchestrateTask(
    task.title,
    task.description,
    task.priority,
    creator.id,
    "ground",
  );
  if (created) {
    console.log(
      "  Created: " +
        created.title +
        " -> " +
        created.delegationChain.join(" -> "),
    );
  }
}

console.log("\n" + "=".repeat(60));
console.log("TEAM METRICS");
console.log("=".repeat(60));
console.log(JSON.stringify(agentRegistry.getTeamMetrics(), null, 2));

console.log("\n" + "=".repeat(60));
console.log("DELEGATION TRACKERS");
console.log("=".repeat(60));
console.log(JSON.stringify(delegationTracker.getAnalytics(), null, 2));

console.log("\n" + "=".repeat(60));
console.log("TASK ORCHESTRATOR DASHBOARD");
console.log("=".repeat(60));
const dashboard = taskOrchestrator.getDashboard();
console.log("Active Trackers: " + dashboard.taskTrackers.length);
console.log("Workload Distribution:", dashboard.workload);
