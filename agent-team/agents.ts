import { AgentCapability, AgentRole, AgentStatus } from "./types";

export interface EliteAgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  specialization: string;
  yearsOfExperience: number;
  capabilities: AgentCapability[];
  currentTask?: string;
  status: AgentStatus;
  completedTasks: string[];
  skills: string[];
  performance: {
    tasksCompleted: number;
    avgCompletionTime: number;
    successRate: number;
  };
}

export const ELITE_AGENTS: EliteAgentConfig[] = [
  {
    id: "agent-001",
    name: "Marcus Chen",
    role: "architect",
    specialization: "System Architecture & Design Patterns",
    yearsOfExperience: 8,
    capabilities: [
      "system-design",
      "architecture-review",
      "code-review",
      "performance-optimization",
    ],
    status: "idle",
    completedTasks: [],
    skills: [
      "React",
      "Next.js",
      "Node.js",
      "System Design",
      "Microservices",
      "AWS",
      "GraphQL",
    ],
    performance: { tasksCompleted: 0, avgCompletionTime: 0, successRate: 100 },
  },
  {
    id: "agent-002",
    name: "Sarah Williams",
    role: "frontend-lead",
    specialization: "React & Modern JavaScript",
    yearsOfExperience: 7,
    capabilities: [
      "react-development",
      "state-management",
      "component-design",
      "testing",
    ],
    status: "idle",
    completedTasks: [],
    skills: [
      "React",
      "TypeScript",
      "Redux",
      "Zustand",
      "Jest",
      "Testing Library",
      "CSS-in-JS",
    ],
    performance: { tasksCompleted: 0, avgCompletionTime: 0, successRate: 100 },
  },
  {
    id: "agent-003",
    name: "David Kim",
    role: "ui-engineer",
    specialization: "UI/UX Implementation & Animations",
    yearsOfExperience: 6,
    capabilities: [
      "ui-development",
      "animation",
      "responsive-design",
      "accessibility",
    ],
    status: "idle",
    completedTasks: [],
    skills: [
      "CSS",
      "Framer Motion",
      "GSAP",
      "Tailwind",
      "Storybook",
      "Figma",
      "Accessibility",
    ],
    performance: { tasksCompleted: 0, avgCompletionTime: 0, successRate: 100 },
  },
  {
    id: "agent-004",
    name: "Emily Rodriguez",
    role: "fullstack",
    specialization: "Full-Stack SaaS Development",
    yearsOfExperience: 9,
    capabilities: [
      "api-development",
      "database-design",
      "authentication",
      "deployment",
    ],
    status: "idle",
    completedTasks: [],
    skills: [
      "Next.js",
      "Prisma",
      "PostgreSQL",
      "Auth0",
      "Stripe",
      "Vercel",
      "Docker",
    ],
    performance: { tasksCompleted: 0, avgCompletionTime: 0, successRate: 100 },
  },
  {
    id: "agent-005",
    name: "James Thompson",
    role: "performance",
    specialization: "Performance & Optimization",
    yearsOfExperience: 7,
    capabilities: [
      "performance-audit",
      "bundle-optimization",
      "caching-strategies",
      "core-vitals",
    ],
    status: "idle",
    completedTasks: [],
    skills: [
      "Webpack",
      "Vite",
      "Lighthouse",
      "Performance Profiling",
      "CDN",
      "Edge Functions",
    ],
    performance: { tasksCompleted: 0, avgCompletionTime: 0, successRate: 100 },
  },
  {
    id: "agent-006",
    name: "Lisa Park",
    role: "saas-specialist",
    specialization: "SaaS Architecture & Billing",
    yearsOfExperience: 8,
    capabilities: [
      "subscription-model",
      "multi-tenant",
      "metered-billing",
      "usage-tracking",
    ],
    status: "idle",
    completedTasks: [],
    skills: [
      "Stripe",
      "Billing Integration",
      "Subscription Management",
      "Multi-tenancy",
      "Webhooks",
    ],
    performance: { tasksCompleted: 0, avgCompletionTime: 0, successRate: 100 },
  },
  {
    id: "agent-007",
    name: "Michael Brown",
    role: "devops",
    specialization: "DevOps & Infrastructure",
    yearsOfExperience: 10,
    capabilities: ["ci-cd", "infrastructure", "monitoring", "security"],
    status: "idle",
    completedTasks: [],
    skills: [
      "GitHub Actions",
      "AWS",
      "Terraform",
      "Kubernetes",
      "Datadog",
      "Security Audits",
    ],
    performance: { tasksCompleted: 0, avgCompletionTime: 0, successRate: 100 },
  },
  {
    id: "agent-008",
    name: "Amanda Foster",
    role: "testing",
    specialization: "Quality Assurance & Testing",
    yearsOfExperience: 6,
    capabilities: [
      "unit-testing",
      "integration-testing",
      "e2e-testing",
      "test-automation",
    ],
    status: "idle",
    completedTasks: [],
    skills: ["Jest", "Cypress", "Playwright", "RTL", "Mocking", "TDD", "BDD"],
    performance: { tasksCompleted: 0, avgCompletionTime: 0, successRate: 100 },
  },
  {
    id: "agent-009",
    name: "Robert Martinez",
    role: "backend",
    specialization: "API Design & Database",
    yearsOfExperience: 9,
    capabilities: [
      "api-design",
      "database-optimization",
      "caching",
      "data-modeling",
    ],
    status: "idle",
    completedTasks: [],
    skills: [
      "Node.js",
      "GraphQL",
      "REST",
      "PostgreSQL",
      "Redis",
      "MongoDB",
      "Prisma",
    ],
    performance: { tasksCompleted: 0, avgCompletionTime: 0, successRate: 100 },
  },
  {
    id: "agent-010",
    name: "Jennifer Lee",
    role: "security",
    specialization: "Application Security",
    yearsOfExperience: 8,
    capabilities: [
      "security-audit",
      "auth-implementation",
      "data-protection",
      "compliance",
    ],
    status: "idle",
    completedTasks: [],
    skills: [
      "OAuth",
      "JWT",
      "Security Headers",
      "GDPR",
      "SOC2",
      "Penetration Testing",
    ],
    performance: { tasksCompleted: 0, avgCompletionTime: 0, successRate: 100 },
  },
  {
    id: "agent-011",
    name: "Chris Anderson",
    role: "frontend-dev",
    specialization: "Component Library Development",
    yearsOfExperience: 5,
    capabilities: [
      "component-design",
      "design-system",
      "documentation",
      "storybook",
    ],
    status: "idle",
    completedTasks: [],
    skills: [
      "Storybook",
      "Design Systems",
      "Component Libraries",
      "Documentation",
      "Radix UI",
    ],
    performance: { tasksCompleted: 0, avgCompletionTime: 0, successRate: 100 },
  },
  {
    id: "agent-012",
    name: "Nicole Taylor",
    role: "integration",
    specialization: "Third-Party Integrations",
    yearsOfExperience: 6,
    capabilities: ["api-integration", "webhooks", "oauth", "third-party-sdk"],
    status: "idle",
    completedTasks: [],
    skills: [
      "API Integration",
      "Webhooks",
      "OAuth",
      "SDK Implementation",
      "Third-Party Services",
    ],
    performance: { tasksCompleted: 0, avgCompletionTime: 0, successRate: 100 },
  },
];

export const TEAM_STATS = {
  totalAgents: ELITE_AGENTS.length,
  totalExperience: ELITE_AGENTS.reduce(
    (sum, agent) => sum + agent.yearsOfExperience,
    0,
  ),
  specializations: [...new Set(ELITE_AGENTS.map((a) => a.specialization))],
  teamComposition: {
    frontend: ELITE_AGENTS.filter((a) =>
      ["frontend-lead", "ui-engineer", "frontend-dev"].includes(a.role),
    ).length,
    backend: ELITE_AGENTS.filter((a) =>
      ["backend", "fullstack"].includes(a.role),
    ).length,
    infrastructure: ELITE_AGENTS.filter((a) =>
      ["devops", "security"].includes(a.role),
    ).length,
    saas: ELITE_AGENTS.filter((a) =>
      ["saas-specialist", "fullstack"].includes(a.role),
    ).length,
    quality: ELITE_AGENTS.filter((a) =>
      ["testing", "performance"].includes(a.role),
    ).length,
  },
};
