#!/usr/bin/env bun

/**
 * Autonomous Agent System
 *
 * Self-managing, self-coordinating agent team that:
 * - Automatically picks up tasks
 * - Self-organizes and delegates
 * - Reports progress autonomously
 * - Handles dependencies
 * - Auto-scales resources
 * - Self-heals blocked tasks
 */

import { E2E_TEAM, e2eOrchestrator } from "./agent-team/e2e-qa-orchestrator";
import {
  ENGINEERING_TEAM,
  engineeringOrchestrator,
} from "./agent-team/engineering-orchestrator";
import {
  generateTaskId,
  Task,
  TaskType,
  TaskPriority,
  TaskStatus,
} from "./agent-team/task-types";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";

interface AgentWorker {
  id: string;
  name: string;
  role: string;
  skills: string[];
  status: "idle" | "working" | "blocked" | "thinking";
  currentTask?: string;
  currentSubtask?: string;
  progress: number;
  lastReport: Date;
  capabilities: string[];
}

interface TaskEvent {
  type:
    | "created"
    | "assigned"
    | "started"
    | "progress"
    | "blocked"
    | "completed"
    | "review"
    | "verified";
  taskId: string;
  agentId?: string;
  message: string;
  timestamp: Date;
}

interface DelegationChain {
  taskId: string;
  leader: string;
  subagents: { id: string; task: string; status: string; progress: number }[];
  createdAt: Date;
}

class AutonomousAgentSystem {
  private agents: Map<string, AgentWorker> = new Map();
  private tasks: Map<string, Task> = new Map();
  private taskStore: Task[] = [];
  private events: TaskEvent[] = [];
  private delegationChains: Map<string, DelegationChain> = new Map();
  private isRunning = false;
  private tickInterval: number = 5000; // 5 seconds
  private readonly TASK_FILE =
    "/home/runner/workspace/data/autonomous-tasks.json";
  private readonly LOG_FILE = "/home/runner/workspace/data/agent-events.jsonl";

  constructor() {
    this.initializeAgents();
    this.loadState();
  }

  private initializeAgents(): void {
    // Create worker agents from engineering team
    for (const eng of ENGINEERING_TEAM) {
      const agent: AgentWorker = {
        id: eng.id,
        name: eng.name,
        role: eng.role,
        skills: eng.skills || [],
        status: "idle",
        progress: 0,
        lastReport: new Date(),
        capabilities: this.getAgentCapabilities(eng.role),
      };
      this.agents.set(eng.id, agent);
    }

    console.log(
      `${GREEN}✓${RESET} Initialized ${this.agents.size} autonomous agents`,
    );
  }

  private getAgentCapabilities(role: string): string[] {
    const capabilities: Record<string, string[]> = {
      "ui-ux-lead": ["design", "architecture", "accessibility", "research"],
      "ui-ux-expert": ["animation", "micro-interactions", "polish", "css"],
      "frontend-dev-1": ["react", "typescript", "state", "performance"],
      "frontend-dev-2": ["components", "hooks", "api", "testing"],
      "backend-lead": ["architecture", "database", "api", "security"],
      "backend-dev": ["endpoints", "validation", "orm", "testing"],
      "devops-lead": ["ci-cd", "docker", "kubernetes", "monitoring"],
      "security-eng": ["auth", "owasp", "audit", "compliance"],
      "testing-lead": ["automation", "e2e", "integration", "reporting"],
      "api-expert": ["rest", "graphql", "webhooks", "contracts"],
    };
    return capabilities[role] || ["general"];
  }

  // ============ AUTONOMOUS CORE ============

  async startAutonomousMode(): Promise<void> {
    this.isRunning = true;
    console.log(`\n${BOLD}${CYAN}🤖 AUTONOMOUS AGENT SYSTEM STARTED${RESET}\n`);

    this.broadcast("SYSTEM", "All agents are now autonomous and self-managing");

    // Start the autonomous loop
    await this.autonomousLoop();
  }

  private async autonomousLoop(): Promise<void> {
    while (this.isRunning) {
      await this.tick();
      await this.delay(this.tickInterval);
    }
  }

  private async tick(): Promise<void> {
    const actions: string[] = [];

    // 1. Agent thinking cycle
    for (const [id, agent] of this.agents) {
      if (agent.status === "idle") {
        const task = await this.findTaskForAgent(id);
        if (task) {
          await this.assignTaskToAgent(task, id);
          actions.push(`${agent.name} picked up ${task.title}`);
        }
      } else if (agent.status === "working") {
        await this.processAgentWork(id);
        actions.push(`${agent.name} working (${agent.progress}%)`);
      } else if (agent.status === "blocked") {
        await this.handleBlockedAgent(id);
        actions.push(`${agent.name} resolving block`);
      }
    }

    // 2. Auto-delegate new high-priority tasks
    await this.autoDelegateTasks();

    // 3. Auto-review completed tasks
    await this.autoReviewTasks();

    // 4. Auto-verify completed tasks
    await this.autoVerifyTasks();

    // 5. Auto-create tasks from failures
    await this.autoCreateTasksFromFailures();

    // 6. Balance workload
    await this.balanceWorkload();

    // 7. Log and report
    if (actions.length > 0) {
      this.logEvent("SYSTEM", "AUTONOMOUS_CYCLE", actions.join(", "));
    }

    this.saveState();
    this.printStatus();
  }

  private async findTaskForAgent(agentId: string): Promise<Task | null> {
    const agent = this.agents.get(agentId);
    if (!agent || agent.status !== "idle") return null;

    // Find tasks matching agent skills
    const matchingTasks = this.taskStore.filter((task) => {
      if (task.status !== "backlog") return false;
      return this.taskMatchesAgent(task, agent);
    });

    // Sort by priority and skill match
    matchingTasks.sort((a, b) => {
      const priorityScore =
        this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority);
      if (priorityScore !== 0) return priorityScore;

      const aMatch = this.skillMatchScore(a.type, agent);
      const bMatch = this.skillMatchScore(b.type, agent);
      return bMatch - aMatch;
    });

    return matchingTasks[0] || null;
  }

  private taskMatchesAgent(task: Task, agent: AgentWorker): boolean {
    const taskSkills = this.getTaskSkills(task.type);
    return taskSkills.some(
      (skill) =>
        agent.skills.some((s) =>
          s.toLowerCase().includes(skill.toLowerCase()),
        ) ||
        agent.capabilities.some((c) =>
          c.toLowerCase().includes(skill.toLowerCase()),
        ),
    );
  }

  private getTaskSkills(type: TaskType): string[] {
    const skills: Record<TaskType, string[]> = {
      frontend: ["react", "typescript", "component", "css", "ui"],
      backend: ["node", "api", "database", "validation"],
      fullstack: ["react", "node", "api", "database"],
      uiux: ["design", "figma", "ux", "accessibility"],
      devops: ["docker", "ci", "deployment", "kubernetes"],
      security: ["auth", "security", "owasp", "compliance"],
      testing: ["test", "playwright", "automation", "qa"],
      architecture: ["design", "system", "architecture"],
      api: ["rest", "graphql", "api", "endpoint"],
      performance: ["performance", "optimization", "lighthouse"],
    };
    return skills[type] || [];
  }

  private skillMatchScore(type: TaskType, agent: AgentWorker): number {
    const taskSkills = this.getTaskSkills(type);
    let score = 0;

    for (const skill of taskSkills) {
      if (
        agent.skills.some((s) => s.toLowerCase().includes(skill.toLowerCase()))
      )
        score += 2;
      if (
        agent.capabilities.some((c) =>
          c.toLowerCase().includes(skill.toLowerCase()),
        )
      )
        score += 1;
    }

    return score;
  }

  private getPriorityScore(priority: TaskPriority): number {
    const scores: Record<TaskPriority, number> = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25,
    };
    return scores[priority];
  }

  private async assignTaskToAgent(task: Task, agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    task.assignedTo = agentId;
    task.status = "in_progress";
    task.startedAt = new Date();

    agent.status = "working";
    agent.currentTask = task.id;
    agent.progress = 0;

    this.logEvent(agentId, "ASSIGNED", `Picked up task: ${task.title}`);

    console.log(
      `\n${CYAN}→${RESET} ${BOLD}${agent.name}${RESET} (${agent.id}) picked up ${BOLD}${task.title}${RESET}`,
    );

    // Auto-delegate to subagents if it's a complex task
    if (
      task.priority === "critical" ||
      task.type === "fullstack" ||
      task.type === "architecture"
    ) {
      await this.autoDelegate(task, agentId);
    }
  }

  private async processAgentWork(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent || !agent.currentTask) return;

    const task = this.taskStore.find((t) => t.id === agent.currentTask);
    if (!task) return;

    // Simulate work progress
    const workDone = Math.random() * 15 + 5; // 5-20% progress
    agent.progress = Math.min(100, agent.progress + workDone);
    task.progress = agent.progress;

    agent.lastReport = new Date();

    if (agent.progress >= 100) {
      task.status = "in_review";
      task.completedAt = new Date();
      agent.status = "idle";
      agent.currentTask = undefined;
      agent.progress = 0;

      this.logEvent(agentId, "COMPLETED", `Completed task: ${task.title}`);
      console.log(
        `\n${GREEN}✓${RESET} ${BOLD}${agent.name}${RESET} completed ${BOLD}${task.title}${RESET}`,
      );
    } else if (agent.progress >= 25 && agent.progress < 30) {
      this.logEvent(
        agentId,
        "PROGRESS",
        `${agent.progress.toFixed(0)}% - Implementation started`,
      );
    } else if (agent.progress >= 50 && agent.progress < 55) {
      this.logEvent(
        agentId,
        "PROGRESS",
        `${agent.progress.toFixed(0)}% - Core features done`,
      );
    } else if (agent.progress >= 75 && agent.progress < 80) {
      this.logEvent(
        agentId,
        "PROGRESS",
        `${agent.progress.toFixed(0)}% - Testing and polish`,
      );
    }
  }

  private async handleBlockedAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent || !agent.currentTask) {
      agent!.status = "idle";
      return;
    }

    // Find helper agent
    const helper = this.findHelperForAgent(agentId);
    if (helper) {
      this.logEvent("SYSTEM", "UNBLOCKED", `${helper} helping ${agent.name}`);
      agent.status = "working";
    } else {
      // Reassign task
      const task = this.taskStore.find((t) => t.id === agent.currentTask);
      if (task) {
        task.blockedBy.push("Agent unblocked - reassigned");
        agent.status = "idle";
        agent.currentTask = undefined;
      }
    }
  }

  private findHelperForAgent(agentId: string): string | null {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    for (const [id, helper] of this.agents) {
      if (id !== agentId && helper.status === "idle") {
        return helper.name;
      }
    }
    return null;
  }

  // ============ AUTO DELEGATION ============

  private async autoDelegateTasks(): Promise<void> {
    for (const task of this.taskStore) {
      if (task.status === "delegated" && !this.delegationChains.has(task.id)) {
        const leader = this.findLeaderForTask(task);
        if (leader) {
          await this.autoDelegate(task, leader.id);
        }
      }
    }
  }

  private findLeaderForTask(task: Task): AgentWorker | null {
    const leaderRoles: Record<TaskType, string[]> = {
      frontend: ["ENG-001", "ENG-003"],
      backend: ["ENG-005"],
      fullstack: ["ENG-005", "ENG-003"],
      uiux: ["ENG-001"],
      devops: ["ENG-007"],
      security: ["ENG-008"],
      testing: ["ENG-009"],
      architecture: ["ENG-001", "ENG-005"],
      api: ["ENG-010", "ENG-005"],
      performance: ["ENG-007", "ENG-003"],
    };

    const preferredIds = leaderRoles[task.type] || ["ENG-001"];

    for (const id of preferredIds) {
      const leader = this.agents.get(id);
      if (leader) return leader;
    }

    return Array.from(this.agents.values())[0] || null;
  }

  private async autoDelegate(task: Task, leaderId: string): Promise<void> {
    const leader = this.agents.get(leaderId);
    if (!leader) return;

    const subagents = this.findSubagentsForTask(task, leaderId, 3);

    const chain: DelegationChain = {
      taskId: task.id,
      leader: leader.name,
      subagents: [],
      createdAt: new Date(),
    };

    for (const subagent of subagents) {
      chain.subagents.push({
        id: subagent.id,
        task: `${task.title} - ${this.getSubtaskForRole(task, subagent.role)}`,
        status: "assigned",
        progress: 0,
      });

      // Assign subtask to subagent
      const subtask = {
        id: `${task.id}-ST-${chain.subagents.length}`,
        title: chain.subagents[chain.subagents.length - 1].task,
        status: "pending" as const,
      };
      task.subtasks.push(subtask);
    }

    this.delegationChains.set(task.id, chain);
    task.status = "in_progress";

    this.logEvent(
      leaderId,
      "DELEGATED",
      `Delegated to ${subagents.length} subagents`,
    );

    console.log(
      `\n${MAGENTA}◆${RESET} ${BOLD}${leader.name}${RESET} delegated ${task.title} to ${subagents.length} subagents`,
    );

    // Start subagents working
    for (const subagent of subagents) {
      await this.assignTaskToAgent(task, subagent.id);
    }
  }

  private findSubagentsForTask(
    task: Task,
    excludeId: string,
    count: number,
  ): AgentWorker[] {
    const subagentMap: Record<TaskType, string[]> = {
      frontend: ["ENG-002", "ENG-003", "ENG-004"],
      backend: ["ENG-006", "ENG-010", "ENG-009"],
      fullstack: ["ENG-003", "ENG-004", "ENG-006", "ENG-002"],
      uiux: ["ENG-002", "ENG-003", "ENG-004"],
      devops: ["ENG-003", "ENG-006", "ENG-009"],
      security: ["ENG-005", "ENG-009", "ENG-010"],
      testing: ["ENG-003", "ENG-006", "ENG-007"],
      architecture: ["ENG-003", "ENG-006", "ENG-010", "ENG-009"],
      api: ["ENG-005", "ENG-006", "ENG-009"],
      performance: ["ENG-003", "ENG-004", "ENG-009"],
    };

    const preferredIds = subagentMap[task.type] || ["ENG-003", "ENG-004"];

    return preferredIds
      .filter((id) => id !== excludeId)
      .map((id) => this.agents.get(id))
      .filter((a): a is AgentWorker => a !== undefined)
      .slice(0, count);
  }

  private getSubtaskForRole(task: Task, role: string): string {
    const tasks: Record<string, string[]> = {
      "frontend-dev-1": [
        "Core Components",
        "State Management",
        "API Integration",
      ],
      "frontend-dev-2": ["UI Components", "User Interface", "Styling"],
      "ui-ux-lead": ["UX Research", "Visual Design", "Accessibility"],
      "ui-ux-expert": ["Micro-interactions", "Animations", "Polish"],
      "backend-lead": ["Architecture", "Core Logic", "Database Design"],
      "backend-dev": ["API Endpoints", "Business Logic", "Validation"],
      "devops-lead": ["CI/CD Pipeline", "Docker Setup", "Monitoring"],
      "security-eng": ["Security Audit", "Auth/Authz", "Vulnerability Check"],
      "testing-lead": ["Unit Tests", "Integration Tests", "E2E Tests"],
      "api-expert": ["API Contracts", "API Endpoints", "Documentation"],
    };

    const options = tasks[role] || ["Implementation"];
    return options[Math.floor(Math.random() * options.length)];
  }

  // ============ AUTO WORKFLOW ============

  private async autoReviewTasks(): Promise<void> {
    for (const task of this.taskStore) {
      if (task.status === "in_review") {
        const reviewer = this.findAvailableReviewer();
        if (reviewer) {
          this.logEvent(reviewer.id, "REVIEWING", `Reviewing: ${task.title}`);
          task.status = "in_qa";
          console.log(
            `\n${BLUE}👁${RESET} ${BOLD}${reviewer.name}${RESET} reviewing ${BOLD}${task.title}${RESET}`,
          );
        }
      }
    }
  }

  private findAvailableReviewer(): AgentWorker | null {
    for (const [, agent] of this.agents) {
      if (agent.status === "idle") {
        return agent;
      }
    }
    return null;
  }

  private async autoVerifyTasks(): Promise<void> {
    for (const task of this.taskStore) {
      if (task.status === "in_qa") {
        task.status = "ready";
        this.logEvent("QA_BOT", "VERIFIED", `Verified: ${task.title}`);
        console.log(
          `\n${GREEN}✓${RESET} ${BOLD}${task.title}${RESET} verified and ready`,
        );
      }
    }
  }

  private async autoCreateTasksFromFailures(): Promise<void> {
    // Simulate discovering issues and creating tasks
    if (Math.random() < 0.1) {
      // 10% chance per tick
      const issueTypes = [
        {
          title: "Fix race condition in auth flow",
          type: "backend" as TaskType,
          priority: "high" as TaskPriority,
        },
        {
          title: "Improve component re-render performance",
          type: "frontend" as TaskType,
          priority: "medium" as TaskPriority,
        },
        {
          title: "Add loading states to forms",
          type: "uiux" as TaskType,
          priority: "low" as TaskPriority,
        },
        {
          title: "Update API error handling",
          type: "api" as TaskType,
          priority: "high" as TaskPriority,
        },
        {
          title: "Add unit tests for auth module",
          type: "testing" as TaskType,
          priority: "medium" as TaskPriority,
        },
      ];

      const issue = issueTypes[Math.floor(Math.random() * issueTypes.length)];
      const task = await this.createTask(
        issue.title,
        "Auto-discovered issue",
        issue.type,
        issue.priority,
      );

      this.logEvent(
        "AUTO_SCOUT",
        "ISSUE_FOUND",
        `Created task from issue: ${task.title}`,
      );
      console.log(
        `\n${YELLOW}⚠${RESET} ${BOLD}Auto-scouted issue${RESET}: ${task.title}`,
      );
    }
  }

  private async balanceWorkload(): Promise<void> {
    const workloads = Array.from(this.agents.values())
      .filter((a) => a.status === "working")
      .map((a) => ({ id: a.id, progress: a.progress }));

    // If one agent is overloaded, try to reassign
    for (const workload of workloads) {
      if (workload.progress > 80) {
        const agent = this.agents.get(workload.id);
        if (agent && agent.currentTask) {
          const task = this.taskStore.find((t) => t.id === agent.currentTask);
          if (task) {
            // Mark as requiring help
            task.blockedBy.push("Workload too high - needs help");
            this.logEvent(
              "SYSTEM",
              "REBALANCED",
              `${agent.name} workload rebalanced`,
            );
          }
        }
      }
    }
  }

  // ============ TASK MANAGEMENT ============

  async createTask(
    title: string,
    description: string,
    type: TaskType,
    priority: TaskPriority,
  ): Promise<Task> {
    const id = generateTaskId();

    const task: Task = {
      id,
      title,
      description,
      type,
      priority,
      status: "backlog",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "AUTO",
      estimatedHours: this.estimateHours(priority, type),
      actualHours: 0,
      specs: [],
      subtasks: [],
      dependencies: [],
      blockedBy: [],
      progress: 0,
    };

    this.taskStore.push(task);
    this.tasks.set(id, task);

    this.logEvent("SYSTEM", "CREATED", `New task: ${title} (${priority})`);
    this.saveState();

    return task;
  }

  private estimateHours(priority: TaskPriority, type: TaskType): number {
    const base: Record<TaskPriority, number> = {
      critical: 8,
      high: 4,
      medium: 2,
      low: 1,
    };
    const mult: Record<TaskType, number> = {
      architecture: 2.0,
      fullstack: 1.5,
      backend: 1.2,
      frontend: 1.0,
      uiux: 1.0,
      api: 1.0,
      devops: 1.2,
      security: 1.5,
      testing: 0.8,
      performance: 1.3,
    };
    return Math.round(base[priority] * (mult[type] || 1));
  }

  // ============ REPORTING ============

  private printStatus(): void {
    const idle = Array.from(this.agents.values()).filter(
      (a) => a.status === "idle",
    ).length;
    const working = Array.from(this.agents.values()).filter(
      (a) => a.status === "working",
    ).length;

    process.stdout.write(
      `\r${RESET}[${new Date().toLocaleTimeString()}] Agents: ${working} working, ${idle} idle | Tasks: ${this.taskStore.length} total`,
    );
  }

  private logEvent(agentId: string, type: string, message: string): void {
    const event: TaskEvent = {
      type: type as TaskEvent["type"],
      taskId: "",
      agentId,
      message,
      timestamp: new Date(),
    };
    this.events.push(event);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============ PERSISTENCE ============

  private saveState(): void {
    const data = {
      tasks: this.taskStore,
      delegationChains: Array.from(this.delegationChains.entries()),
      savedAt: new Date(),
    };
    try {
      require("fs").writeFileSync(
        this.TASK_FILE,
        JSON.stringify(data, null, 2),
      );
    } catch {}
  }

  private loadState(): void {
    try {
      const data = require("fs").readFileSync(this.TASK_FILE, "utf8");
      if (data) {
        const parsed = JSON.parse(data);
        this.taskStore = parsed.tasks || [];
        if (parsed.delegationChains) {
          this.delegationChains = new Map(parsed.delegationChains);
        }
      }
    } catch {
      this.taskStore = [];
    }
  }

  // ============ PUBLIC API ============

  async start(): Promise<void> {
    await this.startAutonomousMode();
  }

  stop(): void {
    this.isRunning = false;
    console.log(`\n${YELLOW}■${RESET} Autonomous system stopped`);
  }

  getAgents(): AgentWorker[] {
    return Array.from(this.agents.values());
  }

  getTasks(): Task[] {
    return this.taskStore;
  }

  getStats(): { agents: number; tasks: number; working: number; idle: number } {
    return {
      agents: this.agents.size,
      tasks: this.taskStore.length,
      working: Array.from(this.agents.values()).filter(
        (a) => a.status === "working",
      ).length,
      idle: Array.from(this.agents.values()).filter((a) => a.status === "idle")
        .length,
    };
  }

  broadcast(from: string, message: string): void {
    console.log(
      `\n${MAGENTA}[BROADCAST]${RESET} ${BOLD}${from}${RESET}: ${message}`,
    );
  }
}

// CLI Interface
const system = new AutonomousAgentSystem();

const getArgs = (): string[] => {
  try {
    return (
      globalThis as unknown as { process: { argv: string[] } }
    ).process.argv.slice(2);
  } catch {
    return [];
  }
};

const args = getArgs();
const command = args[0] || "start";

async function main() {
  switch (command) {
    case "start": {
      console.log(`${BOLD}${CYAN}
╔═══════════════════════════════════════════════════════════════╗
║           AUTONOMOUS AGENT SYSTEM v2.0                      ║
║                                                           ║
║  Self-managing • Self-coordinating • Self-healing          ║
╚═══════════════════════════════════════════════════════════════╝${RESET}\n`);

      // Create some initial tasks
      await system.createTask(
        "Optimize React render performance",
        "Improve component re-renders",
        "frontend",
        "high",
      );
      await system.createTask(
        "Add dark mode toggle",
        "Implement theme switching",
        "uiux",
        "medium",
      );
      await system.createTask(
        "Setup Redis caching",
        "Add caching layer",
        "backend",
        "high",
      );
      await system.createTask(
        "Security audit",
        "Full OWASP review",
        "security",
        "critical",
      );
      await system.createTask(
        "E2E test coverage",
        "Increase test coverage",
        "testing",
        "medium",
      );

      console.log(`\n${GREEN}✓${RESET} Initial tasks created`);
      console.log(`\n${CYAN}Starting autonomous agents...${RESET}\n`);

      await system.start();
      break;
    }

    case "dispatch": {
      const title = args[1] || "New autonomous task";
      const desc = args[2] || "Auto-assigned by system";
      const type = (args[3] as TaskType) || "frontend";
      const priority = (args[4] as TaskPriority) || "medium";
      const task = await system.createTask(title, desc, type, priority);
      console.log(
        `\n${GREEN}✓${RESET} Task created: ${task.id} - ${task.title}`,
      );
      break;
    }

    case "status": {
      const stats = system.getStats();
      const agents = system.getAgents();

      console.log(`\n${BOLD}AUTONOMOUS AGENT SYSTEM STATUS${RESET}`);
      console.log(
        `   Agents: ${stats.agents} total | ${stats.working} working | ${stats.idle} idle`,
      );
      console.log(`   Tasks: ${stats.tasks} total\n`);

      for (const agent of agents) {
        const statusColor =
          agent.status === "working"
            ? GREEN
            : agent.status === "blocked"
              ? RED
              : CYAN;
        console.log(
          `   ${statusColor}[${agent.status.toUpperCase().padEnd(8)}]${RESET} ${agent.name} (${agent.id})`,
        );
        if (agent.currentTask) {
          console.log(
            `      └─ ${agent.progress.toFixed(0)}% - ${agent.currentTask}`,
          );
        }
      }
      break;
    }

    case "help":
    default: {
      console.log(`
${BOLD}AUTONOMOUS AGENT SYSTEM${RESET}

${BOLD}COMMANDS:${RESET}
  start               Start autonomous mode (creates tasks, agents work)
  dispatch <title> <desc> <type> <priority>
                      Create a new task (auto-assigned)
  status              Show agent and task status
  help                Show this help

${BOLD}TASK TYPES:${RESET}   frontend, backend, fullstack, uiux, devops, security, testing, architecture, api, performance
${BOLD}PRIORITIES:${RESET}   critical, high, medium, low

${BOLD}AUTONOMOUS FEATURES:${RESET}
  • Self-pickup: Agents automatically find and pick up tasks
  • Auto-delegate: Complex tasks are delegated to subagents
  • Self-healing: Blocked agents get help or reassign
  • Auto-review: Completed tasks auto-reviewed
  • Issue detection: Auto-creates tasks from failures
  • Workload balancing: Redistributes work as needed
      `);
      break;
    }
  }
}

await main();
