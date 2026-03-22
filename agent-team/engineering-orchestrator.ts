export type EngineerRole =
  | "ui-ux-lead"
  | "ui-ux-expert"
  | "frontend-dev-1"
  | "frontend-dev-2"
  | "backend-lead"
  | "backend-dev"
  | "devops-lead"
  | "security-eng"
  | "testing-lead"
  | "api-expert";

export type EngineerStatus =
  | "idle"
  | "working"
  | "reviewing"
  | "blocked"
  | "completed";

export interface Engineer {
  id: string;
  name: string;
  role: EngineerRole;
  specialization: string;
  yearsOfExperience: number;
  skills: string[];
  currentTask?: string;
  status: EngineerStatus;
  completedTasks: string[];
  peerReviews: string[];
  performance: {
    bugsFixed: number;
    avgFixTime: number;
    codeReviewsGiven: number;
    codeReviewsReceived: number;
  };
}

export interface BugFixTask {
  id: string;
  workItemId: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  type:
    | "ui"
    | "api"
    | "backend"
    | "frontend"
    | "security"
    | "performance"
    | "ux";
  assignedEngineer?: string;
  status: "pending" | "in-progress" | "in-review" | "resolved" | "verified";
  priority: number;
  dependencies: string[];
  createdAt: Date;
  startedAt?: Date;
  resolvedAt?: Date;
  verifiedAt?: Date;
  estimatedHours: number;
  actualHours?: number;
  filesChanged: string[];
  testAdded: boolean;
  reviewer?: string;
  reviewNotes?: string;
}

export interface PeerReview {
  id: string;
  taskId: string;
  author: string;
  reviewer: string;
  status: "pending" | "approved" | "changes-requested";
  comments: ReviewComment[];
  createdAt: Date;
  completedAt?: Date;
  reviewNotes?: string;
}

export interface ReviewComment {
  id: string;
  file: string;
  line?: number;
  type: "suggestion" | "issue" | "praise";
  severity: "minor" | "major" | "critical";
  comment: string;
  resolved: boolean;
}

export interface CoordinationMessage {
  from: string;
  to: string | "all";
  type:
    | "assignment"
    | "status"
    | "help"
    | "review-request"
    | "review-complete"
    | "block"
    | "unblock"
    | "merge";
  payload: Record<string, unknown>;
  timestamp: Date;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export const ENGINEERING_TEAM: Engineer[] = [
  {
    id: "ENG-001",
    name: "Alex Thompson",
    role: "ui-ux-lead",
    specialization: "Design Systems, Accessibility, UX Strategy",
    yearsOfExperience: 15,
    skills: [
      "Figma",
      "Design Systems",
      "WCAG",
      "React",
      "CSS",
      "Framer Motion",
      "Accessibility",
    ],
    status: "idle",
    completedTasks: [],
    peerReviews: [],
    performance: {
      bugsFixed: 0,
      avgFixTime: 0,
      codeReviewsGiven: 0,
      codeReviewsReceived: 0,
    },
  },
  {
    id: "ENG-002",
    name: "Maria Garcia",
    role: "ui-ux-expert",
    specialization: "Animation, Micro-interactions, Visual Polish",
    yearsOfExperience: 12,
    skills: [
      "Framer Motion",
      "GSAP",
      "CSS Animations",
      "React",
      "SVG",
      "Design",
    ],
    status: "idle",
    completedTasks: [],
    peerReviews: [],
    performance: {
      bugsFixed: 0,
      avgFixTime: 0,
      codeReviewsGiven: 0,
      codeReviewsReceived: 0,
    },
  },
  {
    id: "ENG-003",
    name: "James Wilson",
    role: "frontend-dev-1",
    specialization: "React, TypeScript, Performance Optimization",
    yearsOfExperience: 10,
    skills: [
      "React",
      "TypeScript",
      "Performance",
      "Testing",
      "Redux",
      "Zustand",
    ],
    status: "idle",
    completedTasks: [],
    peerReviews: [],
    performance: {
      bugsFixed: 0,
      avgFixTime: 0,
      codeReviewsGiven: 0,
      codeReviewsReceived: 0,
    },
  },
  {
    id: "ENG-004",
    name: "Lisa Chen",
    role: "frontend-dev-2",
    specialization: "State Management, Component Architecture",
    yearsOfExperience: 9,
    skills: [
      "React",
      "State Management",
      "Context API",
      "Testing",
      "Component Design",
    ],
    status: "idle",
    completedTasks: [],
    peerReviews: [],
    performance: {
      bugsFixed: 0,
      avgFixTime: 0,
      codeReviewsGiven: 0,
      codeReviewsReceived: 0,
    },
  },
  {
    id: "ENG-005",
    name: "Robert Martinez",
    role: "backend-lead",
    specialization: "API Design, Database Architecture, Caching",
    yearsOfExperience: 14,
    skills: [
      "Node.js",
      "PostgreSQL",
      "Redis",
      "API Design",
      "Caching",
      "Performance",
    ],
    status: "idle",
    completedTasks: [],
    peerReviews: [],
    performance: {
      bugsFixed: 0,
      avgFixTime: 0,
      codeReviewsGiven: 0,
      codeReviewsReceived: 0,
    },
  },
  {
    id: "ENG-006",
    name: "Jennifer Lee",
    role: "backend-dev",
    specialization: "Express, REST APIs, ORM",
    yearsOfExperience: 8,
    skills: ["Express", "REST", "Prisma", "TypeScript", "Validation"],
    status: "idle",
    completedTasks: [],
    peerReviews: [],
    performance: {
      bugsFixed: 0,
      avgFixTime: 0,
      codeReviewsGiven: 0,
      codeReviewsReceived: 0,
    },
  },
  {
    id: "ENG-007",
    name: "Emma Brown",
    role: "devops-lead",
    specialization: "CI/CD, Docker, Kubernetes, Infrastructure",
    yearsOfExperience: 12,
    skills: [
      "Docker",
      "Kubernetes",
      "GitHub Actions",
      "AWS",
      "Terraform",
      "Monitoring",
    ],
    status: "idle",
    completedTasks: [],
    peerReviews: [],
    performance: {
      bugsFixed: 0,
      avgFixTime: 0,
      codeReviewsGiven: 0,
      codeReviewsReceived: 0,
    },
  },
  {
    id: "ENG-008",
    name: "Michael Park",
    role: "security-eng",
    specialization: "Auth, OWASP, Security Auditing",
    yearsOfExperience: 11,
    skills: [
      "Auth",
      "JWT",
      "OAuth",
      "Security",
      "OWASP",
      "Penetration Testing",
    ],
    status: "idle",
    completedTasks: [],
    peerReviews: [],
    performance: {
      bugsFixed: 0,
      avgFixTime: 0,
      codeReviewsGiven: 0,
      codeReviewsReceived: 0,
    },
  },
  {
    id: "ENG-009",
    name: "Sarah Taylor",
    role: "testing-lead",
    specialization: "Test Automation, Quality Assurance",
    yearsOfExperience: 10,
    skills: ["Playwright", "Jest", "Testing", "Quality", "Automation", "TDD"],
    status: "idle",
    completedTasks: [],
    peerReviews: [],
    performance: {
      bugsFixed: 0,
      avgFixTime: 0,
      codeReviewsGiven: 0,
      codeReviewsReceived: 0,
    },
  },
  {
    id: "ENG-010",
    name: "Chris Anderson",
    role: "api-expert",
    specialization: "GraphQL, Webhooks, Third-party Integrations",
    yearsOfExperience: 9,
    skills: ["GraphQL", "REST", "Webhooks", "Integrations", "API Design"],
    status: "idle",
    completedTasks: [],
    peerReviews: [],
    performance: {
      bugsFixed: 0,
      avgFixTime: 0,
      codeReviewsGiven: 0,
      codeReviewsReceived: 0,
    },
  },
];

const SPECIALIZATION_MAP: Record<string, EngineerRole[]> = {
  ui: ["ui-ux-lead", "ui-ux-expert"],
  ux: ["ui-ux-lead", "ui-ux-expert"],
  frontend: ["frontend-dev-1", "frontend-dev-2", "ui-ux-lead"],
  api: ["api-expert", "backend-lead", "backend-dev"],
  backend: ["backend-lead", "backend-dev"],
  security: ["security-eng", "backend-lead"],
  performance: ["frontend-dev-1", "backend-lead", "devops-lead"],
  devops: ["devops-lead"],
  testing: ["testing-lead"],
};

const COLLABORATION_MAP: Record<EngineerRole, EngineerRole[]> = {
  "ui-ux-lead": ["ui-ux-expert", "frontend-dev-1", "frontend-dev-2"],
  "ui-ux-expert": ["ui-ux-lead", "frontend-dev-1"],
  "frontend-dev-1": ["frontend-dev-2", "ui-ux-lead", "testing-lead"],
  "frontend-dev-2": ["frontend-dev-1", "ui-ux-lead", "backend-dev"],
  "backend-lead": ["backend-dev", "api-expert", "security-eng"],
  "backend-dev": ["backend-lead", "api-expert"],
  "devops-lead": ["backend-lead", "frontend-dev-1"],
  "security-eng": ["backend-lead", "api-expert"],
  "testing-lead": ["frontend-dev-1", "frontend-dev-2", "backend-dev"],
  "api-expert": ["backend-lead", "backend-dev"],
};

export class EngineeringOrchestrator {
  private engineers: Map<string, Engineer> = new Map();
  private tasks: Map<string, BugFixTask> = new Map();
  private reviews: Map<string, PeerReview> = new Map();
  private coordinationLog: CoordinationMessage[] = [];
  private eventListeners: Map<string, Array<(data: unknown) => void>> =
    new Map();

  constructor() {
    ENGINEERING_TEAM.forEach((eng) => this.engineers.set(eng.id, { ...eng }));
  }

  on(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    }
  }

  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((cb) => cb(data));
    }
  }

  private logCoordination(message: CoordinationMessage): void {
    this.coordinationLog.push(message);
    this.emit("coordination", message);
  }

  async createTaskFromWorkItem(workItem: {
    id: string;
    title: string;
    description: string;
    severity: string;
    type: string;
    priority: number;
  }): Promise<BugFixTask> {
    const task: BugFixTask = {
      id: `TASK-${generateId().slice(0, 8)}`,
      workItemId: workItem.id,
      title: workItem.title,
      description: workItem.description,
      severity: workItem.severity as BugFixTask["severity"],
      type: workItem.type as BugFixTask["type"],
      status: "pending",
      priority: workItem.priority,
      dependencies: [],
      createdAt: new Date(),
      estimatedHours: this.estimateHours(
        workItem.severity as BugFixTask["severity"],
      ),
      filesChanged: [],
      testAdded: false,
    };

    this.tasks.set(task.id, task);
    this.emit("task-created", task);

    return task;
  }

  private estimateHours(severity: BugFixTask["severity"]): number {
    const estimates: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return estimates[severity] || 2;
  }

  async assignTask(taskId: string): Promise<BugFixTask | null> {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    const bestEngineer = this.findBestEngineer(task.type);
    if (!bestEngineer) return null;

    task.assignedEngineer = bestEngineer.id;
    task.status = "in-progress";
    task.startedAt = new Date();

    bestEngineer.currentTask = taskId;
    bestEngineer.status = "working";

    this.logCoordination({
      from: "ENG-ORCHESTRATOR",
      to: bestEngineer.id,
      type: "assignment",
      payload: { taskId, title: task.title, severity: task.severity },
      timestamp: new Date(),
    });

    this.emit("task-assigned", { task, engineer: bestEngineer });

    return task;
  }

  private findBestEngineer(taskType: BugFixTask["type"]): Engineer | null {
    const preferredRoles = SPECIALIZATION_MAP[taskType] || ["frontend-dev-1"];

    for (const role of preferredRoles) {
      const engineer = Array.from(this.engineers.values()).find(
        (eng) => eng.role === role && eng.status === "idle",
      );
      if (engineer) return engineer;
    }

    return (
      Array.from(this.engineers.values()).find(
        (eng) => eng.status === "idle",
      ) || null
    );
  }

  async startWork(taskId: string, filesChanged: string[]): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.filesChanged = filesChanged;

    this.logCoordination({
      from: task.assignedEngineer || "unknown",
      to: "all",
      type: "status",
      payload: { taskId, status: "working", files: filesChanged },
      timestamp: new Date(),
    });

    this.emit("work-started", task);
  }

  async requestReview(taskId: string): Promise<PeerReview | null> {
    const task = this.tasks.get(taskId);
    if (!task || !task.assignedEngineer) return null;

    const reviewer = this.suggestReviewer(task);
    if (!reviewer) return null;

    const review: PeerReview = {
      id: `REV-${generateId().slice(0, 8)}`,
      taskId,
      author: task.assignedEngineer,
      reviewer: reviewer.id,
      status: "pending",
      comments: [],
      createdAt: new Date(),
    };

    this.reviews.set(review.id, review);
    task.reviewer = reviewer.id;

    const author = this.engineers.get(task.assignedEngineer);
    if (author) {
      author.status = "reviewing";
    }

    this.logCoordination({
      from: task.assignedEngineer,
      to: reviewer.id,
      type: "review-request",
      payload: { taskId, reviewId: review.id, title: task.title },
      timestamp: new Date(),
    });

    this.emit("review-requested", { task, review });

    return review;
  }

  private suggestReviewer(task: BugFixTask): Engineer | null {
    const collaborators =
      COLLABORATION_MAP[task.assignedEngineer as EngineerRole] || [];

    for (const collabRole of collaborators) {
      const reviewer = Array.from(this.engineers.values()).find(
        (eng) => eng.role === collabRole && eng.id !== task.assignedEngineer,
      );
      if (reviewer) return reviewer;
    }

    return (
      Array.from(this.engineers.values()).find(
        (eng) => eng.id !== task.assignedEngineer && eng.status !== "working",
      ) || null
    );
  }

  async addReviewComment(
    reviewId: string,
    comment: Omit<ReviewComment, "id" | "resolved">,
  ): Promise<void> {
    const review = this.reviews.get(reviewId);
    if (!review) throw new Error(`Review ${reviewId} not found`);

    review.comments.push({
      ...comment,
      id: `CMT-${generateId().slice(0, 8)}`,
      resolved: false,
    });

    this.emit("comment-added", { review, comment });
  }

  async completeReview(
    reviewId: string,
    status: "approved" | "changes-requested",
    notes?: string,
  ): Promise<void> {
    const review = this.reviews.get(reviewId);
    if (!review) throw new Error(`Review ${reviewId} not found`);

    review.status = status;
    review.completedAt = new Date();
    if (notes) review.reviewNotes = notes;

    const task = this.tasks.get(review.taskId);
    const author = this.engineers.get(review.author);
    const reviewer = this.engineers.get(review.reviewer);

    if (reviewer) {
      reviewer.performance.codeReviewsGiven++;
      reviewer.peerReviews.push(review.taskId);
    }

    if (author) {
      author.performance.codeReviewsReceived++;
      if (status === "approved") {
        author.status = "idle";
        author.currentTask = undefined;
      }
    }

    if (status === "approved" && task) {
      task.status = "resolved";
      task.resolvedAt = new Date();
    }

    this.logCoordination({
      from: review.reviewer,
      to: review.author,
      type: "review-complete",
      payload: { reviewId, taskId: review.taskId, status },
      timestamp: new Date(),
    });

    this.emit("review-completed", { review, task });
  }

  async resolveTask(
    taskId: string,
    testAdded: boolean,
    actualHours?: number,
  ): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.testAdded = testAdded;
    task.actualHours = actualHours;
    task.status = "resolved";
    task.resolvedAt = new Date();

    if (task.assignedEngineer) {
      const engineer = this.engineers.get(task.assignedEngineer);
      if (engineer) {
        engineer.completedTasks.push(taskId);
        engineer.performance.bugsFixed++;
        engineer.status = "idle";
        engineer.currentTask = undefined;

        if (actualHours) {
          const prev = engineer.performance.bugsFixed - 1;
          const prevAvg = engineer.performance.avgFixTime;
          engineer.performance.avgFixTime =
            prev === 0
              ? actualHours
              : (prevAvg * prev + actualHours) / engineer.performance.bugsFixed;
        }
      }
    }

    this.logCoordination({
      from: task.assignedEngineer || "unknown",
      to: "all",
      type: "status",
      payload: { taskId, status: "resolved" },
      timestamp: new Date(),
    });

    this.emit("task-resolved", task);
  }

  async verifyTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.status = "verified";
    task.verifiedAt = new Date();

    this.emit("task-verified", task);
  }

  async requestHelp(taskId: string, message: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    const collaborators = task.assignedEngineer
      ? COLLABORATION_MAP[task.assignedEngineer as EngineerRole] || []
      : [];

    for (const collabRole of collaborators) {
      const collaborator = Array.from(this.engineers.values()).find(
        (eng) => eng.role === collabRole && eng.id !== task.assignedEngineer,
      );
      if (collaborator) {
        this.logCoordination({
          from: task.assignedEngineer || "unknown",
          to: collaborator.id,
          type: "help",
          payload: { taskId, message },
          timestamp: new Date(),
        });
      }
    }

    this.emit("help-requested", { task, message });
  }

  async blockTask(taskId: string, reason: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    if (task.assignedEngineer) {
      const engineer = this.engineers.get(task.assignedEngineer);
      if (engineer) {
        engineer.status = "blocked";
      }
    }

    this.logCoordination({
      from: task.assignedEngineer || "unknown",
      to: "all",
      type: "block",
      payload: { taskId, reason },
      timestamp: new Date(),
    });

    this.emit("task-blocked", { task, reason });
  }

  async unblockTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    if (task.assignedEngineer) {
      const engineer = this.engineers.get(task.assignedEngineer);
      if (engineer) {
        engineer.status = "idle";
      }
    }

    this.logCoordination({
      from: task.assignedEngineer || "unknown",
      to: "all",
      type: "unblock",
      payload: { taskId },
      timestamp: new Date(),
    });

    this.emit("task-unblocked", task);
  }

  async mergeFixes(
    taskIds: string[],
    conflictResolution: string,
  ): Promise<void> {
    const tasks = taskIds
      .map((id) => this.tasks.get(id))
      .filter(Boolean) as BugFixTask[];

    this.logCoordination({
      from: "ENG-ORCHESTRATOR",
      to: "all",
      type: "merge",
      payload: { taskIds, resolution: conflictResolution },
      timestamp: new Date(),
    });

    this.emit("fixes-merged", { tasks, resolution: conflictResolution });
  }

  async getEngineerStatus(engineerId: string): Promise<Engineer | undefined> {
    return this.engineers.get(engineerId);
  }

  async getAllEngineers(): Promise<Engineer[]> {
    return Array.from(this.engineers.values());
  }

  async getTask(taskId: string): Promise<BugFixTask | undefined> {
    return this.tasks.get(taskId);
  }

  async getAllTasks(status?: BugFixTask["status"]): Promise<BugFixTask[]> {
    const tasks = Array.from(this.tasks.values());
    if (status) {
      return tasks.filter((t) => t.status === status);
    }
    return tasks;
  }

  async getTasksByEngineer(engineerId: string): Promise<BugFixTask[]> {
    return Array.from(this.tasks.values()).filter(
      (t) => t.assignedEngineer === engineerId,
    );
  }

  async getPendingTasks(): Promise<BugFixTask[]> {
    return this.getAllTasks("pending");
  }

  async getInProgressTasks(): Promise<BugFixTask[]> {
    return this.getAllTasks("in-progress");
  }

  async getCoordinationLog(): Promise<CoordinationMessage[]> {
    return [...this.coordinationLog];
  }

  async getTeamStats(): Promise<{
    totalEngineers: number;
    idleCount: number;
    workingCount: number;
    blockedCount: number;
    totalTasks: number;
    pendingTasks: number;
    resolvedTasks: number;
    totalBugsFixed: number;
    avgFixTime: number;
  }> {
    const engineers = Array.from(this.engineers.values());
    const tasks = Array.from(this.tasks.values());

    const totalFixTime = engineers.reduce(
      (sum, e) => sum + e.performance.avgFixTime,
      0,
    );
    const activeEngineers = engineers.filter(
      (e) => e.performance.bugsFixed > 0,
    ).length;

    return {
      totalEngineers: engineers.length,
      idleCount: engineers.filter((e) => e.status === "idle").length,
      workingCount: engineers.filter((e) => e.status === "working").length,
      blockedCount: engineers.filter((e) => e.status === "blocked").length,
      totalTasks: tasks.length,
      pendingTasks: tasks.filter((t) => t.status === "pending").length,
      resolvedTasks: tasks.filter(
        (t) => t.status === "resolved" || t.status === "verified",
      ).length,
      totalBugsFixed: engineers.reduce(
        (sum, e) => sum + e.performance.bugsFixed,
        0,
      ),
      avgFixTime: activeEngineers > 0 ? totalFixTime / activeEngineers : 0,
    };
  }

  async generateReport(): Promise<string> {
    const engineers = Array.from(this.engineers.values());
    const tasks = Array.from(this.tasks.values());
    const stats = await this.getTeamStats();

    const now = new Date().toISOString();

    return `# Engineering Team Report

## Summary

**Generated:** ${now}
**Team Size:** ${stats.totalEngineers}
**Total Bugs Fixed:** ${stats.totalBugsFixed}

| Metric | Value |
|--------|-------|
| Idle Engineers | ${stats.idleCount} |
| Working Engineers | ${stats.workingCount} |
| Blocked Engineers | ${stats.blockedCount} |
| Pending Tasks | ${stats.pendingTasks} |
| Resolved Tasks | ${stats.resolvedTasks} |
| Avg Fix Time | ${stats.avgFixTime.toFixed(1)}h |

---

## Team Status

| Engineer | Role | Status | Current Task | Bugs Fixed | Avg Time |
|----------|------|--------|--------------|------------|----------|
${engineers.map((e) => `| ${e.name} | ${e.role} | ${e.status} | ${e.currentTask || "-"} | ${e.performance.bugsFixed} | ${e.performance.avgFixTime.toFixed(1)}h |`).join("\n")}

---

## Task Board

### Pending Tasks (${tasks.filter((t) => t.status === "pending").length})
| ID | Title | Severity | Type | Priority |
|----|-------|----------|------|----------|
${tasks
  .filter((t) => t.status === "pending")
  .map(
    (t) =>
      `| ${t.id} | ${t.title} | ${t.severity} | ${t.type} | ${t.priority} |`,
  )
  .join("\n")}

### In Progress (${tasks.filter((t) => t.status === "in-progress").length})
| ID | Title | Assigned To | Started |
|----|-------|-------------|---------|
${tasks
  .filter((t) => t.status === "in-progress")
  .map(
    (t) =>
      `| ${t.id} | ${t.title} | ${t.assignedEngineer || "-"} | ${t.startedAt?.toISOString() || "-"} |`,
  )
  .join("\n")}

### In Review (${tasks.filter((t) => t.status === "in-review").length})
| ID | Title | Reviewer |
|----|-------|----------|
${tasks
  .filter((t) => t.status === "in-review")
  .map((t) => `| ${t.id} | ${t.title} | ${t.reviewer || "-"} |`)
  .join("\n")}

### Resolved (${tasks.filter((t) => t.status === "resolved" || t.status === "verified").length})
| ID | Title | Fixed By | Hours |
|----|-------|----------|-------|
${tasks
  .filter((t) => t.status === "resolved" || t.status === "verified")
  .map(
    (t) =>
      `| ${t.id} | ${t.title} | ${t.assignedEngineer || "-"} | ${t.actualHours || "?"}h |`,
  )
  .join("\n")}

---

## Collaboration Network

${engineers
  .map((e) => {
    const collabs = COLLABORATION_MAP[e.role] || [];
    return `- **${e.name}** collaborates with: ${collabs
      .map((r) => {
        const eng = engineers.find((x) => x.role === r);
        return eng ? eng.name : r;
      })
      .join(", ")}`;
  })
  .join("\n")}

---

## Coordination Log (Recent)

${this.coordinationLog
  .slice(-15)
  .map(
    (msg) =>
      `[${msg.timestamp.toISOString()}] | ${msg.from} → ${msg.to} | ${msg.type}: ${JSON.stringify(msg.payload)}`,
  )
  .join("\n")}

---

*Auto-generated by Engineering Orchestrator*
`;
  }
}

export const engineeringOrchestrator = new EngineeringOrchestrator();
