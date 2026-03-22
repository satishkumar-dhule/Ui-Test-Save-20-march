export type TaskType =
  | "frontend"
  | "backend"
  | "fullstack"
  | "uiux"
  | "devops"
  | "security"
  | "testing"
  | "architecture"
  | "api"
  | "performance";

export type TaskPriority = "critical" | "high" | "medium" | "low";

export type TaskStatus =
  | "backlog"
  | "delegated"
  | "assigned"
  | "in_progress"
  | "blocked"
  | "in_review"
  | "in_qa"
  | "ready"
  | "done";

export interface Subtask {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "done";
}

export interface TestPlan {
  id: string;
  unitTests: string[];
  integrationTests: string[];
  e2eTests: string[];
  performanceTests: string[];
  securityTests: string[];
}

export interface DesignDoc {
  id: string;
  components: string[];
  dataModels: string[];
  apiContracts: string[];
  dependencies: string[];
  risks: string[];
}

export interface Delegation {
  engineerId: string;
  subtaskId: string;
  role: string;
  status: "assigned" | "in_progress" | "completed" | "blocked";
  assignedAt: Date;
  completedAt?: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  assignedTo?: string;
  startedAt?: Date;
  completedAt?: Date;
  estimatedHours: number;
  actualHours: number;
  specs: string[];
  subtasks: Subtask[];
  dependencies: string[];
  blockedBy: string[];
  testPlan?: string;
  designDoc?: string;
  progress: number;
  delegatedTo?: Delegation[];
}

let taskCounter = 0;
let initialized = false;

export function generateTaskId(): string {
  if (!initialized) {
    initializeCounter();
    initialized = true;
  }
  taskCounter++;
  return `TASK-${String(taskCounter).padStart(6, "0")}`;
}

function initializeCounter(): void {
  try {
    const fs = require("fs");
    const path = "/home/runner/workspace/data/task-store.json";
    if (fs.existsSync(path)) {
      const data = fs.readFileSync(path, "utf8");
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.tasks && parsed.tasks.length > 0) {
          const maxId = parsed.tasks.reduce(
            (max: number, task: { id: string }) => {
              const num = parseInt(task.id.replace("TASK-", ""));
              return num > max ? num : max;
            },
            0,
          );
          taskCounter = maxId;
        }
      }
    }
  } catch {
    taskCounter = 0;
  }
}

export function resetTaskCounter(): void {
  taskCounter = 0;
  initialized = false;
}
