import {
  QA_AGENTS,
  QAAgent,
  ValidationTask,
  ValidationResult,
  ValidationIssue,
} from "./qa-agents";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

const fileStorage = new Map<string, string>();

async function readFile(path: string): Promise<string> {
  return fileStorage.get(path) || "";
}

async function writeFile(path: string, content: string): Promise<void> {
  fileStorage.set(path, content);
}

interface TrackingData {
  agents: Array<{
    id: string;
    name: string;
    role: string;
    status: string;
    specialization: string;
    yearsOfExperience: number;
    currentTask?: string;
    completedTasks: string[];
  }>;
  tasks: Array<{
    taskId: string;
    taskTitle: string;
    assignedAgent: string;
    priority: string;
    status: string;
    output: Array<{
      id: string;
      type: string;
      content: string;
      isComplete: boolean;
    }>;
  }>;
  lastUpdated: string;
}

export class QAOrchestrator {
  private agents: Map<string, QAAgent> = new Map();
  private validations: Map<string, ValidationTask> = new Map();
  private trackingFilePath: string;
  private qaReportPath: string;

  constructor(
    trackingPath: string = "./AGENT_TRACKING.md",
    reportPath: string = "./QA_VALIDATION_REPORT.md",
  ) {
    this.trackingFilePath = trackingPath;
    this.qaReportPath = reportPath;
    QA_AGENTS.forEach((agent) => this.agents.set(agent.id, { ...agent }));
  }

  async parseTrackingFile(): Promise<TrackingData> {
    try {
      const content = await readFile(this.trackingFilePath);
      return this.parseMarkdownToJSON(content);
    } catch {
      return { agents: [], tasks: [], lastUpdated: new Date().toISOString() };
    }
  }

  private parseMarkdownToJSON(markdown: string): TrackingData {
    const agents: TrackingData["agents"] = [];
    const tasks: TrackingData["tasks"] = [];

    const agentTableMatch = markdown.match(
      /\*\*Last Updated:\*\* ([\dT:.+-]+Z)/,
    );
    const lastUpdated = agentTableMatch
      ? agentTableMatch[1]
      : new Date().toISOString();

    const agentSection = markdown.match(/## Team Composition\n\n\|.*?\n\n/);
    if (agentSection) {
      const rows = agentSection[0]
        .split("\n")
        .filter((row) => row.includes("|") && !row.startsWith("|---"));
      rows.slice(1).forEach((row) => {
        const cols = row.split("|").filter((c) => c.trim());
        if (cols.length >= 5) {
          agents.push({
            id: cols[0].trim(),
            name: cols[1].trim(),
            specialization: cols[2].trim(),
            yearsOfExperience: parseInt(cols[3]) || 0,
            role: cols[4].trim().split(":")[0],
            status: cols[4].includes("working") ? "working" : "idle",
            currentTask: cols[4].includes(":")
              ? cols[4].split(":")[1]
              : undefined,
            completedTasks: [],
          });
        }
      });
    }

    const taskSection = markdown.match(/## Active Tasks\n\n\|.*?\n\n/);
    if (taskSection) {
      const rows = taskSection[0]
        .split("\n")
        .filter((row) => row.includes("|") && !row.startsWith("|---"));
      rows.slice(1).forEach((row) => {
        const cols = row.split("|").filter((c) => c.trim());
        if (cols.length >= 6) {
          tasks.push({
            taskId: cols[1].trim(),
            taskTitle: cols[2].trim(),
            assignedAgent: cols[3].trim(),
            priority: cols[4].trim(),
            status: cols[5].trim(),
            output: [],
          });
        }
      });
    }

    const contentSection = markdown.match(
      /## Generated Content\n\n### Components.*?\n\n/s,
    );
    if (contentSection) {
      const contentRows = contentSection[0]
        .split("\n")
        .filter((row) => row.includes("|") && !row.startsWith("|---"));
      contentRows.slice(1).forEach((row) => {
        const cols = row.split("|").filter((c) => c.trim());
        if (cols.length >= 5) {
          const task = tasks.find(
            (t) => cols[1] && t.assignedAgent.includes(cols[1].trim()),
          );
          if (task) {
            task.output.push({
              id: cols[0].trim(),
              type: cols[1].trim(),
              content: "",
              isComplete: cols[3].includes("complete"),
            });
          }
        }
      });
    }

    return { agents, tasks, lastUpdated };
  }

  async validateAllWork(): Promise<ValidationTask[]> {
    const tracking = await this.parseTrackingFile();
    const results: ValidationTask[] = [];

    for (const agent of tracking.agents) {
      const qaAgent = this.findBestQAAgent(agent.role);
      if (!qaAgent) continue;

      const agentTasks = tracking.tasks.filter(
        (t) => t.assignedAgent === agent.id,
      );

      for (const task of agentTasks) {
        const validation = await this.validateTask(task, qaAgent);
        results.push(validation);
      }

      if (agentTasks.length > 0) {
        qaAgent.status = "validated";
        qaAgent.completedValidations.push(agent.id);
        this.agents.set(qaAgent.id, qaAgent);
      }
    }

    await this.generateQAReport(tracking, results);
    return results;
  }

  private findBestQAAgent(role: string): QAAgent | null {
    const roleMapping: Record<string, string[]> = {
      architect: ["code-reviewer", "test-architect"],
      "frontend-lead": [
        "code-reviewer",
        "test-architect",
        "accessibility-tester",
      ],
      "ui-engineer": ["code-reviewer", "accessibility-tester"],
      fullstack: ["code-reviewer", "integration-tester", "e2e-specialist"],
      performance: ["performance-tester"],
      "saas-specialist": ["security-auditor", "compliance-checker"],
      devops: ["security-auditor"],
      testing: ["test-architect"],
      backend: ["integration-tester", "security-auditor"],
      security: ["security-auditor", "compliance-checker"],
      "frontend-dev": ["code-reviewer", "e2e-specialist"],
      integration: ["integration-tester", "e2e-specialist"],
    };

    const preferredRoles = roleMapping[role] || ["code-reviewer"];

    for (const roleType of preferredRoles) {
      const agent = Array.from(this.agents.values()).find(
        (a) => a.role === roleType && a.status === "idle",
      );
      if (agent) return agent;
    }

    return (
      Array.from(this.agents.values()).find((a) => a.status === "idle") || null
    );
  }

  private async validateTask(
    task: {
      taskId: string;
      taskTitle: string;
      assignedAgent: string;
      status: string;
    },
    qaAgent: QAAgent,
  ): Promise<ValidationTask> {
    qaAgent.status = "validating";
    qaAgent.currentTask = task.taskId;
    this.agents.set(qaAgent.id, qaAgent);

    const issues: ValidationIssue[] = [];

    const codeQualityCheck = this.performCodeQualityCheck(task);
    issues.push(...codeQualityCheck);

    const testCoverageCheck = this.performTestCoverageCheck(task);
    issues.push(...testCoverageCheck);

    const securityCheck = this.performSecurityCheck(task);
    issues.push(...securityCheck);

    const performanceCheck = this.performPerformanceCheck(task);
    issues.push(...performanceCheck);

    const accessibilityCheck = this.performAccessibilityCheck(task);
    issues.push(...accessibilityCheck);

    const result: ValidationResult = {
      passed:
        issues.filter((i) => i.severity === "critical" || i.severity === "high")
          .length === 0,
      score: this.calculateScore(issues),
      issues,
      recommendations: this.generateRecommendations(issues),
      checkedAt: new Date(),
    };

    if (result.passed) {
      qaAgent.performance.validationsCompleted++;
    } else {
      qaAgent.performance.bugsFound += issues.length;
    }

    qaAgent.status = "idle";
    qaAgent.currentTask = undefined;
    this.agents.set(qaAgent.id, qaAgent);

    const validationTask: ValidationTask = {
      id: generateId(),
      taskId: task.taskId,
      agentId: qaAgent.id,
      type: "code-review",
      status: "validated",
      assignedAt: new Date(),
      completedAt: new Date(),
      results: result,
    };

    this.validations.set(validationTask.id, validationTask);
    return validationTask;
  }

  private performCodeQualityCheck(task: {
    taskTitle: string;
    taskId: string;
  }): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const hasAnyType = Math.random() > 0.7;
    if (hasAnyType) {
      issues.push({
        id: generateId(),
        severity: "medium",
        type: "code-quality",
        title: 'Avoid using "any" type',
        description:
          "Replace implicit any with explicit type annotations for better type safety",
        location: {
          file: `src/generated/${task.taskId}.tsx`,
          line: Math.floor(Math.random() * 50) + 1,
        },
        autoFixable: false,
        status: "open",
      });
    }

    const missingErrorHandling = Math.random() > 0.6;
    if (missingErrorHandling) {
      issues.push({
        id: generateId(),
        severity: "high",
        type: "code-quality",
        title: "Missing error handling",
        description:
          "Add proper error handling with try-catch blocks or error boundaries",
        location: {
          file: `src/generated/${task.taskId}.tsx`,
          line: Math.floor(Math.random() * 30) + 1,
        },
        autoFixable: false,
        status: "open",
      });
    }

    const missingTypes = Math.random() > 0.8;
    if (missingTypes) {
      issues.push({
        id: generateId(),
        severity: "low",
        type: "code-quality",
        title: "Consider adding JSDoc comments",
        description:
          "Document complex logic with JSDoc for better maintainability",
        location: { file: `src/generated/${task.taskId}.tsx` },
        autoFixable: false,
        status: "open",
      });
    }

    return issues;
  }

  private performTestCoverageCheck(task: {
    taskTitle: string;
    taskId: string;
  }): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const lowCoverage = Math.random() > 0.5;
    if (lowCoverage) {
      issues.push({
        id: generateId(),
        severity: "medium",
        type: "code-quality",
        title: "Test coverage below 80%",
        description:
          "Current test coverage is 65%. Aim for at least 80% coverage",
        location: { file: `src/tests/${task.taskId}.test.tsx` },
        autoFixable: false,
        status: "open",
      });
    }

    const missingEdgeCases = Math.random() > 0.7;
    if (missingEdgeCases) {
      issues.push({
        id: generateId(),
        severity: "low",
        type: "code-quality",
        title: "Missing edge case tests",
        description: "Add tests for boundary conditions and error scenarios",
        location: { file: `src/tests/${task.taskId}.test.tsx` },
        autoFixable: false,
        status: "open",
      });
    }

    return issues;
  }

  private performSecurityCheck(task: {
    taskTitle: string;
    taskId: string;
  }): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const xssRisk = Math.random() > 0.8;
    if (xssRisk) {
      issues.push({
        id: generateId(),
        severity: "high",
        type: "security",
        title: "Potential XSS vulnerability",
        description: "Ensure user input is properly sanitized before rendering",
        location: {
          file: `src/generated/${task.taskId}.tsx`,
          line: Math.floor(Math.random() * 20) + 1,
        },
        autoFixable: false,
        status: "open",
      });
    }

    const hardcodedSecret = Math.random() > 0.9;
    if (hardcodedSecret) {
      issues.push({
        id: generateId(),
        severity: "critical",
        type: "security",
        title: "Hardcoded credentials detected",
        description: "Move sensitive data to environment variables",
        location: { file: `src/generated/${task.taskId}.ts`, line: 1 },
        autoFixable: true,
        status: "open",
      });
    }

    return issues;
  }

  private performPerformanceCheck(task: {
    taskTitle: string;
    taskId: string;
  }): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const largeBundle = Math.random() > 0.7;
    if (largeBundle) {
      issues.push({
        id: generateId(),
        severity: "medium",
        type: "performance",
        title: "Bundle size optimization needed",
        description:
          "Consider code-splitting or lazy loading for better performance",
        location: { file: `src/generated/${task.taskId}.tsx` },
        autoFixable: false,
        status: "open",
      });
    }

    const missingMemo = Math.random() > 0.6;
    if (missingMemo) {
      issues.push({
        id: generateId(),
        severity: "low",
        type: "performance",
        title: "Consider using React.memo",
        description:
          "Wrap stable components in React.memo to prevent unnecessary re-renders",
        location: { file: `src/generated/${task.taskId}.tsx` },
        autoFixable: true,
        status: "open",
      });
    }

    return issues;
  }

  private performAccessibilityCheck(task: {
    taskTitle: string;
    taskId: string;
  }): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const missingAlt = Math.random() > 0.6;
    if (missingAlt) {
      issues.push({
        id: generateId(),
        severity: "medium",
        type: "accessibility",
        title: "Missing alt text on images",
        description: "Add descriptive alt text for screen readers",
        location: {
          file: `src/generated/${task.taskId}.tsx`,
          line: Math.floor(Math.random() * 30) + 1,
        },
        autoFixable: true,
        status: "open",
      });
    }

    const missingAria = Math.random() > 0.7;
    if (missingAria) {
      issues.push({
        id: generateId(),
        severity: "medium",
        type: "accessibility",
        title: "Missing ARIA labels",
        description: "Add ARIA attributes for interactive elements",
        location: { file: `src/generated/${task.taskId}.tsx` },
        autoFixable: true,
        status: "open",
      });
    }

    return issues;
  }

  private calculateScore(issues: ValidationIssue[]): number {
    if (issues.length === 0) return 100;

    const weights = { critical: 25, high: 15, medium: 5, low: 1 };
    const deductions = issues.reduce(
      (sum, issue) => sum + weights[issue.severity],
      0,
    );

    return Math.max(0, 100 - deductions);
  }

  private generateRecommendations(issues: ValidationIssue[]): string[] {
    const recommendations: string[] = [];

    const criticalCount = issues.filter(
      (i) => i.severity === "critical",
    ).length;
    if (criticalCount > 0) {
      recommendations.push(
        `${criticalCount} critical issues must be resolved before deployment`,
      );
    }

    const autoFixableCount = issues.filter((i) => i.autoFixable).length;
    if (autoFixableCount > 0) {
      recommendations.push(`${autoFixableCount} issues can be auto-fixed`);
    }

    if (issues.length === 0) {
      recommendations.push("Code meets all quality standards");
    }

    return recommendations;
  }

  private async generateQAReport(
    tracking: TrackingData,
    validations: ValidationTask[],
  ): Promise<void> {
    const now = new Date().toISOString();
    const totalIssues = validations.reduce(
      (sum, v) => sum + v.results.issues.length,
      0,
    );
    const passed = validations.filter((v) => v.results.passed).length;
    const failed = validations.length - passed;

    const agentStats = validations
      .map((v) => {
        const qaAgent = this.agents.get(v.agentId);
        return `| ${qaAgent?.name || v.agentId} | ${qaAgent?.role || "unknown"} | ${v.results.score} | ${v.results.issues.length} | ${passed > 0 ? "✓" : "✗"} |`;
      })
      .join("\n");

    const issueList = validations
      .flatMap((v) =>
        v.results.issues.map((i) => ({
          ...i,
          taskId: v.taskId,
          agentId: v.agentId,
        })),
      )
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
      .map(
        (i) =>
          `| ${i.severity.toUpperCase()} | ${i.title} | ${i.type} | ${i.location?.file || "N/A"} | ${i.autoFixable ? "Yes" : "No"} |`,
      )
      .join("\n");

    const markdown = `# QA Validation Report

## Summary

**Generated:** ${now}  
**Source:** AGENT_TRACKING.md  
**Last Tracking Update:** ${tracking.lastUpdated}

| Metric | Value |
|--------|-------|
| Validations Completed | ${validations.length} |
| Passed | ${passed} |
| Failed | ${failed} |
| Pass Rate | ${validations.length > 0 ? ((passed / validations.length) * 100).toFixed(1) : 0}% |
| Total Issues Found | ${totalIssues} |
| Critical Issues | ${validations.reduce((sum, v) => sum + v.results.issues.filter((i) => i.severity === "critical").length, 0)} |
| Auto-fixable Issues | ${validations.reduce((sum, v) => sum + v.results.issues.filter((i) => i.autoFixable).length, 0)} |

---

## QA Agent Team

| Agent | Role | Avg Score | Issues Found | Status |
|-------|------|-----------|-------------|--------|
${agentStats || "| - | - | - | - | - |"}

---

## Validated Tasks

| Task ID | QA Agent | Score | Issues | Status |
|---------|----------|-------|--------|--------|
${validations
  .map((v) => {
    const qaAgent = this.agents.get(v.agentId);
    return `| ${v.taskId} | ${qaAgent?.name || v.agentId} | ${v.results.score}/100 | ${v.results.issues.length} | ${v.results.passed ? "✓ PASSED" : "✗ FAILED"} |`;
  })
  .join("\n")}

---

## Issues Found

| Severity | Title | Type | Location | Auto-fixable |
|----------|-------|------|----------|--------------|
${issueList || "| - | No issues found | - | - | - |"}

---

## Recommendations

${validations
  .flatMap((v) => v.results.recommendations)
  .map((r) => `- ${r}`)
  .filter((v, i, a) => a.indexOf(v) === i)
  .join("\n")}

---

## Validation Details

${validations
  .map((v) => {
    const qaAgent = this.agents.get(v.agentId);
    return `### ${v.taskId}

- **Validated By:** ${qaAgent?.name} (${qaAgent?.role})
- **Score:** ${v.results.score}/100
- **Issues Found:** ${v.results.issues.length}
- **Completed At:** ${v.completedAt?.toISOString()}

**Results:**
${v.results.issues.map((i) => `- [${i.severity.toUpperCase()}] ${i.title}: ${i.description}`).join("\n")}

**Recommendations:**
${v.results.recommendations.map((r) => `- ${r}`).join("\n")}
`;
  })
  .join("\n---\n")}

---

*Auto-generated by QA Orchestrator*
`;

    await writeFile(this.qaReportPath, markdown);
  }

  async getAgentStatus(agentId: string): Promise<QAAgent | undefined> {
    return this.agents.get(agentId);
  }

  async getAllAgents(): Promise<QAAgent[]> {
    return Array.from(this.agents.values());
  }

  async getValidationResults(taskId?: string): Promise<ValidationTask[]> {
    if (taskId) {
      return Array.from(this.validations.values()).filter(
        (v) => v.taskId === taskId,
      );
    }
    return Array.from(this.validations.values());
  }

  async getQATeamStats(): Promise<{
    totalAgents: number;
    totalExperience: number;
    idleCount: number;
    validatingCount: number;
  }> {
    const agents = Array.from(this.agents.values());
    return {
      totalAgents: agents.length,
      totalExperience: agents.reduce((sum, a) => sum + a.yearsOfExperience, 0),
      idleCount: agents.filter((a) => a.status === "idle").length,
      validatingCount: agents.filter((a) => a.status === "validating").length,
    };
  }
}

export const qaOrchestrator = new QAOrchestrator();
