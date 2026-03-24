import { agentRegistry } from "../core/registry";
import { Task, TaskStatus, TaskPriority, Agent } from "../types";

export interface TaskTracker {
  task: Task;
  assignedAgent: Agent | null;
  startTime: Date;
  endTime?: Date;
  checkpoints: TaskCheckpoint[];
  progress: number;
}

export interface TaskCheckpoint {
  id: string;
  name: string;
  completed: boolean;
  completedAt?: Date;
  delegatorId: string;
  delegateeId: string;
}

export class DelegationTracker {
  private trackers: Map<string, TaskTracker> = new Map();
  private activeTasks: Map<string, string[]> = new Map();

  trackTask(taskId: string): void {
    const task = agentRegistry.getTask(taskId);
    if (!task) return;

    const assignedAgent = task.assignedTo
      ? agentRegistry.getAgent(task.assignedTo) || null
      : null;

    this.trackers.set(taskId, {
      task,
      assignedAgent,
      startTime: new Date(),
      checkpoints: [],
      progress: 0,
    });

    const agentId = task.assignedTo || task.createdBy;
    const existing = this.activeTasks.get(agentId) || [];
    this.activeTasks.set(agentId, [...existing, taskId]);
  }

  getTracker(taskId: string): TaskTracker | undefined {
    return this.trackers.get(taskId);
  }

  addCheckpoint(
    taskId: string,
    name: string,
    delegatorId: string,
    delegateeId: string,
  ): void {
    const tracker = this.trackers.get(taskId);
    if (!tracker) return;

    tracker.checkpoints.push({
      id: `cp-${Date.now()}`,
      name,
      completed: false,
      delegatorId,
      delegateeId,
    });
  }

  completeCheckpoint(taskId: string, checkpointId: string): void {
    const tracker = this.trackers.get(taskId);
    if (!tracker) return;

    const checkpoint = tracker.checkpoints.find((cp) => cp.id === checkpointId);
    if (checkpoint) {
      checkpoint.completed = true;
      checkpoint.completedAt = new Date();
      this.updateProgress(taskId);
    }
  }

  private updateProgress(taskId: string): void {
    const tracker = this.trackers.get(taskId);
    if (!tracker || tracker.checkpoints.length === 0) return;

    const completed = tracker.checkpoints.filter((cp) => cp.completed).length;
    tracker.progress = Math.round(
      (completed / tracker.checkpoints.length) * 100,
    );
  }

  completeTask(taskId: string): void {
    const tracker = this.trackers.get(taskId);
    if (!tracker) return;

    tracker.endTime = new Date();
    tracker.progress = 100;

    if (tracker.assignedAgent) {
      const activeTasks = this.activeTasks.get(tracker.assignedAgent.id) || [];
      this.activeTasks.set(
        tracker.assignedAgent.id,
        activeTasks.filter((id) => id !== taskId),
      );
    }
  }

  getActiveTasks(agentId?: string): TaskTracker[] {
    if (agentId) {
      const agent = agentRegistry.getAgent(agentId);
      if (!agent) return [];

      return agent.activeTasks
        .map((taskId) => this.trackers.get(taskId))
        .filter((t): t is TaskTracker => t !== undefined);
    }

    return Array.from(this.trackers.values()).filter((t) => !t.endTime);
  }

  getTasksByStatus(status: TaskStatus): TaskTracker[] {
    return Array.from(this.trackers.values()).filter(
      (t) => t.task.status === status,
    );
  }

  getAllTrackers(): TaskTracker[] {
    return Array.from(this.trackers.values());
  }

  getAnalytics(): {
    totalTracked: number;
    completed: number;
    inProgress: number;
    averageCompletionTime: number;
    checkpointsCompleted: number;
    checkpointsTotal: number;
  } {
    const trackers = this.getAllTrackers();
    const completed = trackers.filter((t) => t.endTime);
    const inProgress = trackers.filter((t) => !t.endTime);

    let totalCheckpointTime = 0;
    let checkpointsCompleted = 0;
    let checkpointsTotal = 0;

    for (const tracker of trackers) {
      checkpointsTotal += tracker.checkpoints.length;
      checkpointsCompleted += tracker.checkpoints.filter(
        (c) => c.completed,
      ).length;

      if (tracker.endTime && tracker.startTime) {
        totalCheckpointTime +=
          tracker.endTime.getTime() - tracker.startTime.getTime();
      }
    }

    return {
      totalTracked: trackers.length,
      completed: completed.length,
      inProgress: inProgress.length,
      averageCompletionTime:
        completed.length > 0 ? totalCheckpointTime / completed.length : 0,
      checkpointsCompleted,
      checkpointsTotal,
    };
  }

  generateReport(taskId: string): string | null {
    const tracker = this.trackers.get(taskId);
    if (!tracker) return null;

    const history = agentRegistry.getTaskHistory(taskId);
    const delegations = agentRegistry.getDelegationHistory(taskId);

    let report = `Task Report: ${tracker.task.title}\n`;
    report += "=".repeat(50) + "\n";
    report += `Status: ${tracker.task.status}\n`;
    report += `Progress: ${tracker.progress}%\n`;
    report += `Started: ${tracker.startTime.toISOString()}\n`;
    if (tracker.endTime) {
      report += `Completed: ${tracker.endTime.toISOString()}\n`;
    }
    report += `Assigned To: ${tracker.assignedAgent?.name || "Unassigned"}\n\n`;
    report += `Delegation Chain: ${tracker.task.delegationChain.join(" -> ")}\n\n`;
    report += `Checkpoints:\n`;
    for (const cp of tracker.checkpoints) {
      report += `  [${cp.completed ? "x" : " "}] ${cp.name}\n`;
    }
    report += `\nDelegation History:\n`;
    for (const d of delegations) {
      const from = agentRegistry.getAgent(d.fromAgentId)?.name || "Unknown";
      const to = agentRegistry.getAgent(d.toAgentId)?.name || "Unknown";
      report += `  ${from} -> ${to} (${d.timestamp.toISOString()})\n`;
      if (d.reason) report += `    Reason: ${d.reason}\n`;
    }

    return report;
  }
}

export const delegationTracker = new DelegationTracker();
