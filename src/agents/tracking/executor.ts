import { agentRegistry } from "../core/registry";
import { delegationTracker } from "./delegation";
import type { Task, Agent } from "../types";

export interface ExecutorResult {
  success: boolean;
  output: string;
  error?: string;
}

export class TaskExecutor {
  private runningTasks: Map<string, Promise<ExecutorResult>> = new Map();

  async executeTask(taskId: string): Promise<ExecutorResult> {
    const task = agentRegistry.getTask(taskId);
    if (!task) {
      return { success: false, output: "", error: "Task not found" };
    }

    if (this.runningTasks.has(taskId)) {
      return { success: false, output: "", error: "Task already running" };
    }

    const executor = task.assignedTo
      ? agentRegistry.getAgent(task.assignedTo)
      : null;
    if (!executor) {
      return { success: false, output: "", error: "No agent assigned" };
    }

    const promise = this.runTask(task, executor);
    this.runningTasks.set(taskId, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.runningTasks.delete(taskId);
    }
  }

  private async runTask(task: Task, executor: Agent): Promise<ExecutorResult> {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`EXECUTING TASK: ${task.title}`);
    console.log(`Agent: ${executor.name} (${executor.role})`);
    console.log(`${"=".repeat(60)}`);

    agentRegistry.updateTaskStatus(task.id, executor.id, "in_progress");
    delegationTracker.addCheckpoint(
      task.id,
      "Execution Started",
      executor.id,
      executor.id,
    );

    try {
      const result = await this.performWork(task, executor);

      if (result.success) {
        agentRegistry.updateTaskStatus(task.id, executor.id, "completed");
        delegationTracker.addCheckpoint(
          task.id,
          "Execution Completed",
          executor.id,
          executor.id,
        );
        delegationTracker.completeTask(task.id);
      } else {
        agentRegistry.updateTaskStatus(task.id, executor.id, "failed");
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      agentRegistry.updateTaskStatus(task.id, executor.id, "failed");
      return { success: false, output: "", error: errorMsg };
    }
  }

  private async performWork(
    task: Task,
    executor: Agent,
  ): Promise<ExecutorResult> {
    const steps = [
      { name: "Analyzing requirements", delay: 500 },
      { name: "Planning implementation", delay: 400 },
      { name: "Executing work", delay: 600 },
      { name: "Testing results", delay: 300 },
      { name: "Finalizing", delay: 200 },
    ];

    for (const step of steps) {
      console.log(`  [${executor.name}] ${step.name}...`);
      await new Promise((resolve) => setTimeout(resolve, step.delay));
      delegationTracker.addCheckpoint(
        task.id,
        step.name,
        executor.id,
        executor.id,
      );
    }

    const output = this.generateOutput(task, executor);
    console.log(`\n${"=".repeat(60)}`);
    console.log(`TASK COMPLETED: ${task.title}`);
    console.log(`Output: ${output}`);
    console.log(`${"=".repeat(60)}\n`);

    return { success: true, output };
  }

  private generateOutput(task: Task, executor: Agent): string {
    return (
      `Task "${task.title}" completed by ${executor.name}. ` +
      `Priority: ${task.priority}. ` +
      `Delegation chain: ${task.delegationChain.length} levels.`
    );
  }

  isRunning(taskId: string): boolean {
    return this.runningTasks.has(taskId);
  }

  async executeAllPending(): Promise<ExecutorResult[]> {
    const pendingTasks = agentRegistry.getTeamMetrics();
    console.log(
      `\nExecuting ${pendingTasks.inProgressTasks} pending tasks...\n`,
    );

    const results: ExecutorResult[] = [];

    for (let i = 0; i < pendingTasks.inProgressTasks; i++) {
      const task = agentRegistry.getTask(
        Array.from({ length: 1000 }, (_, k) => `task-${k}`)[i],
      );
    }

    return results;
  }
}

export const taskExecutor = new TaskExecutor();
