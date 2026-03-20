import { AgentOrchestrator, Task } from "./orchestrator";
import { AgentWorker, GenerationRequest } from "./worker";
import { streamingDB } from "./streaming-db";
import { ELITE_AGENTS } from "./agents";
import {
  AgentCapability,
  GeneratedContent,
  StreamingUpdate,
  ValidationResult,
} from "./types";

export interface ExecutionResult {
  taskId: string;
  success: boolean;
  content?: GeneratedContent;
  validation?: ValidationResult;
  error?: string;
}

export class AgentExecutionEngine {
  private orchestrator: AgentOrchestrator;
  private workers: Map<string, AgentWorker> = new Map();
  private progressCallbacks: Set<(update: StreamingUpdate) => void> = new Set();

  constructor() {
    this.orchestrator = new AgentOrchestrator();
    ELITE_AGENTS.forEach((agent) => {
      this.workers.set(agent.id, new AgentWorker(agent));
    });
    this.setupStreamSubscription();
  }

  private setupStreamSubscription(): void {
    streamingDB.subscribe((update) => {
      this.progressCallbacks.forEach((cb) => cb(update));
    });
  }

  async executeTask(task: Task): Promise<ExecutionResult> {
    const assignment = await this.orchestrator.assignTask(task);

    if (!assignment) {
      return {
        taskId: task.id,
        success: false,
        error: "No available agent found for this task",
      };
    }

    const worker = this.workers.get(assignment.assignedAgent);
    if (!worker) {
      return {
        taskId: task.id,
        success: false,
        error: "Worker not found",
      };
    }

    const request: GenerationRequest = {
      contentId: `${task.id}-content`,
      type: this.capabilitiesToType(task.requiredCapabilities),
      filePath: this.capabilitiesToPath(task.requiredCapabilities),
      prompt: task.description,
      capabilities: task.requiredCapabilities,
    };

    try {
      await worker.generateContent(request);
      const content = await streamingDB.getContent(request.contentId);

      if (!content) {
        return {
          taskId: task.id,
          success: false,
          error: "Content generation failed",
        };
      }

      const validation = await this.orchestrator.validateContent(
        request.contentId,
        content.content,
      );

      await this.orchestrator.completeTask(task.id, validation);

      return {
        taskId: task.id,
        success: true,
        content,
        validation,
      };
    } catch (error) {
      return {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private capabilitiesToType(
    capabilities: AgentCapability[],
  ): GeneratedContent["type"] {
    if (
      capabilities.includes("unit-testing") ||
      capabilities.includes("integration-testing")
    ) {
      return "test";
    }
    if (
      capabilities.includes("ui-development") ||
      capabilities.includes("component-design")
    ) {
      return "component";
    }
    if (
      capabilities.includes("api-development") ||
      capabilities.includes("api-design")
    ) {
      return "api";
    }
    if (
      capabilities.includes("ci-cd") ||
      capabilities.includes("infrastructure")
    ) {
      return "config";
    }
    return "component";
  }

  private capabilitiesToPath(capabilities: AgentCapability[]): string {
    if (capabilities.includes("unit-testing")) return "src/tests/";
    if (capabilities.includes("component-design")) return "src/components/";
    if (capabilities.includes("api-design")) return "src/api/";
    if (capabilities.includes("ui-development")) return "src/ui/";
    return "src/generated/";
  }

  onProgress(callback: (update: StreamingUpdate) => void): () => void {
    this.progressCallbacks.add(callback);
    return () => {
      this.progressCallbacks.delete(callback);
    };
  }

  async getTaskStatus(taskId: string) {
    return this.orchestrator.getTaskStatus(taskId);
  }

  async getAgentStatus(agentId: string) {
    return this.orchestrator.getAgentStatus(agentId);
  }

  async getAllAgents() {
    return this.orchestrator.getAllAgents();
  }

  async getActiveTasks() {
    return this.orchestrator.getActiveTasks();
  }

  async getGeneratedContent(contentId: string) {
    return streamingDB.getContent(contentId);
  }

  async getAllGeneratedContent() {
    return streamingDB.getAllContent();
  }
}

export const executionEngine = new AgentExecutionEngine();
