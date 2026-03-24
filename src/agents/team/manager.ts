import { agentRegistry } from "../core/registry";
import { delegationTracker } from "../tracking/delegation";
import { Task, TaskPriority, Agent, AgentRole, TaskStatus } from "../types";

export interface TeamConfig {
  name: string;
  roles: AgentRole[];
}

export interface TaskAssignment {
  taskId: string;
  assignedAgent: Agent;
  status: TaskStatus;
  priority: TaskPriority;
}

export class AgentTeamManager {
  private teamConfigs: Map<string, TeamConfig> = new Map();

  createTeam(name: string, roles: AgentRole[]): string {
    const config: TeamConfig = { name, roles };
    this.teamConfigs.set(name, config);

    for (const role of roles) {
      agentRegistry.createAgent(role, `${name}-${role}`);
    }

    return name;
  }

  assignTaskToBestAgent(
    taskId: string,
    preferredRole?: AgentRole,
  ): Agent | null {
    const task = agentRegistry.getTask(taskId);
    if (!task) return null;

    let candidates: Agent[];

    if (preferredRole) {
      candidates = agentRegistry
        .getAllAgents()
        .filter((a) => a.role === preferredRole && !a.capabilities.canDelegate);
    } else {
      candidates = agentRegistry
        .getAllAgents()
        .filter((a) => !a.capabilities.canDelegate)
        .sort((a, b) => a.activeTasks.length - b.activeTasks.length);
    }

    const selected = candidates.find((a) => a.activeTasks.length < 5);
    if (!selected) return null;

    const delegatorId = agentRegistry
      .getAllAgents()
      .find((a) => a.childrenIds.includes(selected.id))?.id;

    if (delegatorId) {
      agentRegistry.delegateTask(taskId, delegatorId, selected.id);
    }

    return selected;
  }

  delegateTaskDownHierarchy(taskId: string, fromAgentId: string): Task | null {
    const fromAgent = agentRegistry.getAgent(fromAgentId);
    if (!fromAgent || fromAgent.childrenIds.length === 0) return null;

    const children = fromAgent.childrenIds
      .map((id) => agentRegistry.getAgent(id))
      .filter(Boolean) as Agent[];

    const available = children
      .filter((a) => a.activeTasks.length < 5)
      .sort((a, b) => a.activeTasks.length - b.activeTasks.length);

    if (available.length === 0) return null;

    return agentRegistry.delegateTask(taskId, fromAgentId, available[0].id);
  }

  getTeamStatus(): {
    architects: Agent[];
    managers: Agent[];
    specialists: Agent[];
    ground: Agent[];
    metrics: ReturnType<typeof agentRegistry.getTeamMetrics>;
  } {
    return {
      architects: agentRegistry.getAgentsByLevel("architect"),
      managers: agentRegistry.getAgentsByLevel("manager"),
      specialists: agentRegistry.getAgentsByLevel("specialist"),
      ground: agentRegistry.getAgentsByLevel("ground"),
      metrics: agentRegistry.getTeamMetrics(),
    };
  }

  getWorkloadDistribution(): Record<string, number> {
    const agents = agentRegistry.getAllAgents();
    const distribution: Record<string, number> = {};

    for (const agent of agents) {
      distribution[agent.name] = agent.activeTasks.length;
    }

    return distribution;
  }

  rebalanceWorkload(): void {
    const overloaded = agentRegistry
      .getAllAgents()
      .filter((a) => a.activeTasks.length > 5);

    const underloaded = agentRegistry
      .getAllAgents()
      .filter((a) => a.activeTasks.length < 3 && !a.capabilities.canDelegate);

    for (const overloadedAgent of overloaded) {
      for (const taskId of overloadedAgent.activeTasks.slice(2)) {
        const underload = underloaded.find(
          (a) => a.activeTasks.length < 3 && a.level === overloadedAgent.level,
        );

        if (underload) {
          const delegator = agentRegistry.getParent(overloadedAgent.id);
          if (delegator && delegator.capabilities.canDelegate) {
            agentRegistry.delegateTask(
              taskId,
              overloadedAgent.id,
              underload.id,
            );
          }
        }
      }
    }
  }
}

export const teamManager = new AgentTeamManager();

export class TaskOrchestrator {
  createAndOrchestrateTask(
    title: string,
    description: string,
    priority: TaskPriority,
    creatorId: string,
    targetLevel: "architect" | "manager" | "specialist" | "ground",
  ): Task | null {
    const task = agentRegistry.createTask(
      title,
      description,
      priority,
      creatorId,
    );

    delegationTracker.trackTask(task.id);

    let delegator = agentRegistry.getAgent(creatorId);
    if (!delegator) {
      const architects = agentRegistry.getAgentsByLevel("architect");
      if (architects.length === 0) return null;
      delegator = architects[0];
    }

    const targetAgents = agentRegistry.getAgentsByLevel(targetLevel);
    if (targetAgents.length === 0) return null;

    const executor = targetAgents[0];

    agentRegistry.delegateTask(task.id, delegator.id, executor.id);
    delegationTracker.addCheckpoint(
      task.id,
      "Task Created",
      creatorId,
      delegator.id,
    );
    delegationTracker.addCheckpoint(
      task.id,
      "Delegated to Execution",
      delegator.id,
      executor.id,
    );

    return task;
  }

  executeTaskPipeline(
    tasks: Array<{
      title: string;
      description: string;
      priority: TaskPriority;
    }>,
    creatorId: string,
  ): Task[] {
    const createdTasks: Task[] = [];

    for (const taskConfig of tasks) {
      const task = this.createAndOrchestrateTask(
        taskConfig.title,
        taskConfig.description,
        taskConfig.priority,
        creatorId,
        "ground",
      );

      if (task) {
        createdTasks.push(task);
      }
    }

    return createdTasks;
  }

  getDashboard(): {
    teamStatus: ReturnType<typeof teamManager.getTeamStatus>;
    taskTrackers: ReturnType<typeof delegationTracker.getAllTrackers>;
    analytics: ReturnType<typeof delegationTracker.getAnalytics>;
    workload: ReturnType<typeof teamManager.getWorkloadDistribution>;
  } {
    return {
      teamStatus: teamManager.getTeamStatus(),
      taskTrackers: delegationTracker.getAllTrackers(),
      analytics: delegationTracker.getAnalytics(),
      workload: teamManager.getWorkloadDistribution(),
    };
  }
}

export const taskOrchestrator = new TaskOrchestrator();
