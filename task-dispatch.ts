#!/usr/bin/env bun

/**
 * Task Dispatch System - Distributed Task Management
 *
 * Tasks are dispatched via CLI and distributed among engineers
 * who work, track, test, and architect solutions
 *
 * Usage:
 *   bun run task-dispatch.ts dispatch <task-details>
 *   bun run task-dispatch.ts status [task-id]
 *   bun run task-dispatch.ts list
 *   bun run task-dispatch.ts assign <task-id> <engineer-id>
 *   bun run task-dispatch.ts work <task-id>
 *   bun run task-dispatch.ts test <task-id>
 *   bun run task-dispatch.ts review <task-id>
 *   bun run task-dispatch.ts complete <task-id>
 */

import { E2E_TEAM, e2eOrchestrator } from "./agent-team/e2e-qa-orchestrator";
import {
  ENGINEERING_TEAM,
  engineeringOrchestrator,
} from "./agent-team/engineering-orchestrator";
import {
  generateTaskId,
  Task,
  TaskStatus,
  TaskPriority,
  TaskType,
} from "./agent-team/task-types";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";

interface TaskStore {
  tasks: Task[];
  workLogs: Map<string, WorkLogEntry[]>;
  testResults: Map<string, TestResult[]>;
  reviewComments: Map<string, ReviewComment[]>;
  designDocs: Map<string, DesignDocument>;
}

interface WorkLogEntry {
  timestamp: Date;
  engineer: string;
  action:
    | "started"
    | "progress"
    | "blocked"
    | "unblocked"
    | "completed"
    | "assigned"
    | "delegated";
  details: string;
}

interface TestResult {
  timestamp: Date;
  testType: "unit" | "integration" | "e2e" | "performance" | "security";
  status: "passed" | "failed" | "skipped";
  details: string;
}

interface ReviewComment {
  timestamp: Date;
  reviewer: string;
  type: "suggestion" | "issue" | "approval";
  comment: string;
  resolved: boolean;
}

interface DesignDocument {
  id: string;
  taskId: string;
  architect: string;
  components: string[];
  dataModels: string[];
  apiContracts: string[];
  dependencies: string[];
  risks: string[];
  createdAt: Date;
  updatedAt: Date;
}

class TaskDispatchSystem {
  private store: TaskStore = {
    tasks: [],
    workLogs: new Map(),
    testResults: new Map(),
    reviewComments: new Map(),
    designDocs: new Map(),
  };

  private readonly TASK_FILE = "/home/runner/workspace/data/task-store.json";
  private loaded = false;

  constructor() {
    this.loadTasksSync();
  }

  private loadTasksSync(): void {
    try {
      const data = require("fs").readFileSync(this.TASK_FILE, "utf8");
      if (data && data.length > 0) {
        const parsed = JSON.parse(data);
        this.store.tasks = parsed.tasks || [];
        if (parsed.workLogs)
          this.store.workLogs = new Map(Object.entries(parsed.workLogs));
        if (parsed.testResults)
          this.store.testResults = new Map(Object.entries(parsed.testResults));
        if (parsed.reviewComments)
          this.store.reviewComments = new Map(
            Object.entries(parsed.reviewComments),
          );
        if (parsed.designDocs)
          this.store.designDocs = new Map(Object.entries(parsed.designDocs));
        this.loaded = true;
      }
    } catch {
      this.store.tasks = [];
    }
  }

  private async loadTasks(): Promise<void> {
    if (this.loaded) return;
    try {
      const bun = (
        globalThis as {
          Bun?: {
            file: (p: string) => {
              exists: () => Promise<boolean>;
              text: () => Promise<string>;
            };
          };
        }
      ).Bun;
      if (!bun) {
        this.loadTasksSync();
        return;
      }
      const file = bun.file(this.TASK_FILE);
      const exists = await file.exists();
      if (exists) {
        const text = await file.text();
        if (text && text.length > 0) {
          const parsed = JSON.parse(text);
          this.store.tasks = parsed.tasks || [];
          if (parsed.workLogs)
            this.store.workLogs = new Map(Object.entries(parsed.workLogs));
          if (parsed.testResults)
            this.store.testResults = new Map(
              Object.entries(parsed.testResults),
            );
          if (parsed.reviewComments)
            this.store.reviewComments = new Map(
              Object.entries(parsed.reviewComments),
            );
          if (parsed.designDocs)
            this.store.designDocs = new Map(Object.entries(parsed.designDocs));
          this.loaded = true;
        }
      }
    } catch {
      this.store.tasks = [];
    }
  }

  private saveTasks(): void {
    const data = {
      tasks: this.store.tasks,
      workLogs: Object.fromEntries(this.store.workLogs),
      testResults: Object.fromEntries(this.store.testResults),
      reviewComments: Object.fromEntries(this.store.reviewComments),
      designDocs: Object.fromEntries(this.store.designDocs),
    };
    require("fs").writeFileSync(this.TASK_FILE, JSON.stringify(data, null, 2));
  }

  async dispatch(
    title: string,
    description: string,
    type: TaskType,
    priority: TaskPriority,
    specs?: string[],
  ): Promise<Task> {
    const taskId = generateTaskId();

    const task: Task = {
      id: taskId,
      title,
      description,
      type,
      priority,
      status: "backlog",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "CLI",
      assignedTo: undefined,
      estimatedHours: this.estimateHours(priority, type),
      actualHours: 0,
      specs: specs || [],
      subtasks: [],
      dependencies: [],
      blockedBy: [],
      testPlan: undefined,
      designDoc: undefined,
      progress: 0,
      delegatedTo: [],
    };

    this.store.tasks.push(task);
    this.store.workLogs.set(taskId, []);
    this.saveTasks();

    console.log(
      `\n${GREEN}✓${RESET} Task dispatched: ${BOLD}${taskId}${RESET}`,
    );
    console.log(`   Title: ${title}`);
    console.log(`   Type: ${type}`);
    console.log(`   Priority: ${priority}`);

    // Auto-delegate to leader who distributes to subagents
    await this.delegateTask(task);

    return task;
  }

  private async delegateTask(task: Task): Promise<void> {
    const leader = this.findLeader(task.type);
    if (!leader) {
      console.log(`${YELLOW}⚠${RESET} No leader available for delegation`);
      return;
    }

    task.assignedTo = leader.id;
    task.status = "delegated";
    task.updatedAt = new Date();

    console.log(`\n${CYAN}👑${RESET} Task delegated to leader`);
    console.log(`   Leader: ${leader.name} (${leader.id})`);

    this.logWork(
      task.id,
      leader.id,
      "delegated",
      `Task delegated to leader ${leader.name}`,
    );

    // Leader breaks down task and assigns to 3+ subagents
    const subagents = this.findSubagents(task.type, leader.id);

    if (subagents.length < 3) {
      // Find more subagents from related disciplines
      const additional = this.findAdditionalSubagents(task.type, [
        ...subagents.map((s) => s.id),
        leader.id,
      ]);
      subagents.push(...additional);
    }

    console.log(
      `\n${MAGENTA}◆${RESET} Leader ${leader.name} is delegating to subagents...`,
    );

    for (const subagent of subagents) {
      await this.assignToSubagent(task.id, leader.id, subagent);
    }

    this.saveTasks();
  }

  private findLeader(type: TaskType): (typeof ENGINEERING_TEAM)[0] | null {
    const leaderMap: Record<TaskType, string[]> = {
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

    const preferredIds = leaderMap[type] || ["ENG-001"];

    for (const id of preferredIds) {
      const engineer = ENGINEERING_TEAM.find((e) => e.id === id);
      if (engineer) return engineer;
    }

    return null;
  }

  private findSubagents(
    type: TaskType,
    excludeId: string,
  ): typeof ENGINEERING_TEAM {
    const subagentMap: Record<TaskType, string[]> = {
      frontend: ["ENG-003", "ENG-004", "ENG-002"],
      backend: ["ENG-006", "ENG-010", "ENG-009"],
      fullstack: ["ENG-003", "ENG-004", "ENG-006", "ENG-002"],
      uiux: ["ENG-002", "ENG-003", "ENG-004"],
      devops: ["ENG-003", "ENG-006", "ENG-009"],
      security: ["ENG-005", "ENG-009", "ENG-010"],
      testing: ["ENG-003", "ENG-006", "ENG-007"],
      architecture: ["ENG-003", "ENG-006", "ENG-010", "ENG-009", "ENG-002"],
      api: ["ENG-005", "ENG-006", "ENG-009"],
      performance: ["ENG-003", "ENG-004", "ENG-009"],
    };

    const preferredIds = subagentMap[type] || ["ENG-003", "ENG-004", "ENG-006"];

    return preferredIds
      .filter((id) => id !== excludeId)
      .map((id) => ENGINEERING_TEAM.find((e) => e.id === id))
      .filter((e): e is (typeof ENGINEERING_TEAM)[0] => e !== undefined)
      .slice(0, 5); // Max 5 subagents
  }

  private findAdditionalSubagents(
    type: TaskType,
    excludeIds: string[],
  ): typeof ENGINEERING_TEAM {
    return ENGINEERING_TEAM.filter((e) => !excludeIds.includes(e.id)).slice(
      0,
      3 - excludeIds.length,
    );
  }

  private async assignToSubagent(
    taskId: string,
    leaderId: string,
    subagent: (typeof ENGINEERING_TEAM)[0],
  ): Promise<void> {
    const task = this.store.tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Create subtask for this subagent
    const subtaskTitle = this.generateSubtaskTitle(task, subagent);
    const subtask: Task["subtasks"][0] = {
      id: `${taskId}-ST-${task.subtasks.length + 1}`,
      title: subtaskTitle,
      status: "pending",
    };
    task.subtasks.push(subtask);

    // Track delegation
    if (!task.delegatedTo) task.delegatedTo = [];
    task.delegatedTo.push({
      engineerId: subagent.id,
      subtaskId: subtask.id,
      role: subagent.role,
      status: "assigned",
      assignedAt: new Date(),
    });

    task.status = "in_progress";
    task.updatedAt = new Date();

    console.log(
      `   ${GREEN}→${RESET} ${subagent.name} (${subagent.id}): ${subtaskTitle}`,
    );

    this.logWork(
      taskId,
      subagent.id,
      "assigned",
      `Assigned subtask: ${subtaskTitle}`,
    );
  }

  private generateSubtaskTitle(
    task: Task,
    subagent: (typeof ENGINEERING_TEAM)[0],
  ): string {
    const titleMap: Record<string, string[]> = {
      "frontend-dev-1": [
        `Implement ${task.title} - Core Components`,
        `Build ${task.title} - State Management`,
        `Implement ${task.title} - API Integration`,
      ],
      "frontend-dev-2": [
        `Implement ${task.title} - UI Components`,
        `Build ${task.title} - User Interface`,
        `Implement ${task.title} - Styling & Animations`,
      ],
      "ui-ux-lead": [
        `Design ${task.title} - UX Research`,
        `Design ${task.title} - Visual Design`,
        `Design ${task.title} - Accessibility`,
      ],
      "ui-ux-expert": [
        `Implement ${task.title} - Micro-interactions`,
        `Implement ${task.title} - Animations`,
        `Implement ${task.title} - Visual Polish`,
      ],
      "backend-lead": [
        `Design ${task.title} - Architecture`,
        `Implement ${task.title} - Core Logic`,
        `Implement ${task.title} - Database Design`,
      ],
      "backend-dev": [
        `Implement ${task.title} - API Endpoints`,
        `Implement ${task.title} - Business Logic`,
        `Implement ${task.title} - Data Validation`,
      ],
      "devops-lead": [
        `Setup ${task.title} - CI/CD Pipeline`,
        `Setup ${task.title} - Docker/Deployment`,
        `Setup ${task.title} - Monitoring`,
      ],
      "security-eng": [
        `Audit ${task.title} - Security Review`,
        `Implement ${task.title} - Auth/Authz`,
        `Audit ${task.title} - Vulnerability Check`,
      ],
      "testing-lead": [
        `Test ${task.title} - Unit Tests`,
        `Test ${task.title} - Integration Tests`,
        `Test ${task.title} - E2E Tests`,
      ],
      "api-expert": [
        `Design ${task.title} - API Contracts`,
        `Implement ${task.title} - API Endpoints`,
        `Document ${task.title} - API Spec`,
      ],
    };

    const options = titleMap[subagent.role] || [`Work on ${task.title}`];
    const index = task.subtasks.length % options.length;
    return options[index] || `Work on ${task.title}`;
  }

  private findBestEngineer(
    type: TaskType,
  ): (typeof ENGINEERING_TEAM)[0] | null {
    const typeToRole: Record<TaskType, string[]> = {
      frontend: ["ENG-003", "ENG-004", "ENG-001", "ENG-002"],
      backend: ["ENG-005", "ENG-006", "ENG-010"],
      fullstack: ["ENG-003", "ENG-004", "ENG-005"],
      uiux: ["ENG-001", "ENG-002"],
      devops: ["ENG-007"],
      security: ["ENG-008"],
      testing: ["ENG-009"],
      architecture: ["ENG-001", "ENG-005"],
      api: ["ENG-010", "ENG-005", "ENG-006"],
      performance: ["ENG-003", "ENG-004", "ENG-007"],
    };

    const preferredIds = typeToRole[type] || ["ENG-003"];

    for (const id of preferredIds) {
      const engineer = ENGINEERING_TEAM.find((e) => e.id === id);
      if (engineer) return engineer;
    }

    return ENGINEERING_TEAM[0];
  }

  private estimateHours(priority: TaskPriority, type: TaskType): number {
    const baseHours: Record<TaskPriority, number> = {
      critical: 8,
      high: 4,
      medium: 2,
      low: 1,
    };
    const multiplier: Record<TaskType, number> = {
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
    return Math.round(baseHours[priority] * (multiplier[type] || 1));
  }

  async assign(taskId: string, engineerId: string): Promise<void> {
    const task = this.store.tasks.find((t) => t.id === taskId);
    if (!task) {
      console.log(`${RED}✗${RESET} Task not found: ${taskId}`);
      return;
    }

    const engineer = ENGINEERING_TEAM.find((e) => e.id === engineerId);
    if (!engineer) {
      console.log(`${RED}✗${RESET} Engineer not found: ${engineerId}`);
      return;
    }

    task.assignedTo = engineerId;
    task.status = "assigned";
    task.updatedAt = new Date();

    this.logWork(
      taskId,
      engineerId,
      "assigned",
      `Task assigned to ${engineer.name}`,
    );
    this.saveTasks();

    console.log(`\n${GREEN}✓${RESET} Task assigned`);
    console.log(`   Task: ${taskId}`);
    console.log(`   Engineer: ${engineer.name} (${engineerId})`);
    console.log(`   Role: ${engineer.role}`);
  }

  async startWork(taskId: string, engineerId?: string): Promise<void> {
    const task = this.store.tasks.find((t) => t.id === taskId);
    if (!task) {
      console.log(`${RED}✗${RESET} Task not found: ${taskId}`);
      return;
    }

    const engineer = engineerId || task.assignedTo;
    if (!engineer) {
      console.log(`${RED}✗${RESET} No engineer assigned to task`);
      return;
    }

    task.status = "in_progress";
    task.updatedAt = new Date();
    task.startedAt = new Date();

    this.logWork(
      taskId,
      engineer,
      "started",
      "Engineer started working on task",
    );
    this.saveTasks();

    const eng = ENGINEERING_TEAM.find((e) => e.id === engineer);
    console.log(`\n${CYAN}▶${RESET} Work started`);
    console.log(`   Task: ${taskId}`);
    console.log(`   Engineer: ${eng?.name || engineer}`);
    console.log(`   Started at: ${new Date().toISOString()}`);
  }

  async updateProgress(
    taskId: string,
    progress: number,
    notes: string,
  ): Promise<void> {
    const task = this.store.tasks.find((t) => t.id === taskId);
    if (!task) {
      console.log(`${RED}✗${RESET} Task not found: ${taskId}`);
      return;
    }

    task.progress = Math.min(100, Math.max(0, progress));
    task.updatedAt = new Date();

    this.logWork(
      taskId,
      task.assignedTo || "unknown",
      "progress",
      `${progress}% - ${notes}`,
    );
    this.saveTasks();

    console.log(`\n${BLUE}ℹ${RESET} Progress updated`);
    console.log(`   Task: ${taskId}`);
    console.log(`   Progress: ${progress}%`);
    console.log(`   Notes: ${notes}`);
  }

  async block(taskId: string, reason: string): Promise<void> {
    const task = this.store.tasks.find((t) => t.id === taskId);
    if (!task) {
      console.log(`${RED}✗${RESET} Task not found: ${taskId}`);
      return;
    }

    task.status = "blocked";
    task.blockedBy.push(reason);
    task.updatedAt = new Date();

    this.logWork(taskId, task.assignedTo || "unknown", "blocked", reason);
    this.saveTasks();

    console.log(`\n${YELLOW}⚠${RESET} Task blocked`);
    console.log(`   Task: ${taskId}`);
    console.log(`   Reason: ${reason}`);
  }

  async unblock(taskId: string): Promise<void> {
    const task = this.store.tasks.find((t) => t.id === taskId);
    if (!task) {
      console.log(`${RED}✗${RESET} Task not found: ${taskId}`);
      return;
    }

    task.status = "in_progress";
    task.blockedBy = [];
    task.updatedAt = new Date();

    this.logWork(
      taskId,
      task.assignedTo || "unknown",
      "unblocked",
      "Block removed",
    );
    this.saveTasks();

    console.log(`\n${GREEN}✓${RESET} Task unblocked`);
    console.log(`   Task: ${taskId}`);
  }

  async addSubtask(taskId: string, title: string): Promise<void> {
    const task = this.store.tasks.find((t) => t.id === taskId);
    if (!task) {
      console.log(`${RED}✗${RESET} Task not found: ${taskId}`);
      return;
    }

    const subtask: Task["subtasks"][0] = {
      id: `${taskId}-ST-${task.subtasks.length + 1}`,
      title,
      status: "pending",
    };
    task.subtasks.push(subtask);
    task.updatedAt = new Date();
    this.saveTasks();

    console.log(`\n${GREEN}✓${RESET} Subtask added`);
    console.log(`   Task: ${taskId}`);
    console.log(`   Subtask: ${subtask.id} - ${title}`);
  }

  async createDesignDoc(taskId: string, architectId: string): Promise<void> {
    const task = this.store.tasks.find((t) => t.id === taskId);
    if (!task) {
      console.log(`${RED}✗${RESET} Task not found: ${taskId}`);
      return;
    }

    const designDoc: DesignDocument = {
      id: `DESIGN-${taskId}`,
      taskId,
      architect: architectId,
      components: [],
      dataModels: [],
      apiContracts: [],
      dependencies: [],
      risks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.store.designDocs.set(taskId, designDoc);
    task.designDoc = designDoc.id;
    task.updatedAt = new Date();
    this.saveTasks();

    console.log(`\n${MAGENTA}◆${RESET} Design document created`);
    console.log(`   Task: ${taskId}`);
    console.log(`   Architect: ${architectId}`);
    console.log(`   Doc ID: ${designDoc.id}`);
  }

  async updateDesignDoc(
    taskId: string,
    updates: Partial<
      Pick<
        DesignDocument,
        "components" | "dataModels" | "apiContracts" | "dependencies" | "risks"
      >
    >,
  ): Promise<void> {
    const doc = this.store.designDocs.get(taskId);
    if (!doc) {
      console.log(
        `${RED}✗${RESET} Design document not found for task: ${taskId}`,
      );
      return;
    }

    Object.assign(doc, updates, { updatedAt: new Date() });
    this.saveTasks();

    console.log(`\n${MAGENTA}◆${RESET} Design document updated`);
    console.log(`   Task: ${taskId}`);
    if (updates.components)
      console.log(`   Components: ${updates.components.join(", ")}`);
    if (updates.dataModels)
      console.log(`   Data Models: ${updates.dataModels.join(", ")}`);
    if (updates.apiContracts)
      console.log(`   API Contracts: ${updates.apiContracts.join(", ")}`);
  }

  async runTests(
    taskId: string,
    testType: "unit" | "integration" | "e2e" | "performance" | "security",
  ): Promise<void> {
    const task = this.store.tasks.find((t) => t.id === taskId);
    if (!task) {
      console.log(`${RED}✗${RESET} Task not found: ${taskId}`);
      return;
    }

    console.log(`\n${CYAN}🧪${RESET} Running ${testType} tests...`);

    // Simulate test execution
    const results: TestResult[] = [];
    const testCases = this.getTestCasesForType(testType, task.type);

    for (const testCase of testCases) {
      const passed = Math.random() > 0.2; // 80% pass rate
      const result: TestResult = {
        timestamp: new Date(),
        testType,
        status: passed ? "passed" : "failed",
        details: testCase,
      };
      results.push(result);
    }

    this.store.testResults.set(taskId, [
      ...(this.store.testResults.get(taskId) || []),
      ...results,
    ]);
    this.saveTasks();

    const passed = results.filter((r) => r.status === "passed").length;
    const failed = results.filter((r) => r.status === "failed").length;

    console.log(`\n${testType.toUpperCase()} Test Results:`);
    console.log(`   Passed: ${GREEN}${passed}${RESET}`);
    console.log(`   Failed: ${failed > 0 ? RED : GREEN}${failed}${RESET}`);

    if (failed > 0) {
      console.log(`\n${YELLOW}⚠${RESET} Failed tests:`);
      results
        .filter((r) => r.status === "failed")
        .forEach((r) => {
          console.log(`   - ${r.details}`);
        });
    }
  }

  private getTestCasesForType(testType: string, taskType: TaskType): string[] {
    const cases: Record<string, Record<string, string[]>> = {
      unit: {
        default: [
          "Component renders correctly",
          "State updates properly",
          "Error handling works",
        ],
        frontend: [
          "Component renders correctly",
          "Props passed correctly",
          "Events handled",
          "Hooks work",
        ],
        backend: [
          "Function returns correct data",
          "Validation works",
          "Error handling",
        ],
      },
      integration: {
        default: ["Components integrate properly", "Data flows correctly"],
        frontend: ["Navigation works", "State persists", "API calls succeed"],
        backend: ["Endpoints respond correctly", "Database operations work"],
      },
      e2e: {
        default: ["User flow completes", "UI displays correctly"],
        frontend: ["Page loads", "User can interact", "Data saves"],
        backend: ["API responds", "Data persists"],
      },
      performance: {
        default: ["Load time acceptable", "No memory leaks"],
        frontend: ["Rendering time < 100ms", "Bundle size acceptable"],
        backend: ["Response time < 200ms", "Query performance"],
      },
      security: {
        default: ["No XSS vulnerabilities", "Input sanitized", "Auth works"],
        frontend: ["No sensitive data in DOM", "CSP headers"],
        backend: ["SQL injection prevented", "Auth tokens secure"],
      },
    };

    return (
      cases[testType]?.[taskType] ||
      cases[testType]?.default || ["Generic test case"]
    );
  }

  async requestReview(taskId: string, reviewerId: string): Promise<void> {
    const task = this.store.tasks.find((t) => t.id === taskId);
    if (!task) {
      console.log(`${RED}✗${RESET} Task not found: ${taskId}`);
      return;
    }

    task.status = "in_review";
    task.updatedAt = new Date();
    this.saveTasks();

    this.logWork(
      taskId,
      task.assignedTo || "unknown",
      "progress",
      `Review requested from ${reviewerId}`,
    );
    this.saveTasks();

    console.log(`\n${BLUE}👁${RESET} Review requested`);
    console.log(`   Task: ${taskId}`);
    console.log(`   Reviewer: ${reviewerId}`);
  }

  async updateSubagentProgress(
    taskId: string,
    engineerId: string,
    progress: number,
    notes: string,
  ): Promise<void> {
    const task = this.store.tasks.find((t) => t.id === taskId);
    if (!task) {
      console.log(`${RED}✗${RESET} Task not found: ${taskId}`);
      return;
    }

    const delegation = task.delegatedTo?.find(
      (d) => d.engineerId === engineerId,
    );
    if (!delegation) {
      console.log(
        `${RED}✗${RESET} Subagent ${engineerId} not assigned to this task`,
      );
      return;
    }

    delegation.status = "in_progress";

    const subtask = task.subtasks.find((st) => st.id === delegation.subtaskId);
    if (subtask) {
      subtask.status = "in_progress";
    }

    // Update overall task progress based on subagent completion
    const completedSubtasks = task.subtasks.filter(
      (st) => st.status === "done",
    ).length;
    const totalSubtasks = task.subtasks.length;
    task.progress = Math.round((completedSubtasks / totalSubtasks) * 100);

    task.updatedAt = new Date();
    this.logWork(taskId, engineerId, "progress", `${progress}% - ${notes}`);
    this.saveTasks();

    const eng = ENGINEERING_TEAM.find((e) => e.id === engineerId);
    console.log(`\n${CYAN}▶${RESET} Subagent progress updated`);
    console.log(`   Task: ${taskId}`);
    console.log(`   Subagent: ${eng?.name || engineerId}`);
    console.log(`   Progress: ${progress}%`);
    console.log(`   Notes: ${notes}`);
    console.log(`   Overall Task Progress: ${task.progress}%`);
  }

  async completeSubagentTask(
    taskId: string,
    engineerId: string,
  ): Promise<void> {
    const task = this.store.tasks.find((t) => t.id === taskId);
    if (!task) {
      console.log(`${RED}✗${RESET} Task not found: ${taskId}`);
      return;
    }

    const delegation = task.delegatedTo?.find(
      (d) => d.engineerId === engineerId,
    );
    if (!delegation) {
      console.log(
        `${RED}✗${RESET} Subagent ${engineerId} not assigned to this task`,
      );
      return;
    }

    delegation.status = "completed";
    delegation.completedAt = new Date();

    const subtask = task.subtasks.find((st) => st.id === delegation.subtaskId);
    if (subtask) {
      subtask.status = "done";
    }

    // Update overall task progress
    const completedSubtasks = task.subtasks.filter(
      (st) => st.status === "done",
    ).length;
    const totalSubtasks = task.subtasks.length;
    task.progress = Math.round((completedSubtasks / totalSubtasks) * 100);

    task.updatedAt = new Date();
    this.logWork(
      taskId,
      engineerId,
      "completed",
      `Subtask completed: ${subtask?.title}`,
    );

    // Check if all subtasks are done
    if (completedSubtasks === totalSubtasks) {
      task.status = "in_review";
      console.log(
        `\n${GREEN}✓${RESET} All subtasks completed! Task moved to review.`,
      );
    }

    this.saveTasks();

    const eng = ENGINEERING_TEAM.find((e) => e.id === engineerId);
    console.log(`\n${GREEN}✓${RESET} Subagent task completed`);
    console.log(`   Task: ${taskId}`);
    console.log(`   Subagent: ${eng?.name || engineerId}`);
    console.log(`   Subtask: ${subtask?.title || delegation.subtaskId}`);
    console.log(`   Overall Task Progress: ${task.progress}%`);
  }

  async addSubagent(
    taskId: string,
    engineerId: string,
    subtaskTitle: string,
  ): Promise<void> {
    const task = this.store.tasks.find((t) => t.id === taskId);
    if (!task) {
      console.log(`${RED}✗${RESET} Task not found: ${taskId}`);
      return;
    }

    const engineer = ENGINEERING_TEAM.find((e) => e.id === engineerId);
    if (!engineer) {
      console.log(`${RED}✗${RESET} Engineer not found: ${engineerId}`);
      return;
    }

    const subtask: Task["subtasks"][0] = {
      id: `${taskId}-ST-${task.subtasks.length + 1}`,
      title: subtaskTitle,
      status: "pending",
    };
    task.subtasks.push(subtask);

    if (!task.delegatedTo) task.delegatedTo = [];
    task.delegatedTo.push({
      engineerId: engineer.id,
      subtaskId: subtask.id,
      role: engineer.role,
      status: "assigned",
      assignedAt: new Date(),
    });

    task.updatedAt = new Date();
    this.saveTasks();

    console.log(`\n${GREEN}✓${RESET} Subagent added`);
    console.log(`   Task: ${taskId}`);
    console.log(`   Subagent: ${engineer.name} (${engineer.id})`);
    console.log(`   Subtask: ${subtask.title}`);
  }

  async addReviewComment(
    taskId: string,
    reviewerId: string,
    comment: string,
    type: "suggestion" | "issue" | "approval",
  ): Promise<void> {
    const reviewComment: ReviewComment = {
      timestamp: new Date(),
      reviewer: reviewerId,
      type,
      comment,
      resolved: false,
    };

    this.store.reviewComments.set(taskId, [
      ...(this.store.reviewComments.get(taskId) || []),
      reviewComment,
    ]);
    this.saveTasks();

    const icon =
      type === "approval"
        ? GREEN + "✓"
        : type === "issue"
          ? RED + "✗"
          : YELLOW + "◆";
    console.log(`\n${icon}${RESET} Review comment added`);
    console.log(`   Task: ${taskId}`);
    console.log(`   Reviewer: ${reviewerId}`);
    console.log(`   Type: ${type}`);
    console.log(`   Comment: ${comment}`);
  }

  async approveReview(taskId: string): Promise<void> {
    const task = this.store.tasks.find((t) => t.id === taskId);
    if (!task) {
      console.log(`${RED}✗${RESET} Task not found: ${taskId}`);
      return;
    }

    task.status = "in_qa";
    task.updatedAt = new Date();
    this.saveTasks();

    console.log(`\n${GREEN}✓${RESET} Review approved`);
    console.log(`   Task: ${taskId}`);
  }

  async markQAPassed(taskId: string): Promise<void> {
    const task = this.store.tasks.find((t) => t.id === taskId);
    if (!task) {
      console.log(`${RED}✗${RESET} Task not found: ${taskId}`);
      return;
    }

    task.status = "ready";
    task.updatedAt = new Date();
    this.saveTasks();

    console.log(`\n${GREEN}✓${RESET} QA passed`);
    console.log(`   Task: ${taskId}`);
  }

  async complete(taskId: string, actualHours: number): Promise<void> {
    const task = this.store.tasks.find((t) => t.id === taskId);
    if (!task) {
      console.log(`${RED}✗${RESET} Task not found: ${taskId}`);
      return;
    }

    task.status = "done";
    task.actualHours = actualHours;
    task.completedAt = new Date();
    task.updatedAt = new Date();
    task.progress = 100;

    this.logWork(
      taskId,
      task.assignedTo || "unknown",
      "completed",
      `Task completed in ${actualHours}h`,
    );
    this.saveTasks();

    console.log(`\n${GREEN}✓${RESET} Task completed`);
    console.log(`   Task: ${taskId}`);
    console.log(`   Actual hours: ${actualHours}h`);
    console.log(`   Estimated: ${task.estimatedHours}h`);
    console.log(
      `   Variance: ${actualHours - task.estimatedHours > 0 ? "+" : ""}${actualHours - task.estimatedHours}h`,
    );
  }

  async listTasks(filter?: TaskStatus | "all"): Promise<void> {
    let tasks = this.store.tasks;

    if (filter && filter !== "all") {
      tasks = tasks.filter((t) => t.status === filter);
    }

    console.log(
      `\n${BOLD}═══════════════════════════════════════════════════════════════════════════════${RESET}`,
    );
    console.log(`${BOLD} TASKS${RESET} (${tasks.length} tasks)`);
    console.log(
      `${BOLD}═══════════════════════════════════════════════════════════════════════════════${RESET}\n`,
    );

    const statusColors: Record<string, string> = {
      backlog: DIM,
      assigned: BLUE,
      in_progress: CYAN,
      blocked: YELLOW,
      in_review: MAGENTA,
      in_qa: YELLOW,
      ready: GREEN,
      done: GREEN,
    };

    for (const task of tasks.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })) {
      const color = statusColors[task.status] || "";
      const eng = ENGINEERING_TEAM.find((e) => e.id === task.assignedTo);

      console.log(`${color}[${task.id}]${RESET} ${BOLD}${task.title}${RESET}`);
      console.log(
        `        Type: ${task.type} | Priority: ${task.priority} | Status: ${task.status}`,
      );
      console.log(
        `        Progress: ${task.progress}%${task.progress < 100 ? ` (${task.progress}/100)` : " ✓"}`,
      );
      console.log(`        Engineer: ${eng?.name || "Unassigned"}`);
      console.log(
        `        Hours: ${task.actualHours || 0}/${task.estimatedHours}h`,
      );
      console.log("");
    }
  }

  async status(taskId: string): Promise<void> {
    const task = this.store.tasks.find((t) => t.id === taskId);
    if (!task) {
      console.log(`${RED}✗${RESET} Task not found: ${taskId}`);
      return;
    }

    const eng = ENGINEERING_TEAM.find((e) => e.id === task.assignedTo);
    const workLog = this.store.workLogs.get(taskId) || [];
    const testResults = this.store.testResults.get(taskId) || [];
    const reviewComments = this.store.reviewComments.get(taskId) || [];
    const designDoc = this.store.designDocs.get(taskId);

    console.log(
      `\n${BOLD}═══════════════════════════════════════════════════════════════════════════════${RESET}`,
    );
    console.log(`${BOLD} TASK STATUS: ${task.id}${RESET}`);
    console.log(
      `${BOLD}═══════════════════════════════════════════════════════════════════════════════${RESET}\n`,
    );

    console.log(`${BOLD}Overview:${RESET}`);
    console.log(`  Title: ${task.title}`);
    console.log(`  Type: ${task.type}`);
    console.log(`  Priority: ${task.priority}`);
    console.log(`  Status: ${task.status}`);
    console.log(`  Progress: ${task.progress}%`);
    console.log(
      `  Engineer: ${eng?.name || "Unassigned"} (${task.assignedTo || "none"})`,
    );
    console.log(
      `  Hours: ${task.actualHours || 0} / ${task.estimatedHours}h estimated`,
    );
    console.log(`  Created: ${new Date(task.createdAt).toLocaleString()}`);
    if (task.startedAt)
      console.log(`  Started: ${new Date(task.startedAt).toLocaleString()}`);
    if (task.completedAt)
      console.log(
        `  Completed: ${new Date(task.completedAt).toLocaleString()}`,
      );

    if (task.subtasks.length > 0) {
      console.log(`\n${BOLD}Delegation (Leader → Subagents):${RESET}`);
      console.log(
        `  ${CYAN}👑 Leader:${RESET} ${eng?.name || "Unknown"} (${task.assignedTo})`,
      );
      console.log(`  ${MAGENTA}◆ Subagents (${task.subtasks.length}):${RESET}`);

      if (task.delegatedTo) {
        for (const del of task.delegatedTo) {
          const subEng = ENGINEERING_TEAM.find((e) => e.id === del.engineerId);
          const subtask = task.subtasks.find((st) => st.id === del.subtaskId);
          const statusIcon =
            subtask?.status === "done"
              ? GREEN + "✓"
              : subtask?.status === "in_progress"
                ? CYAN + "▶"
                : DIM + "○";
          console.log(
            `     ${statusIcon}${RESET} ${subEng?.name || del.engineerId} (${del.role}): ${subtask?.title || del.subtaskId}`,
          );
        }
      } else {
        for (const st of task.subtasks) {
          console.log(`     ${DIM}○${RESET} ${st.id}: ${st.title}`);
        }
      }
    }

    if (task.blockedBy.length > 0) {
      console.log(`\n${YELLOW}${BOLD}Blocked by:${RESET}`);
      for (const block of task.blockedBy) {
        console.log(`  ⚠ ${block}`);
      }
    }

    if (designDoc) {
      console.log(`\n${MAGENTA}${BOLD}Design Document:${RESET}`);
      console.log(`  Components: ${designDoc.components.join(", ") || "None"}`);
      console.log(
        `  Data Models: ${designDoc.dataModels.join(", ") || "None"}`,
      );
      console.log(
        `  API Contracts: ${designDoc.apiContracts.join(", ") || "None"}`,
      );
      console.log(
        `  Dependencies: ${designDoc.dependencies.join(", ") || "None"}`,
      );
      console.log(`  Risks: ${designDoc.risks.join(", ") || "None"}`);
    }

    if (testResults.length > 0) {
      console.log(`\n${CYAN}${BOLD}Test Results:${RESET}`);
      const latestByType = new Map<string, TestResult>();
      for (const tr of testResults) {
        latestByType.set(tr.testType, tr);
      }
      for (const [type, result] of latestByType) {
        const icon = result.status === "passed" ? GREEN + "✓" : RED + "✗";
        console.log(`  ${icon}${RESET} ${type}: ${result.status}`);
      }
    }

    if (reviewComments.length > 0) {
      console.log(
        `\n${BLUE}${BOLD}Review Comments (${reviewComments.length}):${RESET}`,
      );
      for (const rc of reviewComments.slice(-3)) {
        const icon =
          rc.type === "approval"
            ? GREEN + "✓"
            : rc.type === "issue"
              ? RED + "✗"
              : YELLOW + "◆";
        console.log(
          `  ${icon}${RESET} ${rc.reviewer}: ${rc.comment.substring(0, 60)}${rc.comment.length > 60 ? "..." : ""}`,
        );
      }
    }

    if (workLog.length > 0) {
      console.log(`\n${DIM}${BOLD}Recent Activity:${RESET}`);
      for (const log of workLog.slice(-5)) {
        console.log(
          `  ${DIM}[${new Date(log.timestamp).toLocaleTimeString()}]${RESET} ${log.engineer}: ${log.details}`,
        );
      }
    }
  }

  private logWork(
    taskId: string,
    engineer: string,
    action: WorkLogEntry["action"],
    details: string,
  ): void {
    const logs = this.store.workLogs.get(taskId) || [];
    logs.push({
      timestamp: new Date(),
      engineer,
      action,
      details,
    });
    this.store.workLogs.set(taskId, logs);
  }

  async showEngineerStatus(engineerId?: string): Promise<void> {
    const engineers = engineerId
      ? ENGINEERING_TEAM.filter((e) => e.id === engineerId)
      : ENGINEERING_TEAM;

    console.log(
      `\n${BOLD}═══════════════════════════════════════════════════════════════════════════════${RESET}`,
    );
    console.log(`${BOLD} ENGINEER STATUS${RESET}`);
    console.log(
      `${BOLD}═══════════════════════════════════════════════════════════════════════════════${RESET}\n`,
    );

    for (const eng of engineers) {
      const tasks = this.store.tasks.filter((t) => t.assignedTo === eng.id);
      const inProgress = tasks.filter((t) => t.status === "in_progress");
      const completed = tasks.filter((t) => t.status === "done");
      const totalHours = tasks.reduce(
        (sum, t) => sum + (t.actualHours || 0),
        0,
      );

      console.log(`${BOLD}${eng.id}: ${eng.name}${RESET}`);
      console.log(`  Role: ${eng.role}`);
      console.log(
        `  Tasks: ${tasks.length} total | ${inProgress.length} in progress | ${completed.length} done`,
      );
      console.log(`  Hours: ${totalHours}h logged`);

      if (inProgress.length > 0) {
        console.log(`  ${CYAN}Working on:${RESET}`);
        for (const task of inProgress) {
          console.log(`    - ${task.id}: ${task.title} (${task.progress}%)`);
        }
      }
      console.log("");
    }
  }

  async showDashboard(): Promise<void> {
    const tasks = this.store.tasks;
    const backlog = tasks.filter((t) => t.status === "backlog").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const inReview = tasks.filter((t) => t.status === "in_review").length;
    const done = tasks.filter((t) => t.status === "done").length;
    const blocked = tasks.filter((t) => t.status === "blocked").length;

    console.log(
      `\n${BOLD}╔══════════════════════════════════════════════════════════════════════════════╗${RESET}`,
    );
    console.log(
      `${BOLD}║                    TASK DISPATCH DASHBOARD                                 ║${RESET}`,
    );
    console.log(
      `${BOLD}╠══════════════════════════════════════════════════════════════════════════════╣${RESET}`,
    );
    console.log(
      `${BOLD}║${RESET}  ${CYAN}TASKS${RESET}                        ${GREEN}E2E QA TEAM${RESET} (5)                          ${BOLD}║${RESET}`,
    );
    console.log(
      `${BOLD}║${RESET}  ─────────────────────────────────────────────────────────────────   ${BOLD}║${RESET}`,
    );
    console.log(
      `${BOLD}║${RESET}  Total: ${tasks.length}                            Emily Rodriguez (Lead)                     ${BOLD}║${RESET}`,
    );
    console.log(
      `${BOLD}║${RESET}  ${DIM}Backlog${RESET}: ${backlog}  ${CYAN}In Progress${RESET}: ${inProgress}             Michael Chen (UI)                           ${BOLD}║${RESET}`,
    );
    console.log(
      `${BOLD}║${RESET}  ${MAGENTA}In Review${RESET}: ${inReview}  ${YELLOW}Blocked${RESET}: ${blocked}              Sarah Park (API)                            ${BOLD}║${RESET}`,
    );
    console.log(
      `${BOLD}║${RESET}  ${GREEN}Done${RESET}: ${done}                               David Kim (Perf)                            ${BOLD}║${RESET}`,
    );
    console.log(
      `${BOLD}║${RESET}                                            Jessica Brown (Security)                      ${BOLD}║${RESET}`,
    );
    console.log(
      `${BOLD}╠══════════════════════════════════════════════════════════════════════════════╣${RESET}`,
    );
    console.log(
      `${BOLD}║${RESET}  ${MAGENTA}ENGINEERING TEAM${RESET} (10)                                                     ${BOLD}║${RESET}`,
    );
    console.log(
      `${BOLD}║${RESET}  ─────────────────────────────────────────────────────────────────   ${BOLD}║${RESET}`,
    );

    const engRows = ENGINEERING_TEAM.map((eng, i) => {
      const engTasks = tasks.filter(
        (t) => t.assignedTo === eng.id && t.status === "in_progress",
      );
      const status =
        engTasks.length > 0 ? `${CYAN}working${RESET}` : `${DIM}idle${RESET}`;
      return `${BOLD}║${RESET}  ${eng.id}: ${eng.name.padEnd(18)} ${status.padEnd(10)} ${engTasks.length > 0 ? engTasks.map((t) => t.progress + "%").join(", ") : "-"}`;
    });

    console.log(engRows.join("\n"));
    console.log(
      `${BOLD}╚══════════════════════════════════════════════════════════════════════════════╝${RESET}`,
    );
  }
}

// CLI Interface
const dispatchSystem = new TaskDispatchSystem();

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
const command = args[0] || "help";

async function main() {
  switch (command) {
    case "dispatch": {
      const title = args[1] || "Untitled Task";
      const description = args[2] || "No description provided";
      const type = (args[3] as TaskType) || "frontend";
      const priority = (args[4] as TaskPriority) || "medium";
      await dispatchSystem.dispatch(title, description, type, priority);
      break;
    }

    case "status": {
      if (args[1]) {
        await dispatchSystem.status(args[1]);
      } else {
        await dispatchSystem.showDashboard();
      }
      break;
    }

    case "list": {
      const filter = (args[1] as TaskStatus | "all") || "all";
      await dispatchSystem.listTasks(filter);
      break;
    }

    case "assign": {
      await dispatchSystem.assign(args[1], args[2]);
      break;
    }

    case "work": {
      await dispatchSystem.startWork(args[1], args[2]);
      break;
    }

    case "progress": {
      const progress = parseInt(args[2]) || 50;
      const notes = args.slice(3).join(" ") || "Progress update";
      await dispatchSystem.updateProgress(args[1], progress, notes);
      break;
    }

    case "subagent:progress": {
      const engineerId = args[2];
      const progress = parseInt(args[3]) || 50;
      const notes = args.slice(4).join(" ") || "Subagent progress update";
      await dispatchSystem.updateSubagentProgress(
        args[1],
        engineerId,
        progress,
        notes,
      );
      break;
    }

    case "subagent:complete": {
      const engineerId = args[2];
      await dispatchSystem.completeSubagentTask(args[1], engineerId);
      break;
    }

    case "add-subagent": {
      const engineerId = args[2];
      const subtaskTitle = args.slice(3).join(" ") || "Additional work";
      await dispatchSystem.addSubagent(args[1], engineerId, subtaskTitle);
      break;
    }

    case "block": {
      const reason = args.slice(2).join(" ") || "No reason provided";
      await dispatchSystem.block(args[1], reason);
      break;
    }

    case "unblock": {
      await dispatchSystem.unblock(args[1]);
      break;
    }

    case "subtask": {
      const title = args.slice(2).join(" ") || "New subtask";
      await dispatchSystem.addSubtask(args[1], title);
      break;
    }

    case "design": {
      await dispatchSystem.createDesignDoc(args[1], args[2] || "ENG-001");
      break;
    }

    case "design:update": {
      const updates: Record<string, string[]> = {};
      for (let i = 2; i < args.length; i++) {
        const [key, value] = args[i].split(":");
        if (key && value) {
          updates[key] = value.split(",");
        }
      }
      await dispatchSystem.updateDesignDoc(args[1], updates);
      break;
    }

    case "test": {
      const testType =
        (args[2] as
          | "unit"
          | "integration"
          | "e2e"
          | "performance"
          | "security") || "unit";
      await dispatchSystem.runTests(args[1], testType);
      break;
    }

    case "review": {
      await dispatchSystem.requestReview(args[1], args[2] || "ENG-001");
      break;
    }

    case "comment": {
      const type =
        (args[3] as "suggestion" | "issue" | "approval") || "suggestion";
      const comment = args.slice(4).join(" ") || "No comment";
      await dispatchSystem.addReviewComment(args[1], args[2], comment, type);
      break;
    }

    case "approve": {
      await dispatchSystem.approveReview(args[1]);
      break;
    }

    case "qa": {
      await dispatchSystem.markQAPassed(args[1]);
      break;
    }

    case "complete": {
      const hours = parseFloat(args[2]) || 0;
      await dispatchSystem.complete(args[1], hours);
      break;
    }

    case "engineers": {
      await dispatchSystem.showEngineerStatus(args[1]);
      break;
    }

    case "help":
    default: {
      console.log(`
${BOLD}Task Dispatch System${RESET} - Distributed Task Management

${BOLD}COMMANDS:${RESET}

  ${CYAN}Task Dispatch & Delegation${RESET}
    dispatch <title> <desc> <type> <priority>
                Dispatch task - auto-delegates to leader who assigns 3+ subagents
    assign <task-id> <engineer-id>
                Assign task to engineer
    work <task-id> [engineer-id]
                Start working on task

  ${CYAN}Subagent Commands${RESET}
    subagent:progress <task-id> <engineer-id> <0-100> [notes]
                Update subagent progress on their subtask
    subagent:complete <task-id> <engineer-id>
                Mark subagent's subtask as complete

  ${CYAN}Task Tracking${RESET}
    status [task-id]
                Show task status or dashboard
    list [status]
                List all tasks or filter by status
    progress <task-id> <0-100> [notes]
                Update task progress
    engineers [engineer-id]
                Show engineer status

  ${CYAN}Task Architecture${RESET}
    design <task-id> [architect-id]
                Create design document
    design:update <task-id> <key:value>...
                Update design document
                Keys: components, dataModels, apiContracts, dependencies, risks

  ${CYAN}Task Execution${RESET}
    subtask <task-id> <title>
                Add subtask to task
    block <task-id> <reason>
                Block task with reason
    unblock <task-id>
                Remove block from task

  ${CYAN}Testing${RESET}
    test <task-id> [type]
                Run tests (unit|integration|e2e|performance|security)

  ${CYAN}Review & Complete${RESET}
    review <task-id> [reviewer-id]
                Request review
    comment <task-id> <reviewer> <type> <comment>
                Add review comment (type: suggestion|issue|approval)
    approve <task-id>
                Approve review
    qa <task-id>
                Mark QA as passed
    complete <task-id> [hours]
                Mark task as complete

${BOLD}TASK TYPES:${RESET}   frontend, backend, fullstack, uiux, devops, security, testing, architecture, api, performance
${BOLD}PRIORITIES:${RESET}   critical, high, medium, low
${BOLD}STATUS:${RESET}        backlog, assigned, in_progress, blocked, in_review, in_qa, ready, done

${BOLD}EXAMPLES:${RESET}
    bun run task-dispatch.ts dispatch "Fix login bug" "Users cannot login" frontend high
    bun run task-dispatch.ts status
    bun run task-dispatch.ts work TASK-001 ENG-003
    bun run task-dispatch.ts progress TASK-001 50 "Implemented basic auth"
    bun run task-dispatch.ts test TASK-001 e2e
    bun run task-dispatch.ts complete TASK-001 3.5
      `);
      break;
    }
  }
}

await main();
