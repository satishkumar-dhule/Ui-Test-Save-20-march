import { ELITE_AGENTS, EliteAgentConfig } from "./agents";
import { streamingDB } from "./streaming-db";
import {
  TaskAssignment,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  AgentStatus,
  AgentCapability,
} from "./types";

export interface Task {
  id: string;
  title: string;
  description: string;
  requiredCapabilities: AgentCapability[];
  priority: "low" | "medium" | "high" | "critical";
  dependencies: string[];
  estimatedTime: string;
}

export class AgentOrchestrator {
  private agents: Map<string, EliteAgentConfig> = new Map();
  private tasks: Map<string, TaskAssignment> = new Map();
  private taskQueue: Task[] = [];
  private validationRules: ValidationRule[] = [];
  private trackingFilePath: string;

  constructor(trackingFilePath: string = "./AGENT_TRACKING.md") {
    this.trackingFilePath = trackingFilePath;
    ELITE_AGENTS.forEach((agent) => this.agents.set(agent.id, { ...agent }));
    this.initializeValidationRules();
  }

  private initializeValidationRules(): void {
    this.validationRules = [
      {
        name: "typescript",
        check: async (content: string) => {
          const errors: ValidationError[] = [];
          if (
            content.includes("any") &&
            !content.includes("// eslint-disable")
          ) {
            errors.push({
              message: 'Avoid using "any" type',
              severity: "warning",
              autoFixable: false,
            });
          }
          if (content.includes(": any")) {
            errors.push({
              message: "Replace implicit any with explicit type",
              severity: "error",
              autoFixable: false,
            });
          }
          return errors;
        },
      },
      {
        name: "naming",
        check: async (content: string) => {
          const errors: ValidationError[] = [];
          const componentMatch = content.match(
            /function\s+([A-Z][a-zA-Z0-9]*)/,
          );
          if (componentMatch) {
            errors.push({
              message: `Component ${componentMatch[1]} should use PascalCase`,
              severity: "error",
              autoFixable: true,
            });
          }
          return errors;
        },
      },
      {
        name: "security",
        check: async (content: string) => {
          const errors: ValidationError[] = [];
          if (content.includes("eval(")) {
            errors.push({
              message: "eval() is a security risk",
              severity: "error",
              autoFixable: false,
            });
          }
          if (
            content.includes("password") &&
            !content.includes("process.env")
          ) {
            errors.push({
              message: "Hardcoded password detected",
              severity: "error",
              autoFixable: false,
            });
          }
          return errors;
        },
      },
    ];
  }

  async assignTask(task: Task): Promise<TaskAssignment | null> {
    const availableAgent = this.findBestAgent(task.requiredCapabilities);
    if (!availableAgent) return null;

    const assignment: TaskAssignment = {
      taskId: task.id,
      taskTitle: task.title,
      assignedAgent: availableAgent.id,
      assignedAt: new Date(),
      priority: task.priority,
      status: "in-progress",
      dependencies: task.dependencies,
      estimatedTime: task.estimatedTime,
      output: [],
    };

    availableAgent.status = "working";
    availableAgent.currentTask = task.id;
    this.agents.set(availableAgent.id, availableAgent);
    this.tasks.set(task.id, assignment);

    await this.updateTrackingFile();

    return assignment;
  }

  private findBestAgent(
    requiredCapabilities: AgentCapability[],
  ): EliteAgentConfig | null {
    const availableAgents = Array.from(this.agents.values()).filter(
      (a) => a.status === "idle",
    );

    if (availableAgents.length === 0) return null;

    let bestAgent: EliteAgentConfig | null = null;
    let maxScore = 0;

    for (const agent of availableAgents) {
      const score = requiredCapabilities.reduce((acc, cap) => {
        return acc + (agent.capabilities.includes(cap) ? 1 : 0);
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  async validateContent(
    contentId: string,
    content: string,
  ): Promise<ValidationResult> {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];

    for (const rule of this.validationRules) {
      const errors = await rule.check(content);
      errors.forEach((e) => {
        if (e.severity === "error") {
          allErrors.push(e);
        } else {
          allWarnings.push({
            message: e.message,
            suggestion: e.autoFixable ? "Auto-fixable" : undefined,
          });
        }
      });
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      checkedAt: new Date(),
      checkedBy: "orchestrator",
    };
  }

  async completeTask(
    taskId: string,
    validation: ValidationResult,
  ): Promise<void> {
    const assignment = this.tasks.get(taskId);
    if (!assignment) return;

    assignment.status = validation.isValid ? "completed" : "review";
    assignment.validation = validation;

    const agent = this.agents.get(assignment.assignedAgent);
    if (agent) {
      agent.status = "idle";
      agent.currentTask = undefined;
      agent.completedTasks.push(taskId);
      agent.performance.tasksCompleted++;
      this.agents.set(agent.id, agent);
    }

    await this.updateTrackingFile();
  }

  async getTaskStatus(taskId: string): Promise<TaskAssignment | undefined> {
    return this.tasks.get(taskId);
  }

  async getAgentStatus(agentId: string): Promise<EliteAgentConfig | undefined> {
    return this.agents.get(agentId);
  }

  async getAllAgents(): Promise<EliteAgentConfig[]> {
    return Array.from(this.agents.values());
  }

  async getAllTasks(): Promise<TaskAssignment[]> {
    return Array.from(this.tasks.values());
  }

  async getActiveTasks(): Promise<TaskAssignment[]> {
    return Array.from(this.tasks.values()).filter(
      (t) => t.status === "in-progress",
    );
  }

  private async updateTrackingFile(): Promise<void> {
    const agents = await this.getAllAgents();
    const tasks = await this.getAllTasks();
    const content = this.generateTrackingMarkdown(agents, tasks);

    if (typeof window !== "undefined") {
      localStorage.setItem("agent-tracking", content);
    }
  }

  private generateTrackingMarkdown(
    agents: EliteAgentConfig[],
    tasks: TaskAssignment[],
  ): string {
    const now = new Date().toISOString();

    const agentRows = agents
      .map((a) => {
        const status =
          a.status === "idle" ? "idle" : `working:${a.currentTask || ""}`;
        return `| ${a.name} | ${a.specialization} | ${a.yearsOfExperience} | ${status} | ${a.performance.tasksCompleted} |`;
      })
      .join("\n");

    const taskRows = tasks
      .map((t) => {
        return `| ${t.taskId} | ${t.taskTitle} | ${t.assignedAgent} | ${t.priority} | ${t.status} | ${t.output.length} |`;
      })
      .join("\n");

    return `# Elite Frontend & SaaS Agent Team - Work Tracking

## Team Overview

**Total Agents:** ${agents.length}  
**Combined Experience:** ${agents.reduce((s, a) => s + a.yearsOfExperience, 0)}+ Years  
**Last Updated:** ${now}

---

## Team Composition

| Agent | Specialization | Experience | Status | Tasks Done |
|-------|---------------|------------|--------|------------|
${agentRows}

---

## Active Tasks

| Task ID | Title | Assigned | Priority | Status | Output Count |
|---------|-------|----------|----------|--------|--------------|
${taskRows || "| - | - | - | - | - | - |"}

---

## Generated Content

### Components & Files
| ID | Agent | Status | Generated At |
|----|-------|--------|--------------|
${
  tasks
    .flatMap((t) =>
      t.output.map(
        (o) =>
          `| ${o.id} | ${t.assignedAgent} | ${o.isComplete ? "complete" : "streaming"} | ${o.generatedAt.toISOString()} |`,
      ),
    )
    .join("\n") || "| - | - | - | - |"
}

---

## Activity Log

| Timestamp | Agent | Action | Details |
|-----------|-------|--------|---------|
${tasks.map((t) => `| ${t.assignedAt.toISOString()} | ${t.assignedAgent} | Task assigned | ${t.taskTitle} |`).join("\n")}

---

*Auto-generated by Agent Orchestrator*
`;
  }

  subscribeToProgress(
    callback: (update: {
      contentId: string;
      progress: number;
      chunk: string;
    }) => void,
  ): () => void {
    return streamingDB.subscribe((update) => {
      callback({
        contentId: update.taskId,
        progress: update.progress,
        chunk: update.chunk,
      });
    });
  }
}

interface ValidationRule {
  name: string;
  check: (content: string) => Promise<ValidationError[]>;
}

export const orchestrator = new AgentOrchestrator();
