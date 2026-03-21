import {
  e2eOrchestrator,
  E2E_TEAM,
  E2EAgent,
  WorkItem,
} from "./e2e-qa-orchestrator";
import {
  engineeringOrchestrator,
  ENGINEERING_TEAM,
  Engineer,
  BugFixTask,
  PeerReview,
  CoordinationMessage as EngCoordMessage,
} from "./engineering-orchestrator";
import { CoordinationMessage as QACoordMessage } from "./e2e-qa-orchestrator";

export type CoordinationEvent =
  | "team-status"
  | "work-item-created"
  | "work-item-assigned"
  | "task-created"
  | "task-assigned"
  | "task-resolved"
  | "task-verified"
  | "review-requested"
  | "review-completed"
  | "coordination-message"
  | "report-generated";

export interface TeamStatus {
  timestamp: Date;
  qaTeam: {
    totalAgents: number;
    idleCount: number;
    runningCount: number;
    completedSuites: number;
    openWorkItems: number;
    totalBugsFound: number;
    agents: E2EAgent[];
  };
  engineeringTeam: {
    totalEngineers: number;
    idleCount: number;
    workingCount: number;
    blockedCount: number;
    pendingTasks: number;
    resolvedTasks: number;
    totalBugsFixed: number;
    avgFixTime: number;
    engineers: Engineer[];
  };
  pipeline: {
    openWorkItems: number;
    inProgressTasks: number;
    inReviewTasks: number;
    resolvedToday: number;
    verifiedToday: number;
  };
}

export interface UnifiedReport {
  generatedAt: Date;
  summary: {
    totalBugsFound: number;
    totalBugsFixed: number;
    criticalOpen: number;
    highOpen: number;
    passRate: number;
  };
  qaReport: string;
  engineeringReport: string;
  coordinationLog: CoordinationMessage[];
}

export interface CoordinationMessage {
  from: string;
  to: string;
  type:
    | "test-start"
    | "bug-found"
    | "work-item"
    | "task-assign"
    | "fix-complete"
    | "verify"
    | "merge"
    | "escalate";
  payload: Record<string, unknown>;
  timestamp: Date;
}

class CoordinationHub {
  private qaOrchestrator = e2eOrchestrator;
  private engOrchestrator = engineeringOrchestrator;
  private coordinationLog: CoordinationMessage[] = [];
  private eventListeners: Map<string, Array<(data: unknown) => void>> =
    new Map();

  constructor() {
    this.setupEventListeners();
  }

  on(event: CoordinationEvent, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: CoordinationEvent, callback: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    }
  }

  private emit(event: CoordinationEvent, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((cb) => cb(data));
    }
  }

  private log(message: Omit<CoordinationMessage, "timestamp">): void {
    const fullMessage: CoordinationMessage = {
      ...message,
      timestamp: new Date(),
    };
    this.coordinationLog.push(fullMessage);
    this.emit("coordination-message", fullMessage);
  }

  private setupEventListeners(): void {
    this.qaOrchestrator.on("work-item-created", (workItem) => {
      this.handleWorkItemCreated(workItem as WorkItem);
    });

    this.qaOrchestrator.on("work-item-assigned", (data: unknown) => {
      const { workItem, engineer } = data as {
        workItem: WorkItem;
        engineer: string;
      };
      this.log({
        from: "QA-HUB",
        to: engineer,
        type: "work-item",
        payload: { workItemId: workItem.id, action: "assigned" },
      });
    });

    this.engOrchestrator.on("task-resolved", (task) => {
      this.handleTaskResolved(task as BugFixTask);
    });

    this.engOrchestrator.on("task-verified", (task) => {
      this.log({
        from: "ENG-HUB",
        to: "QA-HUB",
        type: "verify",
        payload: { taskId: (task as BugFixTask).id, status: "verified" },
      });
    });

    this.engOrchestrator.on("review-requested", (data: unknown) => {
      const { task, review } = data as { task: BugFixTask; review: PeerReview };
      this.log({
        from: task.assignedEngineer || "unknown",
        to: review.reviewer,
        type: "task-assign",
        payload: { taskId: task.id, reviewId: review.id },
      });
    });
  }

  private async handleWorkItemCreated(workItem: WorkItem): Promise<void> {
    this.log({
      from: workItem.source,
      to: "HUB",
      type: "bug-found",
      payload: {
        workItemId: workItem.id,
        title: workItem.title,
        severity: workItem.severity,
        priority: workItem.priority,
      },
    });

    const task = await this.engOrchestrator.createTaskFromWorkItem(workItem);
    this.emit("work-item-created", { workItem, task });

    if (workItem.severity === "critical") {
      await this.escalateCritical(workItem, task);
    }
  }

  private async handleTaskResolved(task: BugFixTask): Promise<void> {
    this.log({
      from: task.assignedEngineer || "unknown",
      to: "HUB",
      type: "fix-complete",
      payload: { taskId: task.id, workItemId: task.workItemId },
    });

    this.emit("task-resolved", task);
  }

  private async escalateCritical(
    workItem: WorkItem,
    task: BugFixTask,
  ): Promise<void> {
    this.log({
      from: "HUB",
      to: "all",
      type: "escalate",
      payload: {
        type: "CRITICAL",
        workItemId: workItem.id,
        taskId: task.id,
        message: "Critical bug requires immediate attention",
      },
    });

    this.emit("team-status", await this.getStatus());
  }

  async startE2ETesting(): Promise<void> {
    this.log({
      from: "HUB",
      to: "E2E-001",
      type: "test-start",
      payload: { action: "start-all-suites" },
    });

    const plan = await this.qaOrchestrator.createTestPlan(
      "Full E2E Test Suite",
      "Complete coverage test of all DevPrep features",
    );

    await this.qaOrchestrator.runTestPlan(plan.id);
  }

  async runSpecificSuite(suiteId: string): Promise<void> {
    this.log({
      from: "HUB",
      to: "E2E-ORCHESTRATOR",
      type: "test-start",
      payload: { suiteId },
    });

    await this.qaOrchestrator.runTestSuite(suiteId);
  }

  async processWorkItems(): Promise<void> {
    const openWorkItems = await this.qaOrchestrator.getOpenWorkItems();
    const pendingTasks = await this.engOrchestrator.getPendingTasks();

    if (openWorkItems.length === 0) {
      return;
    }

    for (const workItem of openWorkItems) {
      const task = pendingTasks.find((t) => t.workItemId === workItem.id);
      if (task) {
        await this.engOrchestrator.assignTask(task.id);
        this.log({
          from: "HUB",
          to: task.assignedEngineer || "unknown",
          type: "task-assign",
          payload: { taskId: task.id, workItemId: workItem.id },
        });
      }
    }
  }

  async autoAssignWorkItems(): Promise<void> {
    const openWorkItems = await this.qaOrchestrator.getOpenWorkItems();

    for (const workItem of openWorkItems) {
      const task = await this.engOrchestrator.createTaskFromWorkItem(workItem);
      await this.engOrchestrator.assignTask(task.id);
    }
  }

  async runVerificationCycle(): Promise<void> {
    const resolvedTasks = await this.engOrchestrator.getAllTasks("resolved");

    for (const task of resolvedTasks) {
      await this.engOrchestrator.verifyTask(task.id);
    }

    this.log({
      from: "HUB",
      to: "all",
      type: "verify",
      payload: { action: "batch-verify", count: resolvedTasks.length },
    });
  }

  async mergeParallelFixes(taskIds: string[]): Promise<void> {
    await this.engOrchestrator.mergeFixes(taskIds, "auto-merged-by-hub");

    this.log({
      from: "HUB",
      to: "all",
      type: "merge",
      payload: { taskIds },
    });
  }

  async getStatus(): Promise<TeamStatus> {
    const qaStats = await this.qaOrchestrator.getTeamStats();
    const engStats = await this.engOrchestrator.getTeamStats();
    const allWorkItems = await this.qaOrchestrator.getWorkItems();
    const allTasks = await this.engOrchestrator.getAllTasks();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      timestamp: new Date(),
      qaTeam: {
        ...qaStats,
        agents: await this.qaOrchestrator.getAllAgents(),
      },
      engineeringTeam: {
        ...engStats,
        engineers: await this.engOrchestrator.getAllEngineers(),
      },
      pipeline: {
        openWorkItems: allWorkItems.filter((w) => w.status === "open").length,
        inProgressTasks: allTasks.filter((t) => t.status === "in-progress")
          .length,
        inReviewTasks: allTasks.filter((t) => t.status === "in-review").length,
        resolvedToday: allTasks.filter(
          (t) => t.resolvedAt && t.resolvedAt >= today,
        ).length,
        verifiedToday: allTasks.filter(
          (t) => t.verifiedAt && t.verifiedAt >= today,
        ).length,
      },
    };
  }

  async getCoordinationLog(): Promise<CoordinationMessage[]> {
    const qaLog = await this.qaOrchestrator.getCoordinationLog();
    const engLog = await this.engOrchestrator.getCoordinationLog();

    const unifiedLog: CoordinationMessage[] = [
      ...this.coordinationLog,
      ...qaLog.map((msg) => ({
        from: msg.from,
        to: msg.to,
        type: msg.type as CoordinationMessage["type"],
        payload: msg.payload,
        timestamp: msg.timestamp,
      })),
      ...engLog.map((msg) => ({
        from: msg.from,
        to: msg.to,
        type: msg.type as CoordinationMessage["type"],
        payload: msg.payload,
        timestamp: msg.timestamp,
      })),
    ];

    return unifiedLog.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
  }

  async generateUnifiedReport(): Promise<UnifiedReport> {
    const status = await this.getStatus();
    const qaReport = await this.qaOrchestrator.generateReport();
    const engReport = await this.engOrchestrator.generateReport();
    const log = await this.getCoordinationLog();

    const allWorkItems = await this.qaOrchestrator.getWorkItems();
    const allTasks = await this.engOrchestrator.getAllTasks();

    return {
      generatedAt: new Date(),
      summary: {
        totalBugsFound: status.qaTeam.totalBugsFound,
        totalBugsFixed: status.engineeringTeam.totalBugsFixed,
        criticalOpen: allWorkItems.filter(
          (w) => w.severity === "critical" && w.status === "open",
        ).length,
        highOpen: allWorkItems.filter(
          (w) => w.severity === "high" && w.status === "open",
        ).length,
        passRate:
          status.qaTeam.totalBugsFound > 0
            ? ((status.qaTeam.totalBugsFound -
                allWorkItems.filter((w) => w.status === "open").length) /
                status.qaTeam.totalBugsFound) *
              100
            : 100,
      },
      qaReport,
      engineeringReport: engReport,
      coordinationLog: log,
    };
  }

  async getQAReports(): Promise<{
    team: typeof E2E_TEAM;
    stats: Awaited<ReturnType<typeof this.qaOrchestrator.getTeamStats>>;
  }> {
    return {
      team: E2E_TEAM,
      stats: await this.qaOrchestrator.getTeamStats(),
    };
  }

  async getEngineeringReport(): Promise<{
    team: typeof ENGINEERING_TEAM;
    stats: Awaited<ReturnType<typeof this.engOrchestrator.getTeamStats>>;
  }> {
    return {
      team: ENGINEERING_TEAM,
      stats: await this.engOrchestrator.getTeamStats(),
    };
  }
}

export const coordinationHub = new CoordinationHub();
