import { Router, type IRouter, type Request, type Response } from "express";

interface QAAgent {
  id: string;
  name: string;
  role: string;
  status: string;
  specialization: string;
  yearsOfExperience: number;
}

interface ValidationResult {
  id: string;
  taskId: string;
  agentId: string;
  score: number;
  passed: boolean;
  issues: { severity: string; title: string }[];
}

const qaAgents: QAAgent[] = [
  {
    id: "qa-001",
    name: "Patricia Hughes",
    role: "code-reviewer",
    status: "idle",
    specialization: "Code Quality & Best Practices",
    yearsOfExperience: 12,
  },
  {
    id: "qa-002",
    name: "Daniel Brooks",
    role: "test-architect",
    status: "idle",
    specialization: "Test Strategy & Coverage",
    yearsOfExperience: 10,
  },
  {
    id: "qa-003",
    name: "Rachel Green",
    role: "security-auditor",
    status: "idle",
    specialization: "Security Testing & Vulnerability Assessment",
    yearsOfExperience: 11,
  },
  {
    id: "qa-004",
    name: "Kevin O'Brien",
    role: "performance-tester",
    status: "idle",
    specialization: "Performance & Load Testing",
    yearsOfExperience: 9,
  },
  {
    id: "qa-005",
    name: "Michelle Torres",
    role: "accessibility-tester",
    status: "idle",
    specialization: "Accessibility & Inclusive Design",
    yearsOfExperience: 8,
  },
  {
    id: "qa-006",
    name: "Steven Wright",
    role: "integration-tester",
    status: "idle",
    specialization: "API & Integration Testing",
    yearsOfExperience: 7,
  },
  {
    id: "qa-007",
    name: "Amanda Chen",
    role: "e2e-specialist",
    status: "idle",
    specialization: "End-to-End Testing",
    yearsOfExperience: 8,
  },
  {
    id: "qa-008",
    name: "Christopher Lee",
    role: "compliance-checker",
    status: "idle",
    specialization: "Regulatory Compliance & Standards",
    yearsOfExperience: 10,
  },
];

const validationResults: ValidationResult[] = [];
let validationIdCounter = 1;

const router: IRouter = Router();

router.get("/team", async (_req: Request, res: Response) => {
  res.json(qaAgents);
});

router.get("/stats", async (_req: Request, res: Response) => {
  res.json({
    totalAgents: qaAgents.length,
    totalExperience: qaAgents.reduce((sum, a) => sum + a.yearsOfExperience, 0),
    idleCount: qaAgents.filter((a) => a.status === "idle").length,
    validatingCount: qaAgents.filter((a) => a.status === "validating").length,
  });
});

router.get("/validations", async (_req: Request, res: Response) => {
  res.json(validationResults);
});

router.get("/validations/:taskId", async (req: Request, res: Response) => {
  const taskId = req.params.taskId;
  const validations = validationResults.filter((v) => v.taskId === taskId);
  if (validations.length === 0) {
    res.status(404).json({ error: "No validations found for this task" });
    return;
  }
  res.json(validations);
});

router.post("/validate/:taskId", async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId;
    const { type, agentId } = req.body;

    const assignedAgent = agentId
      ? qaAgents.find((a) => a.id === agentId)
      : qaAgents.find((a) => a.status === "idle");

    if (!assignedAgent) {
      res.status(400).json({ error: "No available QA agent" });
      return;
    }

    assignedAgent.status = "validating";

    const issues = generateValidationIssues(type || "code-review");

    const result: ValidationResult = {
      id: `val-${validationIdCounter++}`,
      taskId: typeof taskId === "string" ? taskId : taskId[0],
      agentId: assignedAgent.id,
      score: calculateScore(issues),
      passed:
        issues.filter((i) => i.severity === "critical" || i.severity === "high")
          .length === 0,
      issues,
    };

    validationResults.push(result);
    assignedAgent.status = "idle";

    res.json({
      validationId: result.id,
      passed: result.passed,
      score: result.score,
      issues: result.issues,
      validatedBy: assignedAgent.name,
    });
  } catch (error) {
    res.status(500).json({ error: "Validation failed" });
  }
});

router.post("/validate-all", async (_req: Request, res: Response) => {
  try {
    const results: ValidationResult[] = [];

    for (const agent of qaAgents) {
      if (agent.status === "idle") {
        agent.status = "validating";

        const issues = generateValidationIssues(agent.role);

        const result: ValidationResult = {
          id: `val-${validationIdCounter++}`,
          taskId: "all",
          agentId: agent.id,
          score: calculateScore(issues),
          passed:
            issues.filter(
              (i) => i.severity === "critical" || i.severity === "high",
            ).length === 0,
          issues,
        };

        results.push(result);
        validationResults.push(result);
        agent.status = "idle";
      }
    }

    res.json({
      validationsRun: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      results,
    });
  } catch (error) {
    res.status(500).json({ error: "Validation failed" });
  }
});

function generateValidationIssues(type: string): {
  severity: string;
  title: string;
  description: string;
  autoFixable: boolean;
}[] {
  const issuePool: {
    severity: string;
    title: string;
    description: string;
    autoFixable: boolean;
  }[] = [
    {
      severity: "critical",
      title: "Hardcoded credentials",
      description: "Move secrets to environment variables",
      autoFixable: false,
    },
    {
      severity: "high",
      title: "Potential XSS vulnerability",
      description: "Sanitize user input before rendering",
      autoFixable: false,
    },
    {
      severity: "high",
      title: "Missing error handling",
      description: "Add try-catch blocks for async operations",
      autoFixable: false,
    },
    {
      severity: "medium",
      title: "Test coverage below 80%",
      description: "Current coverage is 65%. Add more tests",
      autoFixable: false,
    },
    {
      severity: "medium",
      title: "Missing alt text",
      description: "Add alt attributes to images",
      autoFixable: true,
    },
    {
      severity: "medium",
      title: "Bundle size optimization",
      description: "Consider code-splitting for better load time",
      autoFixable: false,
    },
    {
      severity: "low",
      title: "Missing JSDoc comments",
      description: "Document complex functions",
      autoFixable: false,
    },
    {
      severity: "low",
      title: "Consider React.memo",
      description: "Wrap stable components to prevent re-renders",
      autoFixable: true,
    },
  ];

  const count = Math.floor(Math.random() * 4) + 1;
  const selected: {
    severity: string;
    title: string;
    description: string;
    autoFixable: boolean;
  }[] = [];

  for (let i = 0; i < count && i < issuePool.length; i++) {
    const index = Math.floor(Math.random() * issuePool.length);
    selected.push(issuePool.splice(index, 1)[0]);
  }

  return selected;
}

function calculateScore(issues: { severity: string }[]): number {
  if (issues.length === 0) return 100;

  const weights: Record<string, number> = {
    critical: 25,
    high: 15,
    medium: 5,
    low: 1,
  };
  const deductions = issues.reduce(
    (sum, issue) => sum + (weights[issue.severity] || 0),
    0,
  );

  return Math.max(0, 100 - deductions);
}

export default router;
