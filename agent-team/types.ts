export type AgentRole =
  | "architect"
  | "frontend-lead"
  | "ui-engineer"
  | "fullstack"
  | "performance"
  | "saas-specialist"
  | "devops"
  | "testing"
  | "backend"
  | "security"
  | "frontend-dev"
  | "integration"
  | "orchestrator";

export type AgentStatus =
  | "idle"
  | "working"
  | "blocked"
  | "reviewing"
  | "completed";

export type AgentCapability =
  | "system-design"
  | "architecture-review"
  | "code-review"
  | "performance-optimization"
  | "react-development"
  | "state-management"
  | "component-design"
  | "testing"
  | "ui-development"
  | "animation"
  | "responsive-design"
  | "accessibility"
  | "api-development"
  | "database-design"
  | "authentication"
  | "deployment"
  | "performance-audit"
  | "bundle-optimization"
  | "caching-strategies"
  | "core-vitals"
  | "subscription-model"
  | "multi-tenant"
  | "metered-billing"
  | "usage-tracking"
  | "ci-cd"
  | "infrastructure"
  | "monitoring"
  | "security"
  | "unit-testing"
  | "integration-testing"
  | "e2e-testing"
  | "test-automation"
  | "api-design"
  | "database-optimization"
  | "caching"
  | "data-modeling"
  | "security-audit"
  | "auth-implementation"
  | "data-protection"
  | "compliance"
  | "component-design"
  | "design-system"
  | "documentation"
  | "storybook"
  | "api-integration"
  | "webhooks"
  | "oauth"
  | "third-party-sdk";

export interface AgentPerformance {
  tasksCompleted: number;
  avgCompletionTime: number;
  successRate: number;
}

export interface EliteAgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  specialization: string;
  yearsOfExperience: number;
  capabilities: AgentCapability[];
  currentTask?: string;
  status: AgentStatus;
  completedTasks: string[];
  skills: string[];
  performance: AgentPerformance;
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  specialization: string;
  yearsOfExperience: number;
  capabilities: AgentCapability[];
  currentTask?: string;
  status: AgentStatus;
  completedTasks: string[];
  skills: string[];
  performance: AgentPerformance;
}

export interface TaskAssignment {
  taskId: string;
  taskTitle: string;
  assignedAgent: string;
  assignedAt: Date;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in-progress" | "review" | "completed" | "blocked";
  dependencies: string[];
  estimatedTime: string;
  actualTime?: string;
  output: GeneratedContent[];
  validation?: ValidationResult;
}

export interface GeneratedContent {
  id: string;
  type: "component" | "api" | "style" | "test" | "config" | "docs";
  content: string;
  filePath: string;
  generatedAt: Date;
  streamedChunks: string[];
  isComplete: boolean;
  agentId: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  checkedAt: Date;
  checkedBy: string;
}

export interface ValidationError {
  line?: number;
  message: string;
  severity: "error" | "warning" | "info";
  autoFixable: boolean;
}

export interface ValidationWarning {
  message: string;
  suggestion?: string;
}

export interface StreamingUpdate {
  taskId: string;
  agentId: string;
  chunk: string;
  progress: number;
  timestamp: Date;
}
