type EventCallback = (data: unknown) => void;

export type E2EAgentRole =
  | "lead"
  | "ui-tester"
  | "api-tester"
  | "performance-tester"
  | "security-tester";

export type E2EAgentStatus =
  | "idle"
  | "running"
  | "analyzing"
  | "creating"
  | "blocked"
  | "completed";

export interface E2ETestResult {
  testId: string;
  testName: string;
  status: "passed" | "failed" | "skipped" | "error";
  duration: number;
  error?: string;
  screenshots?: string[];
  logs?: string[];
  metrics?: Record<string, number>;
}

export interface E2ETestSuite {
  id: string;
  name: string;
  description: string;
  tests: E2ETestCase[];
  category:
    | "smoke"
    | "regression"
    | "visual"
    | "api"
    | "performance"
    | "security";
  assignedAgent: string;
  status: E2EAgentStatus;
  results?: E2ETestResult[];
  startedAt?: Date;
  completedAt?: Date;
}

export interface E2ETestCase {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  estimatedDuration: number;
  dependencies?: string[];
}

export interface E2EAgent {
  id: string;
  name: string;
  role: E2EAgentRole;
  specialization: string;
  yearsOfExperience: number;
  currentTestSuite?: string;
  status: E2EAgentStatus;
  completedSuites: string[];
  performance: {
    suitesCompleted: number;
    bugsFound: number;
    falsePositives: number;
    avgTestTime: number;
  };
}

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  type: "bug" | "feature" | "improvement";
  status: "open" | "in-progress" | "in-review" | "resolved" | "verified";
  source: string;
  assignee?: string;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  verifiedAt?: Date;
  testEvidence: {
    screenshots?: string[];
    consoleLogs?: string[];
    networkLogs?: string[];
    metrics?: Record<string, number>;
    errorMessage?: string;
    stackTrace?: string;
  };
  fixDetails?: {
    fixedBy: string;
    commitHash: string;
    filesChanged: string[];
    testAdded: boolean;
  };
  relatedTests?: string[];
  tags: string[];
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export const E2E_TEAM: E2EAgent[] = [
  {
    id: "E2E-001",
    name: "Emily Rodriguez",
    role: "lead",
    specialization: "Test Strategy, Playwright, Cypress, Test Automation",
    yearsOfExperience: 12,
    status: "idle",
    completedSuites: [],
    performance: {
      suitesCompleted: 0,
      bugsFound: 0,
      falsePositives: 0,
      avgTestTime: 0,
    },
  },
  {
    id: "E2E-002",
    name: "Michael Chen",
    role: "ui-tester",
    specialization: "Visual Regression, Screenshots, Layout Testing, A11y",
    yearsOfExperience: 8,
    status: "idle",
    completedSuites: [],
    performance: {
      suitesCompleted: 0,
      bugsFound: 0,
      falsePositives: 0,
      avgTestTime: 0,
    },
  },
  {
    id: "E2E-003",
    name: "Sarah Park",
    role: "api-tester",
    specialization: "REST, GraphQL, Contract Testing, Postman, WebSockets",
    yearsOfExperience: 9,
    status: "idle",
    completedSuites: [],
    performance: {
      suitesCompleted: 0,
      bugsFound: 0,
      falsePositives: 0,
      avgTestTime: 0,
    },
  },
  {
    id: "E2E-004",
    name: "David Kim",
    role: "performance-tester",
    specialization:
      "Lighthouse, Load Testing, Core Web Vitals, Bundle Analysis",
    yearsOfExperience: 7,
    status: "idle",
    completedSuites: [],
    performance: {
      suitesCompleted: 0,
      bugsFound: 0,
      falsePositives: 0,
      avgTestTime: 0,
    },
  },
  {
    id: "E2E-005",
    name: "Jessica Brown",
    role: "security-tester",
    specialization:
      "OWASP, Auth Testing, Penetration, XSS, CSRF, SQL Injection",
    yearsOfExperience: 10,
    status: "idle",
    completedSuites: [],
    performance: {
      suitesCompleted: 0,
      bugsFound: 0,
      falsePositives: 0,
      avgTestTime: 0,
    },
  },
];

export interface TestPlan {
  id: string;
  name: string;
  description: string;
  suites: E2ETestSuite[];
  status: "planned" | "running" | "completed" | "failed";
  startedAt?: Date;
  completedAt?: Date;
  summary?: {
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    bugsFound: number;
  };
}

export interface CoordinationMessage {
  from: string;
  to: string | "all";
  type:
    | "assignment"
    | "status-update"
    | "help-request"
    | "completion"
    | "block"
    | "unblock";
  payload: Record<string, unknown>;
  timestamp: Date;
}

export class E2EQAOrchestrator {
  private agents: Map<string, E2EAgent> = new Map();
  private testSuites: Map<string, E2ETestSuite> = new Map();
  private workItems: Map<string, WorkItem> = new Map();
  private testPlans: Map<string, TestPlan> = new Map();
  private coordinationLog: CoordinationMessage[] = [];
  private workItemCounter = 0;
  private eventListeners: Map<string, EventCallback[]> = new Map();

  constructor() {
    E2E_TEAM.forEach((agent) => this.agents.set(agent.id, { ...agent }));
    this.initializeTestSuites();
  }

  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
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

  private initializeTestSuites(): void {
    const smokeSuite: E2ETestSuite = {
      id: "suite-smoke",
      name: "Smoke Test Suite",
      description: "Critical path tests - must pass before any release",
      category: "smoke",
      assignedAgent: "E2E-001",
      status: "idle",
      tests: [
        {
          id: "smoke-001",
          name: "User Login",
          description: "Login with valid credentials",
          category: "auth",
          priority: "critical",
          status: "pending",
          estimatedDuration: 5000,
        },
        {
          id: "smoke-002",
          name: "Channel Selection",
          description: "Select DevOps channel",
          category: "navigation",
          priority: "critical",
          status: "pending",
          estimatedDuration: 3000,
        },
        {
          id: "smoke-003",
          name: "Content Display",
          description: "View generated content",
          category: "display",
          priority: "critical",
          status: "pending",
          estimatedDuration: 5000,
        },
        {
          id: "smoke-004",
          name: "API Health",
          description: "Verify API endpoints",
          category: "api",
          priority: "critical",
          status: "pending",
          estimatedDuration: 2000,
        },
        {
          id: "smoke-005",
          name: "Search Functionality",
          description: "Search for content",
          category: "search",
          priority: "high",
          status: "pending",
          estimatedDuration: 4000,
        },
      ],
    };

    const visualSuite: E2ETestSuite = {
      id: "suite-visual",
      name: "Visual Regression Suite",
      description: "Screenshot comparison and layout verification",
      category: "visual",
      assignedAgent: "E2E-002",
      status: "idle",
      tests: [
        {
          id: "visual-001",
          name: "Homepage Layout",
          description: "Verify homepage layout",
          category: "layout",
          priority: "high",
          status: "pending",
          estimatedDuration: 3000,
        },
        {
          id: "visual-002",
          name: "Theme Toggle",
          description: "Test light/dark mode",
          category: "theming",
          priority: "medium",
          status: "pending",
          estimatedDuration: 4000,
        },
        {
          id: "visual-003",
          name: "Responsive Design",
          description: "Test mobile/tablet/desktop",
          category: "responsive",
          priority: "high",
          status: "pending",
          estimatedDuration: 6000,
        },
        {
          id: "visual-004",
          name: "Font Rendering",
          description: "Verify typography",
          category: "typography",
          priority: "low",
          status: "pending",
          estimatedDuration: 2000,
        },
        {
          id: "visual-005",
          name: "Icon/Image Loading",
          description: "Verify media loads",
          category: "media",
          priority: "medium",
          status: "pending",
          estimatedDuration: 3000,
        },
      ],
    };

    const apiSuite: E2ETestSuite = {
      id: "suite-api",
      name: "API Integration Suite",
      description: "REST/GraphQL endpoint validation",
      category: "api",
      assignedAgent: "E2E-003",
      status: "idle",
      tests: [
        {
          id: "api-001",
          name: "GET /api/content",
          description: "Fetch all content",
          category: "api",
          priority: "critical",
          status: "pending",
          estimatedDuration: 2000,
        },
        {
          id: "api-002",
          name: "GET /api/content/:type",
          description: "Filter by type",
          category: "api",
          priority: "high",
          status: "pending",
          estimatedDuration: 2000,
        },
        {
          id: "api-003",
          name: "GET /api/channels/:id",
          description: "Get channel info",
          category: "api",
          priority: "high",
          status: "pending",
          estimatedDuration: 2000,
        },
        {
          id: "api-004",
          name: "POST /api/search",
          description: "Search content",
          category: "api",
          priority: "medium",
          status: "pending",
          estimatedDuration: 3000,
        },
        {
          id: "api-005",
          name: "WebSocket Connection",
          description: "Real-time updates",
          category: "websocket",
          priority: "high",
          status: "pending",
          estimatedDuration: 4000,
        },
      ],
    };

    const performanceSuite: E2ETestSuite = {
      id: "suite-performance",
      name: "Performance Test Suite",
      description: "Core Web Vitals, load testing, bundle analysis",
      category: "performance",
      assignedAgent: "E2E-004",
      status: "idle",
      tests: [
        {
          id: "perf-001",
          name: "Lighthouse Score",
          description: "Overall performance",
          category: "performance",
          priority: "high",
          status: "pending",
          estimatedDuration: 15000,
        },
        {
          id: "perf-002",
          name: "LCP Measurement",
          description: "Largest Contentful Paint",
          category: "performance",
          priority: "high",
          status: "pending",
          estimatedDuration: 10000,
        },
        {
          id: "perf-003",
          name: "FID/TBT Measurement",
          description: "Input delay",
          category: "performance",
          priority: "medium",
          status: "pending",
          estimatedDuration: 10000,
        },
        {
          id: "perf-004",
          name: "Bundle Size",
          description: "Check JS bundle size",
          category: "bundle",
          priority: "medium",
          status: "pending",
          estimatedDuration: 5000,
        },
        {
          id: "perf-005",
          name: "Memory Usage",
          description: "Monitor memory leaks",
          category: "memory",
          priority: "medium",
          status: "pending",
          estimatedDuration: 10000,
        },
      ],
    };

    const securitySuite: E2ETestSuite = {
      id: "suite-security",
      name: "Security Test Suite",
      description: "Auth, XSS, CSRF, SQL injection tests",
      category: "security",
      assignedAgent: "E2E-005",
      status: "idle",
      tests: [
        {
          id: "sec-001",
          name: "Auth Flow",
          description: "Login/logout flow",
          category: "auth",
          priority: "critical",
          status: "pending",
          estimatedDuration: 5000,
        },
        {
          id: "sec-002",
          name: "XSS Prevention",
          description: "Test XSS filters",
          category: "xss",
          priority: "critical",
          status: "pending",
          estimatedDuration: 4000,
        },
        {
          id: "sec-003",
          name: "CSRF Tokens",
          description: "Verify CSRF protection",
          category: "csrf",
          priority: "high",
          status: "pending",
          estimatedDuration: 3000,
        },
        {
          id: "sec-004",
          name: "SQL Injection",
          description: "Test DB queries",
          category: "sqli",
          priority: "critical",
          status: "pending",
          estimatedDuration: 4000,
        },
        {
          id: "sec-005",
          name: "JWT Validation",
          description: "Verify token handling",
          category: "auth",
          priority: "high",
          status: "pending",
          estimatedDuration: 3000,
        },
      ],
    };

    [
      smokeSuite,
      visualSuite,
      apiSuite,
      performanceSuite,
      securitySuite,
    ].forEach((suite) => {
      this.testSuites.set(suite.id, suite);
    });
  }

  async createTestPlan(name: string, description: string): Promise<TestPlan> {
    const plan: TestPlan = {
      id: generateId(),
      name,
      description,
      suites: Array.from(this.testSuites.values()),
      status: "planned",
    };
    this.testPlans.set(plan.id, plan);
    return plan;
  }

  async runTestPlan(planId: string): Promise<TestPlan> {
    const plan = this.testPlans.get(planId);
    if (!plan) throw new Error(`Test plan ${planId} not found`);

    plan.status = "running";
    plan.startedAt = new Date();
    this.emit("plan-started", plan);

    for (const suite of plan.suites) {
      await this.runTestSuite(suite.id);
    }

    plan.status = "completed";
    plan.completedAt = new Date();
    plan.summary = this.calculateSummary(plan);
    this.emit("plan-completed", plan);

    return plan;
  }

  async runTestSuite(suiteId: string): Promise<E2ETestSuite> {
    const suite = this.testSuites.get(suiteId);
    if (!suite) throw new Error(`Test suite ${suiteId} not found`);

    const agent = this.agents.get(suite.assignedAgent);
    if (!agent) throw new Error(`Agent ${suite.assignedAgent} not found`);

    suite.status = "running";
    suite.startedAt = new Date();
    agent.currentTestSuite = suiteId;
    agent.status = "running";

    this.logCoordination({
      from: "E2E-ORCHESTRATOR",
      to: suite.assignedAgent,
      type: "assignment",
      payload: { suiteId, suiteName: suite.name },
      timestamp: new Date(),
    });

    this.emit("suite-started", { suite, agent });

    const results: E2ETestResult[] = [];

    for (const test of suite.tests) {
      const result = await this.runTest(test, agent);
      results.push(result);
    }

    suite.results = results;
    suite.status = "completed";
    suite.completedAt = new Date();
    agent.currentTestSuite = undefined;
    agent.status = "completed";
    agent.completedSuites.push(suiteId);
    agent.performance.suitesCompleted++;

    this.logCoordination({
      from: suite.assignedAgent,
      to: "E2E-ORCHESTRATOR",
      type: "completion",
      payload: {
        suiteId,
        results: results.map((r) => ({ id: r.testId, status: r.status })),
      },
      timestamp: new Date(),
    });

    this.emit("suite-completed", { suite, agent });

    const bugs = results.filter((r) => r.status === "failed");
    if (bugs.length > 0) {
      await this.createWorkItemsFromBugs(bugs, suite, agent);
    }

    return suite;
  }

  private async runTest(
    test: E2ETestCase,
    agent: E2EAgent,
  ): Promise<E2ETestResult> {
    test.status = "running";
    this.emit("test-started", { test, agent });

    await new Promise((resolve) =>
      setTimeout(resolve, test.estimatedDuration / 5),
    );

    const passed = Math.random() > 0.2;
    const result: E2ETestResult = {
      testId: test.id,
      testName: test.name,
      status: passed ? "passed" : "failed",
      duration: test.estimatedDuration,
      logs: [],
      metrics: {
        duration: test.estimatedDuration,
        memory: Math.random() * 50 + 20,
        cpu: Math.random() * 30 + 10,
      },
    };

    test.status = result.status === "error" ? "failed" : result.status;

    if (!passed) {
      result.error = `Test failed: ${test.name}`;
      result.logs = [
        `Error: Assertion failed at ${test.id}`,
        `Expected: value to match criteria`,
        `Actual: condition not met`,
      ];
      result.screenshots = [`${test.id}-failure.png`];

      agent.performance.bugsFound++;
    }

    this.emit("test-completed", { test, result, agent });
    return result;
  }

  async createWorkItemsFromBugs(
    bugs: E2ETestResult[],
    suite: E2ETestSuite,
    agent: E2EAgent,
  ): Promise<WorkItem[]> {
    const workItems: WorkItem[] = [];

    for (const bug of bugs) {
      const testCase = suite.tests.find((t) => t.id === bug.testId);
      if (!testCase) continue;

      const workItem: WorkItem = {
        id: `BUG-${String(++this.workItemCounter).padStart(3, "0")}`,
        title: `[${suite.category.toUpperCase()}] ${bug.testName} failed`,
        description: `Test Case: ${testCase.description}\n\nError: ${bug.error || "Unknown error"}\n\nLogs:\n${(bug.logs || []).join("\n")}`,
        severity: this.mapPriorityToSeverity(testCase.priority),
        type: "bug",
        status: "open",
        source: agent.id,
        priority: this.calculatePriority(testCase.priority, testCase.category),
        createdAt: new Date(),
        updatedAt: new Date(),
        testEvidence: {
          screenshots: bug.screenshots,
          consoleLogs: bug.logs,
          networkLogs: [],
          metrics: bug.metrics,
          errorMessage: bug.error,
        },
        relatedTests: [bug.testId],
        tags: [suite.category, testCase.category],
      };

      this.workItems.set(workItem.id, workItem);
      workItems.push(workItem);

      this.logCoordination({
        from: agent.id,
        to: "all",
        type: "assignment",
        payload: {
          workItemId: workItem.id,
          severity: workItem.severity,
          title: workItem.title,
        },
        timestamp: new Date(),
      });

      this.emit("work-item-created", workItem);
    }

    return workItems;
  }

  private mapPriorityToSeverity(priority: string): WorkItem["severity"] {
    const map: Record<string, WorkItem["severity"]> = {
      critical: "critical",
      high: "high",
      medium: "medium",
      low: "low",
    };
    return map[priority] || "medium";
  }

  private calculatePriority(priority: string, category: string): number {
    const basePriority: Record<string, number> = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25,
    };
    const categoryBoost: Record<string, number> = {
      security: 20,
      auth: 15,
      api: 10,
    };
    return (basePriority[priority] || 50) + (categoryBoost[category] || 0);
  }

  private calculateSummary(plan: TestPlan): TestPlan["summary"] {
    const allTests = plan.suites.flatMap((s) => s.tests);
    const results = plan.suites.flatMap((s) => s.results || []);
    return {
      totalTests: allTests.length,
      passed: results.filter((r) => r.status === "passed").length,
      failed: results.filter((r) => r.status === "failed").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      duration:
        plan.completedAt && plan.startedAt
          ? plan.completedAt.getTime() - plan.startedAt.getTime()
          : 0,
      bugsFound: results.filter((r) => r.status === "failed").length,
    };
  }

  private logCoordination(message: CoordinationMessage): void {
    this.coordinationLog.push(message);
    this.emit("coordination", message);
  }

  async getAgentStatus(agentId: string): Promise<E2EAgent | undefined> {
    return this.agents.get(agentId);
  }

  async getAllAgents(): Promise<E2EAgent[]> {
    return Array.from(this.agents.values());
  }

  async getWorkItems(status?: WorkItem["status"]): Promise<WorkItem[]> {
    const items = Array.from(this.workItems.values());
    if (status) {
      return items.filter((item) => item.status === status);
    }
    return items;
  }

  async getOpenWorkItems(): Promise<WorkItem[]> {
    return this.getWorkItems("open");
  }

  async assignWorkItem(
    workItemId: string,
    engineerId: string,
  ): Promise<WorkItem | undefined> {
    const item = this.workItems.get(workItemId);
    if (!item) return undefined;

    item.assignee = engineerId;
    item.status = "in-progress";
    item.updatedAt = new Date();

    this.logCoordination({
      from: "E2E-ORCHESTRATOR",
      to: engineerId,
      type: "assignment",
      payload: { workItemId, title: item.title, severity: item.severity },
      timestamp: new Date(),
    });

    this.emit("work-item-assigned", { workItem: item, engineer: engineerId });
    return item;
  }

  async updateWorkItemStatus(
    workItemId: string,
    status: WorkItem["status"],
    details?: WorkItem["fixDetails"],
  ): Promise<WorkItem | undefined> {
    const item = this.workItems.get(workItemId);
    if (!item) return undefined;

    item.status = status;
    item.updatedAt = new Date();

    if (status === "resolved" && details) {
      item.fixDetails = details;
      item.resolvedAt = new Date();
    }

    if (status === "verified") {
      item.verifiedAt = new Date();
    }

    this.emit("work-item-updated", item);
    return item;
  }

  async getWorkItemsByEngineer(engineerId: string): Promise<WorkItem[]> {
    return Array.from(this.workItems.values()).filter(
      (item) => item.assignee === engineerId,
    );
  }

  async getTestSuiteResults(
    suiteId: string,
  ): Promise<E2ETestSuite | undefined> {
    return this.testSuites.get(suiteId);
  }

  async getTestPlanResults(planId: string): Promise<TestPlan | undefined> {
    return this.testPlans.get(planId);
  }

  async getCoordinationLog(): Promise<CoordinationMessage[]> {
    return [...this.coordinationLog];
  }

  async getTeamStats(): Promise<{
    totalAgents: number;
    idleCount: number;
    runningCount: number;
    completedSuites: number;
    openWorkItems: number;
    totalBugsFound: number;
  }> {
    const agents = Array.from(this.agents.values());
    return {
      totalAgents: agents.length,
      idleCount: agents.filter((a) => a.status === "idle").length,
      runningCount: agents.filter((a) => a.status === "running").length,
      completedSuites: agents.reduce(
        (sum, a) => sum + a.performance.suitesCompleted,
        0,
      ),
      openWorkItems: Array.from(this.workItems.values()).filter(
        (w) => w.status === "open",
      ).length,
      totalBugsFound: agents.reduce(
        (sum, a) => sum + a.performance.bugsFound,
        0,
      ),
    };
  }

  async generateReport(): Promise<string> {
    const plan = Array.from(this.testPlans.values()).pop();
    const agents = Array.from(this.agents.values());
    const workItems = Array.from(this.workItems.values());

    const now = new Date().toISOString();
    const passedTests = plan?.summary?.passed || 0;
    const failedTests = plan?.summary?.failed || 0;
    const totalTests = plan?.summary?.totalTests || 0;

    const criticalBugs = workItems.filter(
      (w) => w.severity === "critical" && w.status === "open",
    ).length;
    const openBugs = workItems.filter((w) => w.status === "open").length;
    const resolvedBugs = workItems.filter(
      (w) => w.status === "resolved" || w.status === "verified",
    ).length;

    return `# E2E Testing Report

## Summary

**Generated:** ${now}
**Test Plan:** ${plan?.name || "N/A"}
**Status:** ${plan?.status || "Not Run"}

| Metric | Value |
|--------|-------|
| Total Tests | ${totalTests} |
| Passed | ${passedTests} |
| Failed | ${failedTests} |
| Pass Rate | ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}% |
| Bugs Found | ${plan?.summary?.bugsFound || 0} |
| Open Bugs | ${openBugs} |
| Critical Bugs | ${criticalBugs} |
| Resolved Bugs | ${resolvedBugs} |

---

## Test Suites

${plan?.suites
  .map((suite) => {
    const results = suite.results || [];
    const passed = results.filter((r) => r.status === "passed").length;
    const failed = results.filter((r) => r.status === "failed").length;
    return `### ${suite.name}

| Metric | Value |
|--------|-------|
| Status | ${suite.status} |
| Passed | ${passed} |
| Failed | ${failed} |
| Duration | ${suite.completedAt && suite.startedAt ? ((suite.completedAt.getTime() - suite.startedAt.getTime()) / 1000).toFixed(1) : 0}s |

**Failed Tests:**
${
  results
    .filter((r) => r.status === "failed")
    .map((r) => `- ${r.testName}: ${r.error}`)
    .join("\n") || "None"
}
`;
  })
  .join("\n---\n")}

---

## Open Work Items (Bugs)

| ID | Title | Severity | Priority | Source |
|----|-------|----------|----------|--------|
${workItems
  .filter((w) => w.status === "open")
  .map(
    (w) =>
      `| ${w.id} | ${w.title} | ${w.severity} | ${w.priority} | ${w.source} |`,
  )
  .join("\n")}

---

## Agent Performance

| Agent | Role | Suites | Bugs Found | Status |
|-------|------|-------|------------|--------|
${agents.map((a) => `| ${a.name} | ${a.role} | ${a.performance.suitesCompleted} | ${a.performance.bugsFound} | ${a.status} |`).join("\n")}

---

## Coordination Log

${this.coordinationLog
  .slice(-20)
  .map(
    (msg) =>
      `[${msg.timestamp.toISOString()}] | ${msg.from} → ${msg.to} | ${msg.type}: ${JSON.stringify(msg.payload)}`,
  )
  .join("\n")}

---

*Auto-generated by E2E QA Orchestrator*
`;
  }
}

export const e2eOrchestrator = new E2EQAOrchestrator();
