export type QAAgentRole =
  | "code-reviewer"
  | "test-architect"
  | "security-auditor"
  | "performance-tester"
  | "accessibility-tester"
  | "integration-tester"
  | "e2e-specialist"
  | "compliance-checker";

export type QAStatus =
  | "idle"
  | "validating"
  | "blocked"
  | "reviewing"
  | "validated";

export interface QAAgent {
  id: string;
  name: string;
  role: QAAgentRole;
  specialization: string;
  yearsOfExperience: number;
  currentTask?: string;
  status: QAStatus;
  completedValidations: string[];
  skills: string[];
  performance: {
    validationsCompleted: number;
    bugsFound: number;
    falsePositives: number;
  };
}

export interface ValidationTask {
  id: string;
  taskId: string;
  agentId: string;
  type:
    | "code-review"
    | "unit-test"
    | "integration-test"
    | "e2e-test"
    | "security-audit"
    | "performance-audit"
    | "accessibility-audit"
    | "compliance-check";
  status: QAStatus;
  assignedAt: Date;
  completedAt?: Date;
  results: ValidationResult;
}

export interface ValidationResult {
  passed: boolean;
  score: number;
  issues: ValidationIssue[];
  recommendations: string[];
  checkedAt: Date;
}

export interface ValidationIssue {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  type:
    | "bug"
    | "security"
    | "performance"
    | "accessibility"
    | "code-quality"
    | "compliance";
  title: string;
  description: string;
  location?: {
    file?: string;
    line?: number;
    column?: number;
  };
  autoFixable: boolean;
  status: "open" | "fixed" | "false-positive" | "accepted";
}

export const QA_AGENTS: QAAgent[] = [
  {
    id: "qa-001",
    name: "Patricia Hughes",
    role: "code-reviewer",
    specialization: "Code Quality & Best Practices",
    yearsOfExperience: 12,
    status: "idle",
    completedValidations: [],
    skills: [
      "TypeScript",
      "React",
      "Code Review",
      "ESLint",
      "Prettier",
      "Clean Code",
      "Design Patterns",
    ],
    performance: { validationsCompleted: 0, bugsFound: 0, falsePositives: 0 },
  },
  {
    id: "qa-002",
    name: "Daniel Brooks",
    role: "test-architect",
    specialization: "Test Strategy & Coverage",
    yearsOfExperience: 10,
    status: "idle",
    completedValidations: [],
    skills: [
      "Jest",
      "Testing Library",
      "Cypress",
      "Playwright",
      "TDD",
      "BDD",
      "Coverage Analysis",
    ],
    performance: { validationsCompleted: 0, bugsFound: 0, falsePositives: 0 },
  },
  {
    id: "qa-003",
    name: "Rachel Green",
    role: "security-auditor",
    specialization: "Security Testing & Vulnerability Assessment",
    yearsOfExperience: 11,
    status: "idle",
    completedValidations: [],
    skills: [
      "OWASP",
      "Penetration Testing",
      "SAST",
      "DAST",
      "Security Headers",
      "GDPR",
      "SOC2",
    ],
    performance: { validationsCompleted: 0, bugsFound: 0, falsePositives: 0 },
  },
  {
    id: "qa-004",
    name: "Kevin O'Brien",
    role: "performance-tester",
    specialization: "Performance & Load Testing",
    yearsOfExperience: 9,
    status: "idle",
    completedValidations: [],
    skills: [
      "Lighthouse",
      "WebPageTest",
      "k6",
      "JMeter",
      "Profiling",
      "Core Web Vitals",
      "Bundle Analysis",
    ],
    performance: { validationsCompleted: 0, bugsFound: 0, falsePositives: 0 },
  },
  {
    id: "qa-005",
    name: "Michelle Torres",
    role: "accessibility-tester",
    specialization: "Accessibility & Inclusive Design",
    yearsOfExperience: 8,
    status: "idle",
    completedValidations: [],
    skills: [
      "WCAG 2.1",
      "ARIA",
      " axe-core",
      "VoiceOver",
      "NVDA",
      "Screen Readers",
      "Color Contrast",
    ],
    performance: { validationsCompleted: 0, bugsFound: 0, falsePositives: 0 },
  },
  {
    id: "qa-006",
    name: "Steven Wright",
    role: "integration-tester",
    specialization: "API & Integration Testing",
    yearsOfExperience: 7,
    status: "idle",
    completedValidations: [],
    skills: [
      "REST",
      "GraphQL",
      "WebSockets",
      "Postman",
      "SoapUI",
      "Contract Testing",
      "Service Virtualization",
    ],
    performance: { validationsCompleted: 0, bugsFound: 0, falsePositives: 0 },
  },
  {
    id: "qa-007",
    name: "Amanda Chen",
    role: "e2e-specialist",
    specialization: "End-to-End Testing",
    yearsOfExperience: 8,
    status: "idle",
    completedValidations: [],
    skills: [
      "Cypress",
      "Playwright",
      "Selenium",
      "Test Automation",
      "Visual Regression",
      "Cross-browser",
    ],
    performance: { validationsCompleted: 0, bugsFound: 0, falsePositives: 0 },
  },
  {
    id: "qa-008",
    name: "Christopher Lee",
    role: "compliance-checker",
    specialization: "Regulatory Compliance & Standards",
    yearsOfExperience: 10,
    status: "idle",
    completedValidations: [],
    skills: [
      "GDPR",
      "HIPAA",
      "SOC2",
      "PCI-DSS",
      "ISO 27001",
      "Privacy Impact Assessment",
      "Audit Trails",
    ],
    performance: { validationsCompleted: 0, bugsFound: 0, falsePositives: 0 },
  },
];

export const QA_TEAM_STATS = {
  totalAgents: QA_AGENTS.length,
  totalExperience: QA_AGENTS.reduce(
    (sum, agent) => sum + agent.yearsOfExperience,
    0,
  ),
  specializations: [...new Set(QA_AGENTS.map((a) => a.specialization))],
  teamComposition: {
    codeQuality: QA_AGENTS.filter((a) =>
      ["code-reviewer", "test-architect"].includes(a.role),
    ).length,
    security: QA_AGENTS.filter((a) =>
      ["security-auditor", "compliance-checker"].includes(a.role),
    ).length,
    performance: QA_AGENTS.filter((a) =>
      ["performance-tester"].includes(a.role),
    ).length,
    accessibility: QA_AGENTS.filter((a) =>
      ["accessibility-tester"].includes(a.role),
    ).length,
    integration: QA_AGENTS.filter((a) =>
      ["integration-tester", "e2e-specialist"].includes(a.role),
    ).length,
  },
};
