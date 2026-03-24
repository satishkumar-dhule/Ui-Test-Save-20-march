import {
  agentRegistry,
  delegationTracker,
  taskOrchestrator,
  taskExecutor,
  statusTracker,
} from "./src/agents";

const REVAMP_TASKS = [
  {
    title: "Audit Current Website",
    description: "Review all existing pages, components, styles",
    priority: "critical" as const,
  },
  {
    title: "Design System Architecture",
    description: "Create new component library structure",
    priority: "critical" as const,
  },
  {
    title: "Build New Layout Components",
    description: "Create responsive Layout components",
    priority: "high" as const,
  },
  {
    title: "Implement Theme System",
    description: "Build Light/Dark theme with CSS variables",
    priority: "high" as const,
  },
  {
    title: "Create Navigation System",
    description: "Implement primary navigation with breadcrumbs",
    priority: "high" as const,
  },
  {
    title: "Build Dashboard Widgets",
    description: "Create StatsCard, ProgressBar widgets",
    priority: "medium" as const,
  },
  {
    title: "Implement Performance Optimizations",
    description: "Add code splitting, lazy loading",
    priority: "medium" as const,
  },
  {
    title: "Create Page Templates",
    description: "Build HomePage, ContentPage templates",
    priority: "medium" as const,
  },
  {
    title: "Add Accessibility Features",
    description: "Implement ARIA labels, keyboard nav",
    priority: "high" as const,
  },
  {
    title: "Write Documentation",
    description: "Document new components and migration",
    priority: "low" as const,
  },
];

async function runRevampProject() {
  console.log("=".repeat(60));
  console.log("PROJECT: REVAMP WEBSITE");
  console.log("=".repeat(60) + "\n");

  const architects = agentRegistry.getAgentsByLevel("architect");
  const creator = architects[0];

  const createdTasks: any[] = [];

  for (const taskConfig of REVAMP_TASKS) {
    const task = taskOrchestrator.createAndOrchestrateTask(
      taskConfig.title,
      taskConfig.description,
      taskConfig.priority,
      creator.id,
      "ground",
    );
    if (task) {
      createdTasks.push(task);
      const assignee = agentRegistry.getAgent(task.assignedTo || "");
      console.log(
        "[" +
          taskConfig.priority +
          "] " +
          task.title +
          " → " +
          (assignee?.name || "?"),
      );
    }
  }

  console.log("\nExecuting " + createdTasks.length + " tasks...\n");

  for (const task of createdTasks) {
    const result = await taskExecutor.executeTask(task.id);
    console.log((result.success ? "✓" : "✗") + " " + task.title);
  }

  console.log("\n" + "=".repeat(60));
  statusTracker.printStatusDashboard();
}

runRevampProject();
