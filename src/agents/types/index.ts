export type AgentLevel = "architect" | "manager" | "specialist" | "ground";

export type AgentRole =
  | "chief_architect"
  | "system_architect"
  | "tech_lead"
  | "project_manager"
  | "team_lead"
  | "senior_specialist"
  | "specialist"
  | "junior_specialist"
  | "ground_engineer"
  | "intern";

export type TaskStatus =
  | "pending"
  | "in_progress"
  | "delegated"
  | "completed"
  | "failed"
  | "cancelled";

export type TaskPriority = "critical" | "high" | "medium" | "low";

export interface AgentCapabilities {
  canDelegate: boolean;
  canApprove: boolean;
  maxDelegationDepth: number;
  skills: string[];
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  level: AgentLevel;
  capabilities: AgentCapabilities;
  parentId?: string;
  childrenIds: string[];
  activeTasks: string[];
  completedTasks: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  assignedTo?: string;
  delegatorId?: string;
  delegationChain: string[];
  parentTaskId?: string;
  subtasks: string[];
  metadata: Record<string, unknown>;
}

export interface DelegationEvent {
  id: string;
  taskId: string;
  fromAgentId: string;
  toAgentId: string;
  timestamp: Date;
  reason?: string;
}

export interface TaskUpdate {
  taskId: string;
  agentId: string;
  timestamp: Date;
  change: "status_change" | "delegation" | "completion" | "comment";
  oldValue?: string;
  newValue: string;
  comment?: string;
}

export interface TeamMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  averageCompletionTime: number;
  delegationEfficiency: number;
}
