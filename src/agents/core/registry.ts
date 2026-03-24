import {
  Agent,
  AgentLevel,
  AgentRole,
  AgentCapabilities,
  Task,
  TaskStatus,
  TaskPriority,
  DelegationEvent,
  TaskUpdate,
} from "../types";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const LEVEL_HIERARCHY: Record<AgentLevel, number> = {
  architect: 4,
  manager: 3,
  specialist: 2,
  ground: 1,
};

const ROLE_DEFAULTS: Record<AgentRole, AgentCapabilities> = {
  chief_architect: {
    canDelegate: true,
    canApprove: true,
    maxDelegationDepth: 10,
    skills: ["architecture", "system_design", "strategy", "mentorship"],
  },
  system_architect: {
    canDelegate: true,
    canApprove: true,
    maxDelegationDepth: 8,
    skills: ["architecture", "system_design", "technical_direction"],
  },
  tech_lead: {
    canDelegate: true,
    canApprove: true,
    maxDelegationDepth: 6,
    skills: ["technical_leadership", "code_review", "architecture"],
  },
  project_manager: {
    canDelegate: true,
    canApprove: true,
    maxDelegationDepth: 5,
    skills: ["project_management", "resource_allocation", "communication"],
  },
  team_lead: {
    canDelegate: true,
    canApprove: true,
    maxDelegationDepth: 4,
    skills: ["team_management", "task_assignment", "coordination"],
  },
  senior_specialist: {
    canDelegate: true,
    canApprove: false,
    maxDelegationDepth: 2,
    skills: ["expert_level_skills", "mentoring"],
  },
  specialist: {
    canDelegate: false,
    canApprove: false,
    maxDelegationDepth: 0,
    skills: [],
  },
  junior_specialist: {
    canDelegate: false,
    canApprove: false,
    maxDelegationDepth: 0,
    skills: [],
  },
  ground_engineer: {
    canDelegate: false,
    canApprove: false,
    maxDelegationDepth: 0,
    skills: ["execution", "implementation"],
  },
  intern: {
    canDelegate: false,
    canApprove: false,
    maxDelegationDepth: 0,
    skills: ["learning"],
  },
};

export class AgentRegistry {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private delegationEvents: DelegationEvent[] = [];
  private taskUpdates: TaskUpdate[] = [];

  private initializeDefaultTeam(): void {
    const chiefArchitect = this.createAgent(
      "chief_architect",
      "Chief Architect",
      undefined,
    );
    const systemArchitect = this.createAgent(
      "system_architect",
      "System Architect",
      chiefArchitect.id,
    );
    const techLead = this.createAgent(
      "tech_lead",
      "Tech Lead",
      systemArchitect.id,
    );
    const projectManager = this.createAgent(
      "project_manager",
      "Project Manager",
      chiefArchitect.id,
    );
    const teamLead = this.createAgent(
      "team_lead",
      "Team Lead",
      projectManager.id,
    );

    this.createAgent("senior_specialist", "Senior Specialist", techLead.id);
    this.createAgent("specialist", "Specialist A", techLead.id);
    this.createAgent("specialist", "Specialist B", teamLead.id);
    this.createAgent("ground_engineer", "Ground Engineer", teamLead.id);
    this.createAgent("junior_specialist", "Junior Specialist", teamLead.id);
  }

  createAgent(role: AgentRole, name: string, parentId?: string): Agent {
    const level = this.determineLevel(role);
    const capabilities = ROLE_DEFAULTS[role];

    const agent: Agent = {
      id: generateId(),
      name,
      role,
      level,
      capabilities,
      parentId,
      childrenIds: [],
      activeTasks: [],
      completedTasks: [],
    };

    this.agents.set(agent.id, agent);

    if (parentId) {
      const parent = this.agents.get(parentId);
      if (parent) {
        parent.childrenIds.push(agent.id);
      }
    }

    return agent;
  }

  private determineLevel(role: AgentRole): AgentLevel {
    if (["chief_architect", "system_architect"].includes(role))
      return "architect";
    if (["tech_lead", "project_manager", "team_lead"].includes(role))
      return "manager";
    if (["senior_specialist"].includes(role)) return "specialist";
    return "ground";
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getAgentsByLevel(level: AgentLevel): Agent[] {
    return this.getAllAgents().filter((agent) => agent.level === level);
  }

  getChildren(agentId: string): Agent[] {
    const agent = this.getAgent(agentId);
    if (!agent) return [];
    return agent.childrenIds
      .map((id) => this.agents.get(id))
      .filter(Boolean) as Agent[];
  }

  getParent(agentId: string): Agent | undefined {
    const agent = this.getAgent(agentId);
    if (!agent?.parentId) return undefined;
    return this.agents.get(agent.parentId);
  }

  getTeamHierarchy(agentId: string): Agent[] {
    const hierarchy: Agent[] = [];
    let current = this.getAgent(agentId);

    while (current) {
      hierarchy.unshift(current);
      current = this.getParent(current.id);
    }

    return hierarchy;
  }

  createTask(
    title: string,
    description: string,
    priority: TaskPriority,
    createdBy: string,
    parentTaskId?: string,
  ): Task {
    const task: Task = {
      id: generateId(),
      title,
      description,
      status: "pending",
      priority,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      parentTaskId,
      subtasks: [],
      delegationChain: [createdBy],
      metadata: {},
    };

    this.tasks.set(task.id, task);
    return task;
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  getTasksByAgent(agentId: string): Task[] {
    return Array.from(this.tasks.values()).filter(
      (task) => task.assignedTo === agentId && task.status !== "completed",
    );
  }

  canDelegate(fromAgentId: string, toAgentId: string, task: Task): boolean {
    const fromAgent = this.getAgent(fromAgentId);
    const toAgent = this.getAgent(toAgentId);

    if (!fromAgent || !toAgent) return false;
    if (!fromAgent.capabilities.canDelegate) return false;
    if (LEVEL_HIERARCHY[fromAgent.level] <= LEVEL_HIERARCHY[toAgent.level])
      return false;

    const currentDepth = task.delegationChain.length;
    return currentDepth < fromAgent.capabilities.maxDelegationDepth;
  }

  delegateTask(
    taskId: string,
    fromAgentId: string,
    toAgentId: string,
    reason?: string,
  ): Task | null {
    const task = this.getTask(taskId);
    const fromAgent = this.getAgent(fromAgentId);
    const toAgent = this.getAgent(toAgentId);

    if (!task || !fromAgent || !toAgent) return null;
    if (!this.canDelegate(fromAgentId, toAgentId, task)) return null;

    const oldAgent = task.assignedTo;
    if (oldAgent) {
      const oldAgentObj = this.getAgent(oldAgent);
      if (oldAgentObj) {
        oldAgentObj.activeTasks = oldAgentObj.activeTasks.filter(
          (id) => id !== taskId,
        );
      }
    }

    task.assignedTo = toAgentId;
    task.delegatorId = fromAgentId;
    task.delegationChain.push(toAgentId);
    task.status = "delegated";
    task.updatedAt = new Date();

    toAgent.activeTasks.push(taskId);
    fromAgent.activeTasks = fromAgent.activeTasks.filter((id) => id !== taskId);

    const event: DelegationEvent = {
      id: generateId(),
      taskId,
      fromAgentId,
      toAgentId,
      timestamp: new Date(),
      reason,
    };
    this.delegationEvents.push(event);

    this.recordUpdate(
      taskId,
      fromAgentId,
      "delegation",
      oldAgent || "",
      toAgentId,
      reason,
    );

    return task;
  }

  updateTaskStatus(
    taskId: string,
    agentId: string,
    status: TaskStatus,
  ): Task | null {
    const task = this.getTask(taskId);
    const agent = this.getAgent(agentId);

    if (!task || !agent) return null;
    if (task.assignedTo !== agentId && task.createdBy !== agentId) return null;

    const oldStatus = task.status;
    task.status = status;
    task.updatedAt = new Date();

    if (status === "completed") {
      agent.activeTasks = agent.activeTasks.filter((id) => id !== taskId);
      agent.completedTasks.push(taskId);
    }

    this.recordUpdate(taskId, agentId, "status_change", oldStatus, status);

    return task;
  }

  private recordUpdate(
    taskId: string,
    agentId: string,
    change: TaskUpdate["change"],
    oldValue: string,
    newValue: string,
    comment?: string,
  ): void {
    const update: TaskUpdate = {
      taskId,
      agentId,
      timestamp: new Date(),
      change,
      oldValue,
      newValue,
      comment,
    };
    this.taskUpdates.push(update);
  }

  getDelegationHistory(taskId: string): DelegationEvent[] {
    return this.delegationEvents.filter((event) => event.taskId === taskId);
  }

  getTaskHistory(taskId: string): TaskUpdate[] {
    return this.taskUpdates.filter((update) => update.taskId === taskId);
  }

  getTeamMetrics(): {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    delegationCount: number;
  } {
    const allTasks = Array.from(this.tasks.values());
    return {
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter((t) => t.status === "completed").length,
      pendingTasks: allTasks.filter((t) => t.status === "pending").length,
      inProgressTasks: allTasks.filter(
        (t) => t.status === "in_progress" || t.status === "delegated",
      ).length,
      delegationCount: this.delegationEvents.length,
    };
  }

  findBestAvailableAgent(requiredSkill?: string): Agent | undefined {
    const agents = this.getAllAgents()
      .filter((agent) => agent.capabilities.canDelegate === false)
      .filter((agent) => {
        if (requiredSkill) {
          return agent.capabilities.skills.includes(requiredSkill);
        }
        return true;
      })
      .filter((agent) => agent.activeTasks.length < 5)
      .sort((a, b) => LEVEL_HIERARCHY[b.level] - LEVEL_HIERARCHY[a.level]);

    return agents[0];
  }

  getFullHierarchyTree(): Record<string, unknown> {
    const rootAgents = this.getAllAgents().filter((agent) => !agent.parentId);

    const buildTree = (agent: Agent): Record<string, unknown> => {
      const children = agent.childrenIds
        .map((id) => this.agents.get(id))
        .filter(Boolean)
        .map((child) => buildTree(child as Agent));

      return {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        level: agent.level,
        children: children.length > 0 ? children : undefined,
      };
    };

    return {
      organization: rootAgents.map((agent) => buildTree(agent)),
    };
  }
}

export const agentRegistry = new AgentRegistry();
